import icons from './Icons'
import React, { useEffect } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Paper,
  Box,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudOff as CloudOffIcon,
  Sync as SyncIcon
} from '@mui/icons-material';
import withDataSync from '../../hocs/withDataSync';

/**
 * A list component that is aware of data synchronization status
 * and displays appropriate UI elements for optimistic updates and offline operations
 */
const SyncAwareList = ({
  title,
  data,
  loading,
  error,
  fetchData,
  updateItem,
  deleteItem,
  syncStatus,
  pendingOperations,
  onEdit,
  renderItem,
  emptyMessage = 'No items found',
  errorMessage = 'Error loading data'
}) => {
  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Check if an item has pending operations
  const hasPendingOperation = (itemId) => {
    return pendingOperations.some(op => 
      op.data && op.data.id === itemId
    );
  };
  
  // Check if an item is optimistic (not yet confirmed by server)
  const isOptimistic = (item) => {
    return item._isOptimistic === true;
  };
  
  // Render list item
  const renderListItem = (item) => {
    const isPending = hasPendingOperation(item.id);
    const isOptimisticItem = isOptimistic(item);
    
    // If custom render function is provided, use it
    if (renderItem) {
      return renderItem(item, { isPending, isOptimisticItem });
    }
    
    // Default rendering
    return (
      <ListItem key={item.id} divider>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body1">
                {item.title || item.name || item.id}
              </Typography>
              
              {(isPending || isOptimisticItem) && (
                <Chip
                  icon={syncStatus === 'offline' ? <icons.CloudOff fontSize="small" /> : <icons.Sync fontSize="small" />}
                  label={syncStatus === 'offline' ? "Offline" : "Syncing"}
                  size="small"
                  color={syncStatus === 'offline' ? "warning" : "info"}
                  sx={{ ml: 1, height: 24 }}
                />
              )}
            </Box>
          }
          secondary={item.description || item.content || null}
        />
        
        <ListItemSecondaryAction>
          {onEdit && (
            <IconButton 
              edge="end" 
              aria-label="edit"
              onClick={() => onEdit(item)}
              disabled={loading}
            >
              <icons.Edit />
            </IconButton>
          )}
          
          <IconButton 
            edge="end" 
            aria-label="delete"
            onClick={() => deleteItem(item.id)}
            disabled={loading}
            sx={{ ml: 1 }}
          >
            <icons.Delete />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
    );
  };
  
  return (
    <Paper elevation={2} sx={{ overflow: 'hidden' }}>
      {title && (
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
          <Typography variant="h6">{title}</Typography>
        </Box>
      )}
      
      {loading && data.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error">{errorMessage}</Typography>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={fetchData}
            sx={{ mt: 2 }}
          >
            Retry
          </Button>
        </Box>
      ) : data.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">{emptyMessage}</Typography>
        </Box>
      ) : (
        <List disablePadding>
          {data.map(item => renderListItem(item))}
        </List>
      )}
      
      {loading && data.length > 0 && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0,
            display: 'flex', 
            justifyContent: 'center',
            p: 1,
            bgcolor: 'rgba(255, 255, 255, 0.8)',
            zIndex: 1
          }}
        >
          <CircularProgress size={24} />
        </Box>
      )}
    </Paper>
  );
};

// Export the component with data sync capabilities
export default withDataSync(SyncAwareList, {
  showSyncIndicator: true,
  showOfflineManager: true
});