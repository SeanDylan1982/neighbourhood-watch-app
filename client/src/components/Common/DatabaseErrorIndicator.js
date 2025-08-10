import icons from './Icons'
import React, { useState, useEffect } from 'react';
import {
  Alert,
  AlertTitle,
  Button,
  Box,
  Collapse,
  Typography,
  IconButton,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Storage as StorageIcon,
  CloudOff as CloudOffIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

/**
 * Component for displaying database-specific error messages with appropriate
 * user feedback and retry options.
 */
const DatabaseErrorIndicator = ({
  error,
  onRetry,
  onDismiss,
  showDetails = false,
  isRetrying = false,
  autoHideDuration = 0 // 0 means don't auto-hide
}) => {
  const [open, setOpen] = useState(true);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Auto-hide functionality
  useEffect(() => {
    let timer;
    if (autoHideDuration > 0 && open) {
      timer = setTimeout(() => {
        setOpen(false);
        if (onDismiss) onDismiss();
      }, autoHideDuration);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [autoHideDuration, open, onDismiss]);

  if (!error) return null;

  // Determine severity and icon based on error category
  const getSeverity = () => {
    if (!error.classification) return 'error';
    
    switch (error.classification.severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'error';
    }
  };

  const getIcon = () => {
    if (!error.classification) return <icons.CloudOff />;
    
    switch (error.classification.category) {
      case 'connection':
        return <icons.CloudOff />;
      case 'validation':
        return <icons.Warning />;
      case 'authentication':
      case 'authorization':
        return <icons.Warning />;
      default:
        return <icons.Storage />;
    }
  };

  const getTitle = () => {
    if (!error.classification) return 'Database Error';
    
    switch (error.classification.category) {
      case 'connection':
        return 'Database Connection Issue';
      case 'query':
        return 'Database Query Error';
      case 'transaction':
        return 'Transaction Failed';
      case 'validation':
        return 'Data Validation Error';
      case 'authentication':
        return 'Database Authentication Error';
      case 'authorization':
        return 'Database Access Denied';
      default:
        return 'Database Error';
    }
  };

  const getMessage = () => {
    // Use user-friendly message if available
    if (error.classification?.userFriendlyMessage) {
      return error.classification.userFriendlyMessage;
    }
    
    // Fallback to error message
    return error.message || 'An unknown database error occurred';
  };

  const isRetryable = () => {
    return error.classification?.retryable || false;
  };

  const severity = getSeverity();
  const icon = getIcon();
  const title = getTitle();
  const message = getMessage();
  const retryable = isRetryable();

  // For snackbar style
  if (autoHideDuration > 0) {
    return (
      <Snackbar
        open={open}
        autoHideDuration={autoHideDuration}
        onClose={() => {
          setOpen(false);
          if (onDismiss) onDismiss();
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={severity}
          icon={icon}
          onClose={onDismiss ? () => {
            setOpen(false);
            onDismiss();
          } : undefined}
          sx={{ width: '100%' }}
          action={
            retryable && onRetry ? (
              <Button
                size="small"
                color="inherit"
                startIcon={isRetrying ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
                onClick={onRetry}
                disabled={isRetrying}
              >
                {isRetrying ? 'Retrying...' : 'Retry'}
              </Button>
            ) : undefined
          }
        >
          <AlertTitle>{title}</AlertTitle>
          {message}
        </Alert>
      </Snackbar>
    );
  }

  // For inline alert style
  return (
    <Alert
      severity={severity}
      icon={icon}
      sx={{
        mb: 2,
        '& .MuiAlert-action': {
          alignItems: 'flex-start',
          pt: 0.5
        }
      }}
      action={
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {retryable && onRetry && (
            <Button
              size="small"
              startIcon={isRetrying ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
              onClick={onRetry}
              variant="outlined"
              color="inherit"
              disabled={isRetrying}
            >
              {isRetrying ? 'Retrying...' : 'Retry'}
            </Button>
          )}
          {onDismiss && (
            <IconButton
              size="small"
              onClick={onDismiss}
              color="inherit"
            >
              <icons.Close fontSize="small" />
            </IconButton>
          )}
        </Box>
      }
    >
      <AlertTitle>{title}</AlertTitle>
      
      <Typography variant="body2">
        {message}
      </Typography>

      {error.classification?.validationErrors && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" fontWeight="medium">
            Validation errors:
          </Typography>
          <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
            {error.classification.validationErrors.map((err, index) => (
              <li key={index}>
                <Typography variant="caption">
                  {err.field}: {err.message}
                </Typography>
              </li>
            ))}
          </ul>
        </Box>
      )}

      {showDetails && (
        <Box sx={{ mt: 2 }}>
          <Button
            size="small"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            startIcon={showTechnicalDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            variant="text"
            color="inherit"
          >
            Technical Details
          </Button>
          
          <Collapse in={showTechnicalDetails}>
            <Box
              sx={{
                mt: 1,
                p: 2,
                bgcolor: 'rgba(0,0,0,0.05)',
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                maxHeight: 200,
                overflow: 'auto'
              }}
            >
              {error.timestamp && (
                <Typography variant="caption" display="block">
                  <strong>Timestamp:</strong> {new Date(error.timestamp).toLocaleString()}
                </Typography>
              )}
              
              {error.classification && (
                <>
                  <Typography variant="caption" display="block">
                    <strong>Category:</strong> {error.classification.category}
                  </Typography>
                  <Typography variant="caption" display="block">
                    <strong>Severity:</strong> {error.classification.severity}
                  </Typography>
                  <Typography variant="caption" display="block">
                    <strong>Type:</strong> {error.classification.type}
                  </Typography>
                  <Typography variant="caption" display="block">
                    <strong>Retryable:</strong> {error.classification.retryable ? 'Yes' : 'No'}
                  </Typography>
                </>
              )}
              
              {error.stack && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  <strong>Stack Trace:</strong>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {error.stack}
                  </pre>
                </Typography>
              )}
            </Box>
          </Collapse>
        </Box>
      )}
    </Alert>
  );
};

export default DatabaseErrorIndicator;
</content>