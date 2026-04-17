const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const upload = require('./uploadConfig');
const db = require('./db');
const { performOCR } = require('./ocrService');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

/**
 * LOGIC LAYER: The Extraction Brain
 */
const extractData = (text) => {
    const gstinRegex = /([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})/;
    const gstinMatch = text.match(gstinRegex);
    const gstin = gstinMatch ? gstinMatch[0] : "NOT_FOUND";

    const amountRegex = /(?:Total|Amount|Net|Payable|Grand Total|Amt)\s*[:\s]*[₹Rs\.]*\s*([\d,]+\.\d{2})/i;
    const amountMatch = text.match(amountRegex);
    const totalAmount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;

    const dateRegex = /(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{2,4})/; 
    const dateMatch = text.match(dateRegex);
    let billDate = new Date().toISOString().split('T')[0];

    if (dateMatch) {
        let [_, day, month, year] = dateMatch;
        if (year.length === 2) year = "20" + year;
        billDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    const invRegex = /(?:Invoice|Bill|Inv)\s*(?:No|#|Number)?[:\s]*([A-Z0-9\/-]+)/i;
    const invMatch = text.match(invRegex);
    const invoiceNo = invMatch ? invMatch[1] : `TEMP-${Date.now()}`;

    return { gstin, totalAmount, billDate, invoiceNo };
};

/**
 * ROUTE LAYER
 */

// Upload and Process
app.post('/api/upload-bill', upload.single('bill'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });

        const rawText = await performOCR(req.file.path);
        const extracted = extractData(rawText);

        const [existing] = await db.query(
            'SELECT id FROM expenses WHERE gstin = ? AND invoice_no = ? AND total_amount = ?',
            [extracted.gstin, extracted.invoiceNo, extracted.totalAmount]
        );

        if (existing.length > 0) {
            fs.unlinkSync(req.file.path); // Delete the uploaded file if it's a duplicate
            return res.status(409).json({ success: false, message: '❌ Duplicate Alert: This bill exists.' });
        }

        const [result] = await db.query(
            'INSERT INTO expenses (gstin, total_amount, bill_date, invoice_no, image_url) VALUES (?, ?, ?, ?, ?)',
            [extracted.gstin, extracted.totalAmount, extracted.billDate, extracted.invoiceNo, req.file.path]
        );

        res.status(200).json({ success: true, data: { id: result.insertId, ...extracted } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Smart Reporting (JSON for Dashboard, CSV for Export)
app.get('/api/reports/gst', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM expenses ORDER BY bill_date DESC');
        
        if (req.query.format === 'csv') {
            if (rows.length === 0) return res.status(404).send("No data to export");
            const keys = Object.keys(rows[0]);
            const csv = [keys.join(','), ...rows.map(row => keys.map(k => `"${row[k]}"`).join(','))].join('\n');
            res.header('Content-Type', 'text/csv');
            res.attachment('GST_Report.csv');
            return res.send(csv);
        }
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/analytics/spending', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT DATE_FORMAT(bill_date, '%b') as name, SUM(total_amount) as total 
            FROM expenses GROUP BY name, MONTH(bill_date) ORDER BY MONTH(bill_date) ASC
        `);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// CLEANUP DELETE: Removes Database record AND physical image file
app.delete('/api/expenses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT image_url FROM expenses WHERE id = ?', [id]);
        
        if (rows.length > 0 && rows[0].image_url) {
            const filePath = path.resolve(rows[0].image_url);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        await db.query('DELETE FROM expenses WHERE id = ?', [id]);
        res.status(200).json({ success: true, message: '🗑️ Record and file removed.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));