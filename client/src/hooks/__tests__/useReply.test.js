import { renderHook, act } from '@testing-library/react';
import useReply from '../useReply';

describe('useReply', () => {
  const mockMessage = {
    id: 'message-123',
    content: 'This is a test message',
    senderName: 'John Doe',
    type: 'text',
    timestamp: new Date('2024-01-15T10:30:00Z')
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial State', () => {
    it('returns correct initial state', () => {
      const { result } = renderHook(() => useReply());

      expect(result.current.replyTo).toBe(null);
      expect(result.current.isReplying).toBe(false);
      expect(typeof result.current.startReply).toBe('function');
      expect(typeof result.current.cancelReply).toBe('function');
      expect(typeof result.current.clearReply).toBe('function');
      expect(typeof result.current.getReplyData).toBe('function');
      expect(typeof result.current.getReplyContext).toBe('function');
      expect(typeof result.current.isValidReply).toBe('function');
      expect(result.current.inputRef).toBeDefined();
    });
  });

  describe('startReply', () => {
    it('sets reply state correctly', () => {
      const { result } = renderHook(() => useReply());

      act(() => {
        result.current.startReply(mockMessage);
      });

      expect(result.current.isReplying).toBe(true);
      expect(result.current.replyTo).toEqual({
        id: 'message-123',
        content: 'This is a test message',
        senderName: 'John Doe',
        type: 'text',
        filename: undefined,
        timestamp: mockMessage.timestamp
      });
    });

    it('does not set reply state for null message', () => {
      const { result } = renderHook(() => useReply());

      act(() => {
        result.current.startReply(null);
      });

      expect(result.current.isReplying).toBe(false);
      expect(result.current.replyTo).toBe(null);
    });

    it('focuses input after starting reply', () => {
      const mockFocus = jest.fn();
      const { result } = renderHook(() => useReply());
      
      // Mock the input ref
      result.current.inputRef.current = { focus: mockFocus };

      act(() => {
        result.current.startReply(mockMessage);
      });

      // Fast-forward timers to trigger the focus
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(mockFocus).toHaveBeenCalledTimes(1);
    });

    it('handles document messages with filename', () => {
      const documentMessage = {
        ...mockMessage,
        type: 'document',
        filename: 'document.pdf'
      };

      const { result } = renderHook(() => useReply());

      act(() => {
        result.current.startReply(documentMessage);
      });

      expect(result.current.replyTo.filename).toBe('document.pdf');
      expect(result.current.replyTo.type).toBe('document');
    });
  });

  describe('cancelReply', () => {
    it('clears reply state', () => {
      const { result } = renderHook(() => useReply());

      // First start a reply
      act(() => {
        result.current.startReply(mockMessage);
      });

      expect(result.current.isReplying).toBe(true);

      // Then cancel it
      act(() => {
        result.current.cancelReply();
      });

      expect(result.current.isReplying).toBe(false);
      expect(result.current.replyTo).toBe(null);
    });
  });

  describe('clearReply', () => {
    it('clears reply state', () => {
      const { result } = renderHook(() => useReply());

      // First start a reply
      act(() => {
        result.current.startReply(mockMessage);
      });

      expect(result.current.isReplying).toBe(true);

      // Then clear it
      act(() => {
        result.current.clearReply();
      });

      expect(result.current.isReplying).toBe(false);
      expect(result.current.replyTo).toBe(null);
    });
  });

  describe('getReplyData', () => {
    it('returns null when no reply is active', () => {
      const { result } = renderHook(() => useReply());

      const replyData = result.current.getReplyData();
      expect(replyData).toBe(null);
    });

    it('returns correct reply data for text message', () => {
      const { result } = renderHook(() => useReply());

      act(() => {
        result.current.startReply(mockMessage);
      });

      const replyData = result.current.getReplyData();
      expect(replyData).toEqual({
        messageId: 'message-123',
        content: 'This is a test message',
        senderName: 'John Doe',
        type: 'text'
      });
    });

    it('returns correct reply data for media messages', () => {
      const imageMessage = { ...mockMessage, type: 'image' };
      const { result } = renderHook(() => useReply());

      act(() => {
        result.current.startReply(imageMessage);
      });

      const replyData = result.current.getReplyData();
      expect(replyData).toEqual({
        messageId: 'message-123',
        content: '🖼️ Photo',
        senderName: 'John Doe',
        type: 'image'
      });
    });
  });

  describe('getReplyContext', () => {
    it('returns null when no reply is active', () => {
      const { result } = renderHook(() => useReply());

      const context = result.current.getReplyContext();
      expect(context).toBe(null);
    });

    it('returns correct context for active reply', () => {
      const { result } = renderHook(() => useReply());

      act(() => {
        result.current.startReply(mockMessage);
      });

      const context = result.current.getReplyContext();
      expect(context).toEqual({
        id: 'message-123',
        content: 'This is a test message',
        senderName: 'John Doe',
        type: 'text',
        filename: undefined,
        timestamp: mockMessage.timestamp,
        excerpt: 'This is a test message',
        isValid: true
      });
    });

    it('includes excerpt for long messages', () => {
      const longMessage = {
        ...mockMessage,
        content: 'This is a very long message that should be truncated when displayed in the reply preview because it exceeds the maximum length'
      };

      const { result } = renderHook(() => useReply());

      act(() => {
        result.current.startReply(longMessage);
      });

      const context = result.current.getReplyContext();
      expect(context.excerpt).toContain('...');
      expect(context.excerpt.length).toBeLessThanOrEqual(103); // 100 + "..."
    });
  });

  describe('isValidReply', () => {
    it('returns false when no reply is active', () => {
      const { result } = renderHook(() => useReply());

      expect(result.current.isValidReply()).toBe(false);
    });

    it('returns true for valid reply', () => {
      const { result } = renderHook(() => useReply());

      act(() => {
        result.current.startReply(mockMessage);
      });

      expect(result.current.isValidReply()).toBe(true);
    });

    it('returns false for reply without id', () => {
      const invalidMessage = { ...mockMessage, id: null };
      const { result } = renderHook(() => useReply());

      act(() => {
        result.current.startReply(invalidMessage);
      });

      expect(result.current.isValidReply()).toBe(false);
    });

    it('returns false for reply without senderName', () => {
      const invalidMessage = { ...mockMessage, senderName: null };
      const { result } = renderHook(() => useReply());

      act(() => {
        result.current.startReply(invalidMessage);
      });

      expect(result.current.isValidReply()).toBe(false);
    });
  });

  describe('Excerpt Generation', () => {
    it('generates correct excerpts for different message types', () => {
      const { result } = renderHook(() => useReply());

      const testCases = [
        { type: 'text', content: 'Hello world', expected: 'Hello world' },
        { type: 'image', expected: '🖼️ Photo' },
        { type: 'video', expected: '🎥 Video' },
        { type: 'audio', expected: '🎙️ Audio' },
        { type: 'document', filename: 'test.pdf', expected: '📄 test.pdf' },
        { type: 'document', expected: '📄 Document' },
        { type: 'location', expected: '📍 Location' },
        { type: 'contact', expected: '👤 Contact' },
        { type: 'unknown', content: 'Unknown type', expected: 'Unknown type' }
      ];

      testCases.forEach(({ type, content, filename, expected }) => {
        const message = { ...mockMessage, type, content, filename };
        
        act(() => {
          result.current.startReply(message);
        });

        const context = result.current.getReplyContext();
        expect(context.excerpt).toBe(expected);

        act(() => {
          result.current.cancelReply();
        });
      });
    });

    it('truncates long text at word boundaries', () => {
      const longMessage = {
        ...mockMessage,
        content: 'This is a message with multiple words that should be truncated properly at word boundaries'
      };

      const { result } = renderHook(() => useReply());

      act(() => {
        result.current.startReply(longMessage);
      });

      const context = result.current.getReplyContext();
      expect(context.excerpt).toContain('...');
      // Should not cut in the middle of a word
      expect(context.excerpt).not.toMatch(/\w\.\.\./);
    });
  });

  describe('Keyboard Shortcuts', () => {
    let addEventListenerSpy;
    let removeEventListenerSpy;

    beforeEach(() => {
      addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    });

    afterEach(() => {
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('adds keyboard event listener when replying', () => {
      const { result } = renderHook(() => useReply());

      act(() => {
        result.current.startReply(mockMessage);
      });

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('removes keyboard event listener when not replying', () => {
      const { result } = renderHook(() => useReply());

      act(() => {
        result.current.startReply(mockMessage);
      });

      act(() => {
        result.current.cancelReply();
      });

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('cancels reply on Escape key', () => {
      const { result } = renderHook(() => useReply());

      act(() => {
        result.current.startReply(mockMessage);
      });

      expect(result.current.isReplying).toBe(true);

      // Simulate Escape key press
      act(() => {
        const keydownEvent = new KeyboardEvent('keydown', { key: 'Escape' });
        document.dispatchEvent(keydownEvent);
      });

      expect(result.current.isReplying).toBe(false);
      expect(result.current.replyTo).toBe(null);
    });

    it('does not cancel reply on other keys', () => {
      const { result } = renderHook(() => useReply());

      act(() => {
        result.current.startReply(mockMessage);
      });

      expect(result.current.isReplying).toBe(true);

      // Simulate other key presses
      act(() => {
        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
        document.dispatchEvent(enterEvent);
      });

      expect(result.current.isReplying).toBe(true);
    });

    it('removes event listener on unmount', () => {
      const { result, unmount } = renderHook(() => useReply());

      act(() => {
        result.current.startReply(mockMessage);
      });

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });

  describe('Edge Cases', () => {
    it('handles empty message content', () => {
      const emptyMessage = { ...mockMessage, content: '' };
      const { result } = renderHook(() => useReply());

      act(() => {
        result.current.startReply(emptyMessage);
      });

      const context = result.current.getReplyContext();
      expect(context.excerpt).toBe('');
    });

    it('handles null message content', () => {
      const nullMessage = { ...mockMessage, content: null };
      const { result } = renderHook(() => useReply());

      act(() => {
        result.current.startReply(nullMessage);
      });

      const context = result.current.getReplyContext();
      expect(context.excerpt).toBe('');
    });

    it('handles undefined message properties', () => {
      const incompleteMessage = {
        id: 'message-123'
        // Missing other properties
      };

      const { result } = renderHook(() => useReply());

      act(() => {
        result.current.startReply(incompleteMessage);
      });

      expect(result.current.replyTo.senderName).toBeUndefined();
      expect(result.current.isValidReply()).toBe(false);
    });

    it('handles focus when input ref is null', () => {
      const { result } = renderHook(() => useReply());
      
      // Ensure input ref is null
      result.current.inputRef.current = null;

      act(() => {
        result.current.startReply(mockMessage);
      });

      // Should not throw error
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current.isReplying).toBe(true);
    });
  });

  describe('Performance', () => {
    it('does not recreate functions on re-render', () => {
      const { result, rerender } = renderHook(() => useReply());

      const initialStartReply = result.current.startReply;
      const initialCancelReply = result.current.cancelReply;
      const initialClearReply = result.current.clearReply;

      rerender();

      expect(result.current.startReply).toBe(initialStartReply);
      expect(result.current.cancelReply).toBe(initialCancelReply);
      expect(result.current.clearReply).toBe(initialClearReply);
    });
  });
});