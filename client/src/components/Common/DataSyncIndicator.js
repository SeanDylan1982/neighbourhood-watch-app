import React, { useState } from 'react';
import {
  Box,
  Badge,
  IconButton,
  Tooltip,
  Popover,
  List,
  ListItem,
  ListItemText,
  Typography,
  Divider,
  Button,
  CircularProgress
} from '@mui/material';
import {
  SyncOutlined as SyncIcon,
  SyncProblemOutlined as SyncProblemIcon,
  CloudOffOutlined as CloudOffIcon,
  CloudDoneOutlined as CloudDoneIcon,
  WarningAmberOutlined as WarningIcon,
  DeleteOutline as DeleteIcon
} from '@mui/icons-material';
import * as offlineQueue from '../../utils/offlineOperationQueue';

/**
 * Component that displays data synchronization status and pending operations
 */
const DataSyncIndicator = ({ 
  syncStatus, 
  pendingOperations = [], 
  onProcessQueue,
  conflicts = []
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleProcessQueue = async () => {
    if (!onProcessQueue) return;
    
    setProcessing(true);
    try {
      await onProcessQueue();
    } catch (error) {
      console.error('Error processing queue:', error);
    } finally {
      setProcessing(false);
    }
  };
  
  const handleClearQueue = () => {
    offlineQueue.clearQueue();
    handleClose();
  };
  
  const open = Boolean(anchorEl);
  const id = open ? 'data-sync-popover' : undefined;
  
  // Get icon based on sync status
  const getSyncIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <CircularProgress size={20} color="inherit" />;
      case 'error':
        return <SyncProblemIcon />;
      case 'offline':
        return <CloudOffIcon />;
      case 'idle':
      default:
        return pendingOperations.length > 0 ? <SyncIcon /> : <CloudDoneIcon />;
    }
  };
  
  // Get color based on sync status
  const getSyncColor = () => {
    switch (syncStatus) {
      case 'error':
        return 'error';
      case 'offline':
        return 'warning';
      case 'syncing':
        return 'info';
      case 'idle':
      default:
        return pendingOperations.length > 0 ? 'warning' : 'success';
    }
  };
  
  // Get tooltip text based on sync status
  const getTooltipText = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'Synchronizing data...';
      case 'error':
        return 'Synchronization error';
      case 'offline':
        return 'You are offline. Changes will sync when you reconnect.';
      case 'idle':
      default:
        return pendingOperations.length > 0 
          ? `${pendingOperations.length} pending changes to sync` 
          : 'All data synchronized';
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
      <Tooltip title={getTooltipText()}>
        <Badge
          badgeContent={pendingOperations.length}
          color={getSyncColor()}
          overlap="circular"
          variant="dot"
        >
          <IconButton
            aria-describedby={id}
            onClick={handleClick}
            size="small"
            color={getSyncColor()}
          >
            {getSyncIcon()}
          </IconButton>
        </Badge>
      </Tooltip>
      
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ width: 320, maxHeight: 400, overflow: 'auto', p: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Data Synchronization
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Box 
              component="span" 
              sx={{ 
                display: 'inline-flex',
                alignItems: 'center',
                color: `${getSyncColor()}.main`,
                mr: 1
              }}
            >
              {getSyncIcon()}
            </Box>
            <Typography variant="body2">
              {getTooltipText()}
            </Typography>
          </Box>
          
          {pendingOperations.length > 0 && (
            <>
              <Divider sx={{ my: 1 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Pending Operations
              </Typography>
              
              <List dense disablePadding>
                {pendingOperations.map((operation) => (
                  <ListItem key={operation.id} disablePadding sx={{ py: 0.5 }}>
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
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Button
                  size="small"
                  onClick={handleProcessQueue}
                  disabled={syncStatus === 'offline' || processing}
                  startIcon={processing ? <CircularProgress size={16} /> : <SyncIcon />}
                >
                  {processing ? 'Processing...' : 'Sync Now'}
                </Button>
                
                <Button
                  size="small"
                  onClick={handleClearQueue}
                  startIcon={<DeleteIcon />}
                  color="error"
                >
                  Clear Queue
                </Button>
              </Box>
            </>
          )}
          
          {conflicts.length > 0 && (
            <>
              <Divider sx={{ my: 1 }} />
              
              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <WarningIcon color="warning" fontSize="small" sx={{ mr: 0.5 }} />
                Resolved Conflicts ({conflicts.length})
              </Typography>
              
              <List dense disablePadding>
                {conflicts.slice(0, 3).map((conflict, index) => (
                  <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body2">
                          {formatResourceType(conflict.resourceType)}
                          {conflict.resourceId && ` (ID: ${conflict.resourceId.substring(0, 6)}...)`}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {conflict.conflictFields?.length} field(s) • 
                          {conflict.resolutionStrategy === 'client_wins' && ' Client version used'}
                          {conflict.resolutionStrategy === 'server_wins' && ' Server version used'}
                          {conflict.resolutionStrategy === 'merge' && ' Changes merged'}
                          {conflict.resolutionStrategy === 'last_write_wins' && ' Latest version used'}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
                
                {conflicts.length > 3 && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    And {conflicts.length - 3} more conflicts...
                  </Typography>
                )}
              </List>
            </>
          )}
        </Box>
      </Popover>
    </>
  );
};

export default DataSyncIndicator;