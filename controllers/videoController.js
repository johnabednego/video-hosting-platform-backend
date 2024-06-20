const Video = require('../models/Video');

// Upload Video
exports.uploadVideo = async (req, res, next) => {
    const { title, description, videoUrl } = req.body;

    try {
        const newVideo = new Video({
            title,
            description,
            videoUrl,
        });

        const video = await newVideo.save();
        res.json(video);
    } catch (err) {
        next(err); // Pass the error to the error handling middleware
    }
};

// Get Video by ID
exports.getVideoById = async (req, res, next) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) {
            const error = new Error('Video not found');
            error.status = 404;
            throw error;
        }
        res.json(video);
    } catch (err) {
        next(err);
    }
};

// Get All Videos
exports.getAllVideos = async (req, res, next) => {
    try {
        const videos = await Video.find().sort({ date: -1 });
        res.json(videos);
    } catch (err) {
        next(err);
    }
};
