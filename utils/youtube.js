/**
 * YouTube Utility Functions
 * Helper functions for YouTube video processing
 */

const https = require('https');

/**
 * Extract YouTube video ID from URL
 * @param {string} url - YouTube URL
 * @returns {string|null} - Video ID or null if invalid
 */
const extractVideoId = (url) => {
  if (!url) return null;

  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);

  return match ? match[1] : null;
};

/**
 * Generate YouTube thumbnail URL
 * @param {string} videoId - YouTube video ID
 * @param {string} quality - Thumbnail quality (default, medium, high, standard, maxres)
 * @returns {string} - Thumbnail URL
 */
const getThumbnailUrl = (videoId, quality = 'maxresdefault') => {
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
};

/**
 * Generate YouTube embed URL
 * @param {string} videoId - YouTube video ID
 * @param {object} options - Embed options
 * @returns {string} - Embed URL
 */
const getEmbedUrl = (videoId, options = {}) => {
  if (!videoId) return null;

  const baseUrl = `https://www.youtube.com/embed/${videoId}`;
  const params = new URLSearchParams();

  // Default embed parameters
  if (options.autoplay) params.append('autoplay', '1');
  if (options.mute) params.append('mute', '1');
  if (options.controls !== undefined) params.append('controls', options.controls ? '1' : '0');
  if (options.showinfo !== undefined) params.append('showinfo', options.showinfo ? '1' : '0');
  if (options.rel !== undefined) params.append('rel', options.rel ? '1' : '0');
  if (options.start) params.append('start', options.start);
  if (options.end) params.append('end', options.end);

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

/**
 * Get YouTube watch URL from video ID
 * @param {string} videoId - YouTube video ID
 * @returns {string} - Watch URL
 */
const getWatchUrl = (videoId) => {
  if (!videoId) return null;
  return `https://www.youtube.com/watch?v=${videoId}`;
};

/**
 * Validate YouTube URL
 * @param {string} url - YouTube URL to validate
 * @returns {boolean} - True if valid
 */
const isValidYouTubeUrl = (url) => {
  if (!url) return false;

  const regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
  return regex.test(url);
};

/**
 * Check if YouTube video exists (basic check)
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<boolean>} - True if video exists
 */
const checkVideoExists = (videoId) => {
  return new Promise((resolve) => {
    if (!videoId) {
      resolve(false);
      return;
    }

    const url = getThumbnailUrl(videoId, 'default');

    https.get(url, (res) => {
      // If we can get the thumbnail, the video likely exists
      resolve(res.statusCode === 200);
    }).on('error', () => {
      resolve(false);
    });
  });
};

/**
 * Parse YouTube URL and extract information
 * @param {string} url - YouTube URL
 * @returns {object} - Parsed information
 */
const parseYouTubeUrl = (url) => {
  const videoId = extractVideoId(url);

  if (!videoId) {
    return {
      isValid: false,
      videoId: null,
      thumbnailUrl: null,
      embedUrl: null,
      watchUrl: null
    };
  }

  return {
    isValid: true,
    videoId,
    thumbnailUrl: getThumbnailUrl(videoId),
    embedUrl: getEmbedUrl(videoId),
    watchUrl: getWatchUrl(videoId)
  };
};

module.exports = {
  extractVideoId,
  getThumbnailUrl,
  getEmbedUrl,
  getWatchUrl,
  isValidYouTubeUrl,
  checkVideoExists,
  parseYouTubeUrl
};