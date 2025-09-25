import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

const JobStatus = ({ job, onJobComplete, onError }) => {
  const [status, setStatus] = useState(job);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!job || job.status === 'completed' || job.status === 'failed') {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const updatedStatus = await apiService.getJobStatus(job.jobId);
        setStatus(updatedStatus);
        
        // Update progress based on status
        if (updatedStatus.status === 'processing') {
          setProgress(prev => Math.min(prev + Math.random() * 10, 90));
        } else if (updatedStatus.status === 'completed') {
          setProgress(100);
          onJobComplete(updatedStatus);
          clearInterval(pollInterval);
        } else if (updatedStatus.status === 'failed') {
          clearInterval(pollInterval);
        }
      } catch (error) {
        onError(error.message);
        clearInterval(pollInterval);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [job, onJobComplete, onError]);

  if (!status) return null;

  const getStatusConfig = () => {
    switch (status.status) {
      case 'pending':
        return {
          color: '#f39c12',
          icon: '⏳',
          title: 'Queued for Processing',
          description: 'Your archiving request is in the queue and will start shortly.'
        };
      case 'processing':
        return {
          color: '#3498db',
          icon: '⚙️',
          title: 'Archiving in Progress',
          description: `Discovering and downloading pages from ${status.domain}...`
        };
      case 'completed':
        return {
          color: '#27ae60',
          icon: '✅',
          title: 'Archive Complete!',
          description: `Successfully archived ${status.pagesArchived || 0} pages from ${status.domain}.`
        };
      case 'failed':
        return {
          color: '#e74c3c',
          icon: '❌',
          title: 'Archive Failed',
          description: status.error || 'An error occurred while archiving the website.'
        };
      default:
        return {
          color: '#95a5a6',
          icon: '❓',
          title: 'Unknown Status',
          description: 'Unable to determine the current status.'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="job-status">
      <div className="status-card" style={{ borderLeftColor: config.color }}>
        <div className="status-header">
          <div className="status-icon" style={{ color: config.color }}>
            {config.icon}
          </div>
          <div className="status-info">
            <h4 className="status-title">{config.title}</h4>
            <p className="status-description">{config.description}</p>
          </div>
        </div>

        {status.status === 'processing' && (
          <div className="progress-section">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: config.color 
                }}
              />
            </div>
            <div className="progress-text">
              Processing... {Math.round(progress)}%
            </div>
          </div>
        )}

        <div className="status-details">
          <div className="detail-row">
            <span className="detail-label">URL:</span>
            <span className="detail-value">{status.url}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Domain:</span>
            <span className="detail-value">{status.domain}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Started:</span>
            <span className="detail-value">
              {apiService.formatTimestamp(status.timestamp)}
            </span>
          </div>
          {status.pagesArchived > 0 && (
            <div className="detail-row">
              <span className="detail-label">Pages Archived:</span>
              <span className="detail-value">{status.pagesArchived}</span>
            </div>
          )}
        </div>

        {status.status === 'processing' && (
          <div className="processing-animation">
            <div className="pulse-dot"></div>
            <div className="pulse-dot"></div>
            <div className="pulse-dot"></div>
          </div>
        )}
      </div>

      <style jsx>{`
        .job-status {
          max-width: 600px;
          margin: 2rem auto;
          padding: 0 1rem;
        }

        .status-card {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border-left: 4px solid #e0e0e0;
          position: relative;
          overflow: hidden;
        }

        .status-header {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .status-icon {
          font-size: 2rem;
          line-height: 1;
        }

        .status-info {
          flex: 1;
        }

        .status-title {
          margin: 0 0 0.5rem 0;
          color: #2c3e50;
          font-size: 1.3rem;
          font-weight: 600;
        }

        .status-description {
          margin: 0;
          color: #7f8c8d;
          line-height: 1.5;
        }

        .progress-section {
          margin-bottom: 1.5rem;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .progress-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease;
          position: relative;
        }

        .progress-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
          animation: shimmer 2s infinite;
        }

        .progress-text {
          text-align: center;
          font-size: 0.9rem;
          color: #5a6c7d;
          font-weight: 500;
        }

        .status-details {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1rem;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }

        .detail-row:last-child {
          margin-bottom: 0;
        }

        .detail-label {
          font-weight: 600;
          color: #5a6c7d;
        }

        .detail-value {
          color: #2c3e50;
          word-break: break-word;
          text-align: right;
          max-width: 60%;
        }

        .processing-animation {
          position: absolute;
          bottom: 1rem;
          right: 1rem;
          display: flex;
          gap: 0.3rem;
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #3498db;
          animation: pulse 1.5s infinite;
        }

        .pulse-dot:nth-child(2) {
          animation-delay: 0.3s;
        }

        .pulse-dot:nth-child(3) {
          animation-delay: 0.6s;
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes pulse {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .job-status {
            margin: 1rem;
            padding: 0;
          }

          .status-card {
            padding: 1.5rem;
          }

          .status-header {
            flex-direction: column;
            gap: 0.5rem;
          }

          .status-icon {
            font-size: 1.5rem;
          }

          .status-title {
            font-size: 1.1rem;
          }

          .detail-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
          }

          .detail-value {
            max-width: 100%;
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
};

export default JobStatus;
