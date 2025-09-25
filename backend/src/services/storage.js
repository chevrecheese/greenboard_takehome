const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class StorageService {
  constructor() {
    this.archivesDir = path.join(__dirname, '../../archives');
    this.metadataFile = path.join(this.archivesDir, 'metadata.json');
    this.ensureDirectories();
  }

  ensureDirectories() {
    fs.ensureDirSync(this.archivesDir);
    if (!fs.existsSync(this.metadataFile)) {
      fs.writeJsonSync(this.metadataFile, { archives: [] });
    }
  }

  /**
   * Create a new archive entry
   * @param {string} url - The original URL
   * @param {string} domain - The domain being archived
   * @returns {Object} Archive metadata
   */
  createArchive(url, domain) {
    const archiveId = uuidv4();
    const timestamp = new Date().toISOString();
    const archiveDir = path.join(this.archivesDir, archiveId);
    
    fs.ensureDirSync(archiveDir);
    
    const archive = {
      id: archiveId,
      url,
      domain,
      timestamp,
      status: 'pending',
      pages: [],
      assets: [],
      createdAt: timestamp
    };

    // Save archive metadata
    const metadata = fs.readJsonSync(this.metadataFile);
    metadata.archives.push(archive);
    fs.writeJsonSync(this.metadataFile, metadata, { spaces: 2 });

    return archive;
  }

  /**
   * Update archive status and data
   * @param {string} archiveId - Archive ID
   * @param {Object} updates - Updates to apply
   */
  updateArchive(archiveId, updates) {
    const metadata = fs.readJsonSync(this.metadataFile);
    const archiveIndex = metadata.archives.findIndex(a => a.id === archiveId);
    
    if (archiveIndex === -1) {
      throw new Error(`Archive ${archiveId} not found`);
    }

    metadata.archives[archiveIndex] = {
      ...metadata.archives[archiveIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    fs.writeJsonSync(this.metadataFile, metadata, { spaces: 2 });
    return metadata.archives[archiveIndex];
  }

  /**
   * Get all archives for a domain
   * @param {string} domain - Domain to search for
   * @returns {Array} Array of archives
   */
  getArchivesByDomain(domain) {
    const metadata = fs.readJsonSync(this.metadataFile);
    return metadata.archives
      .filter(archive => archive.domain === domain)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Get archive by ID
   * @param {string} archiveId - Archive ID
   * @returns {Object|null} Archive metadata
   */
  getArchive(archiveId) {
    const metadata = fs.readJsonSync(this.metadataFile);
    return metadata.archives.find(archive => archive.id === archiveId) || null;
  }

  /**
   * Save a page to the archive
   * @param {string} archiveId - Archive ID
   * @param {string} url - Page URL
   * @param {string} content - Page HTML content
   * @param {string} relativePath - Relative path for the page
   */
  savePage(archiveId, url, content, relativePath) {
    const archiveDir = path.join(this.archivesDir, archiveId);
    const filePath = path.join(archiveDir, relativePath);
    
    // Ensure directory exists
    fs.ensureDirSync(path.dirname(filePath));
    
    // Save the HTML content
    fs.writeFileSync(filePath, content, 'utf8');
    
    // Update archive metadata
    const archive = this.getArchive(archiveId);
    if (archive) {
      const pages = archive.pages || [];
      pages.push({
        url,
        path: relativePath,
        savedAt: new Date().toISOString()
      });
      this.updateArchive(archiveId, { pages });
    }

    return filePath;
  }

  /**
   * Save an asset to the archive
   * @param {string} archiveId - Archive ID
   * @param {string} url - Asset URL
   * @param {Buffer} content - Asset content
   * @param {string} relativePath - Relative path for the asset
   */
  saveAsset(archiveId, url, content, relativePath) {
    const archiveDir = path.join(this.archivesDir, archiveId);
    const filePath = path.join(archiveDir, relativePath);
    
    // Ensure directory exists
    fs.ensureDirSync(path.dirname(filePath));
    
    // Save the asset
    fs.writeFileSync(filePath, content);
    
    // Update archive metadata
    const archive = this.getArchive(archiveId);
    if (archive) {
      const assets = archive.assets || [];
      assets.push({
        url,
        path: relativePath,
        savedAt: new Date().toISOString()
      });
      this.updateArchive(archiveId, { assets });
    }

    return filePath;
  }

  /**
   * Get the file path for an archived resource
   * @param {string} archiveId - Archive ID
   * @param {string} relativePath - Relative path within archive
   * @returns {string} Absolute file path
   */
  getArchivedFilePath(archiveId, relativePath) {
    return path.join(this.archivesDir, archiveId, relativePath);
  }

  /**
   * Check if a file exists in the archive
   * @param {string} archiveId - Archive ID
   * @param {string} relativePath - Relative path within archive
   * @returns {boolean} Whether file exists
   */
  fileExists(archiveId, relativePath) {
    const filePath = this.getArchivedFilePath(archiveId, relativePath);
    return fs.existsSync(filePath);
  }

  /**
   * Get all archives (for admin/debugging)
   * @returns {Array} All archives
   */
  getAllArchives() {
    const metadata = fs.readJsonSync(this.metadataFile);
    return metadata.archives.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
}

module.exports = new StorageService();
