/**
 * Comprehensive offline management service
 * Coordinates message queuing, caching, and synchronization
 */
class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.messageQueue = new Map(); // chatId -> queue
    this.messageCache = new Map(); // chatId -> cached messages
    this.syncCallbacks = new Map(); // chatId -> callback functions
    this.retryTimeouts = new Map(); // messageId -> timeout
    
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.maxQueueSize = 100;
    this.maxCacheSize = 1000;
    
    this.setupEventListeners();
    this.loadFromStorage();
  }

  /**
   * Set up online/offline event listeners
   */
  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processAllQueues();
      this.notifyStatusChange();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyStatusChange();
    });

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.processAllQueues();
      }
    });
  }

  /**
   * Load queued messages and cached data from localStorage
   */
  loadFromStorage() {
    try {
      // Load message queues
      const savedQueues = localStorage.getItem('offlineMessageQueues');
      if (savedQueues) {
        const queues = JSON.parse(savedQueues);
        Object.entries(queues).forEach(([chatId, queue]) => {
          this.messageQueue.set(chatId, queue);
        });
      }

      // Load message caches
      const savedCaches = localStorage.getItem('offlineMessageCaches');
      if (savedCaches) {
        const caches = JSON.parse(savedCaches);
        Object.entries(caches).forEach(([chatId, cache]) => {
          this.messageCache.set(chatId, cache);
        });
      }
    } catch (error) {
      console.error('Failed to load offline data from storage:', error);
      this.clearStorage();
    }
  }

  /**
   * Save queued messages and cached data to localStorage
   */
  saveToStorage() {
    try {
      // Save message queues
      const queues = Object.fromEntries(this.messageQueue);
      localStorage.setItem('offlineMessageQueues', JSON.stringify(queues));

      // Save message caches
      const caches = Object.fromEntries(this.messageCache);
      localStorage.setItem('offlineMessageCaches', JSON.stringify(caches));
    } catch (error) {
      console.error('Failed to save offline data to storage:', error);
      
      // If storage is full, try to clear some space
      if (error.name === 'QuotaExceededError') {
        this.clearOldData();
        // Try again with reduced data
        try {
          this.saveToStorage();
        } catch (retryError) {
          console.error('Failed to save offline data after cleanup:', retryError);
        }
      }
    }
  }

  /**
   * Clear old cached data to free up storage space
   */
  clearOldData() {
    // Keep only the most recent messages in cache
    this.messageCache.forEach((cache, chatId) => {
      if (cache.length > this.maxCacheSize / 2) {
        const reduced = cache.slice(-Math.floor(this.maxCacheSize / 2));
        this.messageCache.set(chatId, reduced);
      }
    });

    // Remove failed messages older than 24 hours
    this.messageQueue.forEach((queue, chatId) => {
      const filtered = queue.filter(msg => {
        if (msg.status === 'failed') {
          const failedAt = new Date(msg.failedAt || msg.queuedAt);
          const hoursSinceFailed = (Date.now() - failedAt.getTime()) / (1000 * 60 * 60);
          return hoursSinceFailed < 24;
        }
        return true;
      });
      this.messageQueue.set(chatId, filtered);
    });
  }

  /**
   * Clear all storage
   */
  clearStorage() {
    localStorage.removeItem('offlineMessageQueues');
    localStorage.removeItem('offlineMessageCaches');
    this.messageQueue.clear();
    this.messageCache.clear();
  }

  /**
   * Register a sync callback for a chat
   */
  registerSyncCallback(chatId, callback) {
    this.syncCallbacks.set(chatId, callback);
  }

  /**
   * Unregister sync callback for a chat
   */
  unregisterSyncCallback(chatId) {
    this.syncCallbacks.delete(chatId);
  }

  /**
   * Notify all registered callbacks about status changes
   */
  notifyStatusChange() {
    this.syncCallbacks.forEach((callback, chatId) => {
      callback({
        isOnline: this.isOnline,
        queueStats: this.getQueueStats(chatId),
        cacheStats: this.getCacheStats(chatId)
      });
    });
  }

  /**
   * Queue a message for sending when online
   */
  queueMessage(chatId, messageData) {
    if (!this.messageQueue.has(chatId)) {
      this.messageQueue.set(chatId, []);
    }

    const queue = this.messageQueue.get(chatId);
    
    if (queue.length >= this.maxQueueSize) {
      throw new Error('Message queue is full');
    }

    const queuedMessage = {
      id: this.generateTempId(),
      ...messageData,
      queuedAt: new Date().toISOString(),
      retryCount: 0,
      status: 'queued'
    };

    queue.push(queuedMessage);
    this.saveToStorage();
    
    return queuedMessage;
  }

  /**
   * Send a message (queue if offline, send immediately if online)
   */
  async sendMessage(chatId, messageData, sendFunction) {
    if (this.isOnline) {
      try {
        return await sendFunction(messageData);
      } catch (error) {
        // If sending fails while online, queue the message
        const queuedMessage = this.queueMessage(chatId, messageData);
        throw new Error(`Message queued due to send failure: ${error.message}`);
      }
    } else {
      // Queue message for later sending
      const queuedMessage = this.queueMessage(chatId, messageData);
      return {
        ...queuedMessage,
        isQueued: true
      };
    }
  }

  /**
   * Process message queue for a specific chat
   */
  async processQueue(chatId, sendFunction) {
    if (!this.isOnline || !this.messageQueue.has(chatId)) {
      return;
    }

    const queue = this.messageQueue.get(chatId);
    const messagesToProcess = queue.filter(msg => 
      msg.status === 'queued' || msg.status === 'retry_pending'
    );

    for (const message of messagesToProcess) {
      try {
        await this.processMessage(chatId, message, sendFunction);
        
        // Small delay between messages
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Failed to process queued message:', error);
      }
    }
  }

  /**
   * Process all message queues
   */
  async processAllQueues() {
    if (!this.isOnline) return;

    for (const [chatId, queue] of this.messageQueue) {
      const callback = this.syncCallbacks.get(chatId);
      if (callback && callback.sendFunction) {
        await this.processQueue(chatId, callback.sendFunction);
      }
    }
  }

  /**
   * Process a single message from queue
   */
  async processMessage(chatId, message, sendFunction) {
    try {
      this.updateMessageStatus(chatId, message.id, { status: 'sending' });
      
      const result = await sendFunction({
        chatId: message.chatId,
        content: message.content,
        type: message.type,
        attachments: message.attachments,
        replyTo: message.replyTo,
        tempId: message.id
      });

      // Message sent successfully
      this.removeFromQueue(chatId, message.id);
      return result;

    } catch (error) {
      console.error('Failed to send queued message:', error);
      
      const newRetryCount = message.retryCount + 1;
      
      if (newRetryCount >= this.maxRetries) {
        // Max retries reached, mark as failed
        this.updateMessageStatus(chatId, message.id, {
          status: 'failed',
          error: error.message,
          failedAt: new Date().toISOString()
        });
        return false;
      }

      // Schedule retry with exponential backoff
      const retryDelay = this.retryDelay * Math.pow(2, newRetryCount);
      this.updateMessageStatus(chatId, message.id, {
        status: 'retry_pending',
        retryCount: newRetryCount,
        nextRetryAt: new Date(Date.now() + retryDelay).toISOString()
      });

      const timeoutId = setTimeout(() => {
        this.retryTimeouts.delete(message.id);
        this.processMessage(chatId, message, sendFunction);
      }, retryDelay);

      this.retryTimeouts.set(message.id, timeoutId);
      return false;
    }
  }

  /**
   * Update message status in queue
   */
  updateMessageStatus(chatId, messageId, updates) {
    if (!this.messageQueue.has(chatId)) return;

    const queue = this.messageQueue.get(chatId);
    const messageIndex = queue.findIndex(msg => msg.id === messageId);
    
    if (messageIndex !== -1) {
      queue[messageIndex] = { ...queue[messageIndex], ...updates };
      this.saveToStorage();
      this.notifyStatusChange();
    }
  }

  /**
   * Remove message from queue
   */
  removeFromQueue(chatId, messageId) {
    if (!this.messageQueue.has(chatId)) return;

    const queue = this.messageQueue.get(chatId);
    const filteredQueue = queue.filter(msg => msg.id !== messageId);
    this.messageQueue.set(chatId, filteredQueue);
    
    // Clear any pending retry timeout
    if (this.retryTimeouts.has(messageId)) {
      clearTimeout(this.retryTimeouts.get(messageId));
      this.retryTimeouts.delete(messageId);
    }
    
    this.saveToStorage();
    this.notifyStatusChange();
  }

  /**
   * Retry a failed message
   */
  retryMessage(chatId, messageId, sendFunction) {
    if (!this.messageQueue.has(chatId)) return;

    const queue = this.messageQueue.get(chatId);
    const message = queue.find(msg => msg.id === messageId);
    
    if (message && message.status === 'failed') {
      this.updateMessageStatus(chatId, messageId, {
        status: 'queued',
        retryCount: 0,
        error: null,
        failedAt: null
      });
      
      if (this.isOnline && sendFunction) {
        this.processMessage(chatId, message, sendFunction);
      }
    }
  }

  /**
   * Clear failed messages for a chat
   */
  clearFailedMessages(chatId) {
    if (!this.messageQueue.has(chatId)) return;

    const queue = this.messageQueue.get(chatId);
    const filteredQueue = queue.filter(msg => msg.status !== 'failed');
    this.messageQueue.set(chatId, filteredQueue);
    
    this.saveToStorage();
    this.notifyStatusChange();
  }

  /**
   * Get queue statistics for a chat
   */
  getQueueStats(chatId) {
    if (!this.messageQueue.has(chatId)) {
      return {
        total: 0,
        queued: 0,
        sending: 0,
        retryPending: 0,
        failed: 0
      };
    }

    const queue = this.messageQueue.get(chatId);
    const stats = queue.reduce((acc, msg) => {
      acc[msg.status] = (acc[msg.status] || 0) + 1;
      return acc;
    }, {});

    return {
      total: queue.length,
      queued: stats.queued || 0,
      sending: stats.sending || 0,
      retryPending: stats.retry_pending || 0,
      failed: stats.failed || 0
    };
  }

  /**
   * Cache messages for offline viewing
   */
  cacheMessages(chatId, messages) {
    if (!messages || !Array.isArray(messages)) return;

    // Limit the number of cached messages
    const messagesToCache = messages.slice(-this.maxCacheSize);
    this.messageCache.set(chatId, messagesToCache);
    this.saveToStorage();
  }

  /**
   * Get cached messages for a chat
   */
  getCachedMessages(chatId) {
    return this.messageCache.get(chatId) || [];
  }

  /**
   * Add message to cache
   */
  addToCache(chatId, message) {
    if (!this.messageCache.has(chatId)) {
      this.messageCache.set(chatId, []);
    }

    const cache = this.messageCache.get(chatId);
    cache.push(message);
    
    // Limit cache size
    if (cache.length > this.maxCacheSize) {
      cache.splice(0, cache.length - this.maxCacheSize);
    }
    
    this.saveToStorage();
  }

  /**
   * Update message in cache
   */
  updateInCache(chatId, messageId, updates) {
    if (!this.messageCache.has(chatId)) return;

    const cache = this.messageCache.get(chatId);
    const messageIndex = cache.findIndex(msg => msg.id === messageId);
    
    if (messageIndex !== -1) {
      cache[messageIndex] = { ...cache[messageIndex], ...updates };
      this.saveToStorage();
    }
  }

  /**
   * Remove message from cache
   */
  removeFromCache(chatId, messageId) {
    if (!this.messageCache.has(chatId)) return;

    const cache = this.messageCache.get(chatId);
    const filteredCache = cache.filter(msg => msg.id !== messageId);
    this.messageCache.set(chatId, filteredCache);
    this.saveToStorage();
  }

  /**
   * Clear cache for a chat
   */
  clearCache(chatId) {
    this.messageCache.delete(chatId);
    this.saveToStorage();
  }

  /**
   * Get cache statistics for a chat
   */
  getCacheStats(chatId) {
    const cache = this.messageCache.get(chatId) || [];
    return {
      messageCount: cache.length,
      oldestMessage: cache.length > 0 ? cache[0].timestamp : null,
      newestMessage: cache.length > 0 ? cache[cache.length - 1].timestamp : null
    };
  }

  /**
   * Sync server messages with cached messages
   */
  syncWithServerMessages(chatId, serverMessages) {
    if (!serverMessages || !Array.isArray(serverMessages)) return;

    const cachedMessages = this.getCachedMessages(chatId);
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
    
    this.cacheMessages(chatId, mergedMessages);
    return mergedMessages;
  }

  /**
   * Search cached messages
   */
  searchCachedMessages(chatId, query) {
    const cachedMessages = this.getCachedMessages(chatId);
    if (!query.trim()) return cachedMessages;

    const searchTerm = query.toLowerCase();
    return cachedMessages.filter(message => 
      message.content?.toLowerCase().includes(searchTerm) ||
      message.senderName?.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Generate temporary ID for queued messages
   */
  generateTempId() {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get overall statistics
   */
  getOverallStats() {
    let totalQueued = 0;
    let totalCached = 0;
    let totalFailed = 0;

    this.messageQueue.forEach(queue => {
      totalQueued += queue.length;
      totalFailed += queue.filter(msg => msg.status === 'failed').length;
    });

    this.messageCache.forEach(cache => {
      totalCached += cache.length;
    });

    return {
      isOnline: this.isOnline,
      totalQueued,
      totalCached,
      totalFailed,
      activeChats: this.messageQueue.size,
      cachedChats: this.messageCache.size
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Clear all retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts.clear();
    
    // Clear callbacks
    this.syncCallbacks.clear();
  }
}

// Create singleton instance
const offlineManager = new OfflineManager();

export default offlineManager;