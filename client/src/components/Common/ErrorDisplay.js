import icons from './Icons'
import React from 'react';
import {
  Alert,
  AlertTitle,
  Button,
  Box,
  Collapse,
  Typography,
  IconButton
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  WifiOff as WifiOffIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const ErrorDisplay = ({ 
  error, 
  onRetry, 
  onDismiss, 
  showDetails = false,
  compact = false 
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = React.useState(false);

  if (!error) return null;

  const getErrorSeverity = (errorType) => {
    switch (errorType) {
      case 'auth':
      case 'permission':
        return 'error';
      case 'validation':
      case 'notFound':
        return 'warning';
      case 'network':
      case 'offline':
        return 'info';
      case 'server':
      case 'service':
        return 'error';
      default:
        return 'error';
    }
  };

  const getErrorIcon = (errorType) => {
    switch (errorType) {
      case 'offline':
      case 'network':
        return <WifiOffIcon />;
      case 'validation':
      case 'notFound':
        return <icons.Warning />;
      case 'auth':
      case 'permission':
      case 'server':
      case 'service':
        return <icons.Error />;
      default:
        return <icons.Info />;
    }
  };

  const getErrorTitle = (errorType) => {
    switch (errorType) {
      case 'auth':
        return 'Authentication Required';
      case 'permission':
        return 'Access Denied';
      case 'validation':
        return 'Invalid Input';
      case 'notFound':
        return 'Not Found';
      case 'network':
        return 'Network Error';
      case 'offline':
        return 'You\'re Offline';
      case 'server':
        return 'Server Error';
      case 'service':
        return 'Service Unavailable';
      case 'rateLimit':
        return 'Too Many Requests';
      default:
        return 'Error';
    }
  };

  const severity = getErrorSeverity(error.type);
  const icon = getErrorIcon(error.type);
  const title = getErrorTitle(error.type);

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
          {error.canRetry && onRetry && (
            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={onRetry}
              variant="outlined"
              color="inherit"
            >
              Retry
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
      {!compact && (
        <AlertTitle>{title}</AlertTitle>
      )}
      
      <Typography variant="body2">
        {error.message}
      </Typography>

      {showDetails && error.context && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Context: {error.context}
        </Typography>
      )}

      {showDetails && (error.originalError || error.timestamp) && (
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
              
              {error.context && (
                <Typography variant="caption" display="block">
                  <strong>Context:</strong> {error.context}
                </Typography>
              )}
              
              {error.originalError?.stack && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  <strong>Stack Trace:</strong>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {error.originalError.stack}
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

export default ErrorDisplay;