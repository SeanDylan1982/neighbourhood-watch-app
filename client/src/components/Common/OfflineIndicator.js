import React from 'react';
import {
  Alert,
  Snackbar,
  Box,
  Typography,
  Button,
  Slide
} from '@mui/material';
import {
  WifiOff as WifiOffIcon,
  Wifi as WifiIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import useOfflineDetection from '../../hooks/useOfflineDetection';

const SlideTransition = (props) => {
  return <Slide {...props} direction="down" />;
};

const OfflineIndicator = ({ 
  showPersistent = true, 
  showReconnectedToast = true 
}) => {
  const { isOnline, wasOffline } = useOfflineDetection();
  const [showReconnected, setShowReconnected] = React.useState(false);

  React.useEffect(() => {
    if (isOnline && wasOffline && showReconnectedToast) {
      setShowReconnected(true);
    }
  }, [isOnline, wasOffline, showReconnectedToast]);

  const handleReconnectedClose = () => {
    setShowReconnected(false);
  };

  const handleRetryConnection = () => {
    window.location.reload();
  };

  return (
    <>
      {/* Persistent offline indicator */}
      {!isOnline && showPersistent && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            bgcolor: 'warning.main',
            color: 'warning.contrastText',
            py: 1,
            px: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            boxShadow: 2
          }}
        >
          <WifiOffIcon fontSize="small" />
          <Typography variant="body2" fontWeight="medium">
            You're currently offline. Some features may not work properly.
          </Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRetryConnection}
            sx={{
              color: 'inherit',
              borderColor: 'currentColor',
              '&:hover': {
                borderColor: 'currentColor',
                bgcolor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            Retry
          </Button>
        </Box>
      )}

      {/* Reconnected toast notification */}
      <Snackbar
        open={showReconnected}
        autoHideDuration={4000}
        onClose={handleReconnectedClose}
        TransitionComponent={SlideTransition}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleReconnectedClose}
          severity="success"
          icon={<WifiIcon />}
          sx={{ width: '100%' }}
        >
          <Typography variant="body2" fontWeight="medium">
            Connection restored! You're back online.
          </Typography>
        </Alert>
      </Snackbar>
    </>
  );
};

export default OfflineIndicator;