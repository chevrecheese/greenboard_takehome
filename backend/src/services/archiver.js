const puppeteer = require('puppeteer');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const { URL } = require('url');
const mime = require('mime-types');
const storageService = require('./storage');

// Create axios instance with better defaults for handling connection issues
const httpClient = axios.create({
  timeout: 15000,
  maxRedirects: 5,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; WebArchiver/1.0)',
    'Accept': '*/*',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive'
  },
  // Add connection pooling
  httpAgent: require('http').Agent({ 
    keepAlive: true, 
    maxSockets: 10,
    timeout: 15000
  }),
  httpsAgent: require('https').Agent({ 
    keepAlive: true, 
    maxSockets: 10,
    timeout: 15000,
    rejectUnauthorized: false // Allow self-signed certificates
  })
});

class ArchiverService {
  constructor() {
    this.activeJobs = new Map(); // Track active archiving jobs
    this.maxDepth = 3; // Maximum crawl depth
    this.maxPages = 50; // Maximum pages per domain
    this.timeout = 30000; // 30 second timeout per page
  }

  /**
   * Start archiving a website
   * @param {string} url - URL to archive
   * @returns {Object} Job information
   */
  async startArchiving(url) {
    try {
      const parsedUrl = new URL(url);
      const domain = parsedUrl.hostname;
      
      // Create archive entry
      const archive = storageService.createArchive(url, domain);
      
      // Start archiving process (non-blocking)
      this.archiveWebsite(archive.id, url).catch(error => {
        console.error(`Archiving failed for ${url}:`, error);
        storageService.updateArchive(archive.id, {
          status: 'failed',
          error: error.message
        });
      });

      return {
        jobId: archive.id,
        status: 'started',
        url,
        domain
      };
    } catch (error) {
      throw new Error(`Invalid URL: ${error.message}`);
    }
  }

  /**
   * Archive a website and all its same-domain pages
   * @param {string} archiveId - Archive ID
   * @param {string} startUrl - Starting URL
   */
  async archiveWebsite(archiveId, startUrl) {
    let browser;
    let usePuppeteer = true;
    const visitedUrls = new Set();
    const urlQueue = [{ url: startUrl, depth: 0 }];
    const domain = new URL(startUrl).hostname;

    try {
      // Update status to processing
      storageService.updateArchive(archiveId, { status: 'processing' });

      // Try to launch browser, fallback to HTTP-only mode if it fails
      try {
        browser = await puppeteer.launch({
          headless: 'new',
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-background-networking',
            '--proxy-server="direct://"',
            '--proxy-bypass-list=*'
          ],
          ignoreDefaultArgs: ['--disable-extensions'],
          timeout: 60000
        });
        console.log('✅ Puppeteer browser launched successfully');
      } catch (browserError) {
        console.warn('⚠️ Puppeteer launch failed, using HTTP-only mode:', browserError.message);
        usePuppeteer = false;
        browser = null;
      }

      while (urlQueue.length > 0 && visitedUrls.size < this.maxPages) {
        const { url, depth } = urlQueue.shift();
        
        // Skip if already visited or too deep
        if (visitedUrls.has(url) || depth > this.maxDepth) {
          continue;
        }

        try {
          console.log(`Archiving: ${url} (depth: ${depth})`);
          visitedUrls.add(url);

          // Archive the page
          const links = await this.archivePage(browser, archiveId, url);
          
          // Add same-domain links to queue
          if (depth < this.maxDepth) {
            for (const link of links) {
              try {
                const linkUrl = new URL(link, url);
                if (linkUrl.hostname === domain && !visitedUrls.has(linkUrl.href)) {
                  urlQueue.push({ url: linkUrl.href, depth: depth + 1 });
                }
              } catch (e) {
                // Skip invalid URLs
                continue;
              }
            }
          }
          
          // Add small delay between pages to be respectful
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`Failed to archive ${url}:`, error.message);
          // Continue with next URL instead of failing the entire job
        }
      }

      // Update status to completed
      storageService.updateArchive(archiveId, {
        status: 'completed',
        pagesArchived: visitedUrls.size,
        completedAt: new Date().toISOString()
      });

      console.log(`✅ Archiving completed for ${startUrl} (${visitedUrls.size} pages)`);

    } catch (error) {
      console.error('Archiving error:', error);
      storageService.updateArchive(archiveId, {
        status: 'failed',
        error: error.message
      });
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Archive a single page and its assets
   * @param {Object} browser - Puppeteer browser instance
   * @param {string} archiveId - Archive ID
   * @param {string} url - Page URL to archive
   * @returns {Array} Array of links found on the page
   */
  async archivePage(browser, archiveId, url) {
    // If browser is available, try Puppeteer first, otherwise use HTTP
    if (browser) {
      try {
        return await this.archivePageWithPuppeteer(browser, archiveId, url);
      } catch (error) {
        console.warn(`Puppeteer failed for ${url}, trying fallback method: ${error.message}`);
        return await this.archivePageWithHttp(archiveId, url);
      }
    } else {
      return await this.archivePageWithHttp(archiveId, url);
    }
  }

  /**
   * Archive page using Puppeteer (handles JS-rendered content)
   */
  async archivePageWithPuppeteer(browser, archiveId, url) {
    const page = await browser.newPage();
    const links = [];

    try {
      // Set timeout and user agent
      await page.setDefaultTimeout(this.timeout);
      await page.setUserAgent('Mozilla/5.0 (compatible; WebArchiver/1.0)');

      // Navigate to page with more lenient waiting
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: this.timeout 
      });

      // Wait a bit for dynamic content to load
      await page.waitForTimeout(2000);

      // Get page content
      const content = await page.content();
      
      // Parse with Cheerio to extract links and modify content
      const $ = cheerio.load(content);
      const modifiedContent = await this.processPageContent($, archiveId, url);

      // Save the page
      const relativePath = this.getRelativePath(url);
      storageService.savePage(archiveId, url, modifiedContent, relativePath);

      // Extract links for crawling
      $('a[href]').each((i, element) => {
        const href = $(element).attr('href');
        if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
          links.push(href);
        }
      });

      return links;

    } finally {
      await page.close();
    }
  }

  /**
   * Archive page using simple HTTP request (fallback method)
   */
  async archivePageWithHttp(archiveId, url) {
    const links = [];

    try {
      console.log(`Using HTTP fallback for: ${url}`);
      
      // Download page with HTTP client
      const response = await this.downloadWithRetry(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; WebArchiver/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive'
        }
      });

      // Parse with Cheerio
      const $ = cheerio.load(response.data);
      const modifiedContent = await this.processPageContent($, archiveId, url);

      // Save the page
      const relativePath = this.getRelativePath(url);
      storageService.savePage(archiveId, url, modifiedContent, relativePath);

      // Extract links for crawling
      $('a[href]').each((i, element) => {
        const href = $(element).attr('href');
        if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
          links.push(href);
        }
      });

      return links;

    } catch (error) {
      console.error(`HTTP fallback also failed for ${url}:`, error.message);
      return [];
    }
  }

  /**
   * Process page content and download assets
   * @param {Object} $ - Cheerio instance
   * @param {string} archiveId - Archive ID
   * @param {string} pageUrl - Current page URL
   * @returns {string} Modified HTML content
   */
  async processPageContent($, archiveId, pageUrl) {
    const baseUrl = new URL(pageUrl);

    // Process images
    const imgPromises = [];
    $('img[src]').each((i, element) => {
      const src = $(element).attr('src');
      if (src) {
        imgPromises.push(this.downloadAndReplaceAsset($, element, 'src', src, archiveId, baseUrl));
      }
    });

    // Process CSS files
    const cssPromises = [];
    $('link[rel="stylesheet"][href]').each((i, element) => {
      const href = $(element).attr('href');
      if (href) {
        cssPromises.push(this.downloadAndReplaceAsset($, element, 'href', href, archiveId, baseUrl));
      }
    });

    // Process JavaScript files
    const jsPromises = [];
    $('script[src]').each((i, element) => {
      const src = $(element).attr('src');
      if (src) {
        jsPromises.push(this.downloadAndReplaceAsset($, element, 'src', src, archiveId, baseUrl));
      }
    });

    // Wait for all assets to download
    await Promise.allSettled([...imgPromises, ...cssPromises, ...jsPromises]);

    return $.html();
  }

  /**
   * Download an asset and update the HTML reference
   * @param {Object} $ - Cheerio instance
   * @param {Object} element - HTML element
   * @param {string} attribute - Attribute name (src, href, etc.)
   * @param {string} assetUrl - Asset URL
   * @param {string} archiveId - Archive ID
   * @param {URL} baseUrl - Base URL for resolving relative URLs
   */
  async downloadAndReplaceAsset($, element, attribute, assetUrl, archiveId, baseUrl) {
    try {
      // Resolve relative URLs
      const absoluteUrl = new URL(assetUrl, baseUrl.href);
      
      // Skip external assets (different domain)
      if (absoluteUrl.hostname !== baseUrl.hostname) {
        return;
      }

      // Generate local path for asset
      const relativePath = this.getAssetPath(absoluteUrl.href);
      
      // Check if already downloaded
      if (storageService.fileExists(archiveId, relativePath)) {
        $(element).attr(attribute, relativePath);
        return;
      }

      // Download asset with retry logic
      const response = await this.downloadWithRetry(absoluteUrl.href, {
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; WebArchiver/1.0)',
          'Accept': '*/*',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive'
        },
        maxRedirects: 5,
        validateStatus: (status) => status < 400
      });

      // Save asset
      storageService.saveAsset(archiveId, absoluteUrl.href, response.data, relativePath);
      
      // Update HTML reference
      $(element).attr(attribute, relativePath);

    } catch (error) {
      console.error(`Failed to download asset ${assetUrl}:`, error.message);
    }
  }

  /**
   * Generate relative path for a page URL
   * @param {string} url - Page URL
   * @returns {string} Relative file path
   */
  getRelativePath(url) {
    const parsedUrl = new URL(url);
    let pathname = parsedUrl.pathname;
    
    // Handle root path
    if (pathname === '/') {
      return 'index.html';
    }
    
    // Handle paths ending with /
    if (pathname.endsWith('/')) {
      pathname += 'index.html';
    }
    
    // Handle paths without extension
    if (!path.extname(pathname)) {
      pathname += '.html';
    }
    
    // Remove leading slash and return
    return pathname.startsWith('/') ? pathname.substring(1) : pathname;
  }

  /**
   * Generate asset path
   * @param {string} url - Asset URL
   * @returns {string} Relative asset path
   */
  getAssetPath(url) {
    const parsedUrl = new URL(url);
    let pathname = parsedUrl.pathname;
    
    // Create assets directory structure
    const dir = path.dirname(pathname);
    const filename = path.basename(pathname);
    
    // Handle query parameters by creating unique filename
    if (parsedUrl.search) {
      const ext = path.extname(filename);
      const name = path.basename(filename, ext);
      const hash = Buffer.from(parsedUrl.search).toString('base64').replace(/[/+=]/g, '').substring(0, 8);
      return path.join('assets', dir, `${name}_${hash}${ext}`).replace(/\\/g, '/');
    }
    
    return path.join('assets', pathname).replace(/\\/g, '/');
  }

  /**
   * Download with retry logic to handle socket hang up errors
   * @param {string} url - URL to download
   * @param {Object} options - Axios options
   * @param {number} retries - Number of retries (default: 3)
   * @returns {Promise<Object>} Axios response
   */
  async downloadWithRetry(url, options, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await httpClient.get(url, options);
        return response;
      } catch (error) {
        console.warn(`Download attempt ${attempt}/${retries} failed for ${url}: ${error.message}`);
        
        if (attempt === retries) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Get job status
   * @param {string} jobId - Job ID (archive ID)
   * @returns {Object} Job status
   */
  getJobStatus(jobId) {
    const archive = storageService.getArchive(jobId);
    if (!archive) {
      return { error: 'Job not found' };
    }

    return {
      jobId,
      status: archive.status,
      url: archive.url,
      domain: archive.domain,
      timestamp: archive.timestamp,
      pagesArchived: archive.pagesArchived || 0,
      error: archive.error
    };
  }
}

module.exports = new ArchiverService();
