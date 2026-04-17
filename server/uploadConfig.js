// server/uploadConfig.js
const multer = require('multer');
const path = require('path');

// 1. Define where to store the images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // We rename the file to include a timestamp to avoid overwriting
        // e.g., 171567890-bill.jpg
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// 2. Filter: Only allow Images (PNG, JPG, JPEG)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only images (JPG/PNG) are allowed!'));
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit to 5MB per bill
    fileFilter: fileFilter
});

module.exports = upload;