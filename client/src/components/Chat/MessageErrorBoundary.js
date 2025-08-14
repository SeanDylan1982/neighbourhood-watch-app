import React from 'react';
import { useMessage } from '../../contexts/MessageContext';
import './MessageErrorBoundary.css';

const MessageErrorBoundary = ({ children }) => {
  const { 
    error, 
    isLoadingMessages, 
    isRetryingMessages, 
    refreshMessages, 
    retryLastOperation, 
    clearError 
  } = useMessage();

  // Don't show error boundary if messages are loading
  if (isLoadingMessages && !error) {
    return children;
  }

  // Show retry UI for message loading errors
  if (error && error.type === 'load_messages') {
    return (
      <div className="message-error-boundary">
        <div className="message-error-content">
          <div className="message-error-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          
          <h3 className="message-error-title">Failed to Load Messages</h3>
          <p className="message-error-description">
            {error.message || 'Unable to load messages. Please check your connection and try again.'}
          </p>
          
          <div className="message-error-actions">
            <button 
              className="message-error-retry-btn"
              onClick={refreshMessages}
              disabled={isRetryingMessages}
            >
              {isRetryingMessages ? (
                <>
                  <div className="spinner" />
                  Refreshing...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10"/>
                    <polyline points="1 20 1 14 7 14"/>
                    <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                  </svg>
                  Refresh Messages
                </>
              )}
            </button>
            
            <button 
              className="message-error-dismiss-btn"
              onClick={clearError}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show inline error for other types of errors
  if (error && error.canRetry) {
    return (
      <div className="message-inline-error">
        <div className="message-inline-error-content">
          <span className="message-inline-error-text">{error.message}</span>
          <button 
            className="message-inline-error-retry"
            onClick={retryLastOperation}
            disabled={isRetryingMessages}
          >
            {isRetryingMessages ? 'Retrying...' : 'Retry'}
          </button>
          <button 
            className="message-inline-error-dismiss"
            onClick={clearError}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    );
  }

  return children;
};

export default MessageErrorBoundary;