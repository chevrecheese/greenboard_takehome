import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

const ArchiveList = ({ currentJob, onViewArchive, onError }) => {
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [allDomains, setAllDomains] = useState([]);

  // Load all archives on component mount
  useEffect(() => {
    loadAllArchives();
  }, []);

  // Update archives when a new job completes
  useEffect(() => {
    if (currentJob && currentJob.status === 'completed') {
      loadAllArchives();
    }
  }, [currentJob]);

  const loadAllArchives = async () => {
    setLoading(true);
    try {
      const data = await apiService.getAllArchives();
      setArchives(data.archives);
      
      // Extract unique domains
      const domains = [...new Set(data.archives.map(archive => archive.domain))];
      setAllDomains(domains);
      
    } catch (error) {
      onError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadArchivesForDomain = async (domain) => {
    if (!domain) {
      loadAllArchives();
      return;
    }

    setLoading(true);
    try {
      const data = await apiService.getArchivesByDomain(domain);
      setArchives(data.archives);
    } catch (error) {
      onError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDomainChange = (domain) => {
    setSelectedDomain(domain);
    loadArchivesForDomain(domain);
  };

  const handleViewArchive = (archive) => {
    const viewUrl = apiService.getArchiveViewUrl(archive.id);
    onViewArchive(archive, viewUrl);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: '#f39c12', text: 'Pending' },
      processing: { color: '#3498db', text: 'Processing' },
      completed: { color: '#27ae60', text: 'Completed' },
      failed: { color: '#e74c3c', text: 'Failed' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span 
        className="status-badge" 
        style={{ backgroundColor: config.color }}
      >
        {config.text}
      </span>
    );
  };

  if (loading && archives.length === 0) {
    return (
      <div className="archive-list loading">
        <div className="loading-spinner"></div>
        <p>Loading archives...</p>
      </div>
    );
  }

  return (
    <div className="archive-list">
      <div className="list-header">
        <h3>📚 Archived Websites</h3>
        <div className="filter-controls">
          <select 
            value={selectedDomain} 
            onChange={(e) => handleDomainChange(e.target.value)}
            className="domain-filter"
          >
            <option value="">All domains ({archives.length})</option>
            {allDomains.map(domain => (
              <option key={domain} value={domain}>
                {domain}
              </option>
            ))}
          </select>
          <button 
            onClick={loadAllArchives} 
            className="refresh-button"
            disabled={loading}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {archives.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h4>No archives found</h4>
          <p>
            {selectedDomain 
              ? `No archives found for ${selectedDomain}. Try archiving a website first.`
              : 'No archives yet. Start by archiving your first website above.'
            }
          </p>
        </div>
      ) : (
        <div className="archives-grid">
          {archives.map(archive => (
            <div key={archive.id} className="archive-card">
              <div className="archive-header">
                <div className="archive-url">
                  <strong>{archive.domain}</strong>
                  <small>{archive.url}</small>
                </div>
                {getStatusBadge(archive.status)}
              </div>
              
              <div className="archive-meta">
                <div className="meta-item">
                  <span className="meta-label">📅 Archived:</span>
                  <span className="meta-value">
                    {apiService.formatTimestamp(archive.timestamp)}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">⏰ Time:</span>
                  <span className="meta-value">
                    {apiService.getRelativeTime(archive.timestamp)}
                  </span>
                </div>
                {archive.pagesArchived > 0 && (
                  <div className="meta-item">
                    <span className="meta-label">📄 Pages:</span>
                    <span className="meta-value">{archive.pagesArchived}</span>
                  </div>
                )}
              </div>

              <div className="archive-actions">
                {archive.status === 'completed' ? (
                  <button 
                    onClick={() => handleViewArchive(archive)}
                    className="view-button"
                  >
                    👁️ View Archive
                  </button>
                ) : archive.status === 'processing' ? (
                  <div className="processing-indicator">
                    <span className="spinner-small"></span>
                    Processing...
                  </div>
                ) : archive.status === 'failed' ? (
                  <div className="error-indicator">
                    ❌ Failed to archive
                  </div>
                ) : (
                  <div className="pending-indicator">
                    ⏳ Waiting to start...
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .archive-list {
          max-width: 1200px;
          margin: 2rem auto;
          padding: 0 1rem;
        }

        .archive-list.loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e0e0e0;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .list-header h3 {
          font-size: 1.8rem;
          color: #2c3e50;
          margin: 0;
        }

        .filter-controls {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .domain-filter {
          padding: 0.5rem 1rem;
          border: 2px solid #e0e0e0;
          border-radius: 6px;
          font-size: 0.9rem;
          background: white;
          cursor: pointer;
        }

        .domain-filter:focus {
          outline: none;
          border-color: #3498db;
        }

        .refresh-button {
          padding: 0.5rem 1rem;
          background: #f8f9fa;
          border: 2px solid #e0e0e0;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }

        .refresh-button:hover:not(:disabled) {
          background: #e9ecef;
          border-color: #3498db;
        }

        .refresh-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .empty-state h4 {
          color: #2c3e50;
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          color: #7f8c8d;
          max-width: 400px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .archives-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .archive-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .archive-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }

        .archive-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
          gap: 1rem;
        }

        .archive-url {
          flex: 1;
          min-width: 0;
        }

        .archive-url strong {
          display: block;
          font-size: 1.1rem;
          color: #2c3e50;
          margin-bottom: 0.25rem;
          word-break: break-word;
        }

        .archive-url small {
          color: #7f8c8d;
          font-size: 0.85rem;
          word-break: break-all;
        }

        .status-badge {
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .archive-meta {
          margin-bottom: 1.5rem;
        }

        .meta-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }

        .meta-label {
          color: #7f8c8d;
          font-weight: 500;
        }

        .meta-value {
          color: #2c3e50;
          font-weight: 600;
        }

        .archive-actions {
          display: flex;
          gap: 0.5rem;
        }

        .view-button {
          flex: 1;
          padding: 0.75rem 1rem;
          background: linear-gradient(135deg, #27ae60, #219a52);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .view-button:hover {
          background: linear-gradient(135deg, #219a52, #1e8449);
          transform: translateY(-1px);
        }

        .processing-indicator,
        .error-indicator,
        .pending-indicator {
          flex: 1;
          padding: 0.75rem;
          text-align: center;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .processing-indicator {
          background: #e3f2fd;
          color: #1976d2;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .error-indicator {
          background: #ffebee;
          color: #c62828;
        }

        .pending-indicator {
          background: #fff3e0;
          color: #f57c00;
        }

        .spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid #1976d2;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .archives-grid {
            grid-template-columns: 1fr;
          }

          .list-header {
            flex-direction: column;
            align-items: stretch;
          }

          .filter-controls {
            justify-content: space-between;
          }

          .archive-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ArchiveList;
