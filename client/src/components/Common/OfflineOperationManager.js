import React, { useEffect, useState, useCallback } from 'react';
import {
  Snackbar,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Typography,
  CircularProgress
} from '@mui/material';
import useOfflineDetection from '../../hooks/useOfflineDetection';
import * as offlineQueue from '../../utils/offlineOperationQueue';

/**
 * Component that manages offline operations and provides UI for syncing
 * when the connection is restored
 */
const OfflineOperationManager = ({ onProcessQueue }) => {
  const { isOnline, wasOffline } = useOfflineDetection();
  const [queueLength, setQueueLength] = useState(0);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [operations, setOperations] = useState([]);
  
  // Update queue length when operations change
  const updateQueueLength = useCallback(() => {
    const length = offlineQueue.getQueueLength();
    setQueueLength(length);
    setOperations(offlineQueue.getQueue());
    return length;
  }, []);
  
  // Handle queue events
  useEffect(() => {
    const handleQueuedOperation = () => {
      updateQueueLength();
    };
    
    const handleQueueCleared = () => {
      setQueueLength(0);
      setOperations([]);
    };
    
    // Add event listeners
    window.addEventListener('offline:operation-queued', handleQueuedOperation);
    window.addEventListener('offline:operation-removed', handleQueuedOperation);
    window.addEventListener('offline:queue-cleared', handleQueueCleared);
    
    // Initial queue length
    updateQueueLength();
    
    // Cleanup
    return () => {
      window.removeEventListener('offline:operation-queued', handleQueuedOperation);
      window.removeEventListener('offline:operation-removed', handleQueuedOperation);
      window.removeEventListener('offline:queue-cleared', handleQueueCleared);
    };
  }, [updateQueueLength]);
  
  // Show snackbar when coming back online with pending operations
  useEffect(() => {
    if (isOnline && wasOffline) {
      const length = updateQueueLength();
      if (length > 0) {
        setShowSnackbar(true);
      }
    }
  }, [isOnline, wasOffline, updateQueueLength]);
  
  // Handle snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setShowSnackbar(false);
  };
  
  // Handle sync now button click
  const handleSyncNow = () => {
    setShowSnackbar(false);
    setShowDialog(true);
  };
  
  // Handle dialog close
  const handleDialogClose = () => {
    setShowDialog(false);
  };
  
  // Handle process queue
  const handleProcessQueue = async () => {
    if (!onProcessQueue) return;
    
    setProcessing(true);
    try {
      await onProcessQueue();
      // Check if all operations were processed
      const remainingLength = updateQueueLength();
      if (remainingLength === 0) {
        handleDialogClose();
      }
    } catch (error) {
      console.error('Error processing queue:', error);
    } finally {
      setProcessing(false);
    }
  };
  
  // Format operation type for display
  const formatOperationType = (operation) => {
    switch (operation.type) {
      case 'create':
        return 'Create';
      case 'update':
        return 'Update';
      case 'delete':
        return 'Delete';
      default:
        return operation.type;
    }
  };
  
  // Format resource type for display
  const formatResourceType = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };
  
  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };
  
  return (
    <>
      {/* Snackbar notification when coming back online with pending operations */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={10000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity="info" 
          sx={{ width: '100%' }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleSyncNow}
            >
              SYNC NOW
            </Button>
          }
        >
          You're back online! {queueLength} operation{queueLength !== 1 ? 's' : ''} need{queueLength === 1 ? 's' : ''} to be synchronized.
        </Alert>
      </Snackbar>
      
      {/* Dialog for syncing operations */}
      <Dialog
        open={showDialog}
        onClose={handleDialogClose}
        aria-labelledby="sync-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="sync-dialog-title">
          Synchronize Offline Changes
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            The following changes were made while you were offline and need to be synchronized:
          </Typography>
          
          <List dense>
            {operations.map((operation) => (
              <ListItem key={operation.id} divider>
                <ListItemText
                  primary={
                    <Typography variant="body2">
                      {formatOperationType(operation)} {formatResourceType(operation.resource)}
                      {operation.data && operation.data.id && !operation.data._isOptimistic && 
                        ` (ID: ${operation.data.id.substring(0, 6)}...)`
                      }
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      Queued at {formatTimestamp(operation.metadata?.timestamp)}
                      {operation.metadata?.attempts > 0 && 
                        ` • ${operation.metadata.attempts} attempts`
                      }
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
          
          <Typography variant="body2" sx={{ mt: 2 }}>
            Would you like to synchronize these changes now?
          </Typography>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleDialogClose}>
            Later
          </Button>
          <Button 
            onClick={handleProcessQueue} 
            variant="contained" 
            color="primary"
            disabled={processing}
            startIcon={processing && <CircularProgress size={16} />}
          >
            {processing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default OfflineOperationManager;