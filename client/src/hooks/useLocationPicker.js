import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for location picker functionality
 * Provides geolocation API integration with permission handling and error management
 * 
 * Requirements addressed:
 * - 7.1: Display options for Camera, Photo & Video Library, Document, Location, and Contact
 * - 7.2: Show upload progress and inline preview
 * - 7.5: Request geolocation permissions and display location preview
 */
const useLocationPicker = ({
  enableHighAccuracy = true,
  timeout = 10000,
  maximumAge = 300000, // 5 minutes
  onLocationSelect,
  onError
} = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('prompt');
  const [isSupported, setIsSupported] = useState(true);

  // Check geolocation support and permission status
  useEffect(() => {
    const checkSupport = async () => {
      if (!navigator.geolocation) {
        setIsSupported(false);
        setError('Geolocation is not supported by this browser.');
        return;
      }

      // Check permission status if available
      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          setPermissionStatus(permission.state);
          
          // Listen for permission changes
          const handlePermissionChange = () => {
            setPermissionStatus(permission.state);
          };
          
          permission.addEventListener('change', handlePermissionChange);
          
          // Cleanup listener
          return () => {
            permission.removeEventListener('change', handlePermissionChange);
          };
        } catch (err) {
          console.warn('Could not query geolocation permission:', err);
        }
      }
    };

    checkSupport();
  }, []);

  // Reverse geocoding function
  const reverseGeocode = useCallback(async (latitude, longitude) => {
    try {
      // Using a free geocoding service
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      
      if (response.ok) {
        const data = await response.json();
        const addressComponents = [];
        
        if (data.locality) addressComponents.push(data.locality);
        if (data.principalSubdivision) addressComponents.push(data.principalSubdivision);
        if (data.countryName) addressComponents.push(data.countryName);
        
        return addressComponents.join(', ') || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      }
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
    }
    
    // Fallback to coordinates
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }, []);

  // Get current location
  const getCurrentLocation = useCallback(async () => {
    if (!isSupported || loading) return null;

    setLoading(true);
    setError('');

    try {
      const position = await new Promise((resolve, reject) => {
        const options = {
          enableHighAccuracy,
          timeout,
          maximumAge
        };

        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          options
        );
      });

      const { latitude, longitude, accuracy } = position.coords;
      const timestamp = new Date(position.timestamp);

      // Get address
      const address = await reverseGeocode(latitude, longitude);

      const locationData = {
        type: 'location',
        coordinates: { latitude, longitude },
        address,
        accuracy,
        timestamp,
        preview: `📍 ${address}`
      };

      setLocation(locationData);
      setError('');

      // Call callback if provided
      if (onLocationSelect) {
        onLocationSelect(locationData);
      }

      return locationData;

    } catch (error) {
      let errorMessage = 'Failed to get location';

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location access denied. Please enable location permissions in your browser settings.';
          setPermissionStatus('denied');
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information is unavailable. Please check your GPS or network connection.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out. Please try again.';
          break;
        default:
          errorMessage = error.message || 'Failed to get location';
          break;
      }

      setError(errorMessage);
      setLocation(null);

      // Call error callback if provided
      if (onError) {
        onError(new Error(errorMessage));
      }

      return null;
    } finally {
      setLoading(false);
    }
  }, [isSupported, loading, enableHighAccuracy, timeout, maximumAge, reverseGeocode, onLocationSelect, onError]);

  // Clear location and error
  const clearLocation = useCallback(() => {
    setLocation(null);
    setError('');
  }, []);

  // Check if location services are available
  const checkLocationAvailability = useCallback(async () => {
    if (!isSupported) {
      return { available: false, reason: 'not_supported' };
    }

    if (permissionStatus === 'denied') {
      return { available: false, reason: 'permission_denied' };
    }

    return { available: true, reason: null };
  }, [isSupported, permissionStatus]);

  // Format location for display
  const formatLocation = useCallback((locationData) => {
    if (!locationData) return null;

    return {
      ...locationData,
      formattedCoordinates: `${locationData.coordinates.latitude.toFixed(6)}, ${locationData.coordinates.longitude.toFixed(6)}`,
      formattedAccuracy: locationData.accuracy ? 
        locationData.accuracy < 1000 ? 
          `±${Math.round(locationData.accuracy)}m` : 
          `±${(locationData.accuracy / 1000).toFixed(1)}km` 
        : null,
      formattedTimestamp: locationData.timestamp ? 
        (() => {
          const now = new Date();
          const diff = now - locationData.timestamp;
          
          if (diff < 60000) return 'Just now';
          if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
          return locationData.timestamp.toLocaleTimeString();
        })() 
        : null,
      mapUrl: `https://www.google.com/maps?q=${locationData.coordinates.latitude},${locationData.coordinates.longitude}`
    };
  }, []);

  // Watch position (for continuous tracking)
  const watchPosition = useCallback((callback) => {
    if (!isSupported) return null;

    const options = {
      enableHighAccuracy,
      timeout,
      maximumAge
    };

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const timestamp = new Date(position.timestamp);
        const address = await reverseGeocode(latitude, longitude);

        const locationData = {
          type: 'location',
          coordinates: { latitude, longitude },
          address,
          accuracy,
          timestamp,
          preview: `📍 ${address}`
        };

        callback(locationData);
      },
      (error) => {
        callback(null, error);
      },
      options
    );

    return watchId;
  }, [isSupported, enableHighAccuracy, timeout, maximumAge, reverseGeocode]);

  // Clear watch
  const clearWatch = useCallback((watchId) => {
    if (watchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  return {
    // State
    loading,
    error,
    location,
    permissionStatus,
    isSupported,
    
    // Actions
    getCurrentLocation,
    clearLocation,
    checkLocationAvailability,
    formatLocation,
    watchPosition,
    clearWatch,
    
    // Computed values
    canGetLocation: isSupported && permissionStatus !== 'denied' && !loading,
    hasLocation: !!location,
    hasError: !!error
  };
};

export default useLocationPicker;