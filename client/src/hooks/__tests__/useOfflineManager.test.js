import { renderHook, act, waitFor } from '@testing-library/react';
import { useOfflineManager } from '../useOfflineManager';
import offlineManager from '../../services/OfflineManager';

// Mock the OfflineManager
jest.mock('../../services/OfflineManager', () => ({
  __esModule: true,
  default: {
    isOnline: true,
    messageQueue: new Map(),
    messageCache: new Map(),
    registerSyncCallback: jest.fn(),
    unregisterSyncCallback: jest.fn(),
    getQueueStats: jest.fn(() => ({ total: 0, queued: 0, sending: 0, retryPending: 0, failed: 0 })),
    getCacheStats: jest.fn(() => ({ messageCount: 0, oldestMessage: null, newestMessage: null })),
    getCachedMessages: jest.fn(() => []),
    sendMessage: jest.fn(),
    processQueue: jest.fn(),
    retryMessage: jest.fn(),
    removeFromQueue: jest.fn(),
    clearFailedMessages: jest.fn(),
    cacheMessages: jest.fn(),
    addToCache: jest.fn(),
    updateInCache: jest.fn(),
    removeFromCache: jest.fn(),
    clearCache: jest.fn(),
    syncWithServerMessages: jest.fn(),
    searchCachedMessages: jest.fn(),
    getOverallStats: jest.fn(() => ({ isOnline: true, totalQueued: 0, totalCached: 0, totalFailed: 0 }))
  }
}));

describe('useOfflineManager', () => {
  const mockOnSendMessage = jest.fn();
  const chatId = 'test-chat-1';

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSendMessage.mockResolvedValue({ id: 'sent-msg', status: 'sent' });
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useOfflineManager(chatId, mockOnSendMessage));

    expect(result.current.isOnline).toBe(true);
    expect(result.current.processing).toBe(false);
    expect(result.current.queueStats.total).toBe(0);
    expect(result.current.cachedMessages).toEqual([]);
  });

  it('should register sync callback on mount', () => {
    renderHook(() => useOfflineManager(chatId, mockOnSendMessage));

    expect(offlineManager.registerSyncCallback).toHaveBeenCalledWith(
      chatId,
      expect.any(Function)
    );
  });

  it('should unregister sync callback on unmount', () => {
    const { unmount } = renderHook(() => useOfflineManager(chatId, mockOnSendMessage));

    unmount();

    expect(offlineManager.unregisterSyncCallback).toHaveBeenCalledWith(chatId);
  });

  it('should update stats when status changes', () => {
    let statusCallback;
    offlineManager.registerSyncCallback.mockImplementation((id, callback) => {
      statusCallback = callback;
    });

    const { result } = renderHook(() => useOfflineManager(chatId, mockOnSendMessage));

    // Simulate status change
    act(() => {
      statusCallback({
        isOnline: false,
        queueStats: { total: 2, queued: 1, failed: 1 },
        cacheStats: { messageCount: 5 }
      });
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.queueStats.total).toBe(2);
    expect(result.current.queueStats.queued).toBe(1);
    expect(result.current.queueStats.failed).toBe(1);
  });

  it('should send message through offline manager', async () => {
    offlineManager.sendMessage.mockResolvedValue({ id: 'sent-msg', status: 'sent' });

    const { result } = renderHook(() => useOfflineManager(chatId, mockOnSendMessage));

    const messageData = {
      content: 'Hello',
      type: 'text'
    };

    let sentMessage;
    await act(async () => {
      sentMessage = await result.current.sendMessage(messageData);
    });

    expect(offlineManager.sendMessage).toHaveBeenCalledWith(
      chatId,
      messageData,
      mockOnSendMessage
    );
    expect(sentMessage).toEqual({ id: 'sent-msg', status: 'sent' });
  });

  it('should handle queued messages', async () => {
    const queuedMessage = {
      id: 'queued-msg',
      content: 'Hello',
      status: 'queued',
      isQueued: true
    };

    offlineManager.sendMessage.mockResolvedValue(queuedMessage);
    offlineManager.addToCache.mockImplementation(() => {});
    offlineManager.getCachedMessages.mockReturnValue([queuedMessage]);

    const { result } = renderHook(() => useOfflineManager(chatId, mockOnSendMessage));

    await act(async () => {
      await result.current.sendMessage({ content: 'Hello', type: 'text' });
    });

    expect(offlineManager.addToCache).toHaveBeenCalledWith(chatId, queuedMessage);
  });

  it('should process message queue', async () => {
    const { result } = renderHook(() => useOfflineManager(chatId, mockOnSendMessage));

    await act(async () => {
      await result.current.processQueue();
    });

    expect(offlineManager.processQueue).toHaveBeenCalledWith(chatId, mockOnSendMessage);
  });

  it('should retry failed message', () => {
    const { result } = renderHook(() => useOfflineManager(chatId, mockOnSendMessage));

    act(() => {
      result.current.retryMessage('failed-msg-id');
    });

    expect(offlineManager.retryMessage).toHaveBeenCalledWith(
      chatId,
      'failed-msg-id',
      mockOnSendMessage
    );
  });

  it('should remove message from queue', () => {
    const { result } = renderHook(() => useOfflineManager(chatId, mockOnSendMessage));

    act(() => {
      result.current.removeFromQueue('msg-id');
    });

    expect(offlineManager.removeFromQueue).toHaveBeenCalledWith(chatId, 'msg-id');
  });

  it('should clear failed messages', () => {
    const { result } = renderHook(() => useOfflineManager(chatId, mockOnSendMessage));

    act(() => {
      result.current.clearFailedMessages();
    });

    expect(offlineManager.clearFailedMessages).toHaveBeenCalledWith(chatId);
  });

  it('should cache messages', () => {
    const { result } = renderHook(() => useOfflineManager(chatId, mockOnSendMessage));

    const messages = [
      { id: 'msg-1', content: 'Hello' },
      { id: 'msg-2', content: 'World' }
    ];

    act(() => {
      result.current.cacheMessages(messages);
    });

    expect(offlineManager.cacheMessages).toHaveBeenCalledWith(chatId, messages);
  });

  it('should add message to cache', () => {
    const { result } = renderHook(() => useOfflineManager(chatId, mockOnSendMessage));

    const message = { id: 'msg-1', content: 'Hello' };

    act(() => {
      result.current.addToCache(message);
    });

    expect(offlineManager.addToCache).toHaveBeenCalledWith(chatId, message);
  });

  it('should update message in cache', () => {
    const { result } = renderHook(() => useOfflineManager(chatId, mockOnSendMessage));

    const updates = { content: 'Updated content' };

    act(() => {
      result.current.updateInCache('msg-1', updates);
    });

    expect(offlineManager.updateInCache).toHaveBeenCalledWith(chatId, 'msg-1', updates);
  });

  it('should remove message from cache', () => {
    const { result } = renderHook(() => useOfflineManager(chatId, mockOnSendMessage));

    act(() => {
      result.current.removeFromCache('msg-1');
    });

    expect(offlineManager.removeFromCache).toHaveBeenCalledWith(chatId, 'msg-1');
  });

  it('should clear cache', () => {
    const { result } = renderHook(() => useOfflineManager(chatId, mockOnSendMessage));

    act(() => {
      result.current.clearCache();
    });

    expect(offlineManager.clearCache).toHaveBeenCalledWith(chatId);
  });

  it('should sync with server messages', () => {
    const serverMessages = [
      { id: 'msg-1', content: 'Server message 1' },
      { id: 'msg-2', content: 'Server message 2' }
    ];

    const mergedMessages = [
      { id: 'msg-1', content: 'Server message 1' },
      { id: 'msg-2', content: 'Server message 2' },
      { id: 'cached-1', content: 'Cached message' }
    ];

    offlineManager.syncWithServerMessages.mockReturnValue(mergedMessages);

    const { result } = renderHook(() => useOfflineManager(chatId, mockOnSendMessage));

    let syncResult;
    act(() => {
      syncResult = result.current.syncWithServerMessages(serverMessages);
    });

    expect(offlineManager.syncWithServerMessages).toHaveBeenCalledWith(chatId, serverMessages);
    expect(syncResult).toEqual(mergedMessages);
  });

  it('should search cached messages', () => {
    const searchResults = [
      { id: 'msg-1', content: 'Hello world' }
    ];

    offlineManager.searchCachedMessages.mockReturnValue(searchResults);

    const { result } = renderHook(() => useOfflineManager(chatId, mockOnSendMessage));

    let results;
    act(() => {
      results = result.current.searchCachedMessages('hello');
    });

    expect(offlineManager.searchCachedMessages).toHaveBeenCalledWith(chatId, 'hello');
    expect(results).toEqual(searchResults);
  });

  it('should get merged messages', () => {
    const serverMessages = [
      { id: 'server-1', content: 'Server message', timestamp: new Date('2023-01-01') }
    ];

    const cachedMessages = [
      { id: 'cached-1', content: 'Cached message', timestamp: new Date('2023-01-02') }
    ];

    const queuedMessages = [
      { id: 'queued-1', content: 'Queued message', queuedAt: '2023-01-03T00:00:00.000Z', status: 'queued' }
    ];

    offlineManager.getCachedMessages.mockReturnValue(cachedMessages);
    offlineManager.messageQueue.get = jest.fn().mockReturnValue(queuedMessages);

    const { result } = renderHook(() => useOfflineManager(chatId, mockOnSendMessage));

    let mergedMessages;
    act(() => {
      mergedMessages = result.current.getMergedMessages(serverMessages);
    });

    expect(mergedMessages).toHaveLength(3);
    expect(mergedMessages.find(m => m.id === 'server-1')).toBeDefined();
    expect(mergedMessages.find(m => m.id === 'cached-1')).toBeDefined();
    expect(mergedMessages.find(m => m.id === 'queued-1')).toBeDefined();
    
    // Should be sorted by timestamp
    expect(new Date(mergedMessages[0].timestamp)).toBeLessThan(new Date(mergedMessages[1].timestamp));
  });

  it('should get overall statistics', () => {
    const stats = {
      isOnline: true,
      totalQueued: 5,
      totalCached: 10,
      totalFailed: 2,
      activeChats: 3,
      cachedChats: 2
    };

    offlineManager.getOverallStats.mockReturnValue(stats);

    const { result } = renderHook(() => useOfflineManager(chatId, mockOnSendMessage));

    let overallStats;
    act(() => {
      overallStats = result.current.getOverallStats();
    });

    expect(offlineManager.getOverallStats).toHaveBeenCalled();
    expect(overallStats).toEqual(stats);
  });

  it('should handle errors when sending messages', async () => {
    const error = new Error('Send failed');
    offlineManager.sendMessage.mockRejectedValue(error);

    const { result } = renderHook(() => useOfflineManager(chatId, mockOnSendMessage));

    await act(async () => {
      await expect(result.current.sendMessage({ content: 'Hello' })).rejects.toThrow('Send failed');
    });
  });

  it('should handle missing chatId gracefully', () => {
    const { result } = renderHook(() => useOfflineManager(null, mockOnSendMessage));

    // Should not crash and should provide default values
    expect(result.current.isOnline).toBe(true);
    expect(result.current.cachedMessages).toEqual([]);
    
    // Actions should not throw errors
    act(() => {
      result.current.retryMessage('msg-1');
      result.current.removeFromQueue('msg-1');
      result.current.clearFailedMessages();
      result.current.clearCache();
    });

    // Should not have registered callback
    expect(offlineManager.registerSyncCallback).not.toHaveBeenCalled();
  });

  it('should handle missing send function gracefully', async () => {
    const { result } = renderHook(() => useOfflineManager(chatId, null));

    await act(async () => {
      await expect(result.current.sendMessage({ content: 'Hello' })).rejects.toThrow(
        'Chat ID and send function are required'
      );
    });
  });

  it('should prevent concurrent queue processing', async () => {
    const { result } = renderHook(() => useOfflineManager(chatId, mockOnSendMessage));

    // Start processing
    const promise1 = act(async () => {
      await result.current.processQueue();
    });

    // Try to process again while first is still running
    const promise2 = act(async () => {
      await result.current.processQueue();
    });

    await Promise.all([promise1, promise2]);

    // Should only call processQueue once due to processing flag
    expect(offlineManager.processQueue).toHaveBeenCalledTimes(1);
  });
});