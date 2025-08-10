import { renderHook, act, waitFor } from '@testing-library/react';
import { useMessageCache } from '../useMessageCache';

describe('useMessageCache', () => {
  const mockMessages = Array.from({ length: 50 }, (_, i) => ({
    id: `msg-${i}`,
    content: `Message ${i}`,
    timestamp: new Date(Date.now() - i * 1000)
  }));

  const mockOnLoadMessages = jest.fn();

  const defaultProps = {
    chatId: 'chat-1',
    pageSize: 20,
    maxCacheSize: 100,
    onLoadMessages: mockOnLoadMessages
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnLoadMessages.mockResolvedValue({
      messages: mockMessages.slice(0, 20),
      hasMore: true
    });
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useMessageCache(defaultProps));

    expect(result.current.hasMoreBefore).toBe(true);
    expect(result.current.hasMoreAfter).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.cacheSize).toBe(0);
  });

  it('should load a page successfully', async () => {
    const { result } = renderHook(() => useMessageCache(defaultProps));

    let loadResult;
    await act(async () => {
      loadResult = await result.current.loadPage(0);
    });

    expect(mockOnLoadMessages).toHaveBeenCalledWith({
      pageIndex: 0,
      pageSize: 20,
      direction: 'before',
      chatId: 'chat-1'
    });

    expect(loadResult).toEqual({
      messages: mockMessages.slice(0, 20),
      hasMore: true
    });

    expect(result.current.cacheSize).toBe(1);
  });

  it('should return cached page without loading', async () => {
    const { result } = renderHook(() => useMessageCache(defaultProps));

    // Load page first time
    await act(async () => {
      await result.current.loadPage(0);
    });

    // Load same page again
    let cachedResult;
    await act(async () => {
      cachedResult = result.current.getPage(0);
    });

    expect(cachedResult).toBeTruthy();
    expect(cachedResult.messages).toHaveLength(20);
    expect(mockOnLoadMessages).toHaveBeenCalledTimes(1); // Should not call again
  });

  it('should handle loading errors gracefully', async () => {
    mockOnLoadMessages.mockRejectedValue(new Error('Network error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() => useMessageCache(defaultProps));

    let loadResult;
    await act(async () => {
      loadResult = await result.current.loadPage(0);
    });

    expect(loadResult).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith('Failed to load page:', expect.any(Error));
    
    consoleSpy.mockRestore();
  });

  it('should add new message to cache', async () => {
    const { result } = renderHook(() => useMessageCache(defaultProps));

    // Load initial page
    await act(async () => {
      await result.current.loadPage(0);
    });

    const newMessage = {
      id: 'new-msg',
      content: 'New message',
      timestamp: new Date()
    };

    act(() => {
      result.current.addMessage(newMessage);
    });

    const page = result.current.getPage(0);
    expect(page.messages[0]).toEqual(newMessage);
  });

  it('should update message in cache', async () => {
    const { result } = renderHook(() => useMessageCache(defaultProps));

    // Load initial page
    await act(async () => {
      await result.current.loadPage(0);
    });

    const updates = { content: 'Updated content' };

    act(() => {
      result.current.updateMessage('msg-0', updates);
    });

    const page = result.current.getPage(0);
    const updatedMessage = page.messages.find(m => m.id === 'msg-0');
    expect(updatedMessage.content).toBe('Updated content');
  });

  it('should remove message from cache', async () => {
    const { result } = renderHook(() => useMessageCache(defaultProps));

    // Load initial page
    await act(async () => {
      await result.current.loadPage(0);
    });

    act(() => {
      result.current.removeMessage('msg-0');
    });

    const page = result.current.getPage(0);
    const removedMessage = page.messages.find(m => m.id === 'msg-0');
    expect(removedMessage).toBeUndefined();
  });

  it('should get messages in range', async () => {
    const { result } = renderHook(() => useMessageCache(defaultProps));

    // Load multiple pages
    await act(async () => {
      await result.current.loadPage(0);
      await result.current.loadPage(1);
    });

    const messages = result.current.getMessagesInRange(0, 1);
    expect(messages).toHaveLength(40); // 20 messages per page
  });

  it('should clear cache when chatId changes', () => {
    const { result, rerender } = renderHook(
      ({ chatId }) => useMessageCache({ ...defaultProps, chatId }),
      { initialProps: { chatId: 'chat-1' } }
    );

    act(() => {
      result.current.addMessage({ id: 'test', content: 'test' });
    });

    expect(result.current.cacheSize).toBe(1);

    rerender({ chatId: 'chat-2' });

    expect(result.current.cacheSize).toBe(0);
  });

  it('should prevent duplicate loading of same page', async () => {
    const { result } = renderHook(() => useMessageCache(defaultProps));

    // Start loading same page multiple times
    await act(async () => {
      const promises = [
        result.current.loadPage(0),
        result.current.loadPage(0),
        result.current.loadPage(0)
      ];
      await Promise.all(promises);
    });

    expect(mockOnLoadMessages).toHaveBeenCalledTimes(1);
  });

  it('should evict LRU pages when cache is full', async () => {
    const smallCacheProps = { ...defaultProps, maxCacheSize: 2 };
    const { result } = renderHook(() => useMessageCache(smallCacheProps));

    // Load pages to fill cache
    await act(async () => {
      await result.current.loadPage(0);
      await result.current.loadPage(1);
      await result.current.loadPage(2); // Should evict page 0
    });

    expect(result.current.cacheSize).toBe(2);
    expect(result.current.getPage(0)).toBeNull(); // Should be evicted
    expect(result.current.getPage(1)).toBeTruthy();
    expect(result.current.getPage(2)).toBeTruthy();
  });
});