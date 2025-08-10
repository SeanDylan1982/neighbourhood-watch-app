import { renderHook, act } from '@testing-library/react';
import { useUserBlocking } from '../useUserBlocking';
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

describe('useUserBlocking', () => {
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
      json: () => Promise.resolve({ blockedUserIds: [] }),
    });

    const { result } = renderHook(() => useUserBlocking(mockUserId));

    expect(result.current.blockedUsers).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should load blocked users on mount', async () => {
    const mockBlockedUsers = ['user-1', 'user-2'];
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ blockedUserIds: mockBlockedUsers }),
    });

    const { result } = renderHook(() => useUserBlocking(mockUserId));

    await act(async () => {
      // Wait for the effect to complete
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(fetch).toHaveBeenCalledWith(`/api/users/${mockUserId}/blocked`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      },
    });

    expect(result.current.blockedUsers).toEqual(mockBlockedUsers);
  });

  it('should handle loading blocked users error', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useUserBlocking(mockUserId));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.error).toBe('Network error');
  });

  it('should block a user successfully', async () => {
    const targetUserId = 'user-to-block';
    
    // Mock initial load
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ blockedUserIds: [] }),
    });

    // Mock block request
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const { result } = renderHook(() => useUserBlocking(mockUserId));

    await act(async () => {
      const success = await result.current.blockUser(targetUserId, 'spam');
      expect(success).toBe(true);
    });

    expect(fetch).toHaveBeenCalledWith(`/api/users/${mockUserId}/block`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      },
      body: JSON.stringify({
        blockedUserId: targetUserId,
        reason: 'spam',
      }),
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('user_blocked', {
      blockedUserId: targetUserId,
      blockedBy: mockUserId,
    });

    expect(result.current.isUserBlocked(targetUserId)).toBe(true);
  });

  it('should not block current user', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ blockedUserIds: [] }),
    });

    const { result } = renderHook(() => useUserBlocking(mockUserId));

    await act(async () => {
      const success = await result.current.blockUser(mockUserId);
      expect(success).toBe(false);
    });

    expect(fetch).not.toHaveBeenCalledWith(expect.stringContaining('/block'), expect.any(Object));
  });

  it('should unblock a user successfully', async () => {
    const targetUserId = 'user-to-unblock';
    
    // Mock initial load with blocked user
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ blockedUserIds: [targetUserId] }),
    });

    // Mock unblock request
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const { result } = renderHook(() => useUserBlocking(mockUserId));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      const success = await result.current.unblockUser(targetUserId);
      expect(success).toBe(true);
    });

    expect(fetch).toHaveBeenCalledWith(`/api/users/${mockUserId}/unblock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      },
      body: JSON.stringify({
        blockedUserId: targetUserId,
      }),
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('user_unblocked', {
      unblockedUserId: targetUserId,
      unblockedBy: mockUserId,
    });

    expect(result.current.isUserBlocked(targetUserId)).toBe(false);
  });

  it('should filter blocked messages', async () => {
    const blockedUserId = 'blocked-user';
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ blockedUserIds: [blockedUserId] }),
    });

    const { result } = renderHook(() => useUserBlocking(mockUserId));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const messages = [
      { id: '1', senderId: 'user-1', content: 'Hello' },
      { id: '2', senderId: blockedUserId, content: 'Blocked message' },
      { id: '3', senderId: 'user-2', content: 'Another message' },
    ];

    const filteredMessages = result.current.filterBlockedMessages(messages);

    expect(filteredMessages).toHaveLength(2);
    expect(filteredMessages.find(m => m.senderId === blockedUserId)).toBeUndefined();
  });

  it('should filter blocked chats', async () => {
    const blockedUserId = 'blocked-user';
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ blockedUserIds: [blockedUserId] }),
    });

    const { result } = renderHook(() => useUserBlocking(mockUserId));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const chats = [
      { 
        id: 'chat-1', 
        type: 'private', 
        participantIds: [mockUserId, 'user-1'] 
      },
      { 
        id: 'chat-2', 
        type: 'private', 
        participantIds: [mockUserId, blockedUserId] 
      },
      { 
        id: 'chat-3', 
        type: 'group', 
        participantIds: [mockUserId, blockedUserId, 'user-2'] 
      },
    ];

    const filteredChats = result.current.filterBlockedChats(chats);

    expect(filteredChats).toHaveLength(2);
    expect(filteredChats.find(c => c.id === 'chat-2')).toBeUndefined();
    expect(filteredChats.find(c => c.id === 'chat-3')).toBeDefined(); // Group chats not filtered
  });

  it('should check if user can send message', async () => {
    const blockedUserId = 'blocked-user';
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ blockedUserIds: [blockedUserId] }),
    });

    const { result } = renderHook(() => useUserBlocking(mockUserId));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const privateChat = {
      type: 'private',
      participantIds: [mockUserId, blockedUserId],
    };

    const groupChat = {
      type: 'group',
      participantIds: [mockUserId, blockedUserId, 'user-2'],
    };

    expect(result.current.canSendMessage(privateChat)).toBe(false);
    expect(result.current.canSendMessage(groupChat)).toBe(true);
  });
});