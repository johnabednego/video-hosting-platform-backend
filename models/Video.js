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
    date: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Video', VideoSchema);
