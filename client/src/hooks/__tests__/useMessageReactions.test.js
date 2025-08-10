import { renderHook, act } from '@testing-library/react';
import useMessageReactions from '../useMessageReactions';

describe('useMessageReactions', () => {
  const mockReactions = [
    {
      type: 'thumbs_up',
      users: ['user-1', 'user-2'],
      count: 2,
      createdAt: new Date('2024-01-15T10:30:00Z')
    },
    {
      type: 'heart',
      users: ['user-3'],
      count: 1,
      createdAt: new Date('2024-01-15T10:31:00Z')
    }
  ];

  const defaultProps = {
    messageId: 'message-123',
    initialReactions: mockReactions,
    currentUserId: 'user-1'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('returns correct initial state', () => {
      const { result } = renderHook(() => useMessageReactions(
        defaultProps.messageId,
        defaultProps.initialReactions,
        defaultProps.currentUserId
      ));

      expect(result.current.reactions).toEqual(mockReactions);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(typeof result.current.toggleReaction).toBe('function');
      expect(typeof result.current.hasUserReacted).toBe('function');
      expect(typeof result.current.getReactionCount).toBe('function');
    });

    it('handles empty initial reactions', () => {
      const { result } = renderHook(() => useMessageReactions(
        'message-123',
        [],
        'user-1'
      ));

      expect(result.current.reactions).toEqual([]);
      expect(result.current.getTotalReactionCount()).toBe(0);
    });

    it('updates reactions when initialReactions change', () => {
      const { result, rerender } = renderHook(
        ({ initialReactions }) => useMessageReactions('message-123', initialReactions, 'user-1'),
        { initialProps: { initialReactions: mockReactions } }
      );

      expect(result.current.reactions).toEqual(mockReactions);

      const newReactions = [
        { type: 'laugh', users: ['user-4'], count: 1 }
      ];

      rerender({ initialReactions: newReactions });

      expect(result.current.reactions).toEqual(newReactions);
    });
  });

  describe('toggleReaction', () => {
    it('adds reaction optimistically when user has not reacted', async () => {
      const onReactionToggle = jest.fn().mockResolvedValue({
        reactions: [
          ...mockReactions,
          { type: 'laugh', users: ['user-1'], count: 1 }
        ]
      });

      const { result } = renderHook(() => useMessageReactions(
        defaultProps.messageId,
        defaultProps.initialReactions,
        defaultProps.currentUserId
      ));

      await act(async () => {
        await result.current.toggleReaction('laugh', onReactionToggle);
      });

      expect(onReactionToggle).toHaveBeenCalledWith('message-123', 'laugh');
      expect(result.current.reactions).toHaveLength(3);
      expect(result.current.hasUserReacted('laugh')).toBe(true);
    });

    it('removes reaction optimistically when user has already reacted', async () => {
      const onReactionToggle = jest.fn().mockResolvedValue({
        reactions: [
          { type: 'thumbs_up', users: ['user-2'], count: 1 },
          mockReactions[1] // heart reaction unchanged
        ]
      });

      const { result } = renderHook(() => useMessageReactions(
        defaultProps.messageId,
        defaultProps.initialReactions,
        defaultProps.currentUserId
      ));

      await act(async () => {
        await result.current.toggleReaction('thumbs_up', onReactionToggle);
      });

      expect(onReactionToggle).toHaveBeenCalledWith('message-123', 'thumbs_up');
      expect(result.current.hasUserReacted('thumbs_up')).toBe(false);
    });

    it('removes reaction entirely when last user removes it', async () => {
      const singleUserReaction = [
        { type: 'heart', users: ['user-1'], count: 1 }
      ];

      const onReactionToggle = jest.fn().mockResolvedValue({
        reactions: []
      });

      const { result } = renderHook(() => useMessageReactions(
        'message-123',
        singleUserReaction,
        'user-1'
      ));

      await act(async () => {
        await result.current.toggleReaction('heart', onReactionToggle);
      });

      expect(result.current.reactions).toHaveLength(0);
      expect(result.current.getReactionCount('heart')).toBe(0);
    });

    it('sets loading state during API call', async () => {
      let resolvePromise;
      const onReactionToggle = jest.fn(() => new Promise(resolve => {
        resolvePromise = resolve;
      }));

      const { result } = renderHook(() => useMessageReactions(
        defaultProps.messageId,
        defaultProps.initialReactions,
        defaultProps.currentUserId
      ));

      act(() => {
        result.current.toggleReaction('laugh', onReactionToggle);
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise({ reactions: mockReactions });
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('handles API errors and reverts optimistic update', async () => {
      const onReactionToggle = jest.fn().mockRejectedValue(new Error('API Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useMessageReactions(
        defaultProps.messageId,
        defaultProps.initialReactions,
        defaultProps.currentUserId
      ));

      const initialReactions = result.current.reactions;

      await act(async () => {
        await result.current.toggleReaction('laugh', onReactionToggle);
      });

      expect(result.current.error).toBe('API Error');
      expect(result.current.reactions).toEqual(initialReactions);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to toggle reaction:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('prevents duplicate requests for same reaction', async () => {
      const onReactionToggle = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ reactions: mockReactions }), 100))
      );

      const { result } = renderHook(() => useMessageReactions(
        defaultProps.messageId,
        defaultProps.initialReactions,
        defaultProps.currentUserId
      ));

      // Start two concurrent requests
      act(() => {
        result.current.toggleReaction('laugh', onReactionToggle);
        result.current.toggleReaction('laugh', onReactionToggle);
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      // Should only call API once
      expect(onReactionToggle).toHaveBeenCalledTimes(1);
    });

    it('does nothing when required parameters are missing', async () => {
      const onReactionToggle = jest.fn();

      const { result } = renderHook(() => useMessageReactions(null, [], null));

      await act(async () => {
        await result.current.toggleReaction('laugh', onReactionToggle);
      });

      expect(onReactionToggle).not.toHaveBeenCalled();
    });
  });

  describe('Query Functions', () => {
    it('hasUserReacted returns correct values', () => {
      const { result } = renderHook(() => useMessageReactions(
        defaultProps.messageId,
        defaultProps.initialReactions,
        defaultProps.currentUserId
      ));

      expect(result.current.hasUserReacted('thumbs_up')).toBe(true);
      expect(result.current.hasUserReacted('heart')).toBe(false);
      expect(result.current.hasUserReacted('nonexistent')).toBe(false);
    });

    it('getReactionCount returns correct counts', () => {
      const { result } = renderHook(() => useMessageReactions(
        defaultProps.messageId,
        defaultProps.initialReactions,
        defaultProps.currentUserId
      ));

      expect(result.current.getReactionCount('thumbs_up')).toBe(2);
      expect(result.current.getReactionCount('heart')).toBe(1);
      expect(result.current.getReactionCount('nonexistent')).toBe(0);
    });

    it('getReactionUsers returns correct user arrays', () => {
      const { result } = renderHook(() => useMessageReactions(
        defaultProps.messageId,
        defaultProps.initialReactions,
        defaultProps.currentUserId
      ));

      expect(result.current.getReactionUsers('thumbs_up')).toEqual(['user-1', 'user-2']);
      expect(result.current.getReactionUsers('heart')).toEqual(['user-3']);
      expect(result.current.getReactionUsers('nonexistent')).toEqual([]);
    });

    it('getTotalReactionCount returns correct total', () => {
      const { result } = renderHook(() => useMessageReactions(
        defaultProps.messageId,
        defaultProps.initialReactions,
        defaultProps.currentUserId
      ));

      expect(result.current.getTotalReactionCount()).toBe(3);
    });

    it('getMostPopularReaction returns reaction with highest count', () => {
      const { result } = renderHook(() => useMessageReactions(
        defaultProps.messageId,
        defaultProps.initialReactions,
        defaultProps.currentUserId
      ));

      const mostPopular = result.current.getMostPopularReaction();
      expect(mostPopular.type).toBe('thumbs_up');
      expect(mostPopular.count).toBe(2);
    });

    it('getMostPopularReaction returns null for empty reactions', () => {
      const { result } = renderHook(() => useMessageReactions(
        'message-123',
        [],
        'user-1'
      ));

      expect(result.current.getMostPopularReaction()).toBe(null);
    });

    it('getUserReactions returns current user reactions', () => {
      const { result } = renderHook(() => useMessageReactions(
        defaultProps.messageId,
        defaultProps.initialReactions,
        defaultProps.currentUserId
      ));

      expect(result.current.getUserReactions()).toEqual(['thumbs_up']);
    });

    it('getUserReactions returns empty array when no currentUserId', () => {
      const { result } = renderHook(() => useMessageReactions(
        defaultProps.messageId,
        defaultProps.initialReactions,
        null
      ));

      expect(result.current.getUserReactions()).toEqual([]);
    });
  });

  describe('getReactionStats', () => {
    it('returns correct statistics', () => {
      const { result } = renderHook(() => useMessageReactions(
        defaultProps.messageId,
        defaultProps.initialReactions,
        defaultProps.currentUserId
      ));

      const stats = result.current.getReactionStats();

      expect(stats).toEqual({
        totalReactions: 3,
        uniqueUsers: 3,
        reactionTypes: 2,
        mostPopular: expect.objectContaining({
          type: 'thumbs_up',
          count: 2
        }),
        userReactions: ['thumbs_up']
      });
    });

    it('returns correct statistics for empty reactions', () => {
      const { result } = renderHook(() => useMessageReactions(
        'message-123',
        [],
        'user-1'
      ));

      const stats = result.current.getReactionStats();

      expect(stats).toEqual({
        totalReactions: 0,
        uniqueUsers: 0,
        reactionTypes: 0,
        mostPopular: null,
        userReactions: []
      });
    });
  });

  describe('updateReactions', () => {
    it('updates reactions when not loading', () => {
      const { result } = renderHook(() => useMessageReactions(
        defaultProps.messageId,
        defaultProps.initialReactions,
        defaultProps.currentUserId
      ));

      const newReactions = [
        { type: 'laugh', users: ['user-4'], count: 1 }
      ];

      act(() => {
        result.current.updateReactions(newReactions);
      });

      expect(result.current.reactions).toEqual(newReactions);
    });

    it('does not update reactions when loading', async () => {
      let resolvePromise;
      const onReactionToggle = jest.fn(() => new Promise(resolve => {
        resolvePromise = resolve;
      }));

      const { result } = renderHook(() => useMessageReactions(
        defaultProps.messageId,
        defaultProps.initialReactions,
        defaultProps.currentUserId
      ));

      // Start loading state
      act(() => {
        result.current.toggleReaction('laugh', onReactionToggle);
      });

      const newReactions = [
        { type: 'laugh', users: ['user-4'], count: 1 }
      ];

      act(() => {
        result.current.updateReactions(newReactions);
      });

      // Should not update while loading
      expect(result.current.reactions).not.toEqual(newReactions);

      await act(async () => {
        resolvePromise({ reactions: mockReactions });
      });
    });
  });

  describe('clearAllReactions', () => {
    it('clears all reactions optimistically', async () => {
      const onClearReactions = jest.fn().mockResolvedValue();

      const { result } = renderHook(() => useMessageReactions(
        defaultProps.messageId,
        defaultProps.initialReactions,
        defaultProps.currentUserId
      ));

      await act(async () => {
        await result.current.clearAllReactions(onClearReactions);
      });

      expect(onClearReactions).toHaveBeenCalledWith('message-123');
      expect(result.current.reactions).toEqual([]);
    });

    it('reverts on error', async () => {
      const onClearReactions = jest.fn().mockRejectedValue(new Error('Clear failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useMessageReactions(
        defaultProps.messageId,
        defaultProps.initialReactions,
        defaultProps.currentUserId
      ));

      const initialReactions = result.current.reactions;

      await act(async () => {
        await result.current.clearAllReactions(onClearReactions);
      });

      expect(result.current.error).toBe('Clear failed');
      expect(result.current.reactions).toEqual(initialReactions);

      consoleSpy.mockRestore();
    });
  });

  describe('validateReactions', () => {
    it('returns valid for correct reaction data', () => {
      const { result } = renderHook(() => useMessageReactions(
        defaultProps.messageId,
        defaultProps.initialReactions,
        defaultProps.currentUserId
      ));

      const validation = result.current.validateReactions();

      expect(validation.isValid).toBe(true);
      expect(validation.issues).toEqual([]);
    });

    it('identifies validation issues', () => {
      const invalidReactions = [
        { users: ['user-1'], count: 1 }, // Missing type
        { type: 'heart', users: 'invalid', count: 1 }, // Invalid users array
        { type: 'laugh', users: ['user-1'], count: -1 }, // Invalid count
        { type: 'wow', users: ['user-1', 'user-2'], count: 1 } // Count mismatch
      ];

      const { result } = renderHook(() => useMessageReactions(
        'message-123',
        invalidReactions,
        'user-1'
      ));

      const validation = result.current.validateReactions();

      expect(validation.isValid).toBe(false);
      expect(validation.issues).toHaveLength(4);
      expect(validation.issues[0]).toContain('missing type');
      expect(validation.issues[1]).toContain('invalid users array');
      expect(validation.issues[2]).toContain('invalid count');
      expect(validation.issues[3]).toContain('count mismatch');
    });
  });

  describe('Edge Cases', () => {
    it('handles reactions without users array', () => {
      const reactionsWithoutUsers = [
        { type: 'thumbs_up', count: 2 }
      ];

      const { result } = renderHook(() => useMessageReactions(
        'message-123',
        reactionsWithoutUsers,
        'user-1'
      ));

      expect(result.current.hasUserReacted('thumbs_up')).toBe(false);
      expect(result.current.getReactionUsers('thumbs_up')).toEqual([]);
    });

    it('handles null currentUserId', () => {
      const { result } = renderHook(() => useMessageReactions(
        'message-123',
        mockReactions,
        null
      ));

      expect(result.current.hasUserReacted('thumbs_up')).toBe(false);
      expect(result.current.getUserReactions()).toEqual([]);
    });

    it('cleans up on unmount', () => {
      const { unmount } = renderHook(() => useMessageReactions(
        defaultProps.messageId,
        defaultProps.initialReactions,
        defaultProps.currentUserId
      ));

      // Should not throw errors
      unmount();
    });
  });

  describe('Performance', () => {
    it('does not recreate functions on re-render', () => {
      const { result, rerender } = renderHook(() => useMessageReactions(
        defaultProps.messageId,
        defaultProps.initialReactions,
        defaultProps.currentUserId
      ));

      const initialToggleReaction = result.current.toggleReaction;
      const initialHasUserReacted = result.current.hasUserReacted;

      rerender();

      expect(result.current.toggleReaction).toBe(initialToggleReaction);
      expect(result.current.hasUserReacted).toBe(initialHasUserReacted);
    });
  });
});