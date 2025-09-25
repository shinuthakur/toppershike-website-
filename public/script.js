// --- Mobile Navigation ---
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
if(hamburger && navMenu){
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
    document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }));
}

// --- Smooth Scrolling ---
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const target = document.querySelector(this.getAttribute('href'));
        if(target){ 
            e.preventDefault(); 
            target.scrollIntoView({behavior: 'smooth', block: 'start'});
        }
    });
}); 

// --- API Configuration ---
const API_BASE_URL = '/api';

// --- Solution Management with Backend Integration ---
class VideoManager {
    constructor() {
        this.videos = [];
        this.isLoading = false;
        this.currentPage = 1;
        this.totalPages = 1;
        this.filters = {};
        this.adminUnlocked = false;

        this.initializeElements();
        this.setupEventListeners();
        this.loadVideos();
    }

    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.solutionsGrid = document.getElementById('solutionsGrid');
        this.videosListSection = document.getElementById('videos-list-section');
        this.uploadPasswordForm = document.getElementById('upload-password-form');
        this.solutionDetailsForm = document.getElementById('solution-details-form');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.logoutUploadBtn = document.getElementById('logoutUploadBtn');
    }

    setupEventListeners() {
        // Upload area events
        if (this.uploadArea && this.fileInput) {
            this.uploadArea.addEventListener('click', () => this.fileInput.click());
            this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
            this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
            this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }

        // Upload button
        if (this.uploadBtn) {
            this.uploadBtn.addEventListener('click', (e) => this.handleUpload(e));
        }

        // Password form event listener
        if (this.uploadPasswordForm) {
            this.uploadPasswordForm.addEventListener('submit', (e) => this.handlePasswordSubmit(e));
        }

        // Logout button event listener  
        if (this.logoutUploadBtn) {
            this.logoutUploadBtn.addEventListener('click', (e) => this.handleLogout(e));
        }

        // Search and filter events
        this.setupSearchAndFilter();
    }

    // Password form submission
    handlePasswordSubmit(e) {
        e.preventDefault();
        const passwordInput = document.getElementById('upload-password');
        const uploadWrapper = document.getElementById('upload-area-wrapper');
        
        if (passwordInput && passwordInput.value === 'toppershike217') {
            if (uploadWrapper) uploadWrapper.style.display = 'block';
            if (this.uploadPasswordForm) this.uploadPasswordForm.style.display = 'none';
            this.adminUnlocked = true;
            this.displayVideos(); // Refresh gallery to show delete buttons
        } else {
            alert('Incorrect password!');
            if (passwordInput) passwordInput.value = '';
        }
    }

    // Logout functionality  
    handleLogout(e) {
        e.preventDefault();
        const uploadWrapper = document.getElementById('upload-area-wrapper');
        const passwordInput = document.getElementById('upload-password');
        
        if (uploadWrapper) uploadWrapper.style.display = 'none';
        if (this.uploadPasswordForm) this.uploadPasswordForm.style.display = 'flex';
        if (passwordInput) passwordInput.value = '';
        this.adminUnlocked = false;
        this.displayVideos(); // Refresh gallery to hide delete buttons
    }

    setupSearchAndFilter() {
        // Add search functionality
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search videos...';
        searchInput.className = 'search-input';
        searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));

        // Add search input to the page
        const videoGallery = document.querySelector('.video-gallery');
        if (videoGallery) {
            videoGallery.insertBefore(searchInput, videoGallery.firstChild);
        }
    }

    async loadVideos(page = 1, filters = {}) {
        if (this.isLoading) return;

        this.isLoading = true;
        this.showLoading();

        try {
            const queryParams = new URLSearchParams({
                page: page,
                limit: 12,
                ...filters
            });

            const response = await fetch(`${API_BASE_URL}/videos?${queryParams}`);
            const data = await response.json();

            if (data.success) {
                this.videos = data.data;
                this.currentPage = data.pagination.currentPage;
                this.totalPages = data.pagination.totalPages;
                this.filters = filters;

                this.displayVideos();
                this.updatePagination();
            } else {
                this.showError('Failed to load videos: ' + data.message);
            }
        } catch (error) {
            console.error('Error loading videos:', error);
            this.showError('Failed to load videos. Please try again.');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    displayVideos() {
        const container = document.getElementById('solutionsGrid') || document.getElementById('videos-list');
        if (!container) return;

        container.innerHTML = '';

        if (this.videos.length === 0) {
            container.innerHTML = `
                <div class="no-videos">
                    <p>No videos found. Try adjusting your search or filters.</p>
                </div>
            `;
            return;
        }

        this.videos.forEach(video => {
            const card = this.createVideoCard(video);
            container.appendChild(card);
        });
    }

    createVideoCard(video) {
        const card = document.createElement('div');
        card.className = 'solution-card';
        card.dataset.videoId = video._id;

        let media = '';
        if (video.type === 'video' && video.youtubeUrl) {
            const youtubeId = this.extractYoutubeID(video.youtubeUrl);
            media = `
                <div class="video-thumbnail" data-youtube-url="${video.youtubeUrl}">
                    <img src="https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg" alt="${video.title}" style="width:100%; height: 200px; object-fit: cover;">
                    <div class="play-button">▶️</div>
                </div>
            `;
        } else if (video.type === 'image' && video.fileUrl) {
            media = `<img src="${video.fileUrl}" alt="${video.title}" style="width:100%; height: 200px; object-fit: cover;">`;
        }

        card.innerHTML = `
            <div class="solution-media">${media}</div>
            <div class="solution-content">
                <h4>${this.escapeHtml(video.title)}</h4>
                <p>${this.escapeHtml(video.description)}</p>
                <div class="solution-meta">
                    <span>${this.escapeHtml(video.bookTitle)} - ${this.escapeHtml(video.chapter)}</span>
                    <span>${new Date(video.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="video-stats">
                    <span>👁️ ${video.views}</span>
                    ${video.difficulty ? `<span class="difficulty difficulty-${video.difficulty}">${video.difficulty}</span>` : ''}
                </div>
                ${video.tags && video.tags.length > 0 ? `
                    <div class="video-tags">
                        ${video.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                    </div>
                ` : ''}
                ${this.adminUnlocked ? `<button class="delete-btn" data-video-id="${video._id}" style="background:red;color:white;padding:5px 10px;border:none;border-radius:3px;margin-top:10px;">Delete</button>` : ''}
            </div>
        `;

        // Add play video event listener
        const thumbnail = card.querySelector('.video-thumbnail');
        if (thumbnail) {
            thumbnail.addEventListener('click', () => {
                const youtubeUrl = thumbnail.getAttribute('data-youtube-url');
                this.playVideo(youtubeUrl);
            });
            thumbnail.style.cursor = 'pointer';
        }

        // Add delete button event listener (only if button exists)
        const deleteBtn = card.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                const videoId = deleteBtn.getAttribute('data-video-id');
                if (!videoId || videoId === "null" || videoId === "undefined") {
                    this.showError('Could not delete: No valid video ID.');
                    return;
                }
                this.deleteVideo(videoId);
            });
        }

        return card;
    }

    extractYoutubeID(url) {
        const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }

    playVideo(youtubeUrl) {
        // Open YouTube video in new tab
        window.open(youtubeUrl, '_blank');
    }

    async handleUpload(e) {
        e.preventDefault();

        if (this.isLoading) return;

        const formData = this.collectFormData();
        if (!formData) return;

        this.isLoading = true;
        this.uploadBtn.disabled = true;
        this.uploadBtn.textContent = 'Uploading...';

        try {
            const response = await fetch(`${API_BASE_URL}/videos`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess('Video uploaded successfully!');
                this.resetUploadForm();
                this.loadVideos(); // Reload videos
            } else {
                this.showError('Upload failed: ' + data.message);
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showError('Upload failed. Please try again.');
        } finally {
            this.isLoading = false;
            this.uploadBtn.disabled = false;
            this.uploadBtn.textContent = 'Upload Solution';
        }
    }

    async deleteVideo(videoId) {
        if (!confirm('Are you sure you want to delete this video?')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/videos/${videoId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess('Video deleted successfully!');
                this.loadVideos(); // Reload gallery
            } else {
                this.showError('Delete failed: ' + data.message);
            }
        } catch (error) {
            this.showError('Delete failed. Please try again.');
        }
    }

    collectFormData() {
        const title = document.getElementById('title')?.value?.trim();
        const description = document.getElementById('description')?.value?.trim();
        const bookTitle = document.getElementById('bookTitle')?.value?.trim();
        const chapter = document.getElementById('chapterNumber')?.value?.trim();
        const youtubeUrl = document.getElementById('youtubeUrl')?.value?.trim();
        
        // Determine type based on YouTube URL presence
        const type = youtubeUrl ? 'video' : 'image'; 

        if (!title || !description || !bookTitle || !chapter) {
            this.showError('Please fill in all required fields.');
            return null;
        }

        if (type === 'video' && !youtubeUrl) {
            this.showError('Please provide a YouTube URL for video content.');
            return null;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('bookTitle', bookTitle);
        formData.append('chapter', chapter);
        formData.append('type', type);

        if (youtubeUrl) {
            formData.append('youtubeUrl', youtubeUrl);
        }

        // Add image file if type is image
        if (type === 'image' && this.fileInput?.files[0]) {
            formData.append('image', this.fileInput.files[0]);
        }

        return formData;
    }

    resetUploadForm() {
        const inputs = ['title', 'bookTitle', 'description', 'chapterNumber', 'youtubeUrl'];
        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = '';
        });

        if (this.fileInput) this.fileInput.value = '';
    }

    handleSearch(query) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            const filters = { ...this.filters };
            if (query.trim()) {
                filters.search = query.trim();
            } else {
                delete filters.search;
            }
            this.loadVideos(1, filters);
        }, 500);
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.add('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.fileInput.files = files;
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            // Auto-select image type if image file is selected
            const imageRadio = document.querySelector('input[name="contentType"][value="image"]');
            if (imageRadio) imageRadio.checked = true;
        }
    }

    updatePagination() {
        // Add pagination controls if they don't exist
        let paginationContainer = document.querySelector('.pagination-container');
        if (!paginationContainer) {
            paginationContainer = document.createElement('div');
            paginationContainer.className = 'pagination-container';
            const container = document.getElementById('solutionsGrid') || document.getElementById('videos-list');
            if (container && container.parentNode) {
                container.parentNode.appendChild(paginationContainer);
            }
        }

        paginationContainer.innerHTML = '';

        if (this.totalPages <= 1) return;

        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.textContent = 'Previous';
        prevBtn.disabled = this.currentPage === 1;
        prevBtn.onclick = () => this.loadVideos(this.currentPage - 1, this.filters);
        paginationContainer.appendChild(prevBtn);

        // Page info
        const pageInfo = document.createElement('span');
        pageInfo.textContent = `Page ${this.currentPage} of ${this.totalPages}`;
        pageInfo.className = 'page-info';
        paginationContainer.appendChild(pageInfo);

        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Next';
        nextBtn.disabled = this.currentPage === this.totalPages;
        nextBtn.onclick = () => this.loadVideos(this.currentPage + 1, this.filters);
        paginationContainer.appendChild(nextBtn);
    }

    showLoading() {
        const container = document.getElementById('solutionsGrid') || document.getElementById('videos-list');
        if (container) {
            container.innerHTML = '<div class="loading">Loading videos...</div>';
        }
    }

    hideLoading() {
        const loading = document.querySelector('.loading');
        if (loading) loading.remove();
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existing = document.querySelectorAll('.notification');
        existing.forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

// Initialize the video manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.videoManager = new VideoManager();
});

// Make playVideo function globally accessible
window.playVideo = function(youtubeUrl) {
    window.open(youtubeUrl, '_blank');
};
