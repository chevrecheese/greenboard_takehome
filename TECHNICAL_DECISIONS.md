# Technical Decisions & Architecture

## Overview

This document outlines the key technical decisions made during the development of the Web Archiving Tool, trade-offs considered, and future improvements.

## Architecture Decisions

### 1. Technology Stack

**Frontend: React**
- **Decision**: Used React with functional components and hooks
- **Rationale**: 
  - Excellent ecosystem and community support
  - Component-based architecture promotes reusability
  - Built-in state management sufficient for this scope
  - Easy to extend with additional libraries if needed
- **Trade-offs**: 
  - Larger bundle size compared to vanilla JS
  - Learning curve for developers unfamiliar with React

**Backend: Node.js + Express**
- **Decision**: Chose Node.js with Express framework
- **Rationale**:
  - JavaScript across full stack reduces context switching
  - Excellent async handling for I/O operations (web scraping)
  - Rich ecosystem of packages (Puppeteer, Cheerio, etc.)
  - Fast development and prototyping
- **Trade-offs**:
  - Single-threaded nature may limit CPU-intensive operations
  - Memory usage can be higher for long-running processes

### 2. Web Scraping Approach

**Puppeteer over Simple HTTP Requests**
- **Decision**: Used Puppeteer (headless Chrome) instead of simple HTTP requests
- **Rationale**:
  - Handles JavaScript-rendered content (SPAs, dynamic sites)
  - Better compatibility with modern websites
  - Can capture full page state after JS execution
  - Built-in asset discovery and download capabilities
- **Trade-offs**:
  - Higher resource usage (memory, CPU)
  - Slower than simple HTTP requests
  - Requires Chrome/Chromium installation

**Cheerio for HTML Processing**
- **Decision**: Used Cheerio for server-side HTML manipulation
- **Rationale**:
  - jQuery-like API familiar to developers
  - Fast and lightweight for HTML parsing
  - Easy to modify URLs and extract links
- **Alternative Considered**: Native DOM parsing (more verbose)

### 3. Storage Strategy

**File-based Storage**
- **Decision**: Used file system with JSON metadata instead of database
- **Rationale**:
  - Simpler setup and deployment (no database required)
  - Direct file serving without additional processing
  - Easy to backup and migrate (just copy directories)
  - Sufficient for prototype/demo purposes
- **Trade-offs**:
  - Limited scalability and concurrent access
  - No complex querying capabilities
  - Manual management of file organization
  - No ACID transactions

**Directory Structure**
```
archives/
├── metadata.json          # Archive index and metadata
├── {archive-id-1}/        # Individual archive directory
│   ├── index.html         # Main page
│   ├── about.html         # Additional pages
│   └── assets/            # Downloaded assets
│       ├── css/
│       ├── js/
│       └── images/
└── {archive-id-2}/
    └── ...
```

### 4. Asset Management

**Same-Domain Only**
- **Decision**: Only archive assets from the same domain
- **Rationale**:
  - Prevents infinite crawling of external resources
  - Reduces storage requirements
  - Avoids legal/copyright issues with external content
  - Maintains reasonable scope
- **Trade-offs**:
  - Some external assets (CDN resources) won't be preserved
  - May affect visual appearance of archived sites

**Asset Path Rewriting**
- **Decision**: Rewrite all asset URLs to relative paths
- **Rationale**:
  - Ensures archived content works offline
  - Prevents broken links in archived versions
  - Maintains site functionality
- **Implementation**: Used Cheerio to modify HTML attributes

### 5. Crawling Strategy

**Breadth-First Recursive Crawling**
- **Decision**: Implemented breadth-first crawling with depth limits
- **Rationale**:
  - Discovers site structure systematically
  - Prevents infinite loops with circular references
  - Configurable depth limits prevent runaway crawling
- **Limits Implemented**:
  - Maximum depth: 3 levels
  - Maximum pages: 50 per domain
  - Timeout: 30 seconds per page

**Link Discovery**
- **Decision**: Extract links from `<a href="">` attributes only
- **Rationale**:
  - Covers majority of navigation links
  - Simple and reliable extraction
  - Avoids complex JavaScript-based navigation
- **Alternative Considered**: JavaScript execution to find dynamic links (too complex for MVP)

### 6. User Interface Design

**Single Page Application**
- **Decision**: Built as SPA with modal-based archive viewer
- **Rationale**:
  - Smooth user experience without page reloads
  - Easy state management between components
  - Modern web app feel
- **Trade-offs**:
  - Larger initial bundle size
  - SEO challenges (not relevant for this tool)

**Real-time Status Updates**
- **Decision**: Implemented polling-based status updates
- **Rationale**:
  - Simple to implement and understand
  - Works reliably across different network conditions
  - No additional infrastructure required (WebSockets, etc.)
- **Trade-offs**:
  - Less efficient than push-based updates
  - Slight delay in status updates (2-second polling interval)

## What Would Be Done Differently With More Time

### 1. Enhanced Error Handling
- **Current**: Basic error catching and user messages
- **Improvement**: 
  - Detailed error categorization (network, parsing, storage)
  - Retry mechanisms for transient failures
  - Better user guidance for different error types
  - Comprehensive logging system

### 2. Performance Optimizations
- **Current**: Sequential processing with basic limits
- **Improvements**:
  - Parallel page processing (worker threads/processes)
  - Asset deduplication across archives
  - Incremental archiving (only changed content)
  - Compression for stored content
  - CDN integration for asset serving

### 3. Advanced Crawling Features
- **Current**: Simple same-domain link following
- **Improvements**:
  - Sitemap.xml parsing for better discovery
  - Robots.txt respect and parsing
  - JavaScript-rendered link discovery
  - Custom crawling rules and filters
  - Form submission handling

### 4. User Experience Enhancements
- **Current**: Basic web interface
- **Improvements**:
  - Bulk URL archiving
  - Scheduled/recurring archiving
  - Advanced search within archives
  - Archive comparison tools
  - Export/import functionality
  - User authentication and personal archives

### 5. Content Preservation
- **Current**: HTML, CSS, JS, images
- **Improvements**:
  - Video and audio content
  - PDF and document files
  - Dynamic content snapshots
  - Interactive element preservation
  - Mobile-responsive archive viewing

## Production Scaling Considerations

### 1. Database Migration
**Current Limitation**: File-based storage doesn't scale
**Solution**:
- **Metadata**: PostgreSQL for archive metadata, search indexes
- **Content**: Object storage (AWS S3, Google Cloud Storage)
- **Search**: Elasticsearch for full-text search within archives
- **Cache**: Redis for frequently accessed metadata

### 2. Microservices Architecture
**Current**: Monolithic application
**Proposed Architecture**:
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web UI        │    │   API Gateway   │    │   Archive       │
│   (React)       │◄──►│   (Express)     │◄──►│   Service       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Queue         │    │   Storage       │
                       │   (Redis/RMQ)   │    │   Service       │
                       └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Worker        │    │   Database      │
                       │   Processes     │    │   (PostgreSQL)  │
                       └─────────────────┘    └─────────────────┘
```

### 3. Scalability Improvements
- **Horizontal Scaling**: Multiple worker processes/containers
- **Load Balancing**: Distribute archiving jobs across workers
- **CDN Integration**: Serve archived content through CDN
- **Caching Strategy**: Multi-level caching (Redis, CDN, browser)
- **Rate Limiting**: Prevent abuse and manage resource usage

### 4. Reliability & Monitoring
- **Health Checks**: Service health monitoring and alerting
- **Metrics**: Archive success rates, processing times, storage usage
- **Logging**: Centralized logging with structured data
- **Backup Strategy**: Automated backups with point-in-time recovery
- **Disaster Recovery**: Multi-region deployment for high availability

### 5. Security Considerations
- **Authentication**: User accounts and access control
- **Authorization**: Role-based permissions for archives
- **Input Validation**: Comprehensive URL and input sanitization
- **Rate Limiting**: API rate limiting and DDoS protection
- **Content Security**: Sandboxed archive viewing to prevent XSS
- **Privacy**: GDPR compliance for archived personal data

### 6. Legal & Compliance
- **Robots.txt Compliance**: Respect website crawling preferences
- **Copyright Awareness**: Clear usage guidelines and restrictions
- **Data Retention**: Configurable retention policies
- **Terms of Service**: Clear guidelines for acceptable use
- **DMCA Process**: Takedown request handling procedures

## Conclusion

The current implementation successfully demonstrates the core concept of web archiving with a focus on simplicity and functionality. The technical decisions prioritized rapid development and ease of deployment while maintaining a clear path for future scalability and enhancement.

The file-based storage approach, while limiting for production use, provides an excellent foundation for understanding the domain and requirements. The modular architecture makes it straightforward to migrate individual components (storage, crawling, serving) to more robust solutions as needs evolve.

Key strengths of the current approach:
- Simple deployment and setup
- Clear separation of concerns
- Extensible architecture
- Modern, responsive user interface
- Reliable core functionality

The identified improvements provide a clear roadmap for evolving this prototype into a production-ready system capable of handling enterprise-scale archiving requirements.
