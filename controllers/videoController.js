const Video = require('../models/Video');

// Upload Video
exports.uploadVideo = async (req, res) => {
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
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get Video by ID
exports.getVideoById = async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) {
            return res.status(404).json({ msg: 'Video not found' });
        }
        res.json(video);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get All Videos
exports.getAllVideos = async (req, res) => {
    try {
        const videos = await Video.find().sort({ date: -1 });
        res.json(videos);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
