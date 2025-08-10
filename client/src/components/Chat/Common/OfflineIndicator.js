import React from 'react';
import './OfflineIndicator.css';

/**
 * Component to display offline status and queue information
 */
const OfflineIndicator = ({
  isOnline,
  queueStats,
  onRetryAll,
  onClearFailed,
  className = ''
}) => {
  if (isOnline && queueStats.total === 0) {
    return null;
  }

  const handleRetryAll = () => {
    if (onRetryAll) {
      onRetryAll();
    }
  };

  const handleClearFailed = () => {
    if (onClearFailed) {
      onClearFailed();
    }
  };

  return (
    <div className={`offline-indicator ${className} ${!isOnline ? 'offline' : 'online'}`}>
      <div className="offline-indicator-content">
        {/* Connection Status */}
        <div className="connection-status">
          <div className={`status-dot ${isOnline ? 'online' : 'offline'}`} />
          <span className="status-text">
            {isOnline ? 'Connected' : 'No connection'}
          </span>
        </div>

        {/* Queue Information */}
        {queueStats.total > 0 && (
          <div className="queue-info">
            <div className="queue-stats">
              {queueStats.queued > 0 && (
                <span className="queue-stat queued">
                  {queueStats.queued} queued
                </span>
              )}
              
              {queueStats.sending > 0 && (
                <span className="queue-stat sending">
                  {queueStats.sending} sending
                </span>
              )}
              
              {queueStats.retryPending > 0 && (
                <span className="queue-stat retry-pending">
                  {queueStats.retryPending} retrying
                </span>
              )}
              
              {queueStats.failed > 0 && (
                <span className="queue-stat failed">
                  {queueStats.failed} failed
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="queue-actions">
              {queueStats.failed > 0 && (
                <>
                  <button
                    className="retry-btn"
                    onClick={handleRetryAll}
                    title="Retry all failed messages"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                    </svg>
                    Retry
                  </button>
                  
                  <button
                    className="clear-btn"
                    onClick={handleClearFailed}
                    title="Clear failed messages"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Offline Message */}
        {!isOnline && (
          <div className="offline-message">
            <p>You're offline. Messages will be sent when connection is restored.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator;