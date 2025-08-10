import { renderHook, act } from '@testing-library/react';
import useTypingIndicator from '../useTypingIndicator';

// Mock the socket context
const mockSocket = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn()
};

jest.mock('../../contexts/SocketContext', () => ({
  useSocket: () => ({ socket: mockSocket })
}));

describe('useTypingIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Group Chat Typing', () => {
    it('should initialize with empty typing users and not typing', () => {
      const { result } = renderHook(() => 
        useTypingIndicator('chat123', 'group')
      );

      expect(result.current.typingUsers).toEqual([]);
      expect(result.current.isTyping).toBe(false);
    });

    it('should start typing and emit typing_start event', () => {
      const { result } = renderHook(() => 
        useTypingIndicator('chat123', 'group')
      );

      act(() => {
        result.current.startTyping();
      });

      expect(result.current.isTyping).toBe(true);
      expect(mockSocket.emit).toHaveBeenCalledWith('typing_start', 'chat123');
    });

    it('should stop typing and emit typing_stop event', () => {
      const { result } = renderHook(() => 
        useTypingIndicator('chat123', 'group')
      );

      // Start typing first
      act(() => {
        result.current.startTyping();
      });

      // Then stop typing
      act(() => {
        result.current.stopTyping();
      });

      expect(result.current.isTyping).toBe(false);
      expect(mockSocket.emit).toHaveBeenCalledWith('typing_stop', 'chat123');
    });

    it('should automatically stop typing after timeout', async () => {
      const { result } = renderHook(() => 
        useTypingIndicator('chat123', 'group')
      );

      act(() => {
        result.current.startTyping();
      });

      expect(result.current.isTyping).toBe(true);

      // Fast forward time by 3 seconds
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Wait for state updates to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isTyping).toBe(false);
      expect(mockSocket.emit).toHaveBeenCalledWith('typing_stop', 'chat123');
    });

    it('should handle typing input with debouncing', () => {
      const { result } = renderHook(() => 
        useTypingIndicator('chat123', 'group')
      );

      act(() => {
        result.current.handleTyping();
      });

      expect(result.current.isTyping).toBe(true);
      expect(mockSocket.emit).toHaveBeenCalledWith('typing_start', 'chat123');
    });

    it('should listen for user_typing events', () => {
      renderHook(() => useTypingIndicator('chat123', 'group'));

      expect(mockSocket.on).toHaveBeenCalledWith('user_typing', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('user_stopped_typing', expect.any(Function));
    });

    it('should add typing user when receiving typing event', () => {
      let typingHandler;
      mockSocket.on.mockImplementation((event, handler) => {
        if (event === 'user_typing') {
          typingHandler = handler;
        }
      });

      const { result } = renderHook(() => 
        useTypingIndicator('chat123', 'group')
      );

      // Simulate receiving typing event
      act(() => {
        typingHandler({
          userId: 'user456',
          userName: 'John Doe',
          groupId: 'chat123'
        });
      });

      expect(result.current.typingUsers).toEqual([
        { id: 'user456', name: 'John Doe' }
      ]);
    });

    it('should remove typing user when receiving stopped typing event', () => {
      let typingHandler, stoppedTypingHandler;
      mockSocket.on.mockImplementation((event, handler) => {
        if (event === 'user_typing') {
          typingHandler = handler;
        } else if (event === 'user_stopped_typing') {
          stoppedTypingHandler = handler;
        }
      });

      const { result } = renderHook(() => 
        useTypingIndicator('chat123', 'group')
      );

      // Add typing user
      act(() => {
        typingHandler({
          userId: 'user456',
          userName: 'John Doe',
          groupId: 'chat123'
        });
      });

      expect(result.current.typingUsers).toHaveLength(1);

      // Remove typing user
      act(() => {
        stoppedTypingHandler({
          userId: 'user456',
          groupId: 'chat123'
        });
      });

      expect(result.current.typingUsers).toEqual([]);
    });

    it('should automatically remove typing user after timeout', () => {
      let typingHandler;
      mockSocket.on.mockImplementation((event, handler) => {
        if (event === 'user_typing') {
          typingHandler = handler;
        }
      });

      const { result } = renderHook(() => 
        useTypingIndicator('chat123', 'group')
      );

      // Add typing user
      act(() => {
        typingHandler({
          userId: 'user456',
          userName: 'John Doe',
          groupId: 'chat123'
        });
      });

      expect(result.current.typingUsers).toHaveLength(1);

      // Fast forward time by 4 seconds (timeout + buffer)
      act(() => {
        jest.advanceTimersByTime(4000);
      });

      expect(result.current.typingUsers).toEqual([]);
    });
  });

  describe('Private Chat Typing', () => {
    it('should emit private typing events for private chats', () => {
      const { result } = renderHook(() => 
        useTypingIndicator('chat123', 'private')
      );

      act(() => {
        result.current.startTyping();
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('private_typing_start', 'chat123');

      act(() => {
        result.current.stopTyping();
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('private_typing_stop', 'chat123');
    });

    it('should listen for private typing events', () => {
      renderHook(() => useTypingIndicator('chat123', 'private'));

      expect(mockSocket.on).toHaveBeenCalledWith('private_user_typing', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('private_user_stopped_typing', expect.any(Function));
    });

    it('should handle private typing events correctly', () => {
      let typingHandler;
      mockSocket.on.mockImplementation((event, handler) => {
        if (event === 'private_user_typing') {
          typingHandler = handler;
        }
      });

      const { result } = renderHook(() => 
        useTypingIndicator('chat123', 'private')
      );

      // Simulate receiving private typing event
      act(() => {
        typingHandler({
          userId: 'user456',
          userName: 'John Doe',
          chatId: 'chat123'
        });
      });

      expect(result.current.typingUsers).toEqual([
        { id: 'user456', name: 'John Doe' }
      ]);
    });
  });

  describe('Chat Change Handling', () => {
    it('should stop typing when chat changes', () => {
      const { result, rerender } = renderHook(
        ({ chatId }) => useTypingIndicator(chatId, 'group'),
        { initialProps: { chatId: 'chat123' } }
      );

      // Start typing
      act(() => {
        result.current.startTyping();
      });

      expect(result.current.isTyping).toBe(true);

      // Change chat
      rerender({ chatId: 'chat456' });

      expect(result.current.isTyping).toBe(false);
      expect(result.current.typingUsers).toEqual([]);
    });

    it('should clean up event listeners when chat changes', () => {
      const { rerender } = renderHook(
        ({ chatId }) => useTypingIndicator(chatId, 'group'),
        { initialProps: { chatId: 'chat123' } }
      );

      // Change chat
      rerender({ chatId: 'chat456' });

      expect(mockSocket.off).toHaveBeenCalledWith('user_typing', expect.any(Function));
      expect(mockSocket.off).toHaveBeenCalledWith('user_stopped_typing', expect.any(Function));
    });
  });

  describe('Multiple Users Typing', () => {
    it('should handle multiple users typing simultaneously', () => {
      let typingHandler;
      mockSocket.on.mockImplementation((event, handler) => {
        if (event === 'user_typing') {
          typingHandler = handler;
        }
      });

      const { result } = renderHook(() => 
        useTypingIndicator('chat123', 'group')
      );

      // Add first typing user
      act(() => {
        typingHandler({
          userId: 'user456',
          userName: 'John Doe',
          groupId: 'chat123'
        });
      });

      // Add second typing user
      act(() => {
        typingHandler({
          userId: 'user789',
          userName: 'Jane Smith',
          groupId: 'chat123'
        });
      });

      expect(result.current.typingUsers).toHaveLength(2);
      expect(result.current.typingUsers).toEqual([
        { id: 'user456', name: 'John Doe' },
        { id: 'user789', name: 'Jane Smith' }
      ]);
    });

    it('should not add duplicate users to typing list', () => {
      let typingHandler;
      mockSocket.on.mockImplementation((event, handler) => {
        if (event === 'user_typing') {
          typingHandler = handler;
        }
      });

      const { result } = renderHook(() => 
        useTypingIndicator('chat123', 'group')
      );

      // Add same user twice
      act(() => {
        typingHandler({
          userId: 'user456',
          userName: 'John Doe',
          groupId: 'chat123'
        });
      });

      act(() => {
        typingHandler({
          userId: 'user456',
          userName: 'John Doe',
          groupId: 'chat123'
        });
      });

      expect(result.current.typingUsers).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing socket gracefully', () => {
      // Mock useSocket to return null socket
      const originalMock = require('../../contexts/SocketContext');
      originalMock.useSocket = jest.fn(() => ({ socket: null }));

      const { result } = renderHook(() => 
        useTypingIndicator('chat123', 'group')
      );

      // Should not throw errors
      expect(() => {
        act(() => {
          result.current.startTyping();
          result.current.stopTyping();
          result.current.handleTyping();
        });
      }).not.toThrow();
    });

    it('should handle missing chatId gracefully', () => {
      const { result } = renderHook(() => 
        useTypingIndicator(null, 'group')
      );

      // Should not throw errors
      expect(() => {
        act(() => {
          result.current.startTyping();
          result.current.stopTyping();
          result.current.handleTyping();
        });
      }).not.toThrow();

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });
});