import { renderHook, act } from '@testing-library/react';
import { useAutoDelete } from '../useAutoDelete';
import { useChat } from '../useChat';

// Mock the useChat hook
jest.mock('../useChat', () => ({
  useChat: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('useAutoDelete', () => {
  const mockChatId = 'chat-123';
  const mockUserId = 'user-123';
  const mockSocket = {
    emit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useChat.mockReturnValue({ socket: mockSocket });
    mockLocalStorage.getItem.mockReturnValue('mock-token');
  });

  it('should initialize with default values', () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ settings: { enabled: false, period: 24 } }),
    });

    const { result } = renderHook(() => useAutoDelete(mockChatId, mockUserId));

    expect(result.current.autoDeleteSettings.enabled).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should load auto-delete settings on mount', async () => {
    const mockSettings = {
      enabled: true,
      period: 168,
      enabledAt: '2023-01-01T00:00:00Z',
      enabledBy: mockUserId,
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ settings: mockSettings }),
    });

    const { result } = renderHook(() => useAutoDelete(mockChatId, mockUserId));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(fetch).toHaveBeenCalledWith(`/api/chats/${mockChatId}/auto-delete`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      },
    });

    expect(result.current.autoDeleteSettings).toEqual(mockSettings);
  });

  it('should handle loading settings error', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useAutoDelete(mockChatId, mockUserId));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.error).toBe('Network error');
  });

  it('should enable auto-delete successfully', async () => {
    const period = 24;
    const applyToExisting = true;

    // Mock initial load
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ settings: { enabled: false, period: 24 } }),
    });

    // Mock enable request
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        settings: {
          enabled: true,
          period,
          applyToExisting,
          enabledAt: '2023-01-01T00:00:00Z',
          enabledBy: mockUserId,
        },
      }),
    });

    const { result } = renderHook(() => useAutoDelete(mockChatId, mockUserId));

    await act(async () => {
      const success = await result.current.enableAutoDelete(period, applyToExisting);
      expect(success).toBe(true);
    });

    expect(fetch).toHaveBeenCalledWith(`/api/chats/${mockChatId}/auto-delete`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      },
      body: JSON.stringify({
        settings: {
          enabled: true,
          period,
          applyToExisting,
          enabledAt: expect.any(String),
          enabledBy: mockUserId,
        },
        updatedBy: mockUserId,
      }),
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('auto_delete_settings_updated', {
      chatId: mockChatId,
      settings: expect.objectContaining({
        enabled: true,
        period,
      }),
      updatedBy: mockUserId,
    });

    expect(result.current.autoDeleteSettings.enabled).toBe(true);
  });

  it('should disable auto-delete successfully', async () => {
    // Mock initial load with enabled settings
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        settings: { enabled: true, period: 24, enabledBy: mockUserId },
      }),
    });

    // Mock disable request
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        settings: {
          enabled: false,
          period: 24,
          disabledAt: '2023-01-01T01:00:00Z',
          disabledBy: mockUserId,
        },
      }),
    });

    const { result } = renderHook(() => useAutoDelete(mockChatId, mockUserId));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      const success = await result.current.disableAutoDelete();
      expect(success).toBe(true);
    });

    expect(result.current.autoDeleteSettings.enabled).toBe(false);
  });

  it('should calculate expiration time correctly', async () => {
    const mockSettings = {
      enabled: true,
      period: 24, // 24 hours
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ settings: mockSettings }),
    });

    const { result } = renderHook(() => useAutoDelete(mockChatId, mockUserId));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const messageTimestamp = '2023-01-01T00:00:00Z';
    const expirationTime = result.current.calculateExpirationTime(messageTimestamp);

    expect(expirationTime).toBeInstanceOf(Date);
    expect(expirationTime.getTime()).toBe(
      new Date(messageTimestamp).getTime() + (24 * 60 * 60 * 1000)
    );
  });

  it('should determine if message should be deleted', async () => {
    const mockSettings = {
      enabled: true,
      period: 1, // 1 hour
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ settings: mockSettings }),
    });

    const { result } = renderHook(() => useAutoDelete(mockChatId, mockUserId));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Message from 2 hours ago (should be deleted)
    const oldMessage = {
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    };

    // Message from 30 minutes ago (should not be deleted)
    const recentMessage = {
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    };

    expect(result.current.shouldMessageBeDeleted(oldMessage)).toBe(true);
    expect(result.current.shouldMessageBeDeleted(recentMessage)).toBe(false);
  });

  it('should get time until deletion', async () => {
    const mockSettings = {
      enabled: true,
      period: 1, // 1 hour
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ settings: mockSettings }),
    });

    const { result } = renderHook(() => useAutoDelete(mockChatId, mockUserId));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Message from 30 minutes ago (30 minutes remaining)
    const messageTimestamp = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const timeRemaining = result.current.getTimeUntilDeletion(messageTimestamp);

    expect(timeRemaining).toBeGreaterThan(25 * 60 * 1000); // At least 25 minutes
    expect(timeRemaining).toBeLessThan(35 * 60 * 1000); // At most 35 minutes
  });

  it('should format time remaining correctly', () => {
    const { result } = renderHook(() => useAutoDelete(mockChatId, mockUserId));

    expect(result.current.formatTimeRemaining(3661000)).toBe('1h 1m'); // 1 hour 1 minute 1 second
    expect(result.current.formatTimeRemaining(61000)).toBe('1m 1s'); // 1 minute 1 second
    expect(result.current.formatTimeRemaining(30000)).toBe('30s'); // 30 seconds
    expect(result.current.formatTimeRemaining(null)).toBe(null);
  });

  it('should filter expired messages', async () => {
    const mockSettings = {
      enabled: true,
      period: 1, // 1 hour
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ settings: mockSettings }),
    });

    const { result } = renderHook(() => useAutoDelete(mockChatId, mockUserId));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const messages = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago (expired)
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago (not expired)
      },
    ];

    const filteredMessages = result.current.filterExpiredMessages(messages);

    expect(filteredMessages).toHaveLength(1);
    expect(filteredMessages[0].id).toBe('2');
  });

  it('should cleanup expired messages', async () => {
    const mockSettings = {
      enabled: true,
      period: 24,
    };

    // Mock initial load
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ settings: mockSettings }),
    });

    // Mock cleanup request
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ deletedCount: 5 }),
    });

    const { result } = renderHook(() => useAutoDelete(mockChatId, mockUserId));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      const success = await result.current.cleanupExpiredMessages();
      expect(success).toBe(true);
    });

    expect(fetch).toHaveBeenCalledWith(`/api/chats/${mockChatId}/cleanup-expired`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      },
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('messages_auto_deleted', {
      chatId: mockChatId,
      deletedCount: 5,
    });
  });

  it('should get correct status text', async () => {
    // Test disabled state
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ settings: { enabled: false, period: 24 } }),
    });

    const { result, rerender } = renderHook(() => useAutoDelete(mockChatId, mockUserId));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.getStatusText()).toBe('Auto-delete is disabled');

    // Test enabled state
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ settings: { enabled: true, period: 168 } }),
    });

    rerender();

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.getStatusText()).toBe('Messages auto-delete after 7 days');
  });
});