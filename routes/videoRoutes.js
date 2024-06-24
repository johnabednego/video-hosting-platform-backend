const express = require('express');
const router = express.Router();
const { getVideoById, getAllVideos, getVideoStream, getThumbnailStream, uploadVideo } = require('../controllers/videoController');
const upload = require('../middleware/upload');
const auth = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Videos
 *   description: Video management
 */

/**
 * @swagger
 * /api/videos/upload:
 *   post:
 *     summary: Upload a new video
 *     tags: [Videos]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               videoFile:
 *                 type: string
 *                 format: binary
 *               videoUrl:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Video uploaded successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post('/upload', auth, upload.fields([{ name: 'videoFile', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), uploadVideo);

/**
 * @swagger
 * /api/videos/{id}:
 *   get:
 *     summary: Get video by ID
 *     tags: [Videos]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Video ID
 *     responses:
 *       200:
 *         description: Video retrieved successfully
 *       404:
 *         description: Video not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', auth, getVideoById);

/**
 * @swagger
 * /api/videos:
 *   get:
 *     summary: Get all videos
 *     tags: [Videos]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Videos retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/', auth, getAllVideos);

/**
 * @swagger
 * /api/videos/stream/{filename}:
 *   get:
 *     summary: Stream video by filename
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: filename
 *         schema:
 *           type: string
 *         required: true
 *         description: Video filename
 *     responses:
 *       200:
 *         description: Video streamed successfully
 *       404:
 *         description: Video not found
 *       500:
 *         description: Internal server error
 */
router.get('/stream/:filename', getVideoStream);

/**
 * @swagger
 * /api/videos/thumbnail/{id}:
 *   get:
 *     summary: Get thumbnail by video ID
 *     tags: [Videos]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Video ID
 *     responses:
 *       200:
 *         description: Thumbnail retrieved successfully
 *       404:
 *         description: Thumbnail not found
 *       500:
 *         description: Internal server error
 */
router.get('/thumbnail/:id', getThumbnailStream);

module.exports = router;
