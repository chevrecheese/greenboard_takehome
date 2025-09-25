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
git clone <repository-url>
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

## Usage

1. Open the web interface at `http://localhost:3000`
2. Enter a URL in the input field (e.g., `https://example.com`)
3. Click "Archive Website" to start the archiving process
4. View the progress and wait for completion
5. Browse archived versions in the history section
6. Click on any timestamp to view that specific archived snapshot

## Project Structure

```
web-archiver/
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   ├── archiver.js      # Core archiving logic
│   │   │   └── storage.js       # File storage management
│   │   ├── routes/
│   │   │   └── api.js          # API endpoints
│   │   └── app.js              # Express server setup
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ArchiveForm.js   # URL input form
│   │   │   ├── ArchiveList.js   # Archive history
│   │   │   └── ArchiveViewer.js # Archive display
│   │   ├── services/
│   │   │   └── api.js          # API client
│   │   └── App.js              # Main React component
│   └── package.json
└── README.md
```

## API Endpoints

- `POST /api/archive` - Create a new archive for a URL
- `GET /api/archives/:domain` - List all archives for a domain
- `GET /api/view/:archiveId/*` - Serve archived content
- `GET /api/status/:jobId` - Check archiving job status

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

## Development

### Adding New Features

The codebase is structured for easy extension:

- Add new API endpoints in `backend/src/routes/api.js`
- Extend archiving logic in `backend/src/services/archiver.js`
- Add UI components in `frontend/src/components/`

### Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests  
cd frontend
npm test
```

## License

MIT License - see LICENSE file for details
