import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';

/**
 * Custom hook for real-time data synchronization
 * @param {Object} options - Configuration options
 * @param {string} options.type - Type of data to sync ('messages', 'reports', 'notices', 'chatGroups', 'privateChats')
 * @param {Function} options.onSync - Callback function when data is synced
 * @param {Function} options.filter - Optional filter function to filter sync events
 * @returns {Object} Sync state and controls
 */
const useRealTimeSync = ({ type, onSync, filter }) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [lastSync, setLastSync] = useState(null);
  const [syncCount, setSyncCount] = useState(0);
  const { addMessageListener, addReportListener, addNoticeListener, addChatGroupListener, addPrivateChatListener } = useSocket();

  // Handle sync events
  const handleSync = useCallback((data) => {
    // Apply filter if provided
    if (filter && !filter(data)) {
      return;
    }
    
    // Update sync state
    setLastSync({
      timestamp: new Date(),
      type: data.type,
      data
    });
    
    setSyncCount(prev => prev + 1);
    
    // Call onSync callback
    if (onSync) {
      onSync(data);
    }
  }, [filter, onSync]);

  // Set up listener based on type
  useEffect(() => {
    if (!isEnabled) return;
    
    let removeListener;
    
    switch (type) {
      case 'messages':
        removeListener = addMessageListener(handleSync);
        break;
      case 'reports':
        removeListener = addReportListener(handleSync);
        break;
      case 'notices':
        removeListener = addNoticeListener(handleSync);
        break;
      case 'chatGroups':
        removeListener = addChatGroupListener(handleSync);
        break;
      case 'privateChats':
        removeListener = addPrivateChatListener(handleSync);
        break;
      default:
        console.error(`Unknown sync type: ${type}`);
        return;
    }
    
    return () => {
      if (removeListener) {
        removeListener();
      }
    };
  }, [
    type, 
    isEnabled, 
    handleSync, 
    addMessageListener, 
    addReportListener, 
    addNoticeListener, 
    addChatGroupListener, 
    addPrivateChatListener
  ]);

  // Toggle sync on/off
  const toggleSync = useCallback(() => {
    setIsEnabled(prev => !prev);
  }, []);

  // Reset sync count
  const resetSyncCount = useCallback(() => {
    setSyncCount(0);
  }, []);

  return {
    isEnabled,
    lastSync,
    syncCount,
    toggleSync,
    resetSyncCount
  };
};

export default useRealTimeSync;