import React from 'react';

/**
 * Chunk Loading Fix Utilities
 * Provides utilities to handle webpack chunk loading errors
 */

// Global retry mechanism for chunk loading
let chunkRetryCount = 0;
const MAX_CHUNK_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Retry mechanism for failed chunk loads
 * @param {Function} importFn - The dynamic import function
 * @param {number} retries - Number of retries remaining
 * @returns {Promise} - Promise that resolves to the imported module
 */
export const retryChunkLoad = async (importFn, retries = MAX_CHUNK_RETRIES) => {
  try {
    return await importFn();
  } catch (error) {
    // Check if it's a chunk loading error
    const isChunkError = error.name === 'ChunkLoadError' || 
                        error.message?.includes('Loading chunk') ||
                        error.message?.includes('chunk');

    if (isChunkError && retries > 0) {
      console.warn(`Chunk loading failed, retrying... (${MAX_CHUNK_RETRIES - retries + 1}/${MAX_CHUNK_RETRIES})`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      
      // Increment global retry count
      chunkRetryCount++;
      
      // If we've retried too many times globally, suggest page reload
      if (chunkRetryCount >= MAX_CHUNK_RETRIES * 2) {
        console.error('Too many chunk loading failures. Consider reloading the page.');
        
        // Show user notification if possible
        if (window.showNotification) {
          window.showNotification('Loading issues detected. Please reload the page.', 'error');
        }
      }
      
      return retryChunkLoad(importFn, retries - 1);
    }
    
    throw error;
  }
};

/**
 * Enhanced lazy loading with retry mechanism
 * @param {Function} importFn - The dynamic import function
 * @returns {React.ComponentType} - Lazy component with retry mechanism
 */
export const lazyWithRetry = (importFn) => {
  return React.lazy(() => retryChunkLoad(importFn));
};

/**
 * Handle chunk loading errors globally
 */
export const setupChunkErrorHandler = () => {
  // Handle unhandled promise rejections that might be chunk errors
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    
    if (error?.name === 'ChunkLoadError' || error?.message?.includes('Loading chunk')) {
      console.error('Unhandled chunk loading error:', error);
      
      // Prevent the error from being logged to console as unhandled
      event.preventDefault();
      
      // Show user-friendly message
      if (window.showNotification) {
        window.showNotification(
          'There was a problem loading part of the application. Please try refreshing the page.',
          'error'
        );
      }
    }
  });

  // Handle script loading errors
  window.addEventListener('error', (event) => {
    const { target, message } = event;
    
    // Check if it's a script loading error
    if (target?.tagName === 'SCRIPT' || message?.includes('Loading chunk')) {
      console.error('Script/chunk loading error:', event);
      
      // Show user-friendly message
      if (window.showNotification) {
        window.showNotification(
          'Failed to load application resources. Please refresh the page.',
          'error'
        );
      }
    }
  });
};

/**
 * Clear chunk loading cache and force reload
 */
export const clearChunkCache = () => {
  // Clear webpack chunk cache if available
  if (window.__webpack_require__ && window.__webpack_require__.cache) {
    Object.keys(window.__webpack_require__.cache).forEach(key => {
      delete window.__webpack_require__.cache[key];
    });
  }
  
  // Clear browser cache for chunks
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        if (name.includes('chunk') || name.includes('static')) {
          caches.delete(name);
        }
      });
    });
  }
  
  // Force reload
  window.location.reload(true);
};

/**
 * Check if current error is a chunk loading error
 * @param {Error} error - The error to check
 * @returns {boolean} - True if it's a chunk loading error
 */
export const isChunkLoadError = (error) => {
  return error?.name === 'ChunkLoadError' || 
         error?.message?.includes('Loading chunk') ||
         error?.message?.includes('chunk') ||
         error?.message?.includes('Unexpected token');
};

/**
 * Get user-friendly error message for chunk errors
 * @param {Error} error - The error
 * @returns {string} - User-friendly message
 */
export const getChunkErrorMessage = (error) => {
  if (isChunkLoadError(error)) {
    return 'There was a problem loading part of the application. This usually happens when the app is updated while you\'re using it. Please refresh the page to get the latest version.';
  }
  
  return error?.message || 'An unexpected error occurred.';
};

/**
 * Initialize chunk loading fixes
 */
export const initChunkLoadingFixes = () => {
  setupChunkErrorHandler();
  
  // Reset retry count periodically
  setInterval(() => {
    chunkRetryCount = Math.max(0, chunkRetryCount - 1);
  }, 60000); // Reset one retry every minute
  
  console.log('Chunk loading fixes initialized');
};

export default {
  retryChunkLoad,
  lazyWithRetry,
  setupChunkErrorHandler,
  clearChunkCache,
  isChunkLoadError,
  getChunkErrorMessage,
  initChunkLoadingFixes
};