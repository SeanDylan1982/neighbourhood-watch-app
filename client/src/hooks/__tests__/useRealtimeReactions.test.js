import { renderHook, act } from '@testing-library/react';
import useRealtimeReactions from '../useRealtimeReactions';

// Mock the socket context
const mockSocket = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn()
};

jest.mock('../../contexts/SocketContext', () => ({
  useSocket: () => ({ socket: mockSocket })
}));

describe('useRealtimeReactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Basic Functionality', () => {
    it('should initialize with empty reactions', () => {
      const { result } = renderHook(() => 
        useRealtimeReactions('chat123', 'group')
      );

      expect(result.current.reactions).toEqual({});
      expect(result.current.pendingReactions).toEqual({});
    });

    it('should get empty reactions for non-existent message', () => {
      const { result } = renderHook(() => 
        useRealtimeReactions('chat123', 'group')
      );

      const reactions = result.current.getMessageReactions('nonexistent');
      expect(reactions).toEqual({});
    });

    it('should return false for animation state of non-existent reaction', () => {
      const { result } = renderHook(() => 
        useRealtimeReactions('chat123', 'group')
      );

      const isAnimating = result.current.getReactionAnimation('msg1', '👍');
      expect(isAnimating).toBe(false);
    });
  });

  describe('Adding Reactions', () => {
    it('should add reaction optimistically', () => {
      const { result } = renderHook(() => 
        useRealtimeReactions('chat123', 'group')
      );

      act(() => {
        result.current.addReaction('msg1', '👍', 'user1', 'John Doe');
      });

      const reactions = result.current.getMessageReactions('msg1');
      expect(reactions['👍']).toEqual({
        users: [{ id: 'user1', name: 'John Doe' }],
        count: 1,
        lastUpdated: expect.any(Date)
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('react_to_message', {
        messageId: 'msg1',
        reactionType: '👍'
      });
    });

    it('should remove reaction when user reacts again with same type', () => {
      const { result } = renderHook(() => 
        useRealtimeReactions('chat123', 'group')
      );

      // Add reaction first
      act(() => {
        result.current.addReaction('msg1', '👍', 'user1', 'John Doe');
      });

      expect(result.current.getMessageReactions('msg1')['👍'].count).toBe(1);

      // React again with same type (should remove)
      act(() => {
        result.current.addReaction('msg1', '👍', 'user1', 'John Doe');
      });

      const reactions = result.current.getMessageReactions('msg1');
      expect(reactions['👍']).toBeUndefined();
    });

    it('should handle multiple users reacting with same type', () => {
      const { result } = renderHook(() => 
        useRealtimeReactions('chat123', 'group')
      );

      act(() => {
        result.current.addReaction('msg1', '👍', 'user1', 'John Doe');
        result.current.addReaction('msg1', '👍', 'user2', 'Jane Smith');
      });

      const reactions = result.current.getMessageReactions('msg1');
      expect(reactions['👍']).toEqual({
        users: [
          { id: 'user1', name: 'John Doe' },
          { id: 'user2', name: 'Jane Smith' }
        ],
        count: 2,
        lastUpdated: expect.any(Date)
      });
    });

    it('should handle multiple reaction types on same message', () => {
      const { result } = renderHook(() => 
        useRealtimeReactions('chat123', 'group')
      );

      act(() => {
        result.current.addReaction('msg1', '👍', 'user1', 'John Doe');
        result.current.addReaction('msg1', '❤️', 'user2', 'Jane Smith');
      });

      const reactions = result.current.getMessageReactions('msg1');
      expect(reactions['👍'].count).toBe(1);
      expect(reactions['❤️'].count).toBe(1);
    });

    it('should not emit when socket or chatId is missing', () => {
      const { result } = renderHook(() => 
        useRealtimeReactions(null, 'group')
      );

      act(() => {
        result.current.addReaction('msg1', '👍', 'user1', 'John Doe');
      });

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });

  describe('Removing Reactions', () => {
    it('should remove reaction optimistically', () => {
      const { result } = renderHook(() => 
        useRealtimeReactions('chat123', 'group')
      );

      // Add reaction first
      act(() => {
        result.current.addReaction('msg1', '👍', 'user1', 'John Doe');
        result.current.addReaction('msg1', '👍', 'user2', 'Jane Smith');
      });

      expect(result.current.getMessageReactions('msg1')['👍'].count).toBe(2);

      // Remove reaction
      act(() => {
        result.current.removeReaction('msg1', '👍', 'user1');
      });

      const reactions = result.current.getMessageReactions('msg1');
      expect(reactions['👍']).toEqual({
        users: [{ id: 'user2', name: 'Jane Smith' }],
        count: 1,
        lastUpdated: expect.any(Date)
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('react_to_message', {
        messageId: 'msg1',
        reactionType: '👍'
      });
    });

    it('should remove reaction type when count reaches zero', () => {
      const { result } = renderHook(() => 
        useRealtimeReactions('chat123', 'group')
      );

      // Add single reaction
      act(() => {
        result.current.addReaction('msg1', '👍', 'user1', 'John Doe');
      });

      // Remove the reaction
      act(() => {
        result.current.removeReaction('msg1', '👍', 'user1');
      });

      const reactions = result.current.getMessageReactions('msg1');
      expect(reactions['👍']).toBeUndefined();
    });

    it('should handle removing non-existent reaction gracefully', () => {
      const { result } = renderHook(() => 
        useRealtimeReactions('chat123', 'group')
      );

      act(() => {
        result.current.removeReaction('msg1', '👍', 'user1');
      });

      const reactions = result.current.getMessageReactions('msg1');
      expect(reactions).toEqual({});
    });
  });

  describe('User Reaction Status', () => {
    it('should check if user has reacted', () => {
      const { result } = renderHook(() => 
        useRealtimeReactions('chat123', 'group')
      );

      // Initially no reaction
      expect(result.current.hasUserReacted('msg1', '👍', 'user1')).toBe(false);

      // Add reaction
      act(() => {
        result.current.addReaction('msg1', '👍', 'user1', 'John Doe');
      });

      expect(result.current.hasUserReacted('msg1', '👍', 'user1')).toBe(true);
      expect(result.current.hasUserReacted('msg1', '👍', 'user2')).toBe(false);
    });

    it('should get total reaction count for message', () => {
      const { result } = renderHook(() => 
        useRealtimeReactions('chat123', 'group')
      );

      expect(result.current.getTotalReactionCount('msg1')).toBe(0);

      act(() => {
        result.current.addReaction('msg1', '👍', 'user1', 'John Doe');
        result.current.addReaction('msg1', '❤️', 'user2', 'Jane Smith');
        result.current.addReaction('msg1', '👍', 'user3', 'Bob Johnson');
      });

      expect(result.current.getTotalReactionCount('msg1')).toBe(3);
    });
  });

  describe('Animation System', () => {
    it('should trigger reaction animation', () => {
      const { result } = renderHook(() => 
        useRealtimeReactions('chat123', 'group')
      );

      act(() => {
        result.current.triggerReactionAnimation('msg1', '👍');
      });

      expect(result.current.getReactionAnimation('msg1', '👍')).toBe(true);

      // Animation should clear after timeout
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.getReactionAnimation('msg1', '👍')).toBe(false);
    });

    it('should clear existing animation timeout when triggered again', () => {
      const { result } = renderHook(() => 
        useRealtimeReactions('chat123', 'group')
      );

      act(() => {
        result.current.triggerReactionAnimation('msg1', '👍');
      });

      expect(result.current.getReactionAnimation('msg1', '👍')).toBe(true);

      // Trigger again before first timeout
      act(() => {
        jest.advanceTimersByTime(500);
        result.current.triggerReactionAnimation('msg1', '👍');
      });

      expect(result.current.getReactionAnimation('msg1', '👍')).toBe(true);

      // Should still be animating after original timeout would have cleared
      act(() => {
        jest.advanceTimersByTime(600);
      });

      expect(result.current.getReactionAnimation('msg1', '👍')).toBe(true);
    });
  });

  describe('Socket Event Handling', () => {
    it('should listen for reaction events', () => {
      renderHook(() => useRealtimeReactions('chat123', 'group'));

      expect(mockSocket.on).toHaveBeenCalledWith('message_reaction_updated', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('reaction_added', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('reaction_removed', expect.any(Function));
    });

    it('should handle reaction update from server', () => {
      let reactionUpdateHandler;
      mockSocket.on.mockImplementation((event, handler) => {
        if (event === 'message_reaction_updated') {
          reactionUpdateHandler = handler;
        }
      });

      const { result } = renderHook(() => 
        useRealtimeReactions('chat123', 'group')
      );

      // Simulate server reaction update
      act(() => {
        reactionUpdateHandler({
          messageId: 'msg1',
          reactions: [
            { type: '👍', users: ['user1', 'user2'], count: 2 }
          ],
          chatId: 'chat123'
        });
      });

      const reactions = result.current.getMessageReactions('msg1');
      expect(reactions['👍']).toEqual({
        users: [{ id: 'user1', name: '' }, { id: 'user2', name: '' }],
        count: 2,
        lastUpdated: expect.any(Date)
      });
    });

    it('should handle new reaction from server', () => {
      let newReactionHandler;
      mockSocket.on.mockImplementation((event, handler) => {
        if (event === 'reaction_added') {
          newReactionHandler = handler;
        }
      });

      const { result } = renderHook(() => 
        useRealtimeReactions('chat123', 'group')
      );

      // Simulate new reaction from server
      act(() => {
        newReactionHandler({
          messageId: 'msg1',
          reactionType: '👍',
          userId: 'user1',
          userName: 'John Doe',
          chatId: 'chat123'
        });
      });

      const reactions = result.current.getMessageReactions('msg1');
      expect(reactions['👍']).toEqual({
        users: [{ id: 'user1', name: 'John Doe' }],
        count: 1,
        lastUpdated: expect.any(Date)
      });
    });

    it('should ignore events from other chats', () => {
      let reactionUpdateHandler;
      mockSocket.on.mockImplementation((event, handler) => {
        if (event === 'message_reaction_updated') {
          reactionUpdateHandler = handler;
        }
      });

      const { result } = renderHook(() => 
        useRealtimeReactions('chat123', 'group')
      );

      // Simulate reaction update from different chat
      act(() => {
        reactionUpdateHandler({
          messageId: 'msg1',
          reactions: [{ type: '👍', users: ['user1'], count: 1 }],
          chatId: 'different-chat'
        });
      });

      const reactions = result.current.getMessageReactions('msg1');
      expect(reactions).toEqual({});
    });

    it('should clean up event listeners on unmount', () => {
      const { unmount } = renderHook(() => 
        useRealtimeReactions('chat123', 'group')
      );

      unmount();

      expect(mockSocket.off).toHaveBeenCalledWith('message_reaction_updated', expect.any(Function));
      expect(mockSocket.off).toHaveBeenCalledWith('reaction_added', expect.any(Function));
      expect(mockSocket.off).toHaveBeenCalledWith('reaction_removed', expect.any(Function));
    });
  });

  describe('Chat Change Handling', () => {
    it('should clear reactions when chat changes', () => {
      const { result, rerender } = renderHook(
        ({ chatId }) => useRealtimeReactions(chatId, 'group'),
        { initialProps: { chatId: 'chat123' } }
      );

      // Add some reactions
      act(() => {
        result.current.addReaction('msg1', '👍', 'user1', 'John Doe');
      });

      expect(Object.keys(result.current.reactions)).toHaveLength(1);

      // Change chat
      rerender({ chatId: 'chat456' });

      expect(result.current.reactions).toEqual({});
      expect(result.current.pendingReactions).toEqual({});
    });
  });

  describe('Server Data Updates', () => {
    it('should update reactions from server response', () => {
      const { result } = renderHook(() => 
        useRealtimeReactions('chat123', 'group')
      );

      const serverReactions = [
        { type: '👍', users: ['user1', 'user2'], count: 2 },
        { type: '❤️', users: ['user3'], count: 1 }
      ];

      act(() => {
        result.current.updateReactionsFromServer('msg1', serverReactions);
      });

      const reactions = result.current.getMessageReactions('msg1');
      expect(reactions['👍'].count).toBe(2);
      expect(reactions['❤️'].count).toBe(1);
    });

    it('should clear pending reactions when updating from server', () => {
      const { result } = renderHook(() => 
        useRealtimeReactions('chat123', 'group')
      );

      // Add pending reaction
      act(() => {
        result.current.addReaction('msg1', '👍', 'user1', 'John Doe');
      });

      expect(Object.keys(result.current.pendingReactions)).toHaveLength(1);

      // Update from server
      act(() => {
        result.current.updateReactionsFromServer('msg1', [
          { type: '👍', users: ['user1'], count: 1 }
        ]);
      });

      expect(result.current.pendingReactions).toEqual({});
    });
  });

  describe('Error Handling', () => {
    it('should handle missing socket gracefully', () => {
      // Mock useSocket to return null socket
      const originalMock = require('../../contexts/SocketContext');
      originalMock.useSocket = jest.fn(() => ({ socket: null }));

      const { result } = renderHook(() => 
        useRealtimeReactions('chat123', 'group')
      );

      // Should not throw errors
      expect(() => {
        act(() => {
          result.current.addReaction('msg1', '👍', 'user1', 'John Doe');
          result.current.removeReaction('msg1', '👍', 'user1');
        });
      }).not.toThrow();

      expect(result.current.reactions).toEqual({});
    });
  });
});