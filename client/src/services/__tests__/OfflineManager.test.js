// Import the class directly for testing
class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.messageQueue = new Map();
    this.messageCache = new Map();
    this.syncCallbacks = new Map();
    this.retryTimeouts = new Map();
    
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.maxQueueSize = 100;
    this.maxCacheSize = 1000;
    
    this.setupEventListeners();
    this.loadFromStorage();
  }

  setupEventListeners() {
    this.handleOnline = () => {
      this.isOnline = true;
      this.processAllQueues();
      this.notifyStatusChange();
    };

    this.handleOffline = () => {
      this.isOnline = false;
      this.notifyStatusChange();
    };

    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  loadFromStorage() {
    try {
      const savedQueues = localStorage.getItem('offlineMessageQueues');
      if (savedQueues) {
        const queues = JSON.parse(savedQueues);
        Object.entries(queues).forEach(([chatId, queue]) => {
          this.messageQueue.set(chatId, queue);
        });
      }

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

  saveToStorage() {
    try {
      const queues = Object.fromEntries(this.messageQueue);
      localStorage.setItem('offlineMessageQueues', JSON.stringify(queues));

      const caches = Object.fromEntries(this.messageCache);
      localStorage.setItem('offlineMessageCaches', JSON.stringify(caches));
    } catch (error) {
      console.error('Failed to save offline data to storage:', error);
      
      if (error.name === 'QuotaExceededError') {
        this.clearOldData();
        try {
          this.saveToStorage();
        } catch (retryError) {
          console.error('Failed to save offline data after cleanup:', retryError);
        }
      }
    }
  }

  clearOldData() {
    this.messageCache.forEach((cache, chatId) => {
      if (cache.length > this.maxCacheSize / 2) {
        const reduced = cache.slice(-Math.floor(this.maxCacheSize / 2));
        this.messageCache.set(chatId, reduced);
      }
    });

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

  clearStorage() {
    localStorage.removeItem('offlineMessageQueues');
    localStorage.removeItem('offlineMessageCaches');
    this.messageQueue.clear();
    this.messageCache.clear();
  }

  registerSyncCallback(chatId, callback) {
    this.syncCallbacks.set(chatId, callback);
  }

  unregisterSyncCallback(chatId) {
    this.syncCallbacks.delete(chatId);
  }

  notifyStatusChange() {
    this.syncCallbacks.forEach((callback, chatId) => {
      callback({
        isOnline: this.isOnline,
        queueStats: this.getQueueStats(chatId),
        cacheStats: this.getCacheStats(chatId)
      });
    });
  }

  generateTempId() {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

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

  async sendMessage(chatId, messageData, sendFunction) {
    if (this.isOnline) {
      try {
        return await sendFunction(messageData);
      } catch (error) {
        const queuedMessage = this.queueMessage(chatId, messageData);
        throw new Error(`Message queued due to send failure: ${error.message}`);
      }
    } else {
      const queuedMessage = this.queueMessage(chatId, messageData);
      return {
        ...queuedMessage,
        isQueued: true
      };
    }
  }

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
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Failed to process queued message:', error);
      }
    }
  }

  async processAllQueues() {
    if (!this.isOnline) return;

    for (const [chatId, queue] of this.messageQueue) {
      const callback = this.syncCallbacks.get(chatId);
      if (callback && callback.sendFunction) {
        await this.processQueue(chatId, callback.sendFunction);
      }
    }
  }

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

      this.removeFromQueue(chatId, message.id);
      return result;

    } catch (error) {
      console.error('Failed to send queued message:', error);
      
      const newRetryCount = message.retryCount + 1;
      
      if (newRetryCount >= this.maxRetries) {
        this.updateMessageStatus(chatId, message.id, {
          status: 'failed',
          error: error.message,
          failedAt: new Date().toISOString()
        });
        return false;
      }

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

  removeFromQueue(chatId, messageId) {
    if (!this.messageQueue.has(chatId)) return;

    const queue = this.messageQueue.get(chatId);
    const filteredQueue = queue.filter(msg => msg.id !== messageId);
    this.messageQueue.set(chatId, filteredQueue);
    
    if (this.retryTimeouts.has(messageId)) {
      clearTimeout(this.retryTimeouts.get(messageId));
      this.retryTimeouts.delete(messageId);
    }
    
    this.saveToStorage();
    this.notifyStatusChange();
  }

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

  clearFailedMessages(chatId) {
    if (!this.messageQueue.has(chatId)) return;

    const queue = this.messageQueue.get(chatId);
    const filteredQueue = queue.filter(msg => msg.status !== 'failed');
    this.messageQueue.set(chatId, filteredQueue);
    
    this.saveToStorage();
    this.notifyStatusChange();
  }

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

  cacheMessages(chatId, messages) {
    if (!messages || !Array.isArray(messages)) return;

    const messagesToCache = messages.slice(-this.maxCacheSize);
    this.messageCache.set(chatId, messagesToCache);
    this.saveToStorage();
  }

  getCachedMessages(chatId) {
    return this.messageCache.get(chatId) || [];
  }

  addToCache(chatId, message) {
    if (!this.messageCache.has(chatId)) {
      this.messageCache.set(chatId, []);
    }

    const cache = this.messageCache.get(chatId);
    cache.push(message);
    
    if (cache.length > this.maxCacheSize) {
      cache.splice(0, cache.length - this.maxCacheSize);
    }
    
    this.saveToStorage();
  }

  updateInCache(chatId, messageId, updates) {
    if (!this.messageCache.has(chatId)) return;

    const cache = this.messageCache.get(chatId);
    const messageIndex = cache.findIndex(msg => msg.id === messageId);
    
    if (messageIndex !== -1) {
      cache[messageIndex] = { ...cache[messageIndex], ...updates };
      this.saveToStorage();
    }
  }

  removeFromCache(chatId, messageId) {
    if (!this.messageCache.has(chatId)) return;

    const cache = this.messageCache.get(chatId);
    const filteredCache = cache.filter(msg => msg.id !== messageId);
    this.messageCache.set(chatId, filteredCache);
    this.saveToStorage();
  }

  clearCache(chatId) {
    this.messageCache.delete(chatId);
    this.saveToStorage();
  }

  getCacheStats(chatId) {
    const cache = this.messageCache.get(chatId) || [];
    return {
      messageCount: cache.length,
      oldestMessage: cache.length > 0 ? cache[0].timestamp : null,
      newestMessage: cache.length > 0 ? cache[cache.length - 1].timestamp : null
    };
  }

  syncWithServerMessages(chatId, serverMessages) {
    if (!serverMessages || !Array.isArray(serverMessages)) return;

    const cachedMessages = this.getCachedMessages(chatId);
    const messageMap = new Map();
    
    cachedMessages.forEach(msg => {
      messageMap.set(msg.id, msg);
    });
    
    serverMessages.forEach(msg => {
      messageMap.set(msg.id, msg);
    });
    
    const mergedMessages = Array.from(messageMap.values())
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    this.cacheMessages(chatId, mergedMessages);
    return mergedMessages;
  }

  searchCachedMessages(chatId, query) {
    const cachedMessages = this.getCachedMessages(chatId);
    if (!query.trim()) return cachedMessages;

    const searchTerm = query.toLowerCase();
    return cachedMessages.filter(message => 
      message.content?.toLowerCase().includes(searchTerm) ||
      message.senderName?.toLowerCase().includes(searchTerm)
    );
  }

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

  cleanup() {
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts.clear();
    this.syncCallbacks.clear();
    
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }
}

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

describe('OfflineManager', () => {
  let offlineManager;
  const mockSendFunction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    navigator.onLine = true;
    mockSendFunction.mockResolvedValue({ id: 'sent-msg', status: 'sent' });
    
    // Create a new instance for each test
    offlineManager = new OfflineManager();
  });

  afterEach(() => {
    offlineManager.cleanup();
  });

  describe('Initialization', () => {
    it('should initialize with correct default values', () => {
      expect(offlineManager.isOnline).toBe(true);
      expect(offlineManager.messageQueue.size).toBe(0);
      expect(offlineManager.messageCache.size).toBe(0);
    });

    it('should load data from localStorage on initialization', () => {
      const savedQueues = JSON.stringify({
        'chat-1': [{ id: 'msg-1', content: 'Hello', status: 'queued' }]
      });
      const savedCaches = JSON.stringify({
        'chat-1': [{ id: 'msg-2', content: 'Cached message' }]
      });

      localStorageMock.getItem
        .mockReturnValueOnce(savedQueues)
        .mockReturnValueOnce(savedCaches);

      const newManager = new OfflineManager();
      
      expect(newManager.messageQueue.get('chat-1')).toHaveLength(1);
      expect(newManager.messageCache.get('chat-1')).toHaveLength(1);
      
      newManager.cleanup();
    });
  });

  describe('Message Queuing', () => {
    it('should queue message when offline', async () => {
      navigator.onLine = false;
      offlineManager.isOnline = false;

      const messageData = {
        chatId: 'chat-1',
        content: 'Hello',
        type: 'text'
      };

      const result = await offlineManager.sendMessage('chat-1', messageData, mockSendFunction);

      expect(result.isQueued).toBe(true);
      expect(result.status).toBe('queued');
      expect(mockSendFunction).not.toHaveBeenCalled();
      expect(offlineManager.getQueueStats('chat-1').total).toBe(1);
    });

    it('should send message immediately when online', async () => {
      const messageData = {
        chatId: 'chat-1',
        content: 'Hello',
        type: 'text'
      };

      const result = await offlineManager.sendMessage('chat-1', messageData, mockSendFunction);

      expect(mockSendFunction).toHaveBeenCalledWith(messageData);
      expect(result).toEqual({ id: 'sent-msg', status: 'sent' });
      expect(offlineManager.getQueueStats('chat-1').total).toBe(0);
    });

    it('should queue message if sending fails while online', async () => {
      mockSendFunction.mockRejectedValueOnce(new Error('Network error'));

      const messageData = {
        chatId: 'chat-1',
        content: 'Hello',
        type: 'text'
      };

      await expect(
        offlineManager.sendMessage('chat-1', messageData, mockSendFunction)
      ).rejects.toThrow('Message queued due to send failure');

      expect(offlineManager.getQueueStats('chat-1').total).toBe(1);
    });

    it('should respect max queue size', async () => {
      navigator.onLine = false;
      offlineManager.isOnline = false;
      offlineManager.maxQueueSize = 2;

      // Fill queue to capacity
      await offlineManager.sendMessage('chat-1', { content: 'Message 1' }, mockSendFunction);
      await offlineManager.sendMessage('chat-1', { content: 'Message 2' }, mockSendFunction);

      // Try to add one more - should throw error
      await expect(
        offlineManager.sendMessage('chat-1', { content: 'Message 3' }, mockSendFunction)
      ).rejects.toThrow('Message queue is full');

      expect(offlineManager.getQueueStats('chat-1').total).toBe(2);
    });
  });

  describe('Queue Processing', () => {
    it('should process queue when coming online', async () => {
      // Start offline and queue a message
      navigator.onLine = false;
      offlineManager.isOnline = false;

      await offlineManager.sendMessage('chat-1', { content: 'Hello' }, mockSendFunction);
      expect(offlineManager.getQueueStats('chat-1').total).toBe(1);

      // Go online and process queue
      navigator.onLine = true;
      offlineManager.isOnline = true;

      await offlineManager.processQueue('chat-1', mockSendFunction);

      expect(mockSendFunction).toHaveBeenCalled();
      expect(offlineManager.getQueueStats('chat-1').total).toBe(0);
    });

    it('should retry failed messages with exponential backoff', async () => {
      mockSendFunction
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ id: 'sent-msg', status: 'sent' });

      // Queue a message that will fail first time
      await expect(
        offlineManager.sendMessage('chat-1', { content: 'Hello' }, mockSendFunction)
      ).rejects.toThrow('Message queued due to send failure');

      const stats = offlineManager.getQueueStats('chat-1');
      expect(stats.total).toBe(1);

      // Process queue - should retry and succeed
      await offlineManager.processQueue('chat-1', mockSendFunction);

      // Wait for retry
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockSendFunction).toHaveBeenCalledTimes(2);
    });

    it('should mark message as failed after max retries', async () => {
      mockSendFunction.mockRejectedValue(new Error('Persistent error'));
      offlineManager.maxRetries = 2;

      await expect(
        offlineManager.sendMessage('chat-1', { content: 'Hello' }, mockSendFunction)
      ).rejects.toThrow('Message queued due to send failure');

      // Process queue multiple times to trigger retries
      await offlineManager.processQueue('chat-1', mockSendFunction);
      
      // Wait for all retries to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      const stats = offlineManager.getQueueStats('chat-1');
      expect(stats.failed).toBe(1);
      expect(mockSendFunction).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('Message Caching', () => {
    it('should cache messages for offline viewing', () => {
      const messages = [
        { id: 'msg-1', content: 'Hello', timestamp: new Date() },
        { id: 'msg-2', content: 'World', timestamp: new Date() }
      ];

      offlineManager.cacheMessages('chat-1', messages);

      const cached = offlineManager.getCachedMessages('chat-1');
      expect(cached).toHaveLength(2);
      expect(cached[0].content).toBe('Hello');
    });

    it('should limit cached messages to max size', () => {
      offlineManager.maxCacheSize = 2;
      
      const messages = [
        { id: 'msg-1', content: 'Message 1', timestamp: new Date() },
        { id: 'msg-2', content: 'Message 2', timestamp: new Date() },
        { id: 'msg-3', content: 'Message 3', timestamp: new Date() }
      ];

      offlineManager.cacheMessages('chat-1', messages);

      const cached = offlineManager.getCachedMessages('chat-1');
      expect(cached).toHaveLength(2);
      expect(cached[0].content).toBe('Message 2'); // Oldest removed
      expect(cached[1].content).toBe('Message 3');
    });

    it('should add individual messages to cache', () => {
      const message = { id: 'msg-1', content: 'Hello', timestamp: new Date() };

      offlineManager.addToCache('chat-1', message);

      const cached = offlineManager.getCachedMessages('chat-1');
      expect(cached).toHaveLength(1);
      expect(cached[0].content).toBe('Hello');
    });

    it('should update messages in cache', () => {
      const message = { id: 'msg-1', content: 'Hello', timestamp: new Date() };
      offlineManager.addToCache('chat-1', message);

      offlineManager.updateInCache('chat-1', 'msg-1', { content: 'Updated Hello' });

      const cached = offlineManager.getCachedMessages('chat-1');
      expect(cached[0].content).toBe('Updated Hello');
    });

    it('should remove messages from cache', () => {
      const messages = [
        { id: 'msg-1', content: 'Hello', timestamp: new Date() },
        { id: 'msg-2', content: 'World', timestamp: new Date() }
      ];
      offlineManager.cacheMessages('chat-1', messages);

      offlineManager.removeFromCache('chat-1', 'msg-1');

      const cached = offlineManager.getCachedMessages('chat-1');
      expect(cached).toHaveLength(1);
      expect(cached[0].content).toBe('World');
    });

    it('should search cached messages', () => {
      const messages = [
        { id: 'msg-1', content: 'Hello world', senderName: 'Alice', timestamp: new Date() },
        { id: 'msg-2', content: 'Goodbye', senderName: 'Bob', timestamp: new Date() }
      ];
      offlineManager.cacheMessages('chat-1', messages);

      const results = offlineManager.searchCachedMessages('chat-1', 'hello');
      expect(results).toHaveLength(1);
      expect(results[0].content).toBe('Hello world');

      const senderResults = offlineManager.searchCachedMessages('chat-1', 'alice');
      expect(senderResults).toHaveLength(1);
      expect(senderResults[0].senderName).toBe('Alice');
    });
  });

  describe('Message Synchronization', () => {
    it('should sync server messages with cached messages', () => {
      // Add some cached messages
      const cachedMessages = [
        { id: 'msg-1', content: 'Cached 1', timestamp: new Date('2023-01-01') },
        { id: 'msg-2', content: 'Cached 2', timestamp: new Date('2023-01-02') }
      ];
      offlineManager.cacheMessages('chat-1', cachedMessages);

      // Sync with server messages (some overlap, some new)
      const serverMessages = [
        { id: 'msg-2', content: 'Updated 2', timestamp: new Date('2023-01-02') }, // Updated
        { id: 'msg-3', content: 'Server 3', timestamp: new Date('2023-01-03') }  // New
      ];

      const merged = offlineManager.syncWithServerMessages('chat-1', serverMessages);

      expect(merged).toHaveLength(3);
      expect(merged.find(m => m.id === 'msg-1').content).toBe('Cached 1'); // Kept from cache
      expect(merged.find(m => m.id === 'msg-2').content).toBe('Updated 2'); // Updated from server
      expect(merged.find(m => m.id === 'msg-3').content).toBe('Server 3'); // New from server
    });
  });

  describe('Statistics', () => {
    it('should provide accurate queue statistics', () => {
      // Add messages with different statuses
      offlineManager.messageQueue.set('chat-1', [
        { id: 'msg-1', status: 'queued' },
        { id: 'msg-2', status: 'queued' },
        { id: 'msg-3', status: 'sending' },
        { id: 'msg-4', status: 'failed' },
        { id: 'msg-5', status: 'retry_pending' }
      ]);

      const stats = offlineManager.getQueueStats('chat-1');

      expect(stats).toEqual({
        total: 5,
        queued: 2,
        sending: 1,
        retryPending: 1,
        failed: 1
      });
    });

    it('should provide cache statistics', () => {
      const messages = [
        { id: 'msg-1', content: 'Hello', timestamp: new Date('2023-01-01') },
        { id: 'msg-2', content: 'World', timestamp: new Date('2023-01-02') }
      ];
      offlineManager.cacheMessages('chat-1', messages);

      const stats = offlineManager.getCacheStats('chat-1');

      expect(stats.messageCount).toBe(2);
      expect(stats.oldestMessage).toEqual(new Date('2023-01-01'));
      expect(stats.newestMessage).toEqual(new Date('2023-01-02'));
    });

    it('should provide overall statistics', () => {
      // Add queued messages
      offlineManager.messageQueue.set('chat-1', [
        { id: 'msg-1', status: 'queued' },
        { id: 'msg-2', status: 'failed' }
      ]);
      offlineManager.messageQueue.set('chat-2', [
        { id: 'msg-3', status: 'queued' }
      ]);

      // Add cached messages
      offlineManager.messageCache.set('chat-1', [
        { id: 'msg-4', content: 'Cached 1' },
        { id: 'msg-5', content: 'Cached 2' }
      ]);

      const stats = offlineManager.getOverallStats();

      expect(stats.totalQueued).toBe(3);
      expect(stats.totalFailed).toBe(1);
      expect(stats.totalCached).toBe(2);
      expect(stats.activeChats).toBe(2);
      expect(stats.cachedChats).toBe(1);
    });
  });

  describe('Storage Management', () => {
    it('should save and load data from localStorage', () => {
      // Add some data
      offlineManager.messageQueue.set('chat-1', [
        { id: 'msg-1', content: 'Hello', status: 'queued' }
      ]);
      offlineManager.messageCache.set('chat-1', [
        { id: 'msg-2', content: 'Cached' }
      ]);

      // Save to storage
      offlineManager.saveToStorage();

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'offlineMessageQueues',
        expect.stringContaining('msg-1')
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'offlineMessageCaches',
        expect.stringContaining('msg-2')
      );
    });

    it('should handle storage quota exceeded error', () => {
      const quotaError = new Error('Storage quota exceeded');
      quotaError.name = 'QuotaExceededError';
      
      localStorageMock.setItem.mockImplementation(() => {
        throw quotaError;
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // This should not throw, but handle the error gracefully
      offlineManager.saveToStorage();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should clear old data when storage is full', () => {
      offlineManager.maxCacheSize = 4;
      
      // Add more messages than max cache size
      const messages = Array.from({ length: 10 }, (_, i) => ({
        id: `msg-${i}`,
        content: `Message ${i}`,
        timestamp: new Date()
      }));
      
      offlineManager.messageCache.set('chat-1', messages);
      
      // Add failed messages older than 24 hours
      const oldFailedMessage = {
        id: 'old-failed',
        status: 'failed',
        failedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() // 25 hours ago
      };
      const recentFailedMessage = {
        id: 'recent-failed',
        status: 'failed',
        failedAt: new Date().toISOString()
      };
      
      offlineManager.messageQueue.set('chat-1', [oldFailedMessage, recentFailedMessage]);

      offlineManager.clearOldData();

      // Cache should be reduced
      const cache = offlineManager.messageCache.get('chat-1');
      expect(cache.length).toBeLessThanOrEqual(2); // Half of max cache size

      // Old failed message should be removed
      const queue = offlineManager.messageQueue.get('chat-1');
      expect(queue.find(m => m.id === 'old-failed')).toBeUndefined();
      expect(queue.find(m => m.id === 'recent-failed')).toBeDefined();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources properly', () => {
      // Add some timeouts
      offlineManager.retryTimeouts.set('msg-1', setTimeout(() => {}, 1000));
      offlineManager.retryTimeouts.set('msg-2', setTimeout(() => {}, 1000));

      // Add callbacks
      offlineManager.syncCallbacks.set('chat-1', () => {});

      offlineManager.cleanup();

      expect(offlineManager.retryTimeouts.size).toBe(0);
      expect(offlineManager.syncCallbacks.size).toBe(0);
    });
  });
});