import { renderHook, act } from '@testing-library/react';
import usePresence from '../usePresence';

// Mock the socket context
const mockSocket = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn()
};

jest.mock('../../contexts/SocketContext', () => ({
  useSocket: () => ({ socket: mockSocket })
}));

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

describe('usePresence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    navigator.onLine = true;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Basic Functionality', () => {
    it('should initialize with empty presence data', () => {
      const { result } = renderHook(() => 
        usePresence('chat123', 'group')
      );

      expect(result.current.userPresence).toEqual({});
      expect(result.current.isOnline).toBe(true);
    });

    it('should get user presence for non-existent user', () => {
      const { result } = renderHook(() => 
        usePresence('chat123', 'group')
      );

      const presence = result.current.getUserPresence('nonexistent');
      expect(presence).toEqual({
        isOnline: false,
        lastSeen: null
      });
    });

    it('should get online users count for empty presence', () => {
      const { result } = renderHook(() => 
        usePresence('chat123', 'group')
      );

      expect(result.current.getOnlineUsersCount()).toBe(0);
    });

    it('should get empty online users list', () => {
      const { result } = renderHook(() => 
        usePresence('chat123', 'group')
      );

      expect(result.current.getOnlineUsers()).toEqual([]);
    });
  });

  describe('Online Status Management', () => {
    it('should update online status', () => {
      const { result } = renderHook(() => 
        usePresence('chat123', 'group')
      );

      act(() => {
        result.current.updateOnlineStatus(false);
      });

      expect(result.current.isOnline).toBe(false);
      expect(mockSocket.emit).toHaveBeenCalledWith('presence_update', {
        isOnline: false,
        lastSeen: expect.any(Date),
        chatId: 'chat123'
      });
    });

    it('should handle browser online/offline events', () => {
      const { result } = renderHook(() => 
        usePresence('chat123', 'group')
      );

      // Simulate browser going offline
      act(() => {
        navigator.onLine = false;
        window.dispatchEvent(new Event('offline'));
      });

      expect(result.current.isOnline).toBe(false);

      // Simulate browser coming online
      act(() => {
        navigator.onLine = true;
        window.dispatchEvent(new Event('online'));
      });

      expect(result.current.isOnline).toBe(true);
    });
  });

  describe('User Presence Updates', () => {
    it('should update user presence', () => {
      const { result } = renderHook(() => 
        usePresence('chat123', 'group')
      );

      const presenceData = {
        isOnline: true,
        lastActivity: new Date(),
        name: 'John Doe'
      };

      act(() => {
        result.current.updateUserPresence('user1', presenceData);
      });

      expect(result.current.userPresence['user1']).toEqual({
        ...presenceData,
        updatedAt: expect.any(Date)
      });
    });

    it('should bulk update presence data', () => {
      const { result } = renderHook(() => 
        usePresence('chat123', 'group')
      );

      const bulkData = {
        'user1': { isOnline: true, name: 'John Doe' },
        'user2': { isOnline: false, name: 'Jane Smith' }
      };

      act(() => {
        result.current.updatePresenceData(bulkData);
      });

      expect(result.current.userPresence).toEqual(bulkData);
    });

    it('should clear presence data', () => {
      const { result } = renderHook(() => 
        usePresence('chat123', 'group')
      );

      // Add some data first
      act(() => {
        result.current.updateUserPresence('user1', { isOnline: true });
      });

      expect(Object.keys(result.current.userPresence)).toHaveLength(1);

      // Clear data
      act(() => {
        result.current.clearPresenceData();
      });

      expect(result.current.userPresence).toEqual({});
    });
  });

  describe('Last Seen Text Generation', () => {
    it('should return "Online" for online users', () => {
      const { result } = renderHook(() => 
        usePresence('chat123', 'group')
      );

      act(() => {
        result.current.updateUserPresence('user1', {
          isOnline: true,
          lastActivity: new Date()
        });
      });

      const lastSeenText = result.current.getLastSeenText('user1');
      expect(lastSeenText).toBe('Online');
    });

    it('should return "Last seen just now" for very recent activity', () => {
      const { result } = renderHook(() => 
        usePresence('chat123', 'group')
      );

      const now = new Date();
      act(() => {
        result.current.updateUserPresence('user1', {
          isOnline: false,
          lastSeen: now
        });
      });

      const lastSeenText = result.current.getLastSeenText('user1');
      expect(lastSeenText).toBe('Last seen just now');
    });

    it('should return minutes ago for recent activity', () => {
      const { result } = renderHook(() => 
        usePresence('chat123', 'group')
      );

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      act(() => {
        result.current.updateUserPresence('user1', {
          isOnline: false,
          lastSeen: fiveMinutesAgo
        });
      });

      const lastSeenText = result.current.getLastSeenText('user1');
      expect(lastSeenText).toBe('Last seen 5 minutes ago');
    });

    it('should return hours ago for older activity', () => {
      const { result } = renderHook(() => 
        usePresence('chat123', 'group')
      );

      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      act(() => {
        result.current.updateUserPresence('user1', {
          isOnline: false,
          lastSeen: twoHoursAgo
        });
      });

      const lastSeenText = result.current.getLastSeenText('user1');
      expect(lastSeenText).toBe('Last seen 2 hours ago');
    });

    it('should return days ago for very old activity', () => {
      const { result } = renderHook(() => 
        usePresence('chat123', 'group')
      );

      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      act(() => {
        result.current.updateUserPresence('user1', {
          isOnline: false,
          lastSeen: threeDaysAgo
        });
      });

      const lastSeenText = result.current.getLastSeenText('user1');
      expect(lastSeenText).toBe('Last seen 3 days ago');
    });

    it('should return date for very old activity', () => {
      const { result } = renderHook(() => 
        usePresence('chat123', 'group')
      );

      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      act(() => {
        result.current.updateUserPresence('user1', {
          isOnline: false,
          lastSeen: twoWeeksAgo
        });
      });

      const lastSeenText = result.current.getLastSeenText('user1');
      expect(lastSeenText).toContain('Last seen');
      expect(lastSeenText).toContain(twoWeeksAgo.toLocaleDateString());
    });

    it('should handle missing last seen data', () => {
      const { result } = renderHook(() => 
        usePresence('chat123', 'group')
      );

      act(() => {
        result.current.updateUserPresence('user1', {
          isOnline: false,
          lastSeen: null
        });
      });

      const lastSeenText = result.current.getLastSeenText('user1');
      expect(lastSeenText).toBe('Last seen a long time ago');
    });
  });

  describe('Online Users Management', () => {
    it('should count online users correctly', () => {
      const { result } = renderHook(() => 
        usePresence('chat123', 'group')
      );

      act(() => {
        result.current.updateUserPresence('user1', {
          isOnline: true,
          lastActivity: new Date()
        });
        result.current.updateUserPresence('user2', {
          isOnline: true,
          lastActivity: new Date()
        });
        result.current.updateUserPresence('user3', {
          isOnline: false,
          lastSeen: new Date()
        });
      });

      expect(result.current.getOnlineUsersCount()).toBe(2);
    });

    it('should return 0 for private chats', () => {
      const { result } = renderHook(() => 
        usePresence('chat123', 'private')
      );

      act(() => {
        result.current.updateUserPresence('user1', {
          isOnline: true,
          lastActivity: new Date()
        });
      });

      expect(result.current.getOnlineUsersCount()).toBe(0);
    });

    it('should get list of online users', () => {
      const { result } = renderHook(() => 
        usePresence('chat123', 'group')
      );

      const now = new Date();
      act(() => {
        result.current.updateUserPresence('user1', {
          isOnline: true,
          lastActivity: now,
          name: 'John Doe'
        });
        result.current.updateUserPresence('user2', {
          isOnline: false,
          lastSeen: now,
          name: 'Jane Smith'
        });
      });

      const onlineUsers = result.current.getOnlineUsers();
      expect(onlineUsers).toEqual([
        {
          userId: 'user1',
          name: 'John Doe',
          lastActivity: now
        }
      ]);
    });

    it('should filter out users with old activity', () => {
      const { result } = renderHook(() => 
        usePresence('chat123', 'group')
      );

      const oldActivity = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      act(() => {
        result.current.updateUserPresence('user1', {
          isOnline: true,
          lastActivity: oldActivity
        });
      });

      // Should still be considered online (within 2 minute threshold)
      expect(result.current.getOnlineUsersCount()).toBe(1);
    });
  });

  describe('Socket Event Handling', () => {
    it('should listen for presence events', () => {
      renderHook(() => usePresence('chat123', 'group'));

      expect(mockSocket.on).toHaveBeenCalledWith('presence_updated', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('user_joined_chat', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('user_left_chat', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('bulk_presence_update', expect.any(Function));
    });

    it('should request initial presence data', () => {
      renderHook(() => usePresence('chat123', 'group'));

      expect(mockSocket.emit).toHaveBeenCalledWith('get_presence_data', {
        chatId: 'chat123'
      });
    });

    it('should handle presence update events', () => {
      let presenceUpdateHandler;
      mockSocket.on.mockImplementation((event, handler) => {
        if (event === 'presence_updated') {
          presenceUpdateHandler = handler;
        }
      });

      const { result } = renderHook(() => 
        usePresence('chat123', 'group')
      );

      // Simulate presence update event
      act(() => {
        presenceUpdateHandler({
          userId: 'user1',
          isOnline: true,
          lastActivity: new Date(),
          name: 'John Doe',
          chatId: 'chat123'
        });
      });

      expect(result.current.userPresence['user1']).toEqual({
        isOnline: true,
        lastActivity: expect.any(Date),
        name: 'John Doe',
        updatedAt: expect.any(Date)
      });
    });

    it('should ignore events from other chats', () => {
      let presenceUpdateHandler;
      mockSocket.on.mockImplementation((event, handler) => {
        if (event === 'presence_updated') {
          presenceUpdateHandler = handler;
        }
      });

      const { result } = renderHook(() => 
        usePresence('chat123', 'group')
      );

      // Simulate presence update from different chat
      act(() => {
        presenceUpdateHandler({
          userId: 'user1',
          isOnline: true,
          chatId: 'different-chat'
        });
      });

      expect(result.current.userPresence['user1']).toBeUndefined();
    });

    it('should clean up event listeners on unmount', () => {
      const { unmount } = renderHook(() => 
        usePresence('chat123', 'group')
      );

      unmount();

      expect(mockSocket.off).toHaveBeenCalledWith('presence_updated', expect.any(Function));
      expect(mockSocket.off).toHaveBeenCalledWith('user_joined_chat', expect.any(Function));
      expect(mockSocket.off).toHaveBeenCalledWith('user_left_chat', expect.any(Function));
      expect(mockSocket.off).toHaveBeenCalledWith('bulk_presence_update', expect.any(Function));
    });
  });

  describe('Activity Tracking', () => {
    it('should update activity', () => {
      const { result } = renderHook(() => 
        usePresence('chat123', 'group')
      );

      act(() => {
        result.current.updateActivity();
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('activity_update', {
        chatId: 'chat123',
        lastActivity: expect.any(Date)
      });
    });

    it('should not emit activity when offline', () => {
      const { result } = renderHook(() => 
        usePresence('chat123', 'group')
      );

      act(() => {
        result.current.updateOnlineStatus(false);
        result.current.updateActivity();
      });

      // Should only have the presence_update call, not activity_update
      expect(mockSocket.emit).toHaveBeenCalledTimes(1);
      expect(mockSocket.emit).toHaveBeenCalledWith('presence_update', expect.any(Object));
    });
  });

  describe('Heartbeat System', () => {
    it('should emit heartbeat when online', () => {
      renderHook(() => usePresence('chat123', 'group'));

      // Fast forward to trigger heartbeat
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('presence_heartbeat', {
        chatId: 'chat123',
        lastActivity: expect.any(Date)
      });
    });

    it('should not emit heartbeat when offline', () => {
      const { result } = renderHook(() => 
        usePresence('chat123', 'group')
      );

      act(() => {
        result.current.updateOnlineStatus(false);
      });

      // Clear previous calls
      mockSocket.emit.mockClear();

      // Fast forward to trigger heartbeat
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      expect(mockSocket.emit).not.toHaveBeenCalledWith('presence_heartbeat', expect.any(Object));
    });
  });

  describe('Chat Change Handling', () => {
    it('should clear presence data when chat changes', () => {
      const { result, rerender } = renderHook(
        ({ chatId }) => usePresence(chatId, 'group'),
        { initialProps: { chatId: 'chat123' } }
      );

      // Add some presence data
      act(() => {
        result.current.updateUserPresence('user1', { isOnline: true });
      });

      expect(Object.keys(result.current.userPresence)).toHaveLength(1);

      // Change chat
      rerender({ chatId: 'chat456' });

      expect(result.current.userPresence).toEqual({});
    });
  });

  describe('Error Handling', () => {
    it('should handle missing socket gracefully', () => {
      // Mock useSocket to return null socket
      const originalMock = require('../../contexts/SocketContext');
      originalMock.useSocket = jest.fn(() => ({ socket: null }));

      const { result } = renderHook(() => 
        usePresence('chat123', 'group')
      );

      // Should not throw errors
      expect(() => {
        act(() => {
          result.current.updateOnlineStatus(false);
          result.current.updateActivity();
        });
      }).not.toThrow();

      expect(result.current.userPresence).toEqual({});
    });
  });
});