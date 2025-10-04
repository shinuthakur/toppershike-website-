/**
 * Video Routes
 * Defines all API endpoints for video operations
 */

const express = require('express');
const router = express.Router();

// Import controllers
const {
  getAllVideos,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo,
  getUniqueBooks,
  getChaptersByBook,
  getVideoStats
} = require('../videoController');

// Import middleware
const { uploadMiddleware } = require('../middleware/upload');
const {
  videoValidationRules,
  validateObjectId,
  queryValidationRules,
  validateBookTitle
} = require('../middleware/validation');

// @route   GET /api/videos
// @desc    Get all videos with filtering and pagination
// @access  Public
router.get('/', queryValidationRules(), getAllVideos);

// @route   GET /api/videos/stats
// @desc    Get video statistics
// @access  Public
router.get('/stats', getVideoStats);

// @route   GET /api/videos/metadata/books
// @desc    Get unique book titles
// @access  Public
router.get('/metadata/books', getUniqueBooks);

// @route   GET /api/videos/metadata/chapters/:bookTitle
// @desc    Get chapters for a specific book
// @access  Public
router.get('/metadata/chapters/:bookTitle', validateBookTitle(), getChaptersByBook);

// @route   GET /api/videos/:id
// @desc    Get single video by ID
// @access  Public
router.get('/:id', validateObjectId(), getVideoById);

// @route   POST /api/videos
// @desc    Create new video
// @access  Public (should be protected in production)
router.post('/', uploadMiddleware, videoValidationRules(), createVideo);

// @route   PUT /api/videos/:id
// @desc    Update video
// @access  Public (should be protected in production)
router.put('/:id', validateObjectId(), uploadMiddleware, videoValidationRules(), updateVideo);

// @route   DELETE /api/videos/:id
// @desc    Delete video (soft delete)
// @access  Public (should be protected in production)
router.delete('/:id', validateObjectId(), deleteVideo);


module.exports = router;



