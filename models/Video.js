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
  thumbnailFileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'uploads.files',
    required: [true, 'Thumbnail is required'],
  },
  duration: {
    type: Number, // Duration in seconds
  },
  views: {
    type: Number,
    default: 0,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  editedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

module.exports = mongoose.model('Video', VideoSchema);
