import { renderHook, act, waitFor } from '@testing-library/react';
import { useOfflineQueue } from '../useOfflineQueue';

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

describe('useOfflineQueue', () => {
  const mockOnSendMessage = jest.fn();

  const defaultProps = {
    onSendMessage: mockOnSendMessage,
    maxRetries: 3,
    retryDelay: 100,
    maxQueueSize: 10
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    navigator.onLine = true;
    mockOnSendMessage.mockResolvedValue({ id: 'sent-msg', status: 'sent' });
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useOfflineQueue(defaultProps));

    expect(result.current.isOnline).toBe(true);
    expect(result.current.queue).toEqual([]);
    expect(result.current.processing).toBe(false);
  });

  it('should send message immediately when online', async () => {
    const { result } = renderHook(() => useOfflineQueue(defaultProps));

    const messageData = {
      chatId: 'chat-1',
      content: 'Hello',
      type: 'text'
    };

    let sentMessage;
    await act(async () => {
      sentMessage = await result.current.sendMessage(messageData);
    });

    expect(mockOnSendMessage).toHaveBeenCalledWith(messageData);
    expect(sentMessage).toEqual({ id: 'sent-msg', status: 'sent' });
    expect(result.current.queue).toHaveLength(0);
  });

  it('should queue message when offline', async () => {
    navigator.onLine = false;
    const { result } = renderHook(() => useOfflineQueue(defaultProps));

    const messageData = {
      chatId: 'chat-1',
      content: 'Hello',
      type: 'text'
    };

    let queuedMessage;
    await act(async () => {
      queuedMessage = await result.current.sendMessage(messageData);
    });

    expect(mockOnSendMessage).not.toHaveBeenCalled();
    expect(queuedMessage.isQueued).toBe(true);
    expect(result.current.queue).toHaveLength(1);
    expect(result.current.queue[0].status).toBe('queued');
  });

  it('should process queue when coming online', async () => {
    // Start offline
    navigator.onLine = false;
    const { result } = renderHook(() => useOfflineQueue(defaultProps));

    // Queue a message
    const messageData = {
      chatId: 'chat-1',
      content: 'Hello',
      type: 'text'
    };

    await act(async () => {
      await result.current.sendMessage(messageData);
    });

    expect(result.current.queue).toHaveLength(1);

    // Go online
    navigator.onLine = true;
    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => {
      expect(mockOnSendMessage).toHaveBeenCalled();
      expect(result.current.queue).toHaveLength(0);
    });
  });

  it('should retry failed messages with exponential backoff', async () => {
    mockOnSendMessage.mockRejectedValueOnce(new Error('Network error'));
    mockOnSendMessage.mockResolvedValueOnce({ id: 'sent-msg', status: 'sent' });

    const { result } = renderHook(() => useOfflineQueue(defaultProps));

    const messageData = {
      chatId: 'chat-1',
      content: 'Hello',
      type: 'text'
    };

    // First attempt should fail and queue the message
    await act(async () => {
      try {
        await result.current.sendMessage(messageData);
      } catch (error) {
        expect(error.message).toContain('Message queued due to send failure');
      }
    });

    expect(result.current.queue).toHaveLength(1);
    expect(result.current.queue[0].status).toBe('retry_pending');

    // Wait for retry
    await waitFor(() => {
      expect(mockOnSendMessage).toHaveBeenCalledTimes(2);
      expect(result.current.queue).toHaveLength(0);
    }, { timeout: 1000 });
  });

  it('should mark message as failed after max retries', async () => {
    mockOnSendMessage.mockRejectedValue(new Error('Persistent error'));

    const { result } = renderHook(() => useOfflineQueue(defaultProps));

    const messageData = {
      chatId: 'chat-1',
      content: 'Hello',
      type: 'text'
    };

    await act(async () => {
      try {
        await result.current.sendMessage(messageData);
      } catch (error) {
        // Expected to fail
      }
    });

    // Wait for all retries to complete
    await waitFor(() => {
      expect(result.current.queue[0]?.status).toBe('failed');
    }, { timeout: 2000 });

    expect(mockOnSendMessage).toHaveBeenCalledTimes(4); // Initial + 3 retries
  });

  it('should retry failed message manually', async () => {
    const { result } = renderHook(() => useOfflineQueue(defaultProps));

    // Add a failed message to queue
    act(() => {
      result.current.queue.push({
        id: 'failed-msg',
        chatId: 'chat-1',
        content: 'Hello',
        type: 'text',
        status: 'failed',
        retryCount: 3
      });
    });

    await act(async () => {
      result.current.retryMessage('failed-msg');
    });

    await waitFor(() => {
      expect(mockOnSendMessage).toHaveBeenCalled();
    });
  });

  it('should clear failed messages', () => {
    const { result } = renderHook(() => useOfflineQueue(defaultProps));

    // Add mixed status messages
    act(() => {
      result.current.queue.push(
        { id: '1', status: 'queued' },
        { id: '2', status: 'failed' },
        { id: '3', status: 'sending' },
        { id: '4', status: 'failed' }
      );
    });

    act(() => {
      result.current.clearFailedMessages();
    });

    expect(result.current.queue).toHaveLength(2);
    expect(result.current.queue.every(msg => msg.status !== 'failed')).toBe(true);
  });

  it('should provide correct queue statistics', () => {
    const { result } = renderHook(() => useOfflineQueue(defaultProps));

    act(() => {
      result.current.queue.push(
        { id: '1', status: 'queued' },
        { id: '2', status: 'queued' },
        { id: '3', status: 'sending' },
        { id: '4', status: 'failed' },
        { id: '5', status: 'retry_pending' }
      );
    });

    const stats = result.current.getQueueStats();

    expect(stats).toEqual({
      total: 5,
      queued: 2,
      sending: 1,
      retryPending: 1,
      failed: 1
    });
  });

  it('should save and load queue from localStorage', () => {
    const savedQueue = JSON.stringify([
      { id: '1', content: 'Saved message', status: 'queued' }
    ]);
    localStorageMock.getItem.mockReturnValue(savedQueue);

    const { result } = renderHook(() => useOfflineQueue(defaultProps));

    expect(result.current.queue).toHaveLength(1);
    expect(result.current.queue[0].content).toBe('Saved message');
  });

  it('should handle localStorage errors gracefully', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('Storage error');
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() => useOfflineQueue(defaultProps));

    expect(result.current.queue).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should respect max queue size', async () => {
    navigator.onLine = false;
    const { result } = renderHook(() => useOfflineQueue({
      ...defaultProps,
      maxQueueSize: 2
    }));

    // Add messages up to limit
    await act(async () => {
      await result.current.sendMessage({ content: 'Message 1' });
      await result.current.sendMessage({ content: 'Message 2' });
    });

    expect(result.current.queue).toHaveLength(2);

    // Try to add one more - should throw error
    await act(async () => {
      try {
        await result.current.sendMessage({ content: 'Message 3' });
        fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toBe('Message queue is full');
      }
    });

    expect(result.current.queue).toHaveLength(2);
  });
});