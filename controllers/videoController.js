const Video = require('../models/Video');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { getGridfsBucket } = require('../config/db');

// Upload Video
exports.uploadVideo = async (req, res, next) => {
    const { title, description, videoUrl } = req.body;

    try {
        const gridfsBucket = getGridfsBucket();
        if (!gridfsBucket) {
            throw new Error('GridFSBucket not initialized');
        }

        if (req.file) {
            console.log('File upload successful:', req.file);

            // Create a read stream from the temporary file
            const filePath = path.join(__dirname, '..', 'uploads', req.file.filename);
            const readStream = fs.createReadStream(filePath);

            // Create a write stream to GridFSBucket
            const uploadStream = gridfsBucket.openUploadStream(req.file.filename, {
                contentType: req.file.mimetype,
                metadata: {
                    title,
                    description,
                },
            });

            // Pipe the read stream to the write stream
            readStream.pipe(uploadStream);

            uploadStream.on('error', (err) => {
                console.error('Error uploading to GridFS:', err);
                next(err);
            });

            uploadStream.on('finish', async () => {
                // Remove the temporary file
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error('Error deleting temporary file:', err);
                    }
                });

                // Save video details in MongoDB
                const newVideo = new Video({
                    title,
                    description,
                    videoFileId: uploadStream.id,
                });

                try {
                    const video = await newVideo.save();
                    res.status(201).json({ success: true, data: video });
                } catch (validationError) {
                    res.status(400).json({ success: false, message: validationError.message });
                }
            });
        } else if (videoUrl) {
            const newVideo = new Video({
                title,
                description,
                videoUrl,
            });

            try {
                const video = await newVideo.save();
                res.status(201).json({ success: true, data: video });
            } catch (validationError) {
                res.status(400).json({ success: false, message: validationError.message });
            }
        } else {
            return res.status(400).json({ success: false, msg: 'Please provide either a video file or a video URL' });
        }
    } catch (err) {
        console.error('Error uploading video:', err);
        next(err);
    }
};

// Get Video by ID
exports.getVideoById = async (req, res, next) => {
    try {
        const video = await Video.findById(req.params.id).populate('videoFileId');
        if (!video) {
            return res.status(404).json({ success: false, msg: 'Video not found' });
        }

        // Construct the video URL using the filename
        const videoUrl = video.videoUrl || `/api/videos/stream/${video.videoFileId.filename}`;

        res.json({ success: true, data: { ...video.toObject(), videoUrl } });
    } catch (err) {
        console.error('Error fetching video by ID:', err);
        next(err);
    }
};

// Get All Videos
exports.getAllVideos = async (req, res, next) => {
    try {
        const videos = await Video.find().sort({ date: -1 }).populate('videoFileId');
        
        // Construct the video URLs using the filename
        const videosWithUrl = videos.map(video => {
            const videoUrl = video.videoUrl || `/api/videos/stream/${video.videoFileId.filename}`;
            return { ...video.toObject(), videoUrl };
        });

        res.json({ success: true, data: videosWithUrl });
    } catch (err) {
        console.error('Error fetching all videos:', err);
        next(err);
    }
};

// Stream video from GridFS by filename
exports.getVideoStream = async (req, res, next) => {
    const filename = req.params.filename;

    try {
        const gridfsBucket = getGridfsBucket();
        if (!gridfsBucket) {
            throw new Error('GridFSBucket not initialized');
        }

        const files = await gridfsBucket.find({ filename }).toArray();

        if (!files || files.length === 0) {
            return res.status(404).json({ success: false, msg: 'No file exists' });
        }

        const file = files[0];
        const readStream = gridfsBucket.openDownloadStreamByName(filename);

        res.set('Content-Type', file.contentType);
        res.set('Content-Disposition', 'inline');

        readStream.pipe(res);
    } catch (err) {
        console.error('Error streaming video:', err);
        next(err);
    }
};
