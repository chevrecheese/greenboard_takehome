# Web Archiving Tool

A full-stack web archiving application that captures and preserves websites similar to the Wayback Machine.

## Features

- **URL Archiving**: Submit any URL to create a complete snapshot
- **Recursive Crawling**: Automatically discovers and archives all same-domain pages
- **Asset Preservation**: Downloads and stores HTML, CSS, JavaScript, images, and other assets
- **Version History**: Maintains multiple snapshots with timestamps
- **Archive Viewer**: Browse and view archived versions of websites

## Tech Stack

- **Frontend**: React with modern hooks and responsive design
- **Backend**: Node.js with Express
- **Web Scraping**: Puppeteer for dynamic content handling
- **Storage**: File-based system with JSON metadata

## Quick Start

### Prerequisites

- Node.js 16+ and npm

### Installation

1. Clone and navigate to the project:

```bash
git clone https://github.com/chevrecheese/greenboard_takehome.git
cd web-archiver
```

2. Install backend dependencies:

```bash
cd backend
npm install
```

3. Install frontend dependencies:

```bash
cd ../frontend
npm install
```

### Running the Application

1. Start the backend server:

```bash
cd backend
npm start
```

The API will be available at `http://localhost:3001`

2. Start the frontend development server:

```bash
cd frontend
npm start
```

The web interface will be available at `http://localhost:3000`

## Technical Decisions & Trade-offs

### Architecture Choices

1. **File-based Storage**: Chose simple file system over database for easier setup and deployment
2. **Puppeteer over Simple HTTP**: Handles JavaScript-rendered content and modern web apps
3. **Domain-scoped Crawling**: Prevents infinite crawling while capturing complete sites
4. **Asynchronous Processing**: Non-blocking archiving with job status tracking

### Limitations & Future Improvements

1. **Scalability**: Current file-based approach won't scale to production volumes
2. **Concurrent Archiving**: Limited by single-process architecture
3. **Asset Deduplication**: No optimization for repeated assets across archives
4. **Search Functionality**: No full-text search within archived content

### Production Scaling Considerations

1. **Database Migration**: Move to PostgreSQL/MongoDB for metadata and indexing
2. **Object Storage**: Use S3/GCS for archived content storage
3. **Queue System**: Implement Redis/RabbitMQ for job processing
4. **Microservices**: Split archiving, serving, and management into separate services
5. **CDN Integration**: Serve archived content through CDN for performance
6. **Search Engine**: Add Elasticsearch for content search capabilities
