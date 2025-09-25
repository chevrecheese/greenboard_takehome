import React, { useState } from 'react';
import ArchiveForm from './components/ArchiveForm';
import ArchiveList from './components/ArchiveList';
import ArchiveViewer from './components/ArchiveViewer';
import JobStatus from './components/JobStatus';
import './App.css';

function App() {
  const [currentJob, setCurrentJob] = useState(null);
  const [selectedArchive, setSelectedArchive] = useState(null);
  const [viewUrl, setViewUrl] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleArchiveStarted = (job) => {
    setCurrentJob(job);
    setError(null);
    setSuccess(`Started archiving ${job.url}. This may take a few minutes...`);
    
    // Clear success message after 5 seconds
    setTimeout(() => setSuccess(null), 5000);
  };

  const handleJobComplete = (job) => {
    setCurrentJob(job);
    setSuccess(`✅ Successfully archived ${job.domain}! You can now view the archive below.`);
    
    // Clear success message after 10 seconds
    setTimeout(() => setSuccess(null), 10000);
  };

  const handleViewArchive = (archive, url) => {
    setSelectedArchive(archive);
    setViewUrl(url);
  };

  const handleCloseViewer = () => {
    setSelectedArchive(null);
    setViewUrl(null);
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
    // Clear error after 10 seconds
    setTimeout(() => setError(null), 10000);
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1>🌐 Web Archiver</h1>
          <p>Preserve websites and browse them like the Wayback Machine</p>
        </div>
      </header>

      <main className="app-main">
        {/* Error/Success Messages */}
        {(error || success) && (
          <div className="message-container">
            {error && (
              <div className="message error-message">
                <span className="message-icon">⚠️</span>
                <span className="message-text">{error}</span>
                <button 
                  className="message-close" 
                  onClick={clearMessages}
                  aria-label="Close message"
                >
                  ✕
                </button>
              </div>
            )}
            
            {success && (
              <div className="message success-message">
                <span className="message-icon">✅</span>
                <span className="message-text">{success}</span>
                <button 
                  className="message-close" 
                  onClick={clearMessages}
                  aria-label="Close message"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}

        {/* Archive Form */}
        <section className="form-section">
          <ArchiveForm 
            onArchiveStarted={handleArchiveStarted}
            onError={handleError}
          />
        </section>

        {/* Job Status */}
        {currentJob && (
          <section className="status-section">
            <JobStatus 
              job={currentJob}
              onJobComplete={handleJobComplete}
              onError={handleError}
            />
          </section>
        )}

        {/* Archive List */}
        <section className="list-section">
          <ArchiveList 
            currentJob={currentJob}
            onViewArchive={handleViewArchive}
            onError={handleError}
          />
        </section>
      </main>

      {/* Archive Viewer Modal */}
      {selectedArchive && viewUrl && (
        <ArchiveViewer 
          archive={selectedArchive}
          viewUrl={viewUrl}
          onClose={handleCloseViewer}
        />
      )}

      <footer className="app-footer">
        <div className="footer-content">
          <p>
            Built with ❤️ using React and Node.js | 
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-link"
            >
              View Source
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
