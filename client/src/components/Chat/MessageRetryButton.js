import React from 'react';
import { useMessage } from '../../contexts/MessageContext';
import './MessageRetryButton.css';

const MessageRetryButton = ({ message, className = '' }) => {
  const { retryFailedMessage, isSendingMessage } = useMessage();

  if (message.status !== 'failed') {
    return null;
  }

  const handleRetry = () => {
    retryFailedMessage(message.id);
  };

  return (
    <button
      className={`message-retry-button ${className}`}
      onClick={handleRetry}
      disabled={isSendingMessage}
      title="Retry sending message"
      aria-label="Retry sending message"
    >
      {isSendingMessage ? (
        <div className="message-retry-spinner" />
      ) : (
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          className="message-retry-icon"
        >
          <polyline points="23 4 23 10 17 10"/>
          <polyline points="1 20 1 14 7 14"/>
          <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
      )}
      <span className="message-retry-text">
        {isSendingMessage ? 'Retrying...' : 'Retry'}
      </span>
    </button>
  );
};

export default MessageRetryButton;