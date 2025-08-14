import React from 'react';
import { useMessage } from '../contexts/MessageContext';
import MessageErrorBoundary from '../components/Chat/MessageErrorBoundary';
import MessageLoadingState from '../components/Chat/MessageLoadingState';
import MessageRetryButton from '../components/Chat/MessageRetryButton';

/**
 * Example component demonstrating the enhanced MessageContext features
 * This shows how to use:
 * - Enhanced error handling and retry logic
 * - Corrected API response format handling
 * - Better loading states and error messages
 * - Manual refresh option for failed message loads
 */
const EnhancedMessageContextExample = () => {
  const {
    // Enhanced state
    messages,
    error,
    isLoadingMessages,
    isRetryingMessages,
    failedMessages,
    
    // Enhanced actions
    loadMessages,
    sendMessage,
    retryFailedMessage,
    refreshMessages,
    clearError,
    retryLastOperation,
    
    // Existing functionality
    currentMessage,
    updateCurrentMessage,
    replyingTo,
    cancelReply,
    selectedChatId
  } = useMessage();

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;
    
    try {
      await sendMessage(currentMessage);
      // Message sent successfully - MessageContext handles success state
    } catch (error) {
      // Error handling is now managed by MessageContext with toast notifications
      console.log('Send message error handled by MessageContext');
    }
  };

  const handleLoadMessages = async () => {
    if (!selectedChatId) return;
    
    try {
      await loadMessages(selectedChatId);
      // Messages loaded successfully
    } catch (error) {
      // Error handling with retry options is managed by MessageContext
      console.log('Load messages error handled by MessageContext');
    }
  };

  return (
    <div className="enhanced-message-example">
      <h2>Enhanced Message Context Example</h2>
      
      {/* Error Boundary with retry functionality */}
      <MessageErrorBoundary>
        
        {/* Loading state with skeleton */}
        <MessageLoadingState showSkeleton={true} />
        
        {/* Messages list */}
        <div className="messages-list">
          {messages.map((message) => (
            <div key={message.id} className="message-item">
              <div className="message-content">
                <strong>{message.senderName}:</strong> {message.content}
                
                {/* Show retry button for failed messages */}
                {message.status === 'failed' && (
                  <MessageRetryButton message={message} />
                )}
                
                {/* Show status indicators */}
                <div className="message-status">
                  {message.status === 'sending' && <span>Sending...</span>}
                  {message.status === 'sent' && <span>✓</span>}
                  {message.status === 'delivered' && <span>✓✓</span>}
                  {message.status === 'read' && <span className="read">✓✓</span>}
                  {message.status === 'failed' && <span className="failed">Failed</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Manual refresh option */}
        <div className="message-controls">
          <button 
            onClick={refreshMessages}
            disabled={isRetryingMessages}
            className="refresh-button"
          >
            {isRetryingMessages ? 'Refreshing...' : 'Refresh Messages'}
          </button>
          
          <button 
            onClick={handleLoadMessages}
            disabled={isLoadingMessages}
            className="load-button"
          >
            {isLoadingMessages ? 'Loading...' : 'Load Messages'}
          </button>
          
          {error && error.canRetry && (
            <button 
              onClick={retryLastOperation}
              className="retry-button"
            >
              Retry Last Operation
            </button>
          )}
          
          {error && (
            <button 
              onClick={clearError}
              className="clear-error-button"
            >
              Clear Error
            </button>
          )}
        </div>
        
      </MessageErrorBoundary>
      
      {/* Message input with enhanced error handling */}
      <div className="message-input-section">
        {replyingTo && (
          <div className="reply-preview">
            Replying to: {replyingTo.content}
            <button onClick={cancelReply}>Cancel</button>
          </div>
        )}
        
        <div className="message-input">
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => updateCurrentMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button 
            onClick={handleSendMessage}
            disabled={!currentMessage.trim() || isLoadingMessages}
          >
            Send
          </button>
        </div>
      </div>
      
      {/* Failed messages summary */}
      {failedMessages.length > 0 && (
        <div className="failed-messages-summary">
          <h4>Failed Messages ({failedMessages.length})</h4>
          {failedMessages.map((failedMsg) => (
            <div key={failedMsg.id} className="failed-message-item">
              <span>{failedMsg.content}</span>
              <button onClick={() => retryFailedMessage(failedMsg.id)}>
                Retry
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Debug information */}
      <div className="debug-info">
        <h4>Debug Information</h4>
        <p>Messages: {messages.length}</p>
        <p>Failed Messages: {failedMessages.length}</p>
        <p>Loading: {isLoadingMessages ? 'Yes' : 'No'}</p>
        <p>Retrying: {isRetryingMessages ? 'Yes' : 'No'}</p>
        <p>Error: {error ? error.message : 'None'}</p>
        <p>Selected Chat: {selectedChatId || 'None'}</p>
      </div>
    </div>
  );
};

export default EnhancedMessageContextExample;