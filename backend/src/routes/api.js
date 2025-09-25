const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const mime = require('mime-types');
const archiverService = require('../services/archiver');
const storageService = require('../services/storage');

const router = express.Router();

/**
 * POST /api/archive
 * Start archiving a website
 */
router.post('/archive', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const job = await archiverService.startArchiving(url);
    res.json(job);

  } catch (error) {
    console.error('Archive creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/status/:jobId
 * Get archiving job status
 */
router.get('/status/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    const status = archiverService.getJobStatus(jobId);
    
    if (status.error) {
      return res.status(404).json(status);
    }
    
    res.json(status);
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/archives/:domain
 * Get all archives for a domain
 */
router.get('/archives/:domain', (req, res) => {
  try {
    const { domain } = req.params;
    const archives = storageService.getArchivesByDomain(domain);
    
    res.json({
      domain,
      archives: archives.map(archive => ({
        id: archive.id,
        url: archive.url,
        timestamp: archive.timestamp,
        status: archive.status,
        pagesArchived: archive.pagesArchived || 0,
        createdAt: archive.createdAt,
        completedAt: archive.completedAt
      }))
    });
  } catch (error) {
    console.error('Archives retrieval error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/archives
 * Get all archives (for debugging/admin)
 */
router.get('/archives', (req, res) => {
  try {
    const archives = storageService.getAllArchives();
    res.json({
      total: archives.length,
      archives: archives.map(archive => ({
        id: archive.id,
        url: archive.url,
        domain: archive.domain,
        timestamp: archive.timestamp,
        status: archive.status,
        pagesArchived: archive.pagesArchived || 0
      }))
    });
  } catch (error) {
    console.error('All archives retrieval error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/view/:archiveId/*
 * Serve archived content
 */
router.get('/view/:archiveId/*', (req, res) => {
  try {
    const { archiveId } = req.params;
    const requestPath = req.params[0] || 'index.html';
    
    // Get archive metadata
    const archive = storageService.getArchive(archiveId);
    if (!archive) {
      return res.status(404).json({ error: 'Archive not found' });
    }

    if (archive.status !== 'completed') {
      return res.status(400).json({ 
        error: 'Archive not ready', 
        status: archive.status 
      });
    }

    // Get file path
    const filePath = storageService.getArchivedFilePath(archiveId, requestPath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found in archive' });
    }

    // Determine content type
    const contentType = mime.lookup(filePath) || 'application/octet-stream';
    
    // Set appropriate headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('X-Archive-Id', archiveId);
    res.setHeader('X-Archive-Timestamp', archive.timestamp);
    
    // Handle text files (HTML, CSS, JS) with UTF-8 encoding
    if (contentType.startsWith('text/') || contentType.includes('javascript') || contentType.includes('json')) {
      const content = fs.readFileSync(filePath, 'utf8');
      res.send(content);
    } else {
      // Handle binary files (images, etc.)
      const content = fs.readFileSync(filePath);
      res.send(content);
    }

  } catch (error) {
    console.error('Archive serving error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/archive/:archiveId/info
 * Get detailed archive information
 */
router.get('/archive/:archiveId/info', (req, res) => {
  try {
    const { archiveId } = req.params;
    const archive = storageService.getArchive(archiveId);
    
    if (!archive) {
      return res.status(404).json({ error: 'Archive not found' });
    }

    res.json(archive);
  } catch (error) {
    console.error('Archive info error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/archive/:archiveId
 * Delete an archive (optional feature)
 */
router.delete('/archive/:archiveId', async (req, res) => {
  try {
    const { archiveId } = req.params;
    const archive = storageService.getArchive(archiveId);
    
    if (!archive) {
      return res.status(404).json({ error: 'Archive not found' });
    }

    // Remove archive directory
    const archiveDir = path.join(__dirname, '../../archives', archiveId);
    if (fs.existsSync(archiveDir)) {
      await fs.remove(archiveDir);
    }

    // Remove from metadata
    const metadata = fs.readJsonSync(storageService.metadataFile);
    metadata.archives = metadata.archives.filter(a => a.id !== archiveId);
    fs.writeJsonSync(storageService.metadataFile, metadata, { spaces: 2 });

    res.json({ message: 'Archive deleted successfully' });
  } catch (error) {
    console.error('Archive deletion error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
