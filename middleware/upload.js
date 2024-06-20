const multer = require('multer');
const crypto = require('crypto');
const path = require('path');

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
            const filename = buf.toString('hex') + path.extname(file.originalname);
            cb(null, filename);
        });
    }
});

const upload = multer({ storage });

module.exports = upload;
