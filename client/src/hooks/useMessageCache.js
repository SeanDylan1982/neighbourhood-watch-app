import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for message caching and pagination
 * Manages message cache with LRU eviction and pagination support
 */
export const useMessageCache = ({
  chatId,
  pageSize = 50,
  maxCacheSize = 500,
  onLoadMessages = null
}) => {
  const [cache, setCache] = useState(new Map());
  const [loadingPages, setLoadingPages] = useState(new Set());
  const [hasMoreBefore, setHasMoreBefore] = useState(true);
  const [hasMoreAfter, setHasMoreAfter] = useState(true);
  const accessOrder = useRef(new Map()); // Track access order for LRU

  // Get cache key for a page
  const getPageKey = useCallback((pageIndex) => {
    return `${chatId}:${pageIndex}`;
  }, [chatId]);

  // Update access order for LRU
  const updateAccessOrder = useCallback((key) => {
    accessOrder.current.delete(key);
    accessOrder.current.set(key, Date.now());
  }, []);

  // Evict least recently used pages if cache is full
  const evictLRU = useCallback(() => {
    if (cache.size >= maxCacheSize) {
      const oldestKey = accessOrder.current.keys().next().value;
      if (oldestKey) {
        setCache(prev => {
          const newCache = new Map(prev);
          newCache.delete(oldestKey);
          return newCache;
        });
        accessOrder.current.delete(oldestKey);
      }
    }
  }, [cache.size, maxCacheSize]);

  // Get messages for a specific page
  const getPage = useCallback((pageIndex) => {
    const key = getPageKey(pageIndex);
    const page = cache.get(key);
    
    if (page) {
      updateAccessOrder(key);
      return page;
    }
    
    return null;
  }, [cache, getPageKey, updateAccessOrder]);

  // Load a page of messages
  const loadPage = useCallback(async (pageIndex, direction = 'before') => {
    const key = getPageKey(pageIndex);
    
    if (cache.has(key) || loadingPages.has(key)) {
      return getPage(pageIndex);
    }

    if (!onLoadMessages) {
      return null;
    }

    setLoadingPages(prev => new Set(prev).add(key));

    try {
      const result = await onLoadMessages({
        pageIndex,
        pageSize,
        direction,
        chatId
      });

      const { messages, hasMore } = result;

      // Update cache
      evictLRU();
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.set(key, {
          messages,
          pageIndex,
          loadedAt: Date.now(),
          hasMore
        });
        return newCache;
      });

      updateAccessOrder(key);

      // Update pagination flags
      if (direction === 'before') {
        setHasMoreBefore(hasMore);
      } else {
        setHasMoreAfter(hasMore);
      }

      return { messages, hasMore };

    } catch (error) {
      console.error('Failed to load page:', error);
      return null;
    } finally {
      setLoadingPages(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  }, [cache, loadingPages, getPageKey, onLoadMessages, pageSize, chatId, evictLRU, updateAccessOrder]);

  // Get messages in a range
  const getMessagesInRange = useCallback((startPage, endPage) => {
    const messages = [];
    
    for (let pageIndex = startPage; pageIndex <= endPage; pageIndex++) {
      const page = getPage(pageIndex);
      if (page) {
        messages.push(...page.messages);
      }
    }
    
    return messages;
  }, [getPage]);

  // Preload adjacent pages
  const preloadAdjacentPages = useCallback((currentPage) => {
    const pagesToPreload = [currentPage - 1, currentPage + 1];
    
    pagesToPreload.forEach(pageIndex => {
      if (pageIndex >= 0 && !cache.has(getPageKey(pageIndex))) {
        loadPage(pageIndex);
      }
    });
  }, [cache, getPageKey, loadPage]);

  // Clear cache for chat
  const clearCache = useCallback(() => {
    setCache(new Map());
    accessOrder.current.clear();
    setLoadingPages(new Set());
    setHasMoreBefore(true);
    setHasMoreAfter(true);
  }, []);

  // Add new message to cache
  const addMessage = useCallback((message) => {
    // Add to the most recent page (page 0)
    const key = getPageKey(0);
    setCache(prev => {
      const newCache = new Map(prev);
      const page = newCache.get(key);
      
      if (page) {
        const updatedPage = {
          ...page,
          messages: [message, ...page.messages].slice(0, pageSize)
        };
        newCache.set(key, updatedPage);
      } else {
        newCache.set(key, {
          messages: [message],
          pageIndex: 0,
          loadedAt: Date.now(),
          hasMore: true
        });
      }
      
      return newCache;
    });
    
    updateAccessOrder(key);
  }, [getPageKey, pageSize, updateAccessOrder]);

  // Update message in cache
  const updateMessage = useCallback((messageId, updates) => {
    setCache(prev => {
      const newCache = new Map(prev);
      let updated = false;
      
      for (const [key, page] of newCache.entries()) {
        const messageIndex = page.messages.findIndex(m => m.id === messageId);
        if (messageIndex !== -1) {
          const updatedMessages = [...page.messages];
          updatedMessages[messageIndex] = { ...updatedMessages[messageIndex], ...updates };
          
          newCache.set(key, {
            ...page,
            messages: updatedMessages
          });
          updated = true;
          break;
        }
      }
      
      return updated ? newCache : prev;
    });
  }, []);

  // Remove message from cache
  const removeMessage = useCallback((messageId) => {
    setCache(prev => {
      const newCache = new Map(prev);
      let updated = false;
      
      for (const [key, page] of newCache.entries()) {
        const filteredMessages = page.messages.filter(m => m.id !== messageId);
        if (filteredMessages.length !== page.messages.length) {
          newCache.set(key, {
            ...page,
            messages: filteredMessages
          });
          updated = true;
        }
      }
      
      return updated ? newCache : prev;
    });
  }, []);

  // Clear cache when chatId changes
  useEffect(() => {
    clearCache();
  }, [chatId, clearCache]);

  return {
    loadPage,
    getPage,
    getMessagesInRange,
    preloadAdjacentPages,
    clearCache,
    addMessage,
    updateMessage,
    removeMessage,
    hasMoreBefore,
    hasMoreAfter,
    isLoading: loadingPages.size > 0,
    cacheSize: cache.size
  };
};

export default useMessageCache;