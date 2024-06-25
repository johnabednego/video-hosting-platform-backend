const Video = require("../models/Video");
const fs = require("fs");
const path = require("path");
const ffmpeg = require('fluent-ffmpeg');
const { getGridfsBucket } = require("../config/db");

// Supported video MIME types
const supportedVideoTypes = [
  "video/mp4",
  "video/x-msvideo",
  "video/x-ms-wmv",
  "video/mpeg",
  "video/ogg",
  "video/webm",
];
const MAX_FILE_SIZE = 1024 * 1024 * 500; // 500MB

const supportedImageTypes = ["image/jpeg", "image/png", "image/gif"];

// Upload Video
exports.uploadVideo = async (req, res, next) => {
  const { title, description, videoUrl } = req.body;

  try {
    const gridfsBucket = getGridfsBucket();
    if (!gridfsBucket) {
      throw new Error("GridFSBucket not initialized");
    }

    // Check for video file
    if (req.files && req.files.videoFile && req.files.videoFile[0]) {
      console.log("Video file upload successful:", req.files.videoFile[0]);

      // Check if the uploaded file is a video
      if (!supportedVideoTypes.includes(req.files.videoFile[0].mimetype)) {
        fs.unlinkSync(req.files.videoFile[0].path); // Delete the non-video file
        return res.status(400).json({
          success: false,
          msg: "The uploaded file is not a supported video format",
        });
      }

      // Check file size
      if (req.files.videoFile[0].size > MAX_FILE_SIZE) {
        fs.unlinkSync(req.files.videoFile[0].path); // Delete the large file
        return res
          .status(400)
          .json({ success: false, msg: "The uploaded file is too large" });
      }

      // Check for thumbnail file
      if (
        !req.files.thumbnail ||
        !req.files.thumbnail[0] ||
        !supportedImageTypes.includes(req.files.thumbnail[0].mimetype)
      ) {
        return res
          .status(400)
          .json({
            success: false,
            msg: "A valid thumbnail image is required (jpeg, png, gif)",
          });
      }

      // Create a read stream from the temporary video file
      const videoFilePath = path.join(
        __dirname,
        "..",
        "uploads",
        req.files.videoFile[0].filename
      );

      // Extract video duration
      ffmpeg.ffprobe(videoFilePath, async (err, metadata) => {
        if (err) {
          console.error("Error extracting video metadata:", err);
          return res.status(500).json({ success: false, msg: "Error extracting video metadata" });
        }

        const duration = metadata.format.duration;

        // Create a read stream from the temporary video file
        const videoReadStream = fs.createReadStream(videoFilePath);

        // Create a write stream to GridFSBucket for the video
        const videoUploadStream = gridfsBucket.openUploadStream(
          req.files.videoFile[0].filename,
          {
            contentType: req.files.videoFile[0].mimetype,
            metadata: {
              title,
              description,
              duration,
            },
          }
        );

        // Pipe the read stream to the write stream
        videoReadStream.pipe(videoUploadStream);

        videoUploadStream.on("error", (err) => {
          console.error("Error uploading to GridFS:", err);
          next(err);
        });

        videoUploadStream.on("finish", async () => {
          // Remove the temporary video file
          fs.unlink(videoFilePath, (err) => {
            if (err) {
              console.error("Error deleting temporary file:", err);
            }
          });

          // Create a read stream from the temporary thumbnail file
          const thumbnailFilePath = path.join(
            __dirname,
            "..",
            "uploads",
            req.files.thumbnail[0].filename
          );
          const thumbnailReadStream = fs.createReadStream(thumbnailFilePath);

          // Create a write stream to GridFSBucket for the thumbnail
          const thumbnailUploadStream = gridfsBucket.openUploadStream(
            req.files.thumbnail[0].filename,
            {
              contentType: req.files.thumbnail[0].mimetype,
            }
          );

          // Pipe the read stream to the write stream
          thumbnailReadStream.pipe(thumbnailUploadStream);

          thumbnailUploadStream.on("error", (err) => {
            console.error("Error uploading thumbnail to GridFS:", err);
            next(err);
          });

          thumbnailUploadStream.on("finish", async () => {
            // Remove the temporary thumbnail file
            fs.unlink(thumbnailFilePath, (err) => {
              if (err) {
                console.error("Error deleting temporary thumbnail file:", err);
              }
            });

            // Save video details in MongoDB
            const newVideo = new Video({
              title,
              description,
              videoFileId: videoUploadStream.id,
              thumbnailFileId: thumbnailUploadStream.id,
              duration,
              uploadedBy: req.user.id, // Store the ID of the admin who uploaded the video
            });

            try {
              const video = await newVideo.save();
              res.status(201).json({ success: true, data: video });
            } catch (validationError) {
              res
                .status(400)
                .json({ success: false, message: validationError.message });
            }
          });
        });
      });
    } else if (videoUrl) {
      if (
        !req.files.thumbnail ||
        !req.files.thumbnail[0] ||
        !supportedImageTypes.includes(req.files.thumbnail[0].mimetype)
      ) {
        return res
          .status(400)
          .json({ success: false, msg: "A valid thumbnail image is required (jpeg, png, gif)" });
      }

      // Create a read stream from the temporary thumbnail file
      const thumbnailFilePath = path.join(
        __dirname,
        "..",
        "uploads",
        req.files.thumbnail[0].filename
      );
      const thumbnailReadStream = fs.createReadStream(thumbnailFilePath);

      // Create a write stream to GridFSBucket for the thumbnail
      const thumbnailUploadStream = gridfsBucket.openUploadStream(
        req.files.thumbnail[0].filename,
        {
          contentType: req.files.thumbnail[0].mimetype,
        }
      );

      // Pipe the read stream to the write stream
      thumbnailReadStream.pipe(thumbnailUploadStream);

      thumbnailUploadStream.on("error", (err) => {
        console.error("Error uploading thumbnail to GridFS:", err);
        next(err);
      });

      thumbnailUploadStream.on("finish", async () => {
        // Remove the temporary thumbnail file
        fs.unlink(thumbnailFilePath, (err) => {
          if (err) {
            console.error("Error deleting temporary thumbnail file:", err);
          }
        });

        // Save video details in MongoDB
        const newVideo = new Video({
          title,
          description,
          videoUrl,
          thumbnailFileId: thumbnailUploadStream.id,
          uploadedBy: req.user.id, // Store the ID of the admin who uploaded the video
        });

        try {
          const video = await newVideo.save();
          res.status(201).json({ success: true, data: video });
        } catch (validationError) {
          res
            .status(400)
            .json({ success: false, message: validationError.message });
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        msg: "Please provide either a video file or a video URL",
      });
    }
  } catch (err) {
    console.error("Error uploading video:", err);
    next(err);
  }
};

// Edit Video
exports.editVideo = async (req, res, next) => {
  const { id } = req.params;
  const { title, description } = req.body;

  try {
    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({ success: false, msg: 'Video not found' });
    }

    video.title = title || video.title;
    video.description = description || video.description;
    video.editedBy = req.user.id; // Store the ID of the admin who edited the video

    await video.save();

    res.json({ success: true, data: video });
  } catch (err) {
    console.error('Error editing video:', err);
    next(err);
  }
};


// Delete Video
exports.deleteVideo = async (req, res, next) => {
  const { id } = req.params;

  try {
    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({ success: false, msg: 'Video not found' });
    }

    // Delete video from GridFS
    const gridfsBucket = getGridfsBucket();
    if (video.videoFileId) {
      await gridfsBucket.delete(video.videoFileId);
    }
    if (video.thumbnailFileId) {
      await gridfsBucket.delete(video.thumbnailFileId);
    }

    await video.remove();

    res.json({ success: true, msg: 'Video deleted successfully' });
  } catch (err) {
    console.error('Error deleting video:', err);
    next(err);
  }
};


// Get Video by ID
exports.getVideoById = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('videoFileId thumbnailFileId uploadedBy editedBy', 'firstName lastName email');
    if (!video) {
      return res.status(404).json({ success: false, msg: 'Video not found' });
    }

    // Construct the video URL using the filename
    const videoUrl = video.videoUrl || `/api/videos/stream/${video.videoFileId.filename}`;
    const thumbnailUrl = `/api/videos/thumbnail/${video._id}`;

    res.json({ success: true, data: { ...video.toObject(), videoUrl, thumbnailUrl } });
  } catch (err) {
    console.error('Error fetching video by ID:', err);
    next(err);
  }
};

// Get All Videos
exports.getAllVideos = async (req, res, next) => {
  try {
    const videos = await Video.find()
      .sort({ date: -1 })
      .populate('videoFileId thumbnailFileId uploadedBy editedBy', 'firstName lastName email');

    // Construct the video URLs using the filename
    const videosWithUrl = videos.map(video => {
      const videoUrl = video.videoUrl || `/api/videos/stream/${video.videoFileId.filename}`;
      const thumbnailUrl = `/api/videos/thumbnail/${video._id}`;
      return { ...video.toObject(), videoUrl, thumbnailUrl };
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
      throw new Error("GridFSBucket not initialized");
    }

    const files = await gridfsBucket.find({ filename }).toArray();

    if (!files || files.length === 0) {
      return res.status(404).json({ success: false, msg: "No file exists" });
    }

    const file = files[0];
    const readStream = gridfsBucket.openDownloadStreamByName(filename);

    res.set("Content-Type", file.contentType);
    res.set("Content-Disposition", "inline");

    readStream.pipe(res);
  } catch (err) {
    console.error("Error streaming video:", err);
    next(err);
  }
};

// Get Thumbnail by Video ID
exports.getThumbnailStream = async (req, res, next) => {
  const { id } = req.params;

  try {
    const video = await Video.findById(id).populate('thumbnailFileId');
    if (!video) {
      return res.status(404).json({ success: false, msg: 'Video not found' });
    }

    if (!video.thumbnailFileId) {
      return res.status(404).json({ success: false, msg: 'Thumbnail not found' });
    }

    const gridfsBucket = getGridfsBucket();
    if (!gridfsBucket) {
      throw new Error('GridFSBucket not initialized');
    }

    const readStream = gridfsBucket.openDownloadStream(video.thumbnailFileId._id);
    res.set('Content-Type', video.thumbnailFileId.contentType);
    res.set('Content-Disposition', 'inline');

    readStream.pipe(res);
  } catch (err) {
    console.error('Error fetching thumbnail by video ID:', err);
    next(err);
  }
};

// Increment Video Views
exports.incrementViews = async (req, res, next) => {
  const { id } = req.params;

  try {
    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({ success: false, msg: 'Video not found' });
    }

    video.views += 1;
    await video.save();

    res.json({ success: true, views: video.views });
  } catch (err) {
    console.error('Error incrementing views:', err);
    next(err);
  }
};
