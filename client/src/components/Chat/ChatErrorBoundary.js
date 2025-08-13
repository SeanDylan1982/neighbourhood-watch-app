import React from 'react';
import { Alert, AlertTitle, Button, Box, Typography } from '@mui/material';
import { Refresh as RefreshIcon, Wifi as WifiIcon, Lock as LockIcon } from '@mui/icons-material';

/**
 * Specialized error boundary for chat-related errors
 * Provides user-friendly error messages and recovery options
 */
const ChatErrorBoundary = ({ error, onRetry, onDismiss, context = 'chat' }) => {
  if (!error) return null;

  const getErrorConfig = () => {
    const message = error.message?.toLowerCase() || '';
    
    if (error.type === 'auth' || message.includes('unauthorized') || message.includes('session')) {
      return {
        severity: 'warning',
        title: 'Session Expired',
        message: 'Your session has expired. Please refresh the page to continue.',
        icon: <LockIcon />,
        action: {
          label: 'Refresh Page',
          onClick: () => window.location.reload()
        }
      };
    }

    if (message.includes('connection') || message.includes('network') || message.includes('offline')) {
      return {
        severity: 'error',
        title: 'Connection Issue',
        message: 'Unable to connect to chat service. Please check your internet connection.',
        icon: <WifiIcon />,
        action: {
          label: 'Try Again',
          onClick: onRetry
        }
      };
    }

    if (message.includes('unavailable') || message.includes('service')) {
      return {
        severity: 'error',
        title: 'Service Temporarily Unavailable',
        message: 'Chat service is temporarily unavailable. Please try again in a moment.',
        icon: <RefreshIcon />,
        action: {
          label: 'Retry',
          onClick: onRetry
        }
      };
    }

    // Default error
    return {
      severity: 'error',
      title: 'Chat Error',
      message: error.message || 'An unexpected error occurred with the chat service.',
      icon: <RefreshIcon />,
      action: {
        label: 'Try Again',
        onClick: onRetry
      }
    };
  };

  const config = getErrorConfig();

  return (
    <Box sx={{ p: 2 }}>
      <Alert 
        severity={config.severity}
        onClose={onDismiss}
        action={
          config.action && (
            <Button
              color="inherit"
              size="small"
              onClick={config.action.onClick}
              startIcon={config.icon}
            >
              {config.action.label}
            </Button>
          )
        }
      >
        <AlertTitle>{config.title}</AlertTitle>
        <Typography variant="body2">
          {config.message}
        </Typography>
        {error.retryable && (
          <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.8 }}>
            This error is usually temporary. Trying again often resolves the issue.
          </Typography>
        )}
      </Alert>
    </Box>
  );
};

export default ChatErrorBoundary;