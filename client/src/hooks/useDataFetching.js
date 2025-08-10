import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for consistent data fetching with loading states and error handling
 * @param {Object} options - Configuration options
 * @returns {Object} - Fetch function and state
 */
const useDataFetching = (options = {}) => {
  const {
    timeout = 10000,
    retryAttempts = 2,
    retryDelay = 1000,
    onError = null,
    onSuccess = null
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Use ref to store options to prevent fetchData from changing on every render
  const optionsRef = useRef({ timeout, retryAttempts, retryDelay, onError, onSuccess });
  optionsRef.current = { timeout, retryAttempts, retryDelay, onError, onSuccess };

  const fetchData = useCallback(async (url, fetchOptions = {}) => {
    const { timeout, retryAttempts, retryDelay, onError, onSuccess } = optionsRef.current;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    let attempt = 0;
    
    const attemptFetch = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required. Please log in again.');
        }

        // Ensure we use the correct base URL for API calls
        const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
        const fullUrl = url.startsWith('http') ? url : `${baseURL}${url}`;

        const defaultOptions = {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...fetchOptions.headers
          },
          signal: controller.signal,
          ...fetchOptions
        };

        const response = await fetch(fullUrl, defaultOptions);
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            throw new Error('Session expired. Please log in again.');
          } else if (response.status === 504) {
            throw new Error('Request timed out. Please try again.');
          } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
          }
        }

        const data = await response.json();
        
        if (onSuccess) {
          onSuccess(data);
        }
        
        return data;
      } catch (error) {
        clearTimeout(timeoutId);
        
        // Handle abort errors
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.');
        }
        
        // Handle network errors
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          throw new Error('Unable to connect to server. Please check your internet connection.');
        }
        
        throw error;
      }
    };

    // Retry logic
    while (attempt <= retryAttempts) {
      try {
        const result = await attemptFetch();
        setLoading(false);
        return result;
      } catch (error) {
        attempt++;
        
        if (attempt > retryAttempts) {
          setError(error.message);
          setLoading(false);
          
          if (onError) {
            onError(error);
          }
          
          throw error;
        }
        
        // Wait before retry (except for auth errors)
        if (!error.message.includes('Authentication') && !error.message.includes('Session expired')) {
          const currentAttempt = attempt;
          await new Promise(resolve => setTimeout(resolve, retryDelay * currentAttempt));
        } else {
          // Don't retry auth errors
          setError(error.message);
          setLoading(false);
          
          if (onError) {
            onError(error);
          }
          
          throw error;
        }
      }
    }
  }, []); // Empty dependency array since we use optionsRef

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    fetchData,
    loading,
    error,
    clearError
  };
};

export default useDataFetching;