import { useState, useCallback, useRef } from 'react';
import useErrorHandler from './useErrorHandler';
import useOfflineDetection from './useOfflineDetection';

const useApi = () => {
  const [loading, setLoading] = useState(false);
  const { error, handleError, clearError, retryWithErrorHandling } = useErrorHandler();
  const { isOnline } = useOfflineDetection();
  const abortControllerRef = useRef(null);

  const makeRequest = useCallback(async (url, options = {}) => {
    // Ensure we use the correct base URL for API calls
    const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
    const fullUrl = url.startsWith('http') ? url : `${baseURL}${url}`;

    // Check if offline
    if (!isOnline && !options.allowOffline) {
      const offlineError = new Error('You are currently offline');
      offlineError.request = true;
      handleError(offlineError, `API request to ${fullUrl}`);
      throw offlineError;
    }

    setLoading(true);
    clearError();

    // Don't cancel previous requests - let them complete
    // This prevents race conditions when making multiple simultaneous requests
    
    // Create new abort controller for this specific request
    const currentAbortController = new AbortController();

    try {
      const token = localStorage.getItem('token');
      const defaultHeaders = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      };

      const config = {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers
        },
        signal: currentAbortController.signal
      };

      console.log('Making API request to:', fullUrl);
      const response = await fetch(fullUrl, config);
      
      console.log(`Response for ${fullUrl}:`, {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || `HTTP ${response.status}`);
        error.response = { status: response.status, data: errorData };
        throw error;
      }

      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        console.log(`JSON data for ${fullUrl}:`, data);
        
        // Ensure we return an empty array for array endpoints if null/undefined is returned
        if (data === null || data === undefined) {
          console.warn(`Received null/undefined data for ${fullUrl}`);
          if (url.includes('/messages') || url.includes('/privateChat') || 
              url.includes('/chat') || url.includes('/friends')) {
            return [];
          }
        }
        
        // Additional safety check for endpoints that should return arrays
        if ((url.includes('/messages') || url.includes('/privateChat')) && 
            !Array.isArray(data)) {
          console.error(`Expected array but got ${typeof data} for ${url}:`, data);
          return [];
        }
      } else {
        data = await response.text();
        console.log(`Text data for ${fullUrl}:`, data);
      }
      
      console.log(`Returning data for ${fullUrl}:`, data);
      return data;
    } catch (error) {
      // Don't handle aborted requests as errors
      if (error.name === 'AbortError') {
        return;
      }
      
      handleError(error, `API request to ${fullUrl}`);
      throw error;
    } finally {
      setLoading(false);
      // Don't set abortControllerRef to null since we're not using it for cancellation
    }
  }, [handleError, clearError, isOnline]);

  const makeRequestWithRetry = useCallback(async (url, options = {}, maxRetries = 3) => {
    const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
    const fullUrl = url.startsWith('http') ? url : `${baseURL}${url}`;
    return retryWithErrorHandling(
      () => makeRequest(url, options),
      `API request to ${fullUrl}`,
      maxRetries
    );
  }, [makeRequest, retryWithErrorHandling]);

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Convenience methods
  const get = useCallback((url, options = {}) => {
    return makeRequest(url, { ...options, method: 'GET' });
  }, [makeRequest]);

  const post = useCallback((url, data, options = {}) => {
    return makeRequest(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }, [makeRequest]);

  const put = useCallback((url, data, options = {}) => {
    return makeRequest(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }, [makeRequest]);

  const del = useCallback((url, options = {}) => {
    return makeRequest(url, { ...options, method: 'DELETE' });
  }, [makeRequest]);

  const upload = useCallback((url, formData, options = {}) => {
    const token = localStorage.getItem('token');
    return makeRequest(url, {
      ...options,
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      body: formData
    });
  }, [makeRequest]);

  // Convenience methods with retry
  const getWithRetry = useCallback((url, options = {}, maxRetries = 3) => {
    return makeRequestWithRetry(url, { ...options, method: 'GET' }, maxRetries);
  }, [makeRequestWithRetry]);

  const postWithRetry = useCallback((url, data, options = {}, maxRetries = 3) => {
    return makeRequestWithRetry(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    }, maxRetries);
  }, [makeRequestWithRetry]);

  return {
    loading,
    error,
    clearError,
    makeRequest,
    makeRequestWithRetry,
    cancelRequest,
    get,
    post,
    put,
    delete: del,
    upload,
    getWithRetry,
    postWithRetry,
    isOnline
  };
};

export default useApi;