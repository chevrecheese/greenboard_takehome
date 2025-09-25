import React, { useState } from 'react';

const ArchiveViewer = ({ archive, viewUrl, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError('Failed to load archived content');
  };

  const openInNewTab = () => {
    window.open(viewUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="archive-viewer-overlay">
      <div className="archive-viewer">
        <div className="viewer-header">
          <div className="archive-info">
            <h3>📄 Archived: {archive.domain}</h3>
            <div className="archive-details">
              <span className="detail-item">
                🔗 <strong>Original:</strong> {archive.url}
              </span>
              <span className="detail-item">
                📅 <strong>Archived:</strong> {new Date(archive.timestamp).toLocaleString()}
              </span>
              {archive.pagesArchived && (
                <span className="detail-item">
                  📄 <strong>Pages:</strong> {archive.pagesArchived}
                </span>
              )}
            </div>
          </div>
          
          <div className="viewer-controls">
            <button 
              onClick={openInNewTab}
              className="control-button open-button"
              title="Open in new tab"
            >
              🔗 Open in New Tab
            </button>
            <button 
              onClick={onClose}
              className="control-button close-button"
              title="Close viewer"
            >
              ✕ Close
            </button>
          </div>
        </div>

        <div className="viewer-content">
          {isLoading && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <p>Loading archived content...</p>
            </div>
          )}
          
          {error && (
            <div className="error-overlay">
              <div className="error-icon">⚠️</div>
              <h4>Error Loading Archive</h4>
              <p>{error}</p>
              <button onClick={openInNewTab} className="retry-button">
                Try Opening in New Tab
              </button>
            </div>
          )}

          <iframe
            src={viewUrl}
            className="archive-frame"
            title={`Archived content of ${archive.domain}`}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
        </div>

        <div className="viewer-footer">
          <div className="archive-notice">
            <span className="notice-icon">ℹ️</span>
            <span>
              This is an archived snapshot from {new Date(archive.timestamp).toLocaleDateString()}.
              Some interactive features may not work as expected.
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .archive-viewer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .archive-viewer {
          width: 100%;
          height: 100%;
          max-width: 1400px;
          max-height: 900px;
          background: white;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          overflow: hidden;
        }

        .viewer-header {
          background: #f8f9fa;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #e9ecef;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .archive-info h3 {
          margin: 0 0 0.5rem 0;
          color: #2c3e50;
          font-size: 1.3rem;
        }

        .archive-details {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          font-size: 0.9rem;
        }

        .detail-item {
          color: #5a6c7d;
          white-space: nowrap;
        }

        .detail-item strong {
          color: #2c3e50;
        }

        .viewer-controls {
          display: flex;
          gap: 0.5rem;
        }

        .control-button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .open-button {
          background: #3498db;
          color: white;
        }

        .open-button:hover {
          background: #2980b9;
        }

        .close-button {
          background: #e74c3c;
          color: white;
        }

        .close-button:hover {
          background: #c0392b;
        }

        .viewer-content {
          flex: 1;
          position: relative;
          background: #f8f9fa;
        }

        .archive-frame {
          width: 100%;
          height: 100%;
          border: none;
          background: white;
        }

        .loading-overlay,
        .error-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #e0e0e0;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        .loading-overlay p {
          color: #7f8c8d;
          font-size: 1.1rem;
        }

        .error-overlay {
          text-align: center;
          padding: 2rem;
        }

        .error-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .error-overlay h4 {
          color: #e74c3c;
          margin-bottom: 0.5rem;
        }

        .error-overlay p {
          color: #7f8c8d;
          margin-bottom: 2rem;
        }

        .retry-button {
          padding: 0.75rem 1.5rem;
          background: #3498db;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .retry-button:hover {
          background: #2980b9;
        }

        .viewer-footer {
          background: #2c3e50;
          color: white;
          padding: 0.75rem 1.5rem;
        }

        .archive-notice {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
        }

        .notice-icon {
          font-size: 1.1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .archive-viewer-overlay {
            padding: 0;
          }

          .archive-viewer {
            max-width: none;
            max-height: none;
            border-radius: 0;
          }

          .viewer-header {
            flex-direction: column;
            align-items: stretch;
          }

          .archive-details {
            flex-direction: column;
            gap: 0.5rem;
          }

          .viewer-controls {
            justify-content: space-between;
          }

          .control-button {
            flex: 1;
          }

          .archive-notice {
            font-size: 0.8rem;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default ArchiveViewer;
