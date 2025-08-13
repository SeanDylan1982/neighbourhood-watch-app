import { useState, useCallback, useEffect } from 'react';
import ChatCacheService from '../services/ChatCacheService';
import useApi from './useApi';
import { useToast } from '../components/Common/Toast';

/**
 * Custom hook for managing chat data caching
 * Handles preloading, caching, and retrieving chat data from localStorage
 */
const useChatCache = () => {
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [cacheStats, setCacheStats] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const { get } = useApi();
  const { showToast } = useToast();

  // Initialize cache on mount
  useEffect(() => {
    const initializeCache = () => {
      try {
        if (!ChatCacheService.isCacheValid()) {
          console.log('🔄 Initializing new chat cache...');
          ChatCacheService.initializeCache();
        } else {
          console.log('✅ Using existing valid cache');
        }
        
        const stats = ChatCacheService.getCacheStats();
        setCacheStats(stats);
        setIsInitialized(true);
        
        console.log('📊 Cache stats:', stats);
      } catch (error) {
        console.error('Failed to initialize cache:', error);
        setIsInitialized(true); // Still mark as initialized to prevent blocking
      }
    };

    initializeCache();
  }, []);

  /**
   * Preload all chat data and store in cache
   */
  const preloadChatData = useCallback(async (options = {}) => {
    const { showProgress = true, showToasts = true } = options;
    
    if (isPreloading) {
      console.log('Preload already in progress, skipping...');
      return { success: false, message: 'Preload already in progress' };
    }

    setIsPreloading(true);
    setPreloadProgress(0);

    try {
      if (showToasts) {
        showToast('Loading chat data...', 'info', 3000);
      }

      // Create API service wrapper for the cache service
      const apiService = { get };
      
      if (showProgress) setPreloadProgress(25);

      const result = await ChatCacheService.preloadAllChatData(apiService);
      
      if (showProgress) setPreloadProgress(75);

      // Update cache stats
      const stats = ChatCacheService.getCacheStats();
      setCacheStats(stats);
      
      if (showProgress) setPreloadProgress(100);

      if (result.success) {
        if (showToasts) {
          showToast(
            `Chat data loaded: ${result.chatGroupsLoaded} groups, ${result.messagesLoaded} message sets`,
            'success',
            4000
          );
        }
        
        console.log('✅ Chat preload successful:', result);
      } else {
        if (showToasts) {
          showToast('Failed to load some chat data', 'warning', 4000);
        }
        
        console.warn('⚠️ Chat preload partially failed:', result);
      }

      return result;

    } catch (error) {
      console.error('❌ Chat preload error:', error);
      
      if (showToasts) {
        showToast('Failed to load chat data', 'error', 4000);
      }

      return {
        success: false,
        error: error.message,
        chatGroupsLoaded: 0,
        messagesLoaded: 0
      };
    } finally {
      setIsPreloading(false);
      setPreloadProgress(0);
    }
  }, [isPreloading, get, showToast]);

  /**
   * Get cached chat groups
   */
  const getCachedChatGroups = useCallback(() => {
    try {
      return ChatCacheService.getChatGroups();
    } catch (error) {
      console.error('Error getting cached chat groups:', error);
      return null;
    }
  }, []);

  /**
   * Get cached messages for a specific chat
   */
  const getCachedMessages = useCallback((chatId) => {
    try {
      if (!chatId) return null;
      return ChatCacheService.getChatMessages(chatId);
    } catch (error) {
      console.error('Error getting cached messages:', error);
      return null;
    }
  }, []);

  /**
   * Add a new message to cache (for real-time updates)
   */
  const addMessageToCache = useCallback((chatId, message) => {
    try {
      const success = ChatCacheService.addMessageToCache(chatId, message);
      if (success) {
        // Update cache stats
        const stats = ChatCacheService.getCacheStats();
        setCacheStats(stats);
      }
      return success;
    } catch (error) {
      console.error('Error adding message to cache:', error);
      return false;
    }
  }, []);

  /**
   * Update cached chat groups
   */
  const updateCachedChatGroups = useCallback((chatGroups) => {
    try {
      const success = ChatCacheService.storeChatGroups(chatGroups);
      if (success) {
        const stats = ChatCacheService.getCacheStats();
        setCacheStats(stats);
      }
      return success;
    } catch (error) {
      console.error('Error updating cached chat groups:', error);
      return false;
    }
  }, []);

  /**
   * Update cached messages for a chat
   */
  const updateCachedMessages = useCallback((chatId, messages) => {
    try {
      const success = ChatCacheService.storeChatMessages(chatId, messages);
      if (success) {
        const stats = ChatCacheService.getCacheStats();
        setCacheStats(stats);
      }
      return success;
    } catch (error) {
      console.error('Error updating cached messages:', error);
      return false;
    }
  }, []);

  /**
   * Clear all cache
   */
  const clearCache = useCallback(() => {
    try {
      const success = ChatCacheService.clearCache();
      if (success) {
        setCacheStats(null);
        ChatCacheService.initializeCache();
        const stats = ChatCacheService.getCacheStats();
        setCacheStats(stats);
      }
      return success;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }, []);

  /**
   * Check if cache has data for a specific chat
   */
  const hasCachedMessages = useCallback((chatId) => {
    try {
      const messages = ChatCacheService.getChatMessages(chatId);
      return messages && messages.length > 0;
    } catch (error) {
      console.error('Error checking cached messages:', error);
      return false;
    }
  }, []);

  /**
   * Get debug information about the cache
   */
  const getDebugInfo = useCallback(() => {
    try {
      return ChatCacheService.getDebugInfo();
    } catch (error) {
      console.error('Error getting debug info:', error);
      return null;
    }
  }, []);

  return {
    // State
    isPreloading,
    preloadProgress,
    cacheStats,
    isInitialized,
    
    // Actions
    preloadChatData,
    getCachedChatGroups,
    getCachedMessages,
    addMessageToCache,
    updateCachedChatGroups,
    updateCachedMessages,
    clearCache,
    
    // Utilities
    hasCachedMessages,
    getDebugInfo,
    
    // Cache validity
    isCacheValid: ChatCacheService.isCacheValid()
  };
};

export default useChatCache;