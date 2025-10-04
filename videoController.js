/**
 * Video Controller
 * Handles all business logic for video/solution operations
 */

const Video = require('./Video');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs').promises;
/**
 * Extract YouTube video ID from various YouTube URL formats
 */
const extractYoutubeVideoId = (url) => {
  console.log('Extracting YouTube ID from URL:', url); // Debug log
  
  // Handle multiple YouTube URL formats
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^&\n?#]+)/
  ];
  
  for (let pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      console.log('Extracted YouTube ID:', match[1]); // Debug log
      return match[1];
    }
  }
  
  console.log('Failed to extract YouTube ID from:', url); // Debug log
  return null;
};



// @desc    Get all videos with filtering, sorting, and pagination
// @route   GET /api/videos
// @access  Public
const getAllVideos = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      bookTitle,
      chapter,
      type,
      subject,
      grade,
      difficulty,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query object
    const query = { isActive: true };

    // Add filters
    if (bookTitle) query.bookTitle = new RegExp(bookTitle, 'i');
    if (chapter) query.chapter = new RegExp(chapter, 'i');
    if (type) query.type = type;
    if (subject) query.subject = new RegExp(subject, 'i');
    if (grade) query.grade = grade;
    if (difficulty) query.difficulty = difficulty;

    // Add search functionality
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { bookTitle: new RegExp(search, 'i') },
        { chapter: new RegExp(search, 'i') },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Pagination
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = Math.min(parseInt(limit, 10) || 10, 50); // Max 50 items per page
    const skip = (pageNumber - 1) * pageSize;

    // Sort
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const [videos, totalCount] = await Promise.all([
      Video.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Video.countDocuments(query)
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;

    res.status(200).json({
      success: true,
      data: videos,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? pageNumber + 1 : null,
        prevPage: hasPrevPage ? pageNumber - 1 : null
      },
      filters: {
        bookTitle,
        chapter,
        type,
        subject,
        grade,
        difficulty,
        search
      }
    });

  } catch (error) {
    console.error('Get all videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching videos',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get single video by ID
// @route   GET /api/videos/:id
// @access  Public
const getVideoById = async (req, res) => {
  try {
    const { id } = req.params;

    const video = await Video.findById(id);

    if (!video || !video.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Increment view count
    await video.incrementViews();

    res.status(200).json({
      success: true,
      data: video
    });

  } catch (error) {
    console.error('Get video by ID error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid video ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching video',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Create new video
// @route   POST /api/videos
// @access  Public (should be protected in production)
const createVideo = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      title,
      description,
      bookTitle,
      chapter,
      type,
      youtubeUrl,
      tags,
      difficulty,
      subject,
      grade
    } = req.body;

    // Create video data
    const videoData = {
      title: title || bookTitle, //use bookTitle as title if title not provided
      description,
      bookTitle,
      chapter,
      type,
      difficulty,
      subject,
      grade,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    };

    // Handle video type
    if (type === 'video') {
  if (!youtubeUrl) {
    return res.status(400).json({
      success: false,
      message: 'YouTube URL is required for video type'
    });
  }
  
  // Extract YouTube video ID from URL
  const youtubeVideoId = extractYoutubeVideoId(youtubeUrl);
  if (!youtubeVideoId) {
    return res.status(400).json({
      success: false,
      message: 'Invalid YouTube URL format'
    });
  }
  
  videoData.youtubeUrl = youtubeUrl;
  videoData.youtubeVideoId = youtubeVideoId;
}

    // Handle image type with file upload
    if (type === 'image' && req.file) {
      videoData.fileUrl = `/uploads/${req.file.filename}`;
      videoData.fileName = req.file.originalname;
      videoData.fileSize = req.file.size;
    }

    const video = new Video(videoData);
    const savedVideo = await video.save();

    res.status(201).json({
      success: true,
      message: 'Video created successfully',
      data: savedVideo
    });

  } catch (error) {
    console.error('Create video error:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Video with similar details already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating video',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update video
// @route   PUT /api/videos/:id
// @access  Public (should be protected in production)
const updateVideo = async (req, res) => {
  try {
    const { id } = req.params;

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const updateData = { ...req.body };

    // Handle tags
    if (updateData.tags && typeof updateData.tags === 'string') {
      updateData.tags = updateData.tags.split(',').map(tag => tag.trim());
    }

    const video = await Video.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    );

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Video updated successfully',
      data: video
    });

  } catch (error) {
    console.error('Update video error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid video ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating video',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Delete video (soft delete)
// @route   DELETE /api/videos/:id
// @access  Public (should be protected in production)
const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;

    const video = await Video.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Video deleted successfully'
    });

  } catch (error) {
    console.error('Delete video error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid video ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error deleting video',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get unique book titles
// @route   GET /api/videos/metadata/books
// @access  Public
const getUniqueBooks = async (req, res) => {
  try {
    const books = await Video.distinct('bookTitle', { isActive: true });

    res.status(200).json({
      success: true,
      data: books.sort()
    });

  } catch (error) {
    console.error('Get unique books error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching book titles',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get chapters for a specific book
// @route   GET /api/videos/metadata/chapters/:bookTitle
// @access  Public
const getChaptersByBook = async (req, res) => {
  try {
    const { bookTitle } = req.params;

    const chapters = await Video.distinct('chapter', { 
      bookTitle: new RegExp(bookTitle, 'i'),
      isActive: true 
    });

    res.status(200).json({
      success: true,
      data: chapters.sort()
    });

  } catch (error) {
    console.error('Get chapters by book error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chapters',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get video statistics
// @route   GET /api/videos/stats
// @access  Public
const getVideoStats = async (req, res) => {
  try {
    const [
      totalVideos,
      totalImages,
      totalViews,
      bookStats,
      recentVideos
    ] = await Promise.all([
      Video.countDocuments({ type: 'video', isActive: true }),
      Video.countDocuments({ type: 'image', isActive: true }),
      Video.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, totalViews: { $sum: '$views' } } }
      ]),
      Video.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$bookTitle', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Video.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title bookTitle chapter createdAt views')
    ]);

    res.status(200).json({
      success: true,
      data: {
        totals: {
          videos: totalVideos,
          images: totalImages,
          views: totalViews[0]?.totalViews || 0,
          total: totalVideos + totalImages
        },
        topBooks: bookStats,
        recentVideos
      }
    });

  } catch (error) {
    console.error('Get video stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getAllVideos,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo,
  getUniqueBooks,
  getChaptersByBook,
  getVideoStats

};

