const multer = require('multer');
const crypto = require('crypto');
const path = require('path');

// Supported video and image MIME types
const supportedVideoTypes = ['video/mp4', 'video/x-msvideo', 'video/x-ms-wmv', 'video/mpeg', 'video/ogg', 'video/webm'];
const supportedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
const supportedFileTypes = supportedVideoTypes.concat(supportedImageTypes);

// Create a storage engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Temporary storage before moving to GridFS
    },
    filename: (req, file, cb) => {
        crypto.randomBytes(16, (err, buf) => {
            if (err) {
                return cb(err);
            }
            const filename = file.originalname;
            cb(null, filename);
        });
    }
});

// File filter to validate file types
const fileFilter = (req, file, cb) => {
    if (supportedFileTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Unsupported file type'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
});

module.exports = upload;
