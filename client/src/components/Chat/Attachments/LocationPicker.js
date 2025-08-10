import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import './LocationPicker.css';
import {
  LocationOn as LocationIcon,
  MyLocation as CurrentLocationIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Map as MapIcon,
  GpsFixed as GpsIcon,
  LocationDisabled as LocationDisabledIcon
} from '@mui/icons-material';

/**
 * LocationPicker component for sharing location in chat
 * Features:
 * - Geolocation API integration with permission handling
 * - Location preview with coordinates and address
 * - Error states for various location scenarios
 * - Responsive design for mobile and desktop
 * - Location accuracy and timestamp display
 * 
 * Requirements addressed:
 * - 7.1: Display options for Camera, Photo & Video Library, Document, Location, and Contact
 * - 7.2: Show upload progress and inline preview
 * - 7.5: Request geolocation permissions and display location preview
 */
const LocationPicker = ({
  onLocationSelect,
  onClose,
  disabled = false,
  showPreview = true,
  enableHighAccuracy = true,
  timeout = 10000,
  maximumAge = 300000, // 5 minutes
  className = ''
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'granted', 'denied', 'prompt'
  const [accuracy, setAccuracy] = useState(null);

  // Check geolocation support and permission status
  useEffect(() => {
    const checkGeolocationSupport = async () => {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by this browser.');
        return;
      }

      // Check permission status if available
      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          setPermissionStatus(permission.state);
          
          // Listen for permission changes
          permission.addEventListener('change', () => {
            setPermissionStatus(permission.state);
          });
        } catch (err) {
          console.warn('Could not query geolocation permission:', err);
        }
      }
    };

    checkGeolocationSupport();
  }, []);

  // Reverse geocoding to get address from coordinates
  const reverseGeocode = useCallback(async (latitude, longitude) => {
    try {
      // Using a free geocoding service (you might want to use Google Maps API or similar)
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
    if (disabled || loading) return;

    setLoading(true);
    setError('');

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser.');
      }

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

      const { latitude, longitude, accuracy: positionAccuracy } = position.coords;
      const timestamp = new Date(position.timestamp);

      // Get address
      const locationAddress = await reverseGeocode(latitude, longitude);

      const locationData = {
        coordinates: { latitude, longitude },
        address: locationAddress,
        accuracy: positionAccuracy,
        timestamp
      };

      setLocation(locationData);
      setAddress(locationAddress);
      setAccuracy(positionAccuracy);
      setError('');

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
      setAddress('');
      setAccuracy(null);
    } finally {
      setLoading(false);
    }
  }, [disabled, loading, enableHighAccuracy, timeout, maximumAge, reverseGeocode]);

  // Handle location sharing
  const handleShareLocation = useCallback(() => {
    if (!location || disabled) return;

    const locationData = {
      type: 'location',
      coordinates: location.coordinates,
      address: location.address,
      accuracy: location.accuracy,
      timestamp: location.timestamp,
      preview: `📍 ${location.address}`
    };

    if (onLocationSelect) {
      onLocationSelect(locationData);
    }

    if (onClose) {
      onClose();
    }
  }, [location, disabled, onLocationSelect, onClose]);

  // Format accuracy
  const formatAccuracy = useCallback((accuracyMeters) => {
    if (!accuracyMeters) return '';
    
    if (accuracyMeters < 1000) {
      return `±${Math.round(accuracyMeters)}m`;
    } else {
      return `±${(accuracyMeters / 1000).toFixed(1)}km`;
    }
  }, []);

  // Format timestamp
  const formatTimestamp = useCallback((timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const diff = now - timestamp;
    
    if (diff < 60000) { // Less than 1 minute
      return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
      return `${Math.floor(diff / 60000)} minutes ago`;
    } else {
      return timestamp.toLocaleTimeString();
    }
  }, []);

  // Get permission status color and icon
  const getPermissionInfo = useCallback(() => {
    switch (permissionStatus) {
      case 'granted':
        return { color: 'success', icon: GpsIcon, text: 'Location access granted' };
      case 'denied':
        return { color: 'error', icon: LocationDisabledIcon, text: 'Location access denied' };
      default:
        return { color: 'warning', icon: LocationIcon, text: 'Location permission required' };
    }
  }, [permissionStatus]);

  const permissionInfo = getPermissionInfo();
  const PermissionIcon = permissionInfo.icon;

  return (
    <Box className={`location-picker ${className}`}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocationIcon color="primary" />
          <Typography variant="h6">Share Location</Typography>
        </Box>
        {onClose && (
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      {/* Permission Status */}
      <Alert 
        severity={permissionInfo.color} 
        icon={<PermissionIcon />}
        sx={{ mb: 2 }}
      >
        {permissionInfo.text}
      </Alert>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Get Location Button */}
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CurrentLocationIcon />}
          onClick={getCurrentLocation}
          disabled={disabled || loading || permissionStatus === 'denied'}
          sx={{ 
            minWidth: 200,
            py: 1.5,
            borderRadius: 2
          }}
        >
          {loading ? 'Getting Location...' : 'Get Current Location'}
        </Button>
        
        {location && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={getCurrentLocation}
            disabled={disabled || loading}
            sx={{ ml: 1 }}
          >
            Refresh
          </Button>
        )}
      </Box>

      {/* Location Preview */}
      {showPreview && location && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <LocationIcon sx={{ color: 'white' }} />
              </Box>
              
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1 }}>
                  Current Location
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {address}
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                  <Chip
                    size="small"
                    label={`${location.coordinates.latitude.toFixed(6)}, ${location.coordinates.longitude.toFixed(6)}`}
                    variant="outlined"
                  />
                  {accuracy && (
                    <Chip
                      size="small"
                      label={formatAccuracy(accuracy)}
                      color="info"
                      variant="outlined"
                    />
                  )}
                </Box>
                
                {location.timestamp && (
                  <Typography variant="caption" color="text.secondary">
                    Updated {formatTimestamp(location.timestamp)}
                  </Typography>
                )}
              </Box>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<MapIcon />}
                onClick={() => {
                  const { latitude, longitude } = location.coordinates;
                  const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
                  window.open(url, '_blank');
                }}
                size="small"
              >
                View on Map
              </Button>
              
              <Button
                variant="contained"
                onClick={handleShareLocation}
                disabled={disabled}
                size="small"
              >
                Share Location
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Help Text */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Your location will be shared with approximate accuracy.
          {isMobile && ' Make sure location services are enabled on your device.'}
        </Typography>
      </Box>
    </Box>
  );
};

export default LocationPicker;