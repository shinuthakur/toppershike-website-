/**
 * Input Validators
 * Custom validation functions for the application
 */

/**
 * Validate YouTube URL format
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid YouTube URL
 */
const isValidYouTubeUrl = (url) => {
  if (!url || typeof url !== 'string') return false;

  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
  return youtubeRegex.test(url.trim());
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email
 */
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate MongoDB ObjectId
 * @param {string} id - ID to validate
 * @returns {boolean} - True if valid ObjectId
 */
const isValidObjectId = (id) => {
  if (!id || typeof id !== 'string') return false;

  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

/**
 * Sanitize string input
 * @param {string} input - Input to sanitize
 * @param {number} maxLength - Maximum length (default: 255)
 * @returns {string} - Sanitized string
 */
const sanitizeString = (input, maxLength = 255) => {
  if (!input || typeof input !== 'string') return '';

  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>"'&]/g, ''); // Remove potentially harmful characters
};

/**
 * Validate and sanitize tags
 * @param {string|array} tags - Tags to validate
 * @returns {array} - Array of valid tags
 */
const validateTags = (tags) => {
  if (!tags) return [];

  let tagArray = [];

  if (typeof tags === 'string') {
    tagArray = tags.split(',').map(tag => tag.trim());
  } else if (Array.isArray(tags)) {
    tagArray = tags;
  } else {
    return [];
  }

  return tagArray
    .filter(tag => tag && typeof tag === 'string')
    .map(tag => sanitizeString(tag, 30))
    .filter(tag => tag.length > 0)
    .slice(0, 10); // Maximum 10 tags
};

/**
 * Validate file type
 * @param {object} file - File object from multer
 * @param {array} allowedTypes - Array of allowed mime types
 * @returns {boolean} - True if file type is allowed
 */
const isValidFileType = (file, allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']) => {
  if (!file || !file.mimetype) return false;

  return allowedTypes.includes(file.mimetype.toLowerCase());
};

/**
 * Validate file size
 * @param {object} file - File object from multer
 * @param {number} maxSizeInBytes - Maximum size in bytes (default: 10MB)
 * @returns {boolean} - True if file size is acceptable
 */
const isValidFileSize = (file, maxSizeInBytes = 10 * 1024 * 1024) => {
  if (!file || !file.size) return false;

  return file.size <= maxSizeInBytes;
};

/**
 * Validate pagination parameters
 * @param {object} query - Query object with page and limit
 * @returns {object} - Validated pagination parameters
 */
const validatePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 10));

  return { page, limit };
};

/**
 * Validate sort parameters
 * @param {string} sortBy - Field to sort by
 * @param {string} sortOrder - Sort order (asc/desc)
 * @param {array} allowedFields - Allowed sort fields
 * @returns {object} - Validated sort parameters
 */
const validateSort = (sortBy, sortOrder, allowedFields = ['createdAt', 'updatedAt', 'title', 'views']) => {
  const validSortBy = allowedFields.includes(sortBy) ? sortBy : 'createdAt';
  const validSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';

  return { sortBy: validSortBy, sortOrder: validSortOrder };
};

module.exports = {
  isValidYouTubeUrl,
  isValidEmail,
  isValidObjectId,
  sanitizeString,
  validateTags,
  isValidFileType,
  isValidFileSize,
  validatePagination,
  validateSort
};