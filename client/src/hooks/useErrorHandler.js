import { useState, useCallback, useRef } from 'react';

const useErrorHandler = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const retryTimeoutRef = useRef(null);

  const getErrorType = useCallback((error) => {
    if (error.response) {
      const status = error.response.status;
      if (status >= 400 && status < 500) return 'client';
      if (status >= 500) return 'server';
    }
    if (error.request) return 'network';
    return 'unknown';
  }, []);

  const isRetryableError = useCallback((error) => {
    const errorType = getErrorType(error);
    if (errorType === 'client') return false; // Don't retry client errors
    if (errorType === 'network') return true; // Retry network errors
    if (errorType === 'server') {
      const status = error.response?.status;
      return status >= 500 || status === 429; // Retry server errors and rate limits
    }
    return false;
  }, [getErrorType]);

  const handleError = useCallback((error, context = '') => {
    console.error(`Error ${context}:`, error);
    
    let errorMessage = 'An unexpected error occurred';
    let errorType = 'error';
    let canRetry = isRetryableError(error);
    
    if (error.response) {
      // HTTP error response
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 400:
          errorMessage = data.message || 'Invalid request. Please check your input.';
          errorType = 'validation';
          break;
        case 401:
          errorMessage = 'You are not authorized. Please log in again.';
          errorType = 'auth';
          // Clear token and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
          break;
        case 403:
          errorMessage = 'You do not have permission to perform this action.';
          errorType = 'permission';
          break;
        case 404:
          errorMessage = 'The requested resource was not found.';
          errorType = 'notFound';
          break;
        case 429:
          errorMessage = 'Too many requests. Please try again in a moment.';
          errorType = 'rateLimit';
          canRetry = true;
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          errorType = 'server';
          canRetry = true;
          break;
        case 503:
          errorMessage = 'Service temporarily unavailable. Please try again later.';
          errorType = 'service';
          canRetry = true;
          break;
        default:
          errorMessage = data.message || `Server error (${status})`;
          errorType = 'server';
      }
    } else if (error.request) {
      // Network error
      if (!navigator.onLine) {
        errorMessage = 'You appear to be offline. Please check your connection.';
        errorType = 'offline';
      } else {
        errorMessage = 'Network error. Please check your connection and try again.';
        errorType = 'network';
      }
      canRetry = true;
    } else if (error.message) {
      // Other error
      errorMessage = error.message;
      errorType = 'unknown';
    }
    
    setError({
      message: errorMessage,
      type: errorType,
      canRetry,
      originalError: error,
      context,
      timestamp: new Date().toISOString()
    });
  }, [isRetryableError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const withErrorHandling = useCallback(async (asyncFunction, context = '') => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await asyncFunction();
      return result;
    } catch (error) {
      handleError(error, context);
      throw error; // Re-throw so caller can handle if needed
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const retryWithErrorHandling = useCallback(async (asyncFunction, context = '', maxRetries = 3, baseDelay = 1000) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await withErrorHandling(asyncFunction, `${context} (attempt ${attempt})`);
      } catch (error) {
        lastError = error;
        
        // Don't retry if error is not retryable
        if (!isRetryableError(error)) {
          break;
        }
        
        // Wait before retrying (exponential backoff with jitter)
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          const jitter = Math.random() * 0.1 * delay; // Add 10% jitter
          const totalDelay = delay + jitter;
          
          await new Promise(resolve => {
            retryTimeoutRef.current = setTimeout(resolve, totalDelay);
          });
        }
      }
    }
    
    throw lastError;
  }, [withErrorHandling, isRetryableError]);

  const cancelRetry = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const retryLastOperation = useCallback(async (asyncFunction, context = '') => {
    if (error && error.canRetry) {
      clearError();
      try {
        return await withErrorHandling(asyncFunction, `${context} (retry)`);
      } catch (retryError) {
        // Error will be handled by withErrorHandling
        throw retryError;
      }
    }
  }, [error, clearError, withErrorHandling]);

  return {
    error,
    isLoading,
    handleError,
    clearError,
    withErrorHandling,
    retryWithErrorHandling,
    retryLastOperation,
    cancelRetry,
    isRetryableError
  };
};

export default useErrorHandler;