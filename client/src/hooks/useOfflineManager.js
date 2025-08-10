import { useState, useEffect, useCallback, useRef } from 'react';
import offlineManager from '../services/OfflineManager';

/**
 * React hook for integrating with the OfflineManager service
 * Provides a unified interface for offline functionality
 */
export const useOfflineManager = (chatId, onSendMessage) => {
  const [isOnline, setIsOnline] = useState(offlineManager.isOnline);
  const [queueStats, setQueueStats] = useState(offlineManager.getQueueStats(chatId));
  const [cacheStats, setCacheStats] = useState(offlineManager.getCacheStats(chatId));
  const [cachedMessages, setCachedMessages] = useState(offlineManager.getCachedMessages(chatId));
  const [processing, setProcessing] = useState(false);
  
  const sendFunctionRef = useRef(onSendMessage);
  sendFunctionRef.current = onSendMessage;

  // Update stats when status changes
  const handleStatusChange = useCallback((status) => {
    setIsOnline(status.isOnline);
    setQueueStats(status.queueStats);
    setCacheStats(status.cacheStats);
  }, []);

  // Register/unregister sync callback
  useEffect(() => {
    if (!chatId) return;

    const callback = (status) => {
      handleStatusChange(status);
    };
    
    // Add send function to callback for queue processing
    callback.sendFunction = sendFunctionRef.current;
    
    offlineManager.registerSyncCallback(chatId, callback);
    
    // Initial stats update
    handleStatusChange({
      isOnline: offlineManager.isOnline,
      queueStats: offlineManager.getQueueStats(chatId),
      cacheStats: offlineManager.getCacheStats(chatId)
    });
    
    // Load cached messages
    setCachedMessages(offlineManager.getCachedMessages(chatId));

    return () => {
      offlineManager.unregisterSyncCallback(chatId);
    };
  }, [chatId, handleStatusChange]);

  // Send message with offline support
  const sendMessage = useCallback(async (messageData) => {
    if (!chatId || !sendFunctionRef.current) {
      throw new Error('Chat ID and send function are required');
    }

    try {
      const result = await offlineManager.sendMessage(
        chatId, 
        messageData, 
        sendFunctionRef.current
      );
      
      // Add to cache if queued
      if (result.isQueued) {
        offlineManager.addToCache(chatId, result);
        setCachedMessages(offlineManager.getCachedMessages(chatId));
      }
      
      return result;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }, [chatId]);

  // Process message queue
  const processQueue = useCallback(async () => {
    if (!chatId || !sendFunctionRef.current || processing) return;

    setProcessing(true);
    try {
      await offlineManager.processQueue(chatId, sendFunctionRef.current);
    } finally {
      setProcessing(false);
    }
  }, [chatId, processing]);

  // Retry specific message
  const retryMessage = useCallback((messageId) => {
    if (!chatId || !sendFunctionRef.current) return;
    
    offlineManager.retryMessage(chatId, messageId, sendFunctionRef.current);
  }, [chatId]);

  // Remove message from queue
  const removeFromQueue = useCallback((messageId) => {
    if (!chatId) return;
    
    offlineManager.removeFromQueue(chatId, messageId);
  }, [chatId]);

  // Clear failed messages
  const clearFailedMessages = useCallback(() => {
    if (!chatId) return;
    
    offlineManager.clearFailedMessages(chatId);
  }, [chatId]);

  // Cache messages
  const cacheMessages = useCallback((messages) => {
    if (!chatId || !messages) return;
    
    offlineManager.cacheMessages(chatId, messages);
    setCachedMessages(offlineManager.getCachedMessages(chatId));
  }, [chatId]);

  // Add message to cache
  const addToCache = useCallback((message) => {
    if (!chatId || !message) return;
    
    offlineManager.addToCache(chatId, message);
    setCachedMessages(offlineManager.getCachedMessages(chatId));
  }, [chatId]);

  // Update message in cache
  const updateInCache = useCallback((messageId, updates) => {
    if (!chatId || !messageId) return;
    
    offlineManager.updateInCache(chatId, messageId, updates);
    setCachedMessages(offlineManager.getCachedMessages(chatId));
  }, [chatId]);

  // Remove message from cache
  const removeFromCache = useCallback((messageId) => {
    if (!chatId || !messageId) return;
    
    offlineManager.removeFromCache(chatId, messageId);
    setCachedMessages(offlineManager.getCachedMessages(chatId));
  }, [chatId]);

  // Clear cache
  const clearCache = useCallback(() => {
    if (!chatId) return;
    
    offlineManager.clearCache(chatId);
    setCachedMessages([]);
  }, [chatId]);

  // Sync with server messages
  const syncWithServerMessages = useCallback((serverMessages) => {
    if (!chatId || !serverMessages) return [];
    
    const mergedMessages = offlineManager.syncWithServerMessages(chatId, serverMessages);
    setCachedMessages(offlineManager.getCachedMessages(chatId));
    return mergedMessages;
  }, [chatId]);

  // Search cached messages
  const searchCachedMessages = useCallback((query) => {
    if (!chatId) return [];
    
    return offlineManager.searchCachedMessages(chatId, query);
  }, [chatId]);

  // Get queue for current chat
  const getQueue = useCallback(() => {
    if (!chatId) return [];
    
    return offlineManager.messageQueue.get(chatId) || [];
  }, [chatId]);

  // Get merged messages (server + cached + queued)
  const getMergedMessages = useCallback((serverMessages = []) => {
    if (!chatId) return serverMessages;

    const messageMap = new Map();
    
    // Add cached messages first
    cachedMessages.forEach(msg => {
      messageMap.set(msg.id, msg);
    });
    
    // Add server messages (they override cached ones)
    serverMessages.forEach(msg => {
      messageMap.set(msg.id, msg);
    });
    
    // Add queued messages
    const queue = getQueue();
    queue.forEach(queuedMsg => {
      if (!messageMap.has(queuedMsg.id)) {
        messageMap.set(queuedMsg.id, {
          ...queuedMsg,
          timestamp: new Date(queuedMsg.queuedAt),
          isQueued: true
        });
      } else {
        // Update status for existing messages
        const existing = messageMap.get(queuedMsg.id);
        messageMap.set(queuedMsg.id, {
          ...existing,
          status: queuedMsg.status,
          error: queuedMsg.error,
          retryCount: queuedMsg.retryCount
        });
      }
    });
    
    return Array.from(messageMap.values())
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }, [chatId, cachedMessages, getQueue]);

  // Get overall offline manager stats
  const getOverallStats = useCallback(() => {
    return offlineManager.getOverallStats();
  }, []);

  return {
    // Status
    isOnline,
    processing,
    queueStats,
    cacheStats,
    
    // Messages
    cachedMessages,
    getQueue,
    getMergedMessages,
    
    // Actions
    sendMessage,
    processQueue,
    retryMessage,
    removeFromQueue,
    clearFailedMessages,
    
    // Cache management
    cacheMessages,
    addToCache,
    updateInCache,
    removeFromCache,
    clearCache,
    syncWithServerMessages,
    searchCachedMessages,
    
    // Statistics
    getOverallStats
  };
};

export default useOfflineManager;