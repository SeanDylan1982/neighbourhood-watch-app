import React from 'react';
import './MessageRetryButton.css';

/**
 * Component for retrying failed messages
 */
const MessageRetryButton = ({
  message,
  onRetry,
  onRemove,
  className = ''
}) => {
  if (!message || message.status !== 'failed') {
    return null;
  }

  const handleRetry = (e) => {
    e.stopPropagation();
    if (onRetry) {
      onRetry(message.id);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(message.id);
    }
  };

  return (
    <div className={`message-retry-button ${className}`}>
      <div className="retry-content">
        <div className="retry-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        
        <div className="retry-text">
          <span className="retry-label">Message failed to send</span>
          {message.error && (
            <span className="retry-error">{message.error}</span>
          )}
        </div>
        
        <div className="retry-actions">
          <button
            className="retry-action-btn retry-btn"
            onClick={handleRetry}
            title="Retry sending message"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
            Retry
          </button>
          
          <button
            className="retry-action-btn remove-btn"
            onClick={handleRemove}
            title="Remove failed message"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageRetryButton;