import { useState, useCallback, useEffect, useRef } from 'react';
import useApi from './useApi';

/**
 * Custom hook for handling database-specific errors with enhanced user feedback
 * and automatic retry capabilities.
 */
const useDatabaseErrorHandler = (options = {}) => {
  const {
    maxRetries = 3,
    initialRetryDelay = 1000,
    maxRetryDelay = 30000,
    onOfflineStatusChange = null
  } = options;

  const [dbError, setDbError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [isDbOffline, setIsDbOffline] = useState(false);
  const [offlineSince, setOfflineSince] = useState(null);
  const retryTimeoutRef = useRef(null);
  const { get } = useApi();

  // Clear any pending retry timeouts on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Notify about offline status changes
  useEffect(() => {
    if (onOfflineStatusChange) {
      onOfflineStatusChange(isDbOffline);
    }
  }, [isDbOffline, onOfflineStatusChange]);

  /**
   * Determines if an error is database-related
   */
  const isDatabaseError = useCallback((error) => {
    if (!error) return false;
    
    // Check for our enhanced error classification
    if (error.classification) {
      return [
        'connection', 
        'query', 
        'transaction', 
        'validation', 
        'schema'
      ].includes(error.classification.category);
    }
    
    // Fallback checks for standard errors
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      return true;
    }
    
    // Check error message for database-related keywords
    const dbErrorKeywords = [
      'mongodb', 
      'mongo', 
      'database', 
      'connection', 
      'timeout', 
      'mongoose'
    ];
    
    return dbErrorKeywords.some(keyword => 
      error.message && error.message.toLowerCase().includes(keyword)
    );
  }, []);

  /**
   * Determines if a database error is retryable
   */
  const isRetryableDbError = useCallback((error) => {
    if (!error) return false;
    
    // Check our enhanced error classification first
    if (error.classification) {
      return error.classification.retryable;
    }
    
    // Fallback to basic checks
    if (error.name === 'MongoNetworkError') return true;
    if (error.name === 'MongoTimeoutError') return true;
    
    // Check for connection-related error messages
    const retryableKeywords = [
      'connection', 
      'timeout', 
      'network', 
      'unavailable'
    ];
    
    return retryableKeywords.some(keyword => 
      error.message && error.message.toLowerCase().includes(keyword)
    );
  }, []);

  /**
   * Handles a database error with appropriate user feedback
   */
  const handleDatabaseError = useCallback((error, context = '') => {
    if (!isDatabaseError(error)) return false;
    
    console.error(`Database error ${context}:`, error);
    
    // Set the database error state
    setDbError({
      ...error,
      context,
      timestamp: new Date().toISOString()
    });
    
    // Check if this indicates the database is offline
    const isConnectionError = error.classification?.category === 'connection' ||
      error.message?.toLowerCase().includes('connection') ||
      error.message?.toLowerCase().includes('network');
    
    if (isConnectionError) {
      setIsDbOffline(true);
      if (!offlineSince) {
        setOfflineSince(new Date().toISOString());
      }
    }
    
    return true;
  }, [isDatabaseError, offlineSince]);

  /**
   * Clears the current database error
   */
  const clearDbError = useCallback(() => {
    setDbError(null);
  }, []);

  /**
   * Checks if the database is available by making a health check request
   */
  const checkDatabaseConnection = useCallback(async () => {
    try {
      await get('/api/health/database');
      setIsDbOffline(false);
      setOfflineSince(null);
      return true;
    } catch (error) {
      if (isDatabaseError(error)) {
        setIsDbOffline(true);
        if (!offlineSince) {
          setOfflineSince(new Date().toISOString());
        }
        return false;
      }
      return true; // If it's not a DB error, consider DB online
    }
  }, [get, isDatabaseError, offlineSince]);

  /**
   * Retries a database operation with exponential backoff
   */
  const retryDatabaseOperation = useCallback(async (operation, context = '') => {
    setIsRetrying(true);
    setRetryAttempt(prev => prev + 1);
    
    try {
      const result = await operation();
      
      // Success - reset error states
      setDbError(null);
      setIsDbOffline(false);
      setOfflineSince(null);
      setIsRetrying(false);
      setRetryAttempt(0);
      
      return result;
    } catch (error) {
      setIsRetrying(false);
      
      // Handle as database error if applicable
      if (isDatabaseError(error)) {
        handleDatabaseError(error, `${context} (retry attempt ${retryAttempt + 1})`);
        
        // If we haven't exceeded max retries and the error is retryable,
        // schedule another retry with exponential backoff
        if (retryAttempt < maxRetries && isRetryableDbError(error)) {
          const delay = Math.min(
            initialRetryDelay * Math.pow(2, retryAttempt),
            maxRetryDelay
          );
          
          // Add jitter to prevent thundering herd
          const jitter = delay * 0.2 * (Math.random() * 2 - 1);
          const totalDelay = Math.max(100, delay + jitter);
          
          console.log(`Scheduling retry in ${Math.round(totalDelay)}ms...`);
          
          retryTimeoutRef.current = setTimeout(() => {
            retryDatabaseOperation(operation, context);
          }, totalDelay);
        }
      }
      
      throw error;
    }
  }, [
    handleDatabaseError, 
    isDatabaseError, 
    isRetryableDbError, 
    maxRetries, 
    retryAttempt, 
    initialRetryDelay, 
    maxRetryDelay
  ]);

  /**
   * Manually retry the database connection
   */
  const retryConnection = useCallback(async () => {
    setIsRetrying(true);
    
    try {
      const isConnected = await checkDatabaseConnection();
      setIsRetrying(false);
      
      if (isConnected) {
        setDbError(null);
        setIsDbOffline(false);
        setOfflineSince(null);
        setRetryAttempt(0);
      }
      
      return isConnected;
    } catch (error) {
      setIsRetrying(false);
      return false;
    }
  }, [checkDatabaseConnection]);

  /**
   * Wraps an async function with database error handling
   */
  const withDatabaseErrorHandling = useCallback(async (asyncFunction, context = '') => {
    try {
      return await asyncFunction();
    } catch (error) {
      if (isDatabaseError(error)) {
        handleDatabaseError(error, context);
      }
      throw error;
    }
  }, [handleDatabaseError, isDatabaseError]);

  return {
    dbError,
    isRetrying,
    isDbOffline,
    offlineSince,
    retryAttempt,
    handleDatabaseError,
    clearDbError,
    retryDatabaseOperation,
    retryConnection,
    checkDatabaseConnection,
    withDatabaseErrorHandling,
    isDatabaseError,
    isRetryableDbError
  };
};

export default useDatabaseErrorHandler;
</content>