import { useState, useCallback, useRef } from 'react';

/**
 * Hook for implementing retry logic with exponential backoff
 * @param {Function} operation - The async operation to retry
 * @param {Object} options - Retry configuration options
 * @returns {Object} Retry state and functions
 */
const useRetry = (operation, options = {}) => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryCondition = () => true,
    onRetry = () => {},
    onMaxRetriesReached = () => {},
    onSuccess = () => {},
    onError = () => {}
  } = options;

  const [state, setState] = useState({
    isLoading: false,
    error: null,
    retryCount: 0,
    lastAttempt: null,
    data: null
  });

  const timeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  const calculateDelay = useCallback((attempt) => {
    const delay = Math.min(
      initialDelay * Math.pow(backoffFactor, attempt),
      maxDelay
    );
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }, [initialDelay, backoffFactor, maxDelay]);

  const execute = useCallback(async (...args) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      lastAttempt: new Date()
    }));

    const attemptOperation = async (attempt = 0) => {
      try {
        // Create new abort controller for this attempt
        abortControllerRef.current = new AbortController();
        
        const result = await operation(...args, {
          signal: abortControllerRef.current.signal,
          attempt
        });

        setState(prev => ({
          ...prev,
          isLoading: false,
          error: null,
          data: result,
          retryCount: attempt
        }));

        onSuccess(result, attempt);
        return result;

      } catch (error) {
        // Don't retry if operation was aborted
        if (error.name === 'AbortError') {
          return;
        }

        const shouldRetry = attempt < maxRetries && retryCondition(error, attempt);

        if (shouldRetry) {
          const delay = calculateDelay(attempt);
          
          setState(prev => ({
            ...prev,
            retryCount: attempt + 1,
            error: error,
            lastAttempt: new Date()
          }));

          onRetry(error, attempt + 1, delay);

          // Schedule next attempt
          timeoutRef.current = setTimeout(() => {
            attemptOperation(attempt + 1);
          }, delay);

        } else {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: error,
            retryCount: attempt
          }));

          if (attempt >= maxRetries) {
            onMaxRetriesReached(error, attempt);
          }

          onError(error, attempt);
          throw error;
        }
      }
    };

    return attemptOperation();
  }, [
    operation,
    maxRetries,
    retryCondition,
    calculateDelay,
    onRetry,
    onMaxRetriesReached,
    onSuccess,
    onError
  ]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState({
      isLoading: false,
      error: null,
      retryCount: 0,
      lastAttempt: null,
      data: null
    });
  }, []);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState(prev => ({
      ...prev,
      isLoading: false
    }));
  }, []);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    ...state,
    execute,
    reset,
    cancel,
    cleanup,
    canRetry: state.retryCount < maxRetries,
    nextRetryIn: state.retryCount < maxRetries ? calculateDelay(state.retryCount) : null
  };
};

export default useRetry;