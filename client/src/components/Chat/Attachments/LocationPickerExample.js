import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Chip,
  Alert
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import LocationPicker from './LocationPicker';

/**
 * LocationPickerExample - Demonstrates usage of the LocationPicker component
 * Shows how to integrate location sharing in a chat interface
 */
const LocationPickerExample = () => {
  const [open, setOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [sharedLocations, setSharedLocations] = useState([]);

  // Handle location selection
  const handleLocationSelect = (locationData) => {
    setSelectedLocation(locationData);
    setSharedLocations(prev => [...prev, { ...locationData, id: Date.now() }]);
    setOpen(false);
  };

  // Handle dialog close
  const handleClose = () => {
    setOpen(false);
  };

  // Clear shared locations
  const clearLocations = () => {
    setSharedLocations([]);
    setSelectedLocation(null);
  };

  // Format coordinates for display
  const formatCoordinates = (coordinates) => {
    return `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`;
  };

  // Format accuracy
  const formatAccuracy = (accuracyMeters) => {
    if (!accuracyMeters) return '';
    
    if (accuracyMeters < 1000) {
      return `±${Math.round(accuracyMeters)}m`;
    } else {
      return `±${(accuracyMeters / 1000).toFixed(1)}km`;
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        LocationPicker Example
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        This example demonstrates how to use the LocationPicker component for sharing location in chat messages.
      </Typography>

      {/* Share Location Button */}
      <Button
        variant="contained"
        startIcon={<ShareIcon />}
        onClick={() => setOpen(true)}
        size="large"
        sx={{ mb: 3 }}
      >
        Share My Location
      </Button>

      {/* Current Selection */}
      {selectedLocation && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">
            Location Selected: {selectedLocation.address}
          </Typography>
        </Alert>
      )}

      {/* Shared Locations */}
      {sharedLocations.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Shared Locations ({sharedLocations.length})
            </Typography>
            <Button size="small" onClick={clearLocations}>
              Clear All
            </Button>
          </Box>

          {sharedLocations.map((location) => (
            <Card key={location.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <LocationIcon sx={{ color: 'white', fontSize: 20 }} />
                  </Box>
                  
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1 }}>
                      {location.address}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                      <Chip
                        size="small"
                        label={formatCoordinates(location.coordinates)}
                        variant="outlined"
                      />
                      {location.accuracy && (
                        <Chip
                          size="small"
                          label={formatAccuracy(location.accuracy)}
                          color="info"
                          variant="outlined"
                        />
                      )}
                    </Box>
                    
                    {location.timestamp && (
                      <Typography variant="caption" color="text.secondary">
                        Shared at {new Date(location.timestamp).toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                </Box>
                
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      const { latitude, longitude } = location.coordinates;
                      const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
                      window.open(url, '_blank');
                    }}
                  >
                    View on Map
                  </Button>
                  
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      const { latitude, longitude } = location.coordinates;
                      navigator.clipboard.writeText(`${latitude}, ${longitude}`);
                    }}
                  >
                    Copy Coordinates
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Usage Information */}
      <Card sx={{ bgcolor: 'grey.50' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Usage Notes
          </Typography>
          
          <Typography variant="body2" component="div">
            <ul>
              <li>The LocationPicker requests geolocation permissions from the browser</li>
              <li>Location accuracy depends on device GPS and network connectivity</li>
              <li>Addresses are resolved using reverse geocoding when possible</li>
              <li>The component handles various error states gracefully</li>
              <li>Location data includes coordinates, address, accuracy, and timestamp</li>
            </ul>
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            <strong>Privacy Note:</strong> Location data is only shared when explicitly requested by the user.
            The component respects browser permission settings and provides clear feedback about location access status.
          </Typography>
        </CardContent>
      </Card>

      {/* LocationPicker Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle>
          Share Location
        </DialogTitle>
        
        <DialogContent>
          <LocationPicker
            onLocationSelect={handleLocationSelect}
            onClose={handleClose}
            showPreview={true}
            enableHighAccuracy={true}
            timeout={10000}
          />
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LocationPickerExample;