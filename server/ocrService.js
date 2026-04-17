// server/ocrService.js
const Tesseract = require('tesseract.js');

const performOCR = async (imagePath) => {
    try {
        console.log("Reading bill content...");
        const { data: { text } } = await Tesseract.recognize(imagePath, 'eng');
        return text;
    } catch (error) {
        console.error("OCR Error:", error);
        throw new Error("Failed to read the image");
    }
};

module.exports = { performOCR };