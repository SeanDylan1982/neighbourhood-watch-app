import { useState, useEffect, useCallback } from 'react';

const useOfflineDetection = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  const updateOnlineStatus = useCallback(() => {
    const online = navigator.onLine;
    setIsOnline(online);
    
    if (!online) {
      setWasOffline(true);
    }
  }, []);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    
    // If we were offline, trigger a reconnection event
    if (wasOffline) {
      setWasOffline(false);
      
      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('app:back-online'));
      
      // Optional: Show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Connection restored', {
          body: 'You are back online!',
          icon: '/favicon.ico'
        });
      }
    }
  }, [wasOffline]);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setWasOffline(true);
    
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('app:offline'));
    
    // Optional: Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Connection lost', {
        body: 'You are currently offline. Some features may not work.',
        icon: '/favicon.ico'
      });
    }
  }, []);

  useEffect(() => {
    // Initial check
    updateOnlineStatus();

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline, updateOnlineStatus]);

  // Periodic connectivity check (optional) - disabled to prevent false offline detection
  useEffect(() => {
    const checkConnectivity = async () => {
      // Only check if navigator says we're online but we think we're offline
      if (navigator.onLine && !isOnline) {
        try {
          // Try to fetch a small resource to verify actual connectivity
          const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
          const response = await fetch(`${baseURL}/api/health`, {
            method: 'HEAD',
            cache: 'no-cache',
            timeout: 5000
          });
          
          if (response.ok) {
            setIsOnline(true);
            setWasOffline(false);
          }
        } catch (error) {
          // Don't mark as offline just because server is down
          // Only rely on navigator.onLine for offline detection
          console.log('Server connectivity check failed, but not marking as offline:', error.message);
        }
      }
    };

    // Check connectivity less frequently and only when needed
    const interval = setInterval(checkConnectivity, 60000); // Every minute instead of 30 seconds

    return () => clearInterval(interval);
  }, [isOnline]);

  return {
    isOnline,
    wasOffline,
    isOffline: !isOnline
  };
};

export default useOfflineDetection;