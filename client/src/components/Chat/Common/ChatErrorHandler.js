import React, { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from './ErrorBoundary';
import ErrorRecoveryPanel from './ErrorRecoveryPanel';
import useErrorRecovery from '../../../hooks/useErrorRecovery';
import useRetry from '../../../hooks/useRetry';
import { withErrorHandling, logError, reportError } from '../../../utils/errorUtils';
import './ChatErrorHandler.css';

/**
 * Comprehensive error handling wrapper for chat components
 * Provides error boundaries, recovery mechanisms, and user-friendly error management
 */
const ChatErrorHandler = ({
  children,
  userId,
  chatId,
  showErrorPanel = false,
  onError,
  onRecovery,
  className = ''
}) => {
  const {
    errors,
    isRecovering,
    addError,
    retryOperation,
    dismissError,
    clearAllErrors,
    hasRecoverableErrors
  } = useErrorRecovery({
    maxRetries: 3,
    showToasts: true,
    persistErrors: true,
    onError: (error) => {
      logError(error.error || error, { 
        component: 'chat',
        userId,
        chatId 
      });
      reportError(error.error || error, {
        component: 'chat',
        userId,
        chatId
      });
      onError?.(error);
    },
    onRecovery: (error, result) => {
      onRecovery?.(error, result);
    }
  });

  // Global error handler for unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      const error = event.reason;
      addError(error, {
        component: 'chat',
        type: 'unhandled_rejection',
        userId,
        chatId
      });
      
      // Prevent default browser error handling
      event.preventDefault();
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [addError, userId, chatId]);

  // Error boundary fallback component
  const ErrorFallback = useCallback(({ error, onRetry, onReload, retryCount }) => (
    <div className="chat-error-handler__fallback">
      <div className="chat-error-handler__fallback-content">
        <div className="chat-error-handler__fallback-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L2 22h20L12 2zm0 15h-2v-2h2v2zm0-4h-2V9h2v4z"
              fill="currentColor"
            />
          </svg>
        </div>
        
        <h3 className="chat-error-handler__fallback-title">
          Chat Error
        </h3>
        
        <p className="chat-error-handler__fallback-message">
          The chat component encountered an error. This might be due to a temporary issue.
        </p>

        <div className="chat-error-handler__fallback-actions">
          <button
            className="chat-error-handler__fallback-button chat-error-handler__fallback-button--primary"
            onClick={onRetry}
            disabled={retryCount >= 3}
          >
            {retryCount >= 3 ? 'Max retries reached' : 'Retry Chat'}
          </button>
          
          <button
            className="chat-error-handler__fallback-button chat-error-handler__fallback-button--secondary"
            onClick={onReload}
          >
            Reload Page
          </button>
        </div>

        {retryCount > 0 && (
          <p className="chat-error-handler__fallback-retry-info">
            Retry attempts: {retryCount}/3
          </p>
        )}

        <details className="chat-error-handler__fallback-details">
          <summary>Technical Details</summary>
          <div className="chat-error-handler__fallback-error-info">
            <p><strong>Error:</strong> {error.name}</p>
            <p><strong>Message:</strong> {error.message}</p>
            <p><strong>Chat ID:</strong> {chatId || 'N/A'}</p>
            <p><strong>User ID:</strong> {userId || 'N/A'}</p>
          </div>
        </details>
      </div>
    </div>
  ), [chatId, userId]);

  // Handle retry operations
  const handleRetry = useCallback(async (errorId) => {
    const error = errors.find(e => e.id === errorId);
    if (!error) return;

    try {
      // Create a generic retry operation based on error context
      const retryOperation = async () => {
        if (error.context?.operation === 'sendMessage') {
          // Retry sending message
          throw new Error('Message retry not implemented');
        } else if (error.context?.operation === 'loadMessages') {
          // Retry loading messages
          throw new Error('Load messages retry not implemented');
        } else if (error.context?.operation === 'uploadFile') {
          // Retry file upload
          throw new Error('File upload retry not implemented');
        } else {
          // Generic retry - just resolve
          return Promise.resolve('Retry successful');
        }
      };

      await retryOperation(retryOperation, errorId, error.context);
    } catch (retryError) {
      // Error will be handled by the retry mechanism
      console.error('Retry failed:', retryError);
    }
  }, [errors, retryOperation]);

  // Create error-wrapped functions for common chat operations
  const createErrorWrappedFunction = useCallback((fn, operation) => {
    return withErrorHandling(fn, {
      maxRetries: 3,
      retryDelay: 1000,
      context: { 
        component: 'chat',
        operation,
        userId,
        chatId 
      },
      onError: (error, attempt) => {
        addError(error, {
          component: 'chat',
          operation,
          attempt,
          userId,
          chatId
        });
      },
      onRetry: (error, attempt) => {
        console.log(`Retrying ${operation}, attempt ${attempt}:`, error.message);
      }
    });
  }, [addError, userId, chatId]);

  // Provide error handling utilities to children
  const errorHandlingContext = {
    addError,
    createErrorWrappedFunction,
    hasErrors: errors.length > 0,
    hasRecoverableErrors: hasRecoverableErrors(),
    isRecovering
  };

  return (
    <div className={`chat-error-handler ${className}`}>
      <ErrorBoundary
        fallback={ErrorFallback}
        userId={userId}
        chatId={chatId}
        onRetry={() => {
          // Add error boundary retry to error recovery
          addError(new Error('Component error boundary triggered'), {
            component: 'chat',
            type: 'boundary_retry',
            userId,
            chatId
          });
        }}
      >
        {/* Pass error handling context to children */}
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              errorHandling: errorHandlingContext
            });
          }
          return child;
        })}
      </ErrorBoundary>

      {/* Error recovery panel */}
      {showErrorPanel && errors.length > 0 && (
        <div className="chat-error-handler__panel">
          <ErrorRecoveryPanel
            errors={errors}
            isRecovering={isRecovering}
            onRetry={handleRetry}
            onDismiss={dismissError}
            onClearAll={clearAllErrors}
          />
        </div>
      )}

      {/* Floating error indicator */}
      {!showErrorPanel && errors.length > 0 && (
        <div className="chat-error-handler__indicator">
          <button
            className="chat-error-handler__indicator-button"
            onClick={() => {
              // This would typically open a modal or expand the error panel
              console.log('Show error details:', errors);
            }}
            title={`${errors.length} error${errors.length === 1 ? '' : 's'} occurred`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L2 22h20L12 2zm0 15h-2v-2h2v2zm0-4h-2V9h2v4z"
                fill="currentColor"
              />
            </svg>
            <span className="chat-error-handler__indicator-count">
              {errors.length}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

ChatErrorHandler.propTypes = {
  children: PropTypes.node.isRequired,
  userId: PropTypes.string,
  chatId: PropTypes.string,
  showErrorPanel: PropTypes.bool,
  onError: PropTypes.func,
  onRecovery: PropTypes.func,
  className: PropTypes.string
};

export default ChatErrorHandler;