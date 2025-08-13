import { useState, useCallback, useRef } from 'react';
import { useToast } from '../components/Common/Toast';

/**
 * Specialized error handler for chat-related operations
 * Provides better UX for chat errors and reduces noise from expected failures
 */
const useChatErrorHandler = () => {
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const { showToast } = useToast();
  const retryTimeoutRef = useRef(null);

  const clearError = useCallback(() => {
    setError(null);
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const isExpectedChatError = useCallback((error, context) => {
    // Don't show errors for these expected scenarios
    const expectedScenarios = [
      'empty chat list',
      'no messages',
      'chat not found',
      'no members'
    ];

    const errorMessage = error.message?.toLowerCase() || '';
    const contextLower = context?.toLowerCase() || '';

    return expectedScenarios.some(scenario => 
      errorMessage.includes(scenario) || contextLower.includes(scenario)
    );
  }, []);

  const isCriticalError = useCallback((error) => {
    // Critical errors that should always be shown
    if (error.response?.status === 401) return true; // Auth errors
    if (error.response?.status === 403) return true; // Permission errors
    if (error.response?.status >= 500) return true; // Server errors
    if (error.name === 'NetworkError') return true; // Network errors
    return false;
  }, []);

  const getErrorMessage = useCallback((error) => {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 401:
          return 'Your session has expired. Please refresh the page to log in again.';
        case 403:
          return 'You don\'t have permission to access this chat.';
        case 404:
          return 'Chat not found. It may have been deleted.';
        case 429:
          return 'Too many requests. Please wait a moment and try again.';
        case 500:
        case 502:
        case 503:
        case 504:
          return 'Chat service is temporarily unavailable. Please try again in a moment.';
        default:
          return data?.message || `Chat error (${status})`;
      }
    }

    if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
      return 'Connection issue. Please check your internet connection.';
    }

    return error.message || 'An unexpected chat error occurred';
  }, []);

  const handleChatError = useCallback((error, context = '', options = {}) => {
    const {
      silent = false,
      showToast: shouldShowToast = true,
      retryable = true
    } = options;

    console.error(`Chat error ${context}:`, error);

    // Don't show UI errors for expected scenarios unless they're critical
    if (isExpectedChatError(error, context) && !isCriticalError(error)) {
      console.log(`Suppressing expected chat error: ${error.message}`);
      return;
    }

    const errorMessage = getErrorMessage(error);
    const isRetryableError = retryable && (
      error.response?.status >= 500 ||
      error.response?.status === 429 ||
      error.name === 'NetworkError'
    );

    // Set error state for components that need it
    if (!silent) {
      setError({
        message: errorMessage,
        type: error.response?.status === 401 ? 'auth' : 'error',
        retryable: isRetryableError,
        context
      });
    }

    // Show toast notification for critical errors
    if (shouldShowToast && isCriticalError(error)) {
      const toastType = error.response?.status === 401 ? 'warning' : 'error';
      showToast(errorMessage, toastType, 8000);
    }
  }, [isExpectedChatError, isCriticalError, getErrorMessage, showToast]);

  const retryChatOperation = useCallback(async (operation, context = '', maxRetries = 3) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        setIsRetrying(attempt > 1);
        const result = await operation();
        setIsRetrying(false);
        clearError();
        return result;
      } catch (error) {
        lastError = error;
        
        // Don't retry auth errors or client errors
        if (error.response?.status === 401 || 
            error.response?.status === 403 ||
            (error.response?.status >= 400 && error.response?.status < 500)) {
          break;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => {
            retryTimeoutRef.current = setTimeout(resolve, delay);
          });
        }
      }
    }

    setIsRetrying(false);
    handleChatError(lastError, context);
    throw lastError;
  }, [handleChatError, clearError]);

  const handleChatLoad = useCallback(async (loadFunction, context = '') => {
    try {
      clearError();
      return await loadFunction();
    } catch (error) {
      // For loading operations, be more lenient with errors
      handleChatError(error, context, { 
        silent: !isCriticalError(error),
        showToast: isCriticalError(error)
      });
      
      // Return empty data for non-critical errors to prevent UI breaks
      if (!isCriticalError(error)) {
        if (context.includes('messages')) return [];
        if (context.includes('groups') || context.includes('chats')) return [];
        if (context.includes('members') || context.includes('users')) return [];
      }
      
      throw error;
    }
  }, [handleChatError, clearError, isCriticalError]);

  return {
    error,
    isRetrying,
    clearError,
    handleChatError,
    retryChatOperation,
    handleChatLoad
  };
};

export default useChatErrorHandler;