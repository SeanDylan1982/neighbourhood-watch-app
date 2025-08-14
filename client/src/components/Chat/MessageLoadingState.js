import React from 'react';
import { useMessage } from '../../contexts/MessageContext';
import './MessageLoadingState.css';

const MessageLoadingState = ({ showSkeleton = true, message = 'Loading messages...' }) => {
  const { isLoadingMessages, isRetryingMessages } = useMessage();

  if (!isLoadingMessages && !isRetryingMessages) {
    return null;
  }

  const displayMessage = isRetryingMessages ? 'Refreshing messages...' : message;

  return (
    <div className="message-loading-state">
      {showSkeleton ? (
        <div className="message-loading-skeleton">
          {/* Message skeleton items */}
          {[1, 2, 3].map((index) => (
            <div key={index} className="message-skeleton-item">
              <div className="message-skeleton-avatar" />
              <div className="message-skeleton-content">
                <div className="message-skeleton-header">
                  <div className="message-skeleton-name" />
                  <div className="message-skeleton-time" />
                </div>
                <div className="message-skeleton-text">
                  <div className="message-skeleton-line" />
                  <div className="message-skeleton-line short" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="message-loading-simple">
          <div className="message-loading-spinner" />
          <span className="message-loading-text">{displayMessage}</span>
        </div>
      )}
    </div>
  );
};

export default MessageLoadingState;