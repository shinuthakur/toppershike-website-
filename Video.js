/**
 * Video Model Schema
 * Defines the structure for video/solution documents in MongoDB
 */

const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Video title is required'],
    trim: true,
    maxLength: [200, 'Title cannot exceed 200 characters']
  },

  description: {
    type: String,
    required: [true, 'Video description is required'],
    trim: true,
    maxLength: [1000, 'Description cannot exceed 1000 characters']
  },

  bookTitle: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true,
    maxLength: [100, 'Book title cannot exceed 100 characters']
  },

  chapter: {
    type: String,
    required: [true, 'Chapter is required'],
    trim: true,
    maxLength: [50, 'Chapter cannot exceed 50 characters']
  },

  type: {
    type: String,
    enum: ['video', 'image'],
    required: [true, 'Content type is required'],
    default: 'video'
  },

  youtubeUrl: {
    type: String,
    required: function() {
      return this.type === 'video';
    },
    validate: {
      validator: function(url) {
        if (this.type !== 'video') return true;
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
        return youtubeRegex.test(url);
      },
      message: 'Please provide a valid YouTube URL'
    }
  },

  youtubeVideoId: {
    type: String,
    required: function() {
      return this.type === 'video';
    }
  },

  thumbnailUrl: {
    type: String,
    default: function() {
      if (this.youtubeVideoId) {
        return `https://img.youtube.com/vi/${this.youtubeVideoId}/maxresdefault.jpg`;
      }
      return null;
    }
  },

  fileUrl: {
    type: String,
    required: function() {
      return this.type === 'image';
    }
  },

  fileName: {
    type: String
  },

  fileSize: {
    type: Number
  },

  duration: {
    type: String, // e.g., "10:30" for 10 minutes 30 seconds
    default: null
  },

  views: {
    type: Number,
    default: 0
  },

  likes: {
    type: Number,
    default: 0
  },

  isActive: {
    type: Boolean,
    default: true
  },

  tags: [{
    type: String,
    trim: true,
    maxLength: [30, 'Tag cannot exceed 30 characters']
  }],

  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },

  subject: {
    type: String,
    trim: true,
    maxLength: [50, 'Subject cannot exceed 50 characters']
  },

  grade: {
    type: String,
    trim: true,
    maxLength: [20, 'Grade cannot exceed 20 characters']
  },

  uploadedBy: {
    type: String,
    default: 'Admin',
    trim: true
  },

  publishedAt: {
    type: Date,
    default: Date.now
  }

}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for embedded YouTube URL
videoSchema.virtual('youtubeEmbedUrl').get(function() {
  if (this.youtubeVideoId) {
    return `https://www.youtube.com/embed/${this.youtubeVideoId}`;
  }
  return null;
});

// Pre-save middleware to extract YouTube video ID
videoSchema.pre('save', function(next) {
  if (this.youtubeUrl && this.type === 'video') {
    const match = this.youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (match) {
      this.youtubeVideoId = match[1];
      this.thumbnailUrl = `https://img.youtube.com/vi/${this.youtubeVideoId}/maxresdefault.jpg`;
    }
  }
  next();
});

// Index for better query performance
videoSchema.index({ bookTitle: 1, chapter: 1 });
videoSchema.index({ type: 1, isActive: 1 });
videoSchema.index({ createdAt: -1 });
videoSchema.index({ subject: 1, grade: 1 });

// Static method to get videos by book and chapter
videoSchema.statics.getByBookAndChapter = function(bookTitle, chapter) {
  return this.find({ 
    bookTitle: new RegExp(bookTitle, 'i'), 
    chapter: new RegExp(chapter, 'i'),
    isActive: true 
  }).sort({ createdAt: -1 });
};

// Instance method to increment views
videoSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

module.exports = mongoose.model('Video', videoSchema);