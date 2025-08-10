import { renderHook, act } from '@testing-library/react';
import { useReporting } from '../useReporting';
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

describe('useReporting', () => {
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
    const { result } = renderHook(() => useReporting(mockUserId));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should report a message successfully', async () => {
    const mockMessageId = 'message-123';
    const mockChatId = 'chat-123';
    const mockReason = 'spam';
    const mockDescription = 'This is spam content';

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ reportId: 'report-123' }),
    });

    const { result } = renderHook(() => useReporting(mockUserId));

    await act(async () => {
      const success = await result.current.reportMessage(
        mockMessageId,
        mockChatId,
        mockReason,
        mockDescription
      );
      expect(success).toBe(true);
    });

    expect(fetch).toHaveBeenCalledWith('/api/reports/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      },
      body: JSON.stringify({
        messageId: mockMessageId,
        chatId: mockChatId,
        reason: mockReason,
        description: mockDescription,
        reportedBy: mockUserId,
      }),
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('message_reported', {
      reportId: 'report-123',
      messageId: mockMessageId,
      chatId: mockChatId,
      reason: mockReason,
      reportedBy: mockUserId,
    });
  });

  it('should handle message reporting failure', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useReporting(mockUserId));

    await act(async () => {
      const success = await result.current.reportMessage('msg-1', 'chat-1', 'spam');
      expect(success).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
  });

  it('should not report message with invalid parameters', async () => {
    const { result } = renderHook(() => useReporting(mockUserId));

    await act(async () => {
      const success = await result.current.reportMessage('', 'chat-1', 'spam');
      expect(success).toBe(false);
    });

    expect(fetch).not.toHaveBeenCalled();
  });

  it('should report a user successfully', async () => {
    const mockReportedUserId = 'reported-user-123';
    const mockReason = 'harassment';
    const mockDescription = 'User is harassing others';
    const mockEvidence = ['message-1', 'message-2'];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ reportId: 'report-456' }),
    });

    const { result } = renderHook(() => useReporting(mockUserId));

    await act(async () => {
      const success = await result.current.reportUser(
        mockReportedUserId,
        mockReason,
        mockDescription,
        mockEvidence
      );
      expect(success).toBe(true);
    });

    expect(fetch).toHaveBeenCalledWith('/api/reports/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      },
      body: JSON.stringify({
        reportedUserId: mockReportedUserId,
        reason: mockReason,
        description: mockDescription,
        evidence: mockEvidence,
        reportedBy: mockUserId,
      }),
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('user_reported', {
      reportId: 'report-456',
      reportedUserId: mockReportedUserId,
      reason: mockReason,
      reportedBy: mockUserId,
    });
  });

  it('should not report current user', async () => {
    const { result } = renderHook(() => useReporting(mockUserId));

    await act(async () => {
      const success = await result.current.reportUser(mockUserId, 'harassment');
      expect(success).toBe(false);
    });

    expect(fetch).not.toHaveBeenCalled();
  });

  it('should get user reports', async () => {
    const mockReports = [
      { id: 'report-1', type: 'message', reason: 'spam' },
      { id: 'report-2', type: 'user', reason: 'harassment' },
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ reports: mockReports }),
    });

    const { result } = renderHook(() => useReporting(mockUserId));

    await act(async () => {
      const reports = await result.current.getUserReports();
      expect(reports).toEqual(mockReports);
    });

    expect(fetch).toHaveBeenCalledWith(`/api/reports/user/${mockUserId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      },
    });
  });

  it('should handle get user reports failure', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useReporting(mockUserId));

    await act(async () => {
      const reports = await result.current.getUserReports();
      expect(reports).toEqual([]);
    });

    expect(result.current.error).toBe('Network error');
  });

  it('should check if message has been reported', async () => {
    const mockMessageId = 'message-123';

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ hasReported: true }),
    });

    const { result } = renderHook(() => useReporting(mockUserId));

    await act(async () => {
      const hasReported = await result.current.hasReportedMessage(mockMessageId);
      expect(hasReported).toBe(true);
    });

    expect(fetch).toHaveBeenCalledWith(`/api/reports/message/${mockMessageId}/check`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      },
    });
  });

  it('should check if user has been reported', async () => {
    const mockReportedUserId = 'reported-user-123';

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ hasReported: false }),
    });

    const { result } = renderHook(() => useReporting(mockUserId));

    await act(async () => {
      const hasReported = await result.current.hasReportedUser(mockReportedUserId);
      expect(hasReported).toBe(false);
    });

    expect(fetch).toHaveBeenCalledWith(`/api/reports/user/${mockReportedUserId}/check`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      },
    });
  });

  it('should handle check report status failure gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useReporting(mockUserId));

    await act(async () => {
      const hasReported = await result.current.hasReportedMessage('message-123');
      expect(hasReported).toBe(false);
    });
  });
});