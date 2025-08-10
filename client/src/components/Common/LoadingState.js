import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Skeleton,
  Card,
  CardContent
} from '@mui/material';

/**
 * Comprehensive loading state component with different variants
 */
const LoadingState = ({ 
  variant = 'spinner', 
  message = 'Loading...', 
  size = 'medium',
  count = 3,
  height = 100
}) => {
  const getSize = () => {
    switch (size) {
      case 'small': return 24;
      case 'large': return 60;
      default: return 40;
    }
  };

  if (variant === 'skeleton') {
    return (
      <Box sx={{ width: '100%' }}>
        {Array.from({ length: count }).map((_, index) => (
          <Card key={index} sx={{ mb: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Skeleton variant="circular" width={40} height={40} />
                <Box flex={1}>
                  <Skeleton variant="text" width="60%" height={24} />
                  <Skeleton variant="text" width="40%" height={20} />
                </Box>
                <Skeleton variant="rectangular" width={80} height={32} />
              </Box>
              <Skeleton variant="text" width="100%" height={20} />
              <Skeleton variant="text" width="80%" height={20} />
              <Box mt={2}>
                <Skeleton variant="rectangular" width="100%" height={height} />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  if (variant === 'list') {
    return (
      <Box sx={{ width: '100%' }}>
        {Array.from({ length: count }).map((_, index) => (
          <Box key={index} display="flex" alignItems="center" gap={2} mb={2} p={2}>
            <Skeleton variant="circular" width={32} height={32} />
            <Box flex={1}>
              <Skeleton variant="text" width="70%" height={20} />
              <Skeleton variant="text" width="50%" height={16} />
            </Box>
            <Skeleton variant="rectangular" width={60} height={24} />
          </Box>
        ))}
      </Box>
    );
  }

  if (variant === 'cards') {
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
        {Array.from({ length: count }).map((_, index) => (
          <Card key={index}>
            <CardContent>
              <Skeleton variant="text" width="80%" height={24} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="100%" height={20} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="60%" height={20} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" width="100%" height={120} />
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  // Default spinner variant
  return (
    <Box 
      display="flex" 
      flexDirection="column"
      justifyContent="center" 
      alignItems="center" 
      minHeight="200px"
      gap={2}
    >
      <CircularProgress size={getSize()} />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingState;