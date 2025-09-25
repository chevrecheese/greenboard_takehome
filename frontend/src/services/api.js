import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Start archiving a website
   * @param {string} url - URL to archive
   * @returns {Promise<Object>} Job information
   */
  async startArchiving(url) {
    try {
      const response = await this.client.post('/archive', { url });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get job status
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} Job status
   */
  async getJobStatus(jobId) {
    try {
      const response = await this.client.get(`/status/${jobId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get archives for a domain
   * @param {string} domain - Domain name
   * @returns {Promise<Object>} Archives data
   */
  async getArchivesByDomain(domain) {
    try {
      const response = await this.client.get(`/archives/${domain}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get all archives
   * @returns {Promise<Object>} All archives
   */
  async getAllArchives() {
    try {
      const response = await this.client.get('/archives');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get archive information
   * @param {string} archiveId - Archive ID
   * @returns {Promise<Object>} Archive details
   */
  async getArchiveInfo(archiveId) {
    try {
      const response = await this.client.get(`/archive/${archiveId}/info`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get URL for viewing archived content
   * @param {string} archiveId - Archive ID
   * @param {string} path - Path within archive (optional)
   * @returns {string} URL for archived content
   */
  getArchiveViewUrl(archiveId, path = '') {
    return `${API_BASE_URL}/view/${archiveId}/${path}`;
  }

  /**
   * Delete an archive
   * @param {string} archiveId - Archive ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteArchive(archiveId) {
    try {
      const response = await this.client.delete(`/archive/${archiveId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Extract domain from URL
   * @param {string} url - Full URL
   * @returns {string} Domain name
   */
  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      throw new Error('Invalid URL format');
    }
  }

  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {boolean} Whether URL is valid
   */
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Handle API errors
   * @param {Error} error - Axios error
   * @returns {Error} Formatted error
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.error || error.response.data?.message || 'Server error';
      return new Error(message);
    } else if (error.request) {
      // Request was made but no response received
      return new Error('Network error - please check your connection');
    } else {
      // Something else happened
      return new Error(error.message || 'Unknown error occurred');
    }
  }

  /**
   * Format timestamp for display
   * @param {string} timestamp - ISO timestamp
   * @returns {string} Formatted date/time
   */
  formatTimestamp(timestamp) {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
  }

  /**
   * Get relative time (e.g., "2 hours ago")
   * @param {string} timestamp - ISO timestamp
   * @returns {string} Relative time string
   */
  getRelativeTime(timestamp) {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      
      return date.toLocaleDateString();
    } catch (error) {
      return 'Unknown time';
    }
  }
}

export default new ApiService();
