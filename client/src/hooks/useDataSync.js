import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import useRealTimeSync from './useRealTimeSync';
import useApi from './useApi';
import useOfflineDetection from './useOfflineDetection';
import * as offlineQueue from '../utils/offlineOperationQueue';
import * as optimisticUpdates from '../utils/optimisticUpdates';
import * as conflictResolution from '../utils/conflictResolution';

/**
 * Custom hook for client-side data synchronization with optimistic updates,
 * offline operation queueing, and conflict resolution
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.resourceType - Type of resource to sync ('messages', 'reports', etc.)
 * @param {string} options.endpoint - API endpoint for the resource
 * @param {Function} options.onDataChange - Callback when data changes
 * @param {Function} options.onError - Callback when errors occur
 * @param {Function} options.filter - Optional filter function for real-time updates
 * @param {Object} options.conflictOptions - Conflict resolution options
 * @returns {Object} Data sync state and methods
 */
const useDataSync = ({
  resourceType,
  endpoint,
  onDataChange,
  onError,
  filter,
  conflictOptions = {}
}) => {
  // State
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, error, offline
  const [pendingOperations, setPendingOperations] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  
  // Refs
  const dataRef = useRef(data);
  const syncTimeoutRef = useRef(null);
  const initialLoadDoneRef = useRef(false);
  
  // Hooks
  const { isOnline, wasOffline } = useOfflineDetection();
  const { get, post, put, delete: del } = useApi();
  const { connectionStatus } = useSocket();
  
  // Set up real-time sync
  const { isEnabled: realtimeSyncEnabled } = useRealTimeSync({
    type: resourceType,
    onSync: handleRealtimeUpdate,
    filter
  });
  
  // Update ref when data changes
  useEffect(() => {
    dataRef.current = data;
  }, [data]);
  
  // Handle real-time updates from server
  function handleRealtimeUpdate(update) {
    if (!update || !update.data) return;
    
    const updatedItem = update.data;
    
    // Check for conflicts with any optimistic updates
    const pendingUpdates = optimisticUpdates.getPendingUpdatesForType(resourceType);
    const conflictingUpdate = pendingUpdates.find(pu => pu.resourceId === updatedItem.id);
    
    if (conflictingUpdate) {
      handleConflict(conflictingUpdate, updatedItem);
      return;
    }
    
    // No conflict, update the data
    updateLocalData(updatedItem);
  }
  
  // Handle conflicts between optimistic updates and server data
  async function handleConflict(clientUpdate, serverData) {
    try {
      const hasConflict = conflictResolution.detectConflict(
        clientUpdate.optimisticData,
        serverData,
        conflictOptions.detectionOptions
      );
      
      if (!hasConflict) {
        // No actual conflict, confirm the optimistic update
        optimisticUpdates.confirmOptimisticUpdate(clientUpdate.updateId, serverData);
        updateLocalData(serverData);
        return;
      }
      
      // Resolve the conflict
      const resolvedData = await conflictResolution.resolveConflict(
        clientUpdate.optimisticData,
        serverData,
        resourceType,
        conflictOptions.strategy,
        conflictOptions.resolutionOptions
      );
      
      // Track conflict metadata
      const conflictMeta = conflictResolution.getConflictMetadata(
        clientUpdate.optimisticData,
        serverData,
        resourceType,
        conflictOptions.strategy || 'auto'
      );
      
      setConflicts(prev => [...prev, conflictMeta]);
      
      // Update local data with resolved version
      updateLocalData(resolvedData);
      
      // If client version won or was merged, we need to sync back to server
      if (
        conflictOptions.strategy === conflictResolution.ConflictStrategy.CLIENT_WINS ||
        conflictOptions.strategy === conflictResolution.ConflictStrategy.MERGE ||
        conflictOptions.strategy === conflictResolution.ConflictStrategy.LAST_WRITE_WINS
      ) {
        // Only sync if we're online
        if (isOnline) {
          await put(`${endpoint}/${resolvedData.id}`, resolvedData);
        } else {
          // Queue for later if offline
          queueOperation('update', resolvedData);
        }
      }
      
      // Confirm the optimistic update with resolved data
      optimisticUpdates.confirmOptimisticUpdate(clientUpdate.updateId, resolvedData);
      
    } catch (err) {
      console.error('Error handling conflict:', err);
      setError(err);
      
      // Roll back to server version on error
      optimisticUpdates.rollbackOptimisticUpdate(clientUpdate.updateId, err);
      updateLocalData(serverData);
      
      if (onError) {
        onError(err, 'conflict_resolution');
      }
    }
  }
  
  // Update local data state
  const updateLocalData = useCallback((itemOrItems) => {
    setData(currentData => {
      let newData;
      
      // Handle single item update
      if (!Array.isArray(itemOrItems)) {
        const item = itemOrItems;
        
        // Find if item already exists in data
        const existingIndex = currentData.findIndex(d => d.id === item.id);
        
        if (existingIndex >= 0) {
          // Update existing item
          newData = [
            ...currentData.slice(0, existingIndex),
            item,
            ...currentData.slice(existingIndex + 1)
          ];
        } else {
          // Add new item
          newData = [...currentData, item];
        }
      } 
      // Handle array of items
      else {
        // Replace entire data set
        newData = itemOrItems;
      }
      
      // Notify about data change
      if (onDataChange) {
        onDataChange(newData);
      }
      
      return newData;
    });
  }, [onDataChange]);
  
  // Remove item from local data
  const removeLocalData = useCallback((itemId) => {
    setData(currentData => {
      const newData = currentData.filter(item => item.id !== itemId);
      
      // Notify about data change
      if (onDataChange) {
        onDataChange(newData);
      }
      
      return newData;
    });
  }, [onDataChange]);
  
  // Fetch data from server
  const fetchData = useCallback(async () => {
    if (!endpoint) return;
    
    try {
      setLoading(true);
      setSyncStatus('syncing');
      
      const response = await get(endpoint);
      
      // Apply any pending optimistic updates to the fetched data
      const dataWithOptimisticUpdates = optimisticUpdates.applyOptimisticUpdatesToCollection(
        resourceType,
        response
      );
      
      updateLocalData(dataWithOptimisticUpdates);
      initialLoadDoneRef.current = true;
      setSyncStatus('idle');
      
      return dataWithOptimisticUpdates;
    } catch (err) {
      console.error(`Error fetching ${resourceType}:`, err);
      setError(err);
      setSyncStatus('error');
      
      if (onError) {
        onError(err, 'fetch');
      }
      
      return [];
    } finally {
      setLoading(false);
    }
  }, [endpoint, get, resourceType, onError, updateLocalData]);
  
  // Create item with optimistic update
  const createItem = useCallback(async (itemData) => {
    // Generate temporary ID for optimistic update
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const optimisticItem = {
      ...itemData,
      id: tempId,
      _isOptimistic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Register optimistic update
    const updateId = optimisticUpdates.registerOptimisticUpdate(
      resourceType,
      tempId,
      null, // No original data for new items
      optimisticItem
    );
    
    // Update local data immediately
    updateLocalData(optimisticItem);
    
    try {
      let serverItem;
      
      if (isOnline) {
        // Send to server if online
        serverItem = await post(endpoint, itemData);
        
        // Confirm optimistic update with server data
        optimisticUpdates.confirmOptimisticUpdate(updateId, serverItem);
        
        // Update local data with server response
        updateLocalData(serverItem);
      } else {
        // Queue operation for when we're back online
        queueOperation('create', itemData, { optimisticId: tempId, updateId });
      }
      
      return serverItem || optimisticItem;
    } catch (err) {
      console.error(`Error creating ${resourceType}:`, err);
      setError(err);
      
      // Roll back optimistic update
      optimisticUpdates.rollbackOptimisticUpdate(updateId, err);
      removeLocalData(tempId);
      
      if (onError) {
        onError(err, 'create');
      }
      
      throw err;
    }
  }, [endpoint, post, resourceType, isOnline, updateLocalData, removeLocalData, onError]);
  
  // Update item with optimistic update
  const updateItem = useCallback(async (itemId, updates) => {
    // Find current item data
    const currentItem = dataRef.current.find(item => item.id === itemId);
    
    if (!currentItem) {
      const error = new Error(`Item with ID ${itemId} not found`);
      setError(error);
      
      if (onError) {
        onError(error, 'update');
      }
      
      throw error;
    }
    
    // Create optimistic version
    const optimisticItem = {
      ...currentItem,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    // Register optimistic update
    const updateId = optimisticUpdates.registerOptimisticUpdate(
      resourceType,
      itemId,
      currentItem,
      optimisticItem
    );
    
    // Update local data immediately
    updateLocalData(optimisticItem);
    
    try {
      let serverItem;
      
      if (isOnline) {
        // Send to server if online
        serverItem = await put(`${endpoint}/${itemId}`, optimisticItem);
        
        // Check for conflicts
        const hasConflict = conflictResolution.detectConflict(
          optimisticItem,
          serverItem,
          conflictOptions.detectionOptions
        );
        
        if (hasConflict) {
          // Handle conflict
          const resolvedData = await conflictResolution.resolveConflict(
            optimisticItem,
            serverItem,
            resourceType,
            conflictOptions.strategy,
            conflictOptions.resolutionOptions
          );
          
          // Track conflict metadata
          const conflictMeta = conflictResolution.getConflictMetadata(
            optimisticItem,
            serverItem,
            resourceType,
            conflictOptions.strategy || 'auto'
          );
          
          setConflicts(prev => [...prev, conflictMeta]);
          
          // Update with resolved data
          serverItem = resolvedData;
          
          // If client version won or was merged, we need to sync back to server
          if (
            conflictOptions.strategy === conflictResolution.ConflictStrategy.CLIENT_WINS ||
            conflictOptions.strategy === conflictResolution.ConflictStrategy.MERGE ||
            conflictOptions.strategy === conflictResolution.ConflictStrategy.LAST_WRITE_WINS
          ) {
            await put(`${endpoint}/${itemId}`, resolvedData);
          }
        }
        
        // Confirm optimistic update with server data
        optimisticUpdates.confirmOptimisticUpdate(updateId, serverItem);
        
        // Update local data with server response
        updateLocalData(serverItem);
      } else {
        // Queue operation for when we're back online
        queueOperation('update', optimisticItem, { updateId });
      }
      
      return serverItem || optimisticItem;
    } catch (err) {
      console.error(`Error updating ${resourceType}:`, err);
      setError(err);
      
      // Roll back optimistic update
      optimisticUpdates.rollbackOptimisticUpdate(updateId, err);
      updateLocalData(currentItem);
      
      if (onError) {
        onError(err, 'update');
      }
      
      throw err;
    }
  }, [
    endpoint, 
    put, 
    resourceType, 
    isOnline, 
    updateLocalData, 
    onError, 
    conflictOptions
  ]);
  
  // Delete item with optimistic update
  const deleteItem = useCallback(async (itemId) => {
    // Find current item data
    const currentItem = dataRef.current.find(item => item.id === itemId);
    
    if (!currentItem) {
      const error = new Error(`Item with ID ${itemId} not found`);
      setError(error);
      
      if (onError) {
        onError(error, 'delete');
      }
      
      throw error;
    }
    
    // Register optimistic update (deletion)
    const updateId = optimisticUpdates.registerOptimisticUpdate(
      resourceType,
      itemId,
      currentItem,
      { ...currentItem, _deleted: true }
    );
    
    // Remove from local data immediately
    removeLocalData(itemId);
    
    try {
      if (isOnline) {
        // Send to server if online
        await del(`${endpoint}/${itemId}`);
        
        // Confirm optimistic update
        optimisticUpdates.confirmOptimisticUpdate(updateId, { id: itemId, _deleted: true });
      } else {
        // Queue operation for when we're back online
        queueOperation('delete', { id: itemId }, { updateId });
      }
      
      return true;
    } catch (err) {
      console.error(`Error deleting ${resourceType}:`, err);
      setError(err);
      
      // Roll back optimistic update
      optimisticUpdates.rollbackOptimisticUpdate(updateId, err);
      updateLocalData(currentItem);
      
      if (onError) {
        onError(err, 'delete');
      }
      
      throw err;
    }
  }, [endpoint, del, resourceType, isOnline, removeLocalData, updateLocalData, onError]);
  
  // Queue an operation for when we're back online
  const queueOperation = useCallback((type, data, metadata = {}) => {
    const operation = {
      type,
      resource: resourceType,
      endpoint: type === 'create' ? endpoint : `${endpoint}/${data.id}`,
      method: type === 'create' ? 'POST' : type === 'update' ? 'PUT' : 'DELETE',
      data,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString()
      }
    };
    
    const operationId = offlineQueue.addToQueue(operation);
    
    // Update pending operations state
    setPendingOperations(prev => [...prev, { ...operation, id: operationId }]);
    
    return operationId;
  }, [resourceType, endpoint]);
  
  // Process the offline operation queue
  const processQueue = useCallback(async () => {
    if (!isOnline) return;
    
    const processOperation = async (operation) => {
      const { type, endpoint, method, data, metadata } = operation;
      
      switch (method) {
        case 'POST':
          const createdItem = await post(endpoint, data);
          
          // If this was an optimistic update, confirm it
          if (metadata.updateId) {
            optimisticUpdates.confirmOptimisticUpdate(metadata.updateId, createdItem);
            
            // If we had a temporary ID, update it with the real one
            if (metadata.optimisticId) {
              removeLocalData(metadata.optimisticId);
              updateLocalData(createdItem);
            }
          }
          return createdItem;
          
        case 'PUT':
          const updatedItem = await put(endpoint, data);
          
          // If this was an optimistic update, confirm it
          if (metadata.updateId) {
            optimisticUpdates.confirmOptimisticUpdate(metadata.updateId, updatedItem);
            updateLocalData(updatedItem);
          }
          return updatedItem;
          
        case 'DELETE':
          await del(endpoint);
          
          // If this was an optimistic update, confirm it
          if (metadata.updateId) {
            optimisticUpdates.confirmOptimisticUpdate(metadata.updateId, { id: data.id, _deleted: true });
          }
          return true;
          
        default:
          throw new Error(`Unknown method: ${method}`);
      }
    };
    
    const results = await offlineQueue.processQueue(processOperation, {
      removeOnSuccess: true,
      stopOnError: false,
      maxAttempts: 3
    });
    
    // Update pending operations state
    if (results.successful > 0) {
      setPendingOperations(offlineQueue.getQueue());
    }
    
    return results;
  }, [isOnline, post, put, del, updateLocalData, removeLocalData]);
  
  // Initial data fetch
  useEffect(() => {
    if (!initialLoadDoneRef.current) {
      fetchData();
    }
  }, [fetchData]);
  
  // Process queue when coming back online
  useEffect(() => {
    if (isOnline && wasOffline && offlineQueue.getQueueLength() > 0) {
      // Process queue with a small delay to ensure connection is stable
      syncTimeoutRef.current = setTimeout(() => {
        processQueue().catch(err => {
          console.error('Error processing offline queue:', err);
          if (onError) {
            onError(err, 'queue_processing');
          }
        });
      }, 1000);
    }
    
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [isOnline, wasOffline, processQueue, onError]);
  
  // Update sync status based on connection status
  useEffect(() => {
    if (!isOnline) {
      setSyncStatus('offline');
    } else if (connectionStatus === 'error') {
      setSyncStatus('error');
    } else if (connectionStatus === 'reconnecting') {
      setSyncStatus('syncing');
    } else if (connectionStatus === 'connected' && syncStatus === 'offline') {
      setSyncStatus('idle');
    }
  }, [isOnline, connectionStatus, syncStatus]);
  
  // Expose the hook API
  return {
    data,
    loading,
    error,
    syncStatus,
    pendingOperations,
    conflicts,
    isOnline,
    realtimeSyncEnabled,
    
    // Data operations
    fetchData,
    createItem,
    updateItem,
    deleteItem,
    
    // Queue management
    processQueue,
    queueLength: pendingOperations.length,
    
    // Utilities
    clearError: () => setError(null),
    clearConflicts: () => setConflicts([])
  };
};

export default useDataSync;