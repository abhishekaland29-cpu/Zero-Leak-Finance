// server/db.js
const mysql = require('mysql2');
require('dotenv').config();

// Use the URL string method for easier cloud deployment
const connectionUri = process.env.DATABASE_URL;

if (!connectionUri) {
    console.error("❌ ERROR: DATABASE_URL is not defined in environment variables.");
    process.exit(1);
}

const pool = mysql.createPool({
    uri: connectionUri,
    waitForConnections: true,
    connectionLimit: 15, // Slightly higher for concurrent OCR requests
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Test connection on startup
pool.getConnection((err, conn) => {
    if (err) console.error("❌ Database connection failed:", err.message);
    else {
        console.log("✅ Securely connected to MySQL via URI.");
        conn.release();
    }
});

module.exports = pool.promise();