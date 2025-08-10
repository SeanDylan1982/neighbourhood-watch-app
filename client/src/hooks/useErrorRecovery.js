import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';

/**
 * Hook for comprehensive error recovery management
 * @param {Object} options - Error recovery configuration
 * @returns {Object} Error recovery state and functions
 */
const useErrorRecovery = (options = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    showToasts = true,
    persistErrors = true,
    onError = () => {},
    onRecovery = () => {},
    onMaxRetriesReached = () => {}
  } = options;

  const { showToast } = useToast();
  const [errors, setErrors] = useState([]);
  const [isRecovering, setIsRecovering] = useState(false);
  const errorCountRef = useRef(new Map());
  const recoveryTimeoutRef = useRef(null);

  // Load persisted errors on mount
  useEffect(() => {
    if (persistErrors) {
      try {
        const persistedErrors = localStorage.getItem('chat_errors');
        if (persistedErrors) {
          const parsed = JSON.parse(persistedErrors);
          setErrors(parsed.filter(error => 
            Date.now() - error.timestamp < 24 * 60 * 60 * 1000 // 24 hours
          ));
        }
      } catch (err) {
        console.warn('Failed to load persisted errors:', err);
      }
    }
  }, [persistErrors]);

  // Persist errors when they change
  useEffect(() => {
    if (persistErrors && errors.length > 0) {
      try {
        localStorage.setItem('chat_errors', JSON.stringify(errors));
      } catch (err) {
        console.warn('Failed to persist errors:', err);
      }
    }
  }, [errors, persistErrors]);

  const addError = useCallback((error, context = {}) => {
    const errorId = `${error.name || 'Error'}_${error.message || 'Unknown'}`;
    const currentCount = errorCountRef.current.get(errorId) || 0;
    
    const errorEntry = {
      id: `${errorId}_${Date.now()}`,
      name: error.name || 'Error',
      message: error.message || 'An unknown error occurred',
      stack: error.stack,
      timestamp: Date.now(),
      context,
      retryCount: currentCount,
      canRetry: currentCount < maxRetries,
      severity: determineSeverity(error, context),
      category: categorizeError(error, context)
    };

    setErrors(prev => [errorEntry, ...prev.slice(0, 49)]); // Keep last 50 errors
    errorCountRef.current.set(errorId, currentCount + 1);

    // Show toast notification
    if (showToasts) {
      const toastMessage = getErrorToastMessage(errorEntry);
      showToast(toastMessage, 'error');
    }

    // Call error callback
    onError(errorEntry);

    return errorEntry;
  }, [maxRetries, showToasts, showToast, onError]);

  const retryOperation = useCallback(async (operation, errorId, context = {}) => {
    const error = errors.find(e => e.id === errorId);
    if (!error || !error.canRetry) {
      return null;
    }

    setIsRecovering(true);

    try {
      // Clear any existing timeout
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current);
      }

      // Wait for retry delay
      await new Promise(resolve => {
        recoveryTimeoutRef.current = setTimeout(resolve, retryDelay);
      });

      const result = await operation();

      // Remove error on successful retry
      setErrors(prev => prev.filter(e => e.id !== errorId));
      
      if (showToasts) {
        showToast('Operation completed successfully', 'success');
      }

      onRecovery(error, result);
      return result;

    } catch (retryError) {
      const updatedError = addError(retryError, { 
        ...context, 
        isRetry: true, 
        originalErrorId: errorId 
      });

      if (updatedError.retryCount >= maxRetries) {
        onMaxRetriesReached(updatedError);
      }

      throw retryError;
    } finally {
      setIsRecovering(false);
    }
  }, [errors, retryDelay, showToasts, showToast, addError, maxRetries, onRecovery, onMaxRetriesReached]);

  const dismissError = useCallback((errorId) => {
    setErrors(prev => prev.filter(e => e.id !== errorId));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
    errorCountRef.current.clear();
    
    if (persistErrors) {
      localStorage.removeItem('chat_errors');
    }
  }, [persistErrors]);

  const getErrorsByCategory = useCallback((category) => {
    return errors.filter(error => error.category === category);
  }, [errors]);

  const getErrorsBySeverity = useCallback((severity) => {
    return errors.filter(error => error.severity === severity);
  }, [errors]);

  const hasRecoverableErrors = useCallback(() => {
    return errors.some(error => error.canRetry);
  }, [errors]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current);
      }
    };
  }, []);

  return {
    errors,
    isRecovering,
    addError,
    retryOperation,
    dismissError,
    clearAllErrors,
    getErrorsByCategory,
    getErrorsBySeverity,
    hasRecoverableErrors,
    errorCount: errors.length,
    criticalErrorCount: errors.filter(e => e.severity === 'critical').length,
    recoverableErrorCount: errors.filter(e => e.canRetry).length
  };
};

// Helper functions
const determineSeverity = (error, context) => {
  // Network errors are usually recoverable
  if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
    return 'warning';
  }

  // Authentication errors are critical
  if (error.status === 401 || error.status === 403) {
    return 'critical';
  }

  // Server errors might be recoverable
  if (error.status >= 500) {
    return 'error';
  }

  // Client errors are usually not recoverable
  if (error.status >= 400) {
    return 'warning';
  }

  // JavaScript errors in chat context
  if (context.component === 'chat' && error.name === 'TypeError') {
    return 'error';
  }

  return 'info';
};

const categorizeError = (error, context) => {
  if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
    return 'network';
  }

  if (error.status >= 400 && error.status < 500) {
    return 'client';
  }

  if (error.status >= 500) {
    return 'server';
  }

  if (context.component) {
    return `component_${context.component}`;
  }

  if (error.name === 'TypeError' || error.name === 'ReferenceError') {
    return 'javascript';
  }

  return 'unknown';
};

const getErrorToastMessage = (error) => {
  switch (error.category) {
    case 'network':
      return 'Connection issue detected. Retrying...';
    case 'server':
      return 'Server error occurred. Please try again.';
    case 'client':
      return 'Request failed. Please check your input.';
    default:
      return error.message || 'An error occurred';
  }
};

export default useErrorRecovery;