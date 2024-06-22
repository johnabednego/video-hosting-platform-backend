const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
    },
    videoUrl: {
        type: String,
    },
    videoFileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'uploads.files',
    },
}, { timestamps: true });

module.exports = mongoose.model('Video', VideoSchema);
