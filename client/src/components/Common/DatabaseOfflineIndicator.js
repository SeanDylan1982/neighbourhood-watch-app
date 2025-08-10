import icons from './Icons'
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Collapse,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CloudOff as CloudOffIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon,
  Close as CloseIcon
} from '@mui/icons-material';

/**
 * Component for displaying a persistent offline mode indicator when the database is unavailable.
 * This component provides information about offline capabilities and retry options.
 */
const DatabaseOfflineIndicator = ({
  onRetry,
  offlineSince,
  offlineCapabilities = [],
  minimizable = true,
  retryInProgress = false
}) => {
  const [minimized, setMinimized] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [nextRetryTime, setNextRetryTime] = useState(null);
  const [countdown, setCountdown] = useState(0);

  // Handle automatic retry with exponential backoff
  useEffect(() => {
    if (!onRetry || minimized || retryInProgress) return;

    // Calculate backoff time (exponential with max of 2 minutes)
    const calculateBackoff = () => {
      const baseDelay = 5; // 5 seconds base
      const maxDelay = 120; // 2 minutes max
      const calculatedDelay = Math.min(
        baseDelay * Math.pow(2, retryCount),
        maxDelay
      );
      // Add jitter (±10%)
      const jitter = calculatedDelay * 0.1 * (Math.random() * 2 - 1);
      return Math.round(calculatedDelay + jitter);
    };

    const backoffSeconds = calculateBackoff();
    const retryAt = new Date();
    retryAt.setSeconds(retryAt.getSeconds() + backoffSeconds);
    setNextRetryTime(retryAt);
    setCountdown(backoffSeconds);

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleRetry();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [retryCount, onRetry, minimized, retryInProgress]);

  const handleRetry = () => {
    if (onRetry && !retryInProgress) {
      onRetry();
      setRetryCount(prev => prev + 1);
    }
  };

  const formatOfflineDuration = () => {
    if (!offlineSince) return 'Unknown';
    
    const now = new Date();
    const diff = now - new Date(offlineSince);
    
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds} seconds`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''}`;
    
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  if (minimized) {
    return (
      <Tooltip title="Database connection unavailable - Click to expand">
        <IconButton
          color="warning"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            bgcolor: 'warning.main',
            color: 'warning.contrastText',
            '&:hover': {
              bgcolor: 'warning.dark'
            },
            boxShadow: 2,
            zIndex: 1000
          }}
          onClick={() => setMinimized(false)}
        >
          <icons.CloudOff />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        maxWidth: 350,
        width: '100%',
        zIndex: 1000,
        overflow: 'hidden',
        borderLeft: '4px solid',
        borderColor: 'warning.main'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          bgcolor: 'warning.main',
          color: 'warning.contrastText',
          px: 2,
          py: 1
        }}
      >
        <icons.CloudOff sx={{ mr: 1 }} />
        <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
          Database Connection Unavailable
        </Typography>
        {minimizable && (
          <IconButton
            size="small"
            color="inherit"
            onClick={() => setMinimized(true)}
            sx={{ ml: 1 }}
          >
            <icons.Close fontSize="small" />
          </IconButton>
        )}
      </Box>

      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          The application is currently running in offline mode. Some features may be limited or unavailable.
        </Typography>
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Offline for: {formatOfflineDuration()}
          </Typography>
          
          <Button
            size="small"
            startIcon={retryInProgress ? null : <RefreshIcon />}
            onClick={handleRetry}
            variant="outlined"
            color="warning"
            disabled={retryInProgress}
          >
            {retryInProgress ? (
              'Connecting...'
            ) : countdown > 0 ? (
              `Retry in ${countdown}s`
            ) : (
              'Retry Now'
            )}
          </Button>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Button
            size="small"
            startIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={() => setShowDetails(!showDetails)}
            sx={{ textTransform: 'none' }}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
          
          <Collapse in={showDetails}>
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 'medium', mb: 0.5 }}>
                Available in offline mode:
              </Typography>
              
              {offlineCapabilities.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {offlineCapabilities.map((capability, index) => (
                    <li key={index}>
                      <Typography variant="caption" color="text.secondary">
                        {capability}
                      </Typography>
                    </li>
                  ))}
                </ul>
              ) : (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 2 }}>
                  No offline capabilities available
                </Typography>
              )}
              
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <icons.Info color="info" fontSize="small" sx={{ mt: 0.3 }} />
                <Typography variant="caption" color="text.secondary">
                  Your changes will be synchronized automatically when the database connection is restored.
                </Typography>
              </Box>
            </Box>
          </Collapse>
        </Box>
      </Box>
    </Paper>
  );
};

export default DatabaseOfflineIndicator;
</content>