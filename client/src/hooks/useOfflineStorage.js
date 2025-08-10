import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for offline message storage and caching
 * Provides cached message viewing capabilities when offline
 */
export const useOfflineStorage = ({
  chatId,
  maxStorageSize = 1000, // Maximum number of messages to store per chat
  storageKey = 'offlineMessages'
}) => {
  const [cachedMessages, setCachedMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get storage key for specific chat
  const getChatStorageKey = useCallback((id) => {
    return `${storageKey}_${id}`;
  }, [storageKey]);

  // Load cached messages from localStorage
  const loadCachedMessages = useCallback(async () => {
    if (!chatId) return;

    setIsLoading(true);
    try {
      const key = getChatStorageKey(chatId);
      const cached = localStorage.getItem(key);
      
      if (cached) {
        const parsedMessages = JSON.parse(cached);
        setCachedMessages(parsedMessages);
      } else {
        setCachedMessages([]);
      }
    } catch (error) {
      console.error('Failed to load cached messages:', error);
      setCachedMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [chatId, getChatStorageKey]);

  // Save messages to localStorage
  const saveCachedMessages = useCallback((messages) => {
    if (!chatId || !messages.length) return;

    try {
      const key = getChatStorageKey(chatId);
      
      // Limit the number of stored messages
      const messagesToStore = messages.slice(-maxStorageSize);
      
      localStorage.setItem(key, JSON.stringify(messagesToStore));
      setCachedMessages(messagesToStore);
    } catch (error) {
      console.error('Failed to save cached messages:', error);
      
      // If storage is full, try to clear some space
      if (error.name === 'QuotaExceededError') {
        clearOldCaches();
        // Try again with fewer messages
        try {
          const reducedMessages = messages.slice(-Math.floor(maxStorageSize / 2));
          localStorage.setItem(getChatStorageKey(chatId), JSON.stringify(reducedMessages));
          setCachedMessages(reducedMessages);
        } catch (retryError) {
          console.error('Failed to save reduced message cache:', retryError);
        }
      }
    }
  }, [chatId, getChatStorageKey, maxStorageSize]);

  // Add new message to cache
  const addToCache = useCallback((message) => {
    setCachedMessages(prev => {
      const updated = [...prev, message];
      
      // Save to localStorage
      if (chatId) {
        const key = getChatStorageKey(chatId);
        const messagesToStore = updated.slice(-maxStorageSize);
        try {
          localStorage.setItem(key, JSON.stringify(messagesToStore));
        } catch (error) {
          console.error('Failed to update message cache:', error);
        }
        return messagesToStore;
      }
      
      return updated;
    });
  }, [chatId, getChatStorageKey, maxStorageSize]);

  // Update message in cache
  const updateInCache = useCallback((messageId, updates) => {
    setCachedMessages(prev => {
      const updated = prev.map(msg => 
        msg.id === messageId ? { ...msg, ...updates } : msg
      );
      
      // Save to localStorage
      if (chatId) {
        const key = getChatStorageKey(chatId);
        try {
          localStorage.setItem(key, JSON.stringify(updated));
        } catch (error) {
          console.error('Failed to update message in cache:', error);
        }
      }
      
      return updated;
    });
  }, [chatId, getChatStorageKey]);

  // Remove message from cache
  const removeFromCache = useCallback((messageId) => {
    setCachedMessages(prev => {
      const updated = prev.filter(msg => msg.id !== messageId);
      
      // Save to localStorage
      if (chatId) {
        const key = getChatStorageKey(chatId);
        try {
          localStorage.setItem(key, JSON.stringify(updated));
        } catch (error) {
          console.error('Failed to remove message from cache:', error);
        }
      }
      
      return updated;
    });
  }, [chatId, getChatStorageKey]);

  // Clear cache for current chat
  const clearCache = useCallback(() => {
    if (!chatId) return;

    const key = getChatStorageKey(chatId);
    localStorage.removeItem(key);
    setCachedMessages([]);
  }, [chatId, getChatStorageKey]);

  // Clear old caches to free up space
  const clearOldCaches = useCallback(() => {
    try {
      const keysToRemove = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(storageKey)) {
          keysToRemove.push(key);
        }
      }
      
      // Remove oldest caches (simple approach - remove half)
      const toRemove = keysToRemove.slice(0, Math.floor(keysToRemove.length / 2));
      toRemove.forEach(key => localStorage.removeItem(key));
      
    } catch (error) {
      console.error('Failed to clear old caches:', error);
    }
  }, [storageKey]);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    let totalCaches = 0;
    let totalMessages = 0;
    let totalSize = 0;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(storageKey)) {
          totalCaches++;
          const data = localStorage.getItem(key);
          if (data) {
            totalSize += data.length;
            try {
              const messages = JSON.parse(data);
              totalMessages += messages.length;
            } catch (e) {
              // Invalid JSON, skip
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to get cache stats:', error);
    }

    return {
      totalCaches,
      totalMessages,
      totalSize,
      currentChatMessages: cachedMessages.length
    };
  }, [storageKey, cachedMessages.length]);

  // Search cached messages
  const searchCachedMessages = useCallback((query) => {
    if (!query.trim()) return cachedMessages;

    const searchTerm = query.toLowerCase();
    return cachedMessages.filter(message => 
      message.content?.toLowerCase().includes(searchTerm) ||
      message.senderName?.toLowerCase().includes(searchTerm)
    );
  }, [cachedMessages]);

  // Get messages by date range
  const getMessagesByDateRange = useCallback((startDate, endDate) => {
    return cachedMessages.filter(message => {
      const messageDate = new Date(message.timestamp);
      return messageDate >= startDate && messageDate <= endDate;
    });
  }, [cachedMessages]);

  // Sync with server messages when online
  const syncWithServerMessages = useCallback((serverMessages) => {
    if (!serverMessages || !Array.isArray(serverMessages)) return;

    // Merge server messages with cached messages
    const messageMap = new Map();
    
    // Add cached messages first
    cachedMessages.forEach(msg => {
      messageMap.set(msg.id, msg);
    });
    
    // Override with server messages (they are authoritative)
    serverMessages.forEach(msg => {
      messageMap.set(msg.id, msg);
    });
    
    const mergedMessages = Array.from(messageMap.values())
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    saveCachedMessages(mergedMessages);
  }, [cachedMessages, saveCachedMessages]);

  // Load cached messages when chatId changes
  useEffect(() => {
    loadCachedMessages();
  }, [loadCachedMessages]);

  return {
    cachedMessages,
    isLoading,
    addToCache,
    updateInCache,
    removeFromCache,
    clearCache,
    clearOldCaches,
    getCacheStats,
    searchCachedMessages,
    getMessagesByDateRange,
    syncWithServerMessages,
    saveCachedMessages
  };
};

export default useOfflineStorage;