const Video = require('../models/Video');

// Upload Video
exports.uploadVideo = async (req, res, next) => {
    const { title, description, videoUrl } = req.body;

    try {
        if (!title || !description || !videoUrl) {
            return res.status(400).json({ success: false, msg: 'Please provide title, description, and videoUrl' });
        }

        const newVideo = new Video({
            title,
            description,
            videoUrl,
        });

        const video = await newVideo.save();
        res.status(201).json({ success: true, data: video });
    } catch (err) {
        next(err); // Pass the error to the error handling middleware
    }
};

// Get Video by ID
exports.getVideoById = async (req, res, next) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) {
            return res.status(404).json({ success: false, msg: 'Video not found' });
        }
        res.json({ success: true, data: video });
    } catch (err) {
        next(err);
    }
};

// Get All Videos
exports.getAllVideos = async (req, res, next) => {
    try {
        const videos = await Video.find().sort({ date: -1 });
        res.json({ success: true, data: videos });
    } catch (err) {
        next(err);
    }
};
