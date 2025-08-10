/**
 * Utility functions for error handling and recovery
 */

/**
 * Creates a standardized error object
 * @param {string} name - Error name/type
 * @param {string} message - Error message
 * @param {Object} options - Additional error options
 * @returns {Error} Standardized error object
 */
export const createError = (name, message, options = {}) => {
  const error = new Error(message);
  error.name = name;
  
  if (options.code) error.code = options.code;
  if (options.status) error.status = options.status;
  if (options.cause) error.cause = options.cause;
  if (options.context) error.context = options.context;
  
  return error;
};

/**
 * Determines if an error is recoverable
 * @param {Error} error - The error to check
 * @returns {boolean} Whether the error is recoverable
 */
export const isRecoverableError = (error) => {
  // Network errors are usually recoverable
  if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
    return true;
  }

  // Timeout errors are recoverable
  if (error.name === 'TimeoutError' || error.code === 'TIMEOUT') {
    return true;
  }

  // Server errors (5xx) are often recoverable
  if (error.status >= 500 && error.status < 600) {
    return true;
  }

  // Rate limiting is recoverable
  if (error.status === 429) {
    return true;
  }

  // Temporary service unavailable
  if (error.status === 503) {
    return true;
  }

  // WebSocket connection errors
  if (error.name === 'WebSocketError' && error.code !== 1000) {
    return true;
  }

  return false;
};

/**
 * Gets user-friendly error message
 * @param {Error} error - The error object
 * @param {Object} context - Additional context
 * @returns {string} User-friendly error message
 */
export const getUserFriendlyMessage = (error, context = {}) => {
  // Network-related errors
  if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }

  // Timeout errors
  if (error.name === 'TimeoutError' || error.code === 'TIMEOUT') {
    return 'The request took too long to complete. Please try again.';
  }

  // Authentication errors
  if (error.status === 401) {
    return 'Your session has expired. Please log in again.';
  }

  if (error.status === 403) {
    return 'You don\'t have permission to perform this action.';
  }

  // Not found errors
  if (error.status === 404) {
    return context.resource 
      ? `${context.resource} not found.`
      : 'The requested resource was not found.';
  }

  // Rate limiting
  if (error.status === 429) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  // Server errors
  if (error.status >= 500) {
    return 'Server error occurred. Our team has been notified. Please try again later.';
  }

  // File upload errors
  if (context.operation === 'upload') {
    if (error.message.includes('size')) {
      return 'File is too large. Please choose a smaller file.';
    }
    if (error.message.includes('type')) {
      return 'File type not supported. Please choose a different file.';
    }
    return 'Failed to upload file. Please try again.';
  }

  // Chat-specific errors
  if (context.component === 'chat') {
    if (error.message.includes('message')) {
      return 'Failed to send message. Please try again.';
    }
    if (error.message.includes('connection')) {
      return 'Connection to chat server lost. Reconnecting...';
    }
  }

  // Default fallback
  return error.message || 'An unexpected error occurred. Please try again.';
};

/**
 * Logs error to console with structured format
 * @param {Error} error - The error to log
 * @param {Object} context - Additional context
 */
export const logError = (error, context = {}) => {
  const errorData = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context,
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  if (process.env.NODE_ENV === 'development') {
    console.group(`🚨 Error: ${error.name}`);
    console.error('Message:', error.message);
    console.error('Context:', context);
    console.error('Stack:', error.stack);
    console.groupEnd();
  } else {
    console.error('Error occurred:', errorData);
  }
};

/**
 * Sends error to monitoring service
 * @param {Error} error - The error to report
 * @param {Object} context - Additional context
 * @returns {Promise} Promise that resolves when error is reported
 */
export const reportError = async (error, context = {}) => {
  try {
    const errorData = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: context.userId,
      sessionId: context.sessionId
    };

    // Only send to server in production
    if (process.env.NODE_ENV === 'production') {
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorData)
      });
    }
  } catch (reportingError) {
    console.error('Failed to report error:', reportingError);
  }
};

/**
 * Wraps an async function with error handling
 * @param {Function} fn - The async function to wrap
 * @param {Object} options - Error handling options
 * @returns {Function} Wrapped function with error handling
 */
export const withErrorHandling = (fn, options = {}) => {
  const {
    onError = () => {},
    onRetry = () => {},
    maxRetries = 3,
    retryDelay = 1000,
    context = {}
  } = options;

  return async (...args) => {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;
        
        // Log the error
        logError(error, { ...context, attempt });
        
        // Check if we should retry
        if (attempt < maxRetries && isRecoverableError(error)) {
          onRetry(error, attempt + 1);
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
          continue;
        }
        
        // Max retries reached or non-recoverable error
        onError(error, attempt);
        throw error;
      }
    }
    
    throw lastError;
  };
};

/**
 * Creates a retry function with exponential backoff
 * @param {Function} operation - The operation to retry
 * @param {Object} options - Retry options
 * @returns {Function} Function that executes with retry logic
 */
export const createRetryFunction = (operation, options = {}) => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    jitter = true
  } = options;

  return async (...args) => {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation(...args);
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries || !isRecoverableError(error)) {
          throw error;
        }
        
        // Calculate delay with exponential backoff
        let delay = Math.min(
          initialDelay * Math.pow(backoffFactor, attempt),
          maxDelay
        );
        
        // Add jitter to prevent thundering herd
        if (jitter) {
          delay += Math.random() * 1000;
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  };
};

/**
 * Validates error object structure
 * @param {*} error - The error to validate
 * @returns {boolean} Whether the error is valid
 */
export const isValidError = (error) => {
  return error instanceof Error || 
         (error && typeof error === 'object' && error.message);
};

/**
 * Sanitizes error for safe serialization
 * @param {Error} error - The error to sanitize
 * @returns {Object} Sanitized error object
 */
export const sanitizeError = (error) => {
  if (!isValidError(error)) {
    return {
      name: 'UnknownError',
      message: 'An unknown error occurred',
      timestamp: new Date().toISOString()
    };
  }

  return {
    name: error.name || 'Error',
    message: error.message || 'An error occurred',
    stack: error.stack,
    code: error.code,
    status: error.status,
    timestamp: new Date().toISOString()
  };
};

/**
 * Error types for consistent error handling
 */
export const ErrorTypes = {
  NETWORK_ERROR: 'NetworkError',
  TIMEOUT_ERROR: 'TimeoutError',
  VALIDATION_ERROR: 'ValidationError',
  AUTHENTICATION_ERROR: 'AuthenticationError',
  AUTHORIZATION_ERROR: 'AuthorizationError',
  NOT_FOUND_ERROR: 'NotFoundError',
  SERVER_ERROR: 'ServerError',
  WEBSOCKET_ERROR: 'WebSocketError',
  UPLOAD_ERROR: 'UploadError',
  CHAT_ERROR: 'ChatError'
};

/**
 * Error codes for specific error scenarios
 */
export const ErrorCodes = {
  NETWORK_UNAVAILABLE: 'NETWORK_UNAVAILABLE',
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
  INVALID_INPUT: 'INVALID_INPUT',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  SERVER_UNAVAILABLE: 'SERVER_UNAVAILABLE',
  WEBSOCKET_DISCONNECTED: 'WEBSOCKET_DISCONNECTED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UNSUPPORTED_FILE_TYPE: 'UNSUPPORTED_FILE_TYPE',
  MESSAGE_SEND_FAILED: 'MESSAGE_SEND_FAILED',
  CHAT_CONNECTION_LOST: 'CHAT_CONNECTION_LOST'
};