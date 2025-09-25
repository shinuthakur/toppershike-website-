/**
 * Request Validation Middleware
 * Uses express-validator for input validation
 */

const { body, param, query } = require('express-validator');

// Validation rules for creating/updating videos
const videoValidationRules = () => {
  return [
    body('title')
      .trim()
      .isLength({ min: 3, max: 200 })
      .withMessage('Title must be between 3 and 200 characters')
      .escape(),

    body('description')
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Description must be between 10 and 1000 characters')
      .escape(),

    body('bookTitle')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Book title must be between 2 and 100 characters')
      .escape(),

    body('chapter')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Chapter must be between 1 and 50 characters')
      .escape(),

    body('type')
      .isIn(['video', 'image'])
      .withMessage('Type must be either "video" or "image"'),

    body('youtubeUrl')
      .optional()
      .isURL()
      .withMessage('YouTube URL must be a valid URL')
      .custom((value, { req }) => {
        if (req.body.type === 'video' && !value) {
          throw new Error('YouTube URL is required for video type');
        }
        if (value) {
          const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
          if (!youtubeRegex.test(value)) {
            throw new Error('Please provide a valid YouTube URL');
          }
        }
        return true;
      }),

    body('tags')
      .optional()
      .isString()
      .custom((value) => {
        if (value) {
          const tags = value.split(',').map(tag => tag.trim());
          if (tags.length > 10) {
            throw new Error('Maximum 10 tags allowed');
          }
          for (const tag of tags) {
            if (tag.length > 30) {
              throw new Error('Each tag must be less than 30 characters');
            }
          }
        }
        return true;
      }),

    body('difficulty')
      .optional()
      .isIn(['easy', 'medium', 'hard'])
      .withMessage('Difficulty must be easy, medium, or hard'),

    body('subject')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Subject cannot exceed 50 characters')
      .escape(),

    body('grade')
      .optional()
      .trim()
      .isLength({ max: 20 })
      .withMessage('Grade cannot exceed 20 characters')
      .escape()
  ];
};

// Validation for MongoDB ObjectId parameters
const validateObjectId = () => {
  return [
    param('id')
      .isMongoId()
      .withMessage('Invalid ID format')
  ];
};

// Validation for query parameters
const queryValidationRules = () => {
  return [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),

    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),

    query('type')
      .optional()
      .isIn(['video', 'image'])
      .withMessage('Type must be either "video" or "image"'),

    query('difficulty')
      .optional()
      .isIn(['easy', 'medium', 'hard'])
      .withMessage('Difficulty must be easy, medium, or hard'),

    query('sortBy')
      .optional()
      .isIn(['createdAt', 'updatedAt', 'title', 'views', 'likes'])
      .withMessage('Invalid sort field'),

    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc')
  ];
};

// Validation for book title parameter
const validateBookTitle = () => {
  return [
    param('bookTitle')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Book title must be between 1 and 100 characters')
      .escape()
  ];
};

module.exports = {
  videoValidationRules,
  validateObjectId,
  queryValidationRules,
  validateBookTitle
};