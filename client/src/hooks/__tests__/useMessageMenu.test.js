import { renderHook, act } from '@testing-library/react';
import useMessageMenu from '../useMessageMenu';

// Mock navigator.vibrate
Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: jest.fn()
});

describe('useMessageMenu Hook', () => {
  const mockHandlers = {
    onReact: jest.fn(),
    onReply: jest.fn(),
    onCopy: jest.fn(),
    onForward: jest.fn(),
    onDelete: jest.fn(),
    onInfo: jest.fn(),
    onReport: jest.fn(),
    onMessageAction: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial State', () => {
    it('initializes with closed menu state', () => {
      const { result } = renderHook(() => useMessageMenu(mockHandlers));

      expect(result.current.menuState.open).toBe(false);
      expect(result.current.menuState.anchorEl).toBe(null);
      expect(result.current.menuState.messageId).toBe(null);
      expect(result.current.isMenuOpen).toBe(false);
    });
  });

  describe('Menu Controls', () => {
    it('opens menu with correct state', () => {
      const { result } = renderHook(() => useMessageMenu(mockHandlers));
      const mockAnchorEl = { getBoundingClientRect: () => ({}) };
      const messageId = 'test-message-id';

      act(() => {
        result.current.openMenu(messageId, mockAnchorEl);
      });

      expect(result.current.menuState.open).toBe(true);
      expect(result.current.menuState.anchorEl).toBe(mockAnchorEl);
      expect(result.current.menuState.messageId).toBe(messageId);
      expect(result.current.isMenuOpen).toBe(true);
    });

    it('closes menu and resets state', () => {
      const { result } = renderHook(() => useMessageMenu(mockHandlers));
      const mockAnchorEl = { getBoundingClientRect: () => ({}) };

      // First open the menu
      act(() => {
        result.current.openMenu('test-message-id', mockAnchorEl);
      });

      // Then close it
      act(() => {
        result.current.closeMenu();
      });

      expect(result.current.menuState.open).toBe(false);
      expect(result.current.menuState.anchorEl).toBe(null);
      expect(result.current.menuState.messageId).toBe(null);
      expect(result.current.isMenuOpen).toBe(false);
    });
  });

  describe('Right-Click Handling', () => {
    it('handles context menu event correctly', () => {
      const { result } = renderHook(() => useMessageMenu(mockHandlers));
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        clientX: 100,
        clientY: 200
      };
      const messageId = 'test-message-id';

      act(() => {
        result.current.handleContextMenu(mockEvent, messageId);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(result.current.menuState.open).toBe(true);
      expect(result.current.menuState.messageId).toBe(messageId);
      expect(result.current.menuState.position).toEqual({ x: 100, y: 200 });
    });
  });

  describe('Touch Handling (Long Press)', () => {
    it('starts long press timer on touch start', () => {
      const { result } = renderHook(() => useMessageMenu(mockHandlers));
      const mockEvent = {
        touches: [{ clientX: 100, clientY: 200 }]
      };
      const messageId = 'test-message-id';
      const targetElement = document.createElement('div');

      act(() => {
        result.current.handleTouchStart(mockEvent, messageId, targetElement);
      });

      // Menu should not be open immediately
      expect(result.current.menuState.open).toBe(false);

      // Fast-forward time to trigger long press
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.menuState.open).toBe(true);
      expect(result.current.menuState.messageId).toBe(messageId);
    });

    it('cancels long press on touch move beyond threshold', () => {
      const { result } = renderHook(() => useMessageMenu(mockHandlers));
      const touchStartEvent = {
        touches: [{ clientX: 100, clientY: 200 }]
      };
      const touchMoveEvent = {
        touches: [{ clientX: 120, clientY: 220 }] // Moved beyond threshold
      };

      act(() => {
        result.current.handleTouchStart(touchStartEvent, 'test-message-id', document.createElement('div'));
      });

      act(() => {
        result.current.handleTouchMove(touchMoveEvent);
      });

      // Fast-forward time - should not trigger long press
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.menuState.open).toBe(false);
    });

    it('does not cancel long press on small touch movements', () => {
      const { result } = renderHook(() => useMessageMenu(mockHandlers));
      const touchStartEvent = {
        touches: [{ clientX: 100, clientY: 200 }]
      };
      const touchMoveEvent = {
        touches: [{ clientX: 105, clientY: 205 }] // Small movement within threshold
      };

      act(() => {
        result.current.handleTouchStart(touchStartEvent, 'test-message-id', document.createElement('div'));
      });

      act(() => {
        result.current.handleTouchMove(touchMoveEvent);
      });

      // Fast-forward time - should still trigger long press
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.menuState.open).toBe(true);
    });

    it('cleans up timer on touch end', () => {
      const { result } = renderHook(() => useMessageMenu(mockHandlers));
      const touchStartEvent = {
        touches: [{ clientX: 100, clientY: 200 }]
      };
      const touchEndEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };

      act(() => {
        result.current.handleTouchStart(touchStartEvent, 'test-message-id', document.createElement('div'));
      });

      act(() => {
        result.current.handleTouchEnd(touchEndEvent);
      });

      // Fast-forward time - should not trigger long press
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.menuState.open).toBe(false);
    });

    it('prevents click event after long press', () => {
      const { result } = renderHook(() => useMessageMenu(mockHandlers));
      const touchStartEvent = {
        touches: [{ clientX: 100, clientY: 200 }]
      };
      const touchEndEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };
      const clickEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };

      // Start long press
      act(() => {
        result.current.handleTouchStart(touchStartEvent, 'test-message-id', document.createElement('div'));
      });

      // Trigger long press
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // End touch
      act(() => {
        result.current.handleTouchEnd(touchEndEvent);
      });

      // Try to click
      const clickResult = result.current.handleClick(clickEvent);

      expect(clickEvent.preventDefault).toHaveBeenCalled();
      expect(clickEvent.stopPropagation).toHaveBeenCalled();
      expect(clickResult).toBe(false);
    });
  });

  describe('Action Handlers', () => {
    it('handles react action correctly', () => {
      const { result } = renderHook(() => useMessageMenu(mockHandlers));
      const messageId = 'test-message-id';

      // Open menu first
      act(() => {
        result.current.openMenu(messageId, {});
      });

      act(() => {
        result.current.handleReact(messageId);
      });

      expect(mockHandlers.onReact).toHaveBeenCalledWith(messageId);
      expect(result.current.menuState.open).toBe(false);
    });

    it('handles reply action correctly', () => {
      const { result } = renderHook(() => useMessageMenu(mockHandlers));
      const messageId = 'test-message-id';

      act(() => {
        result.current.handleReply(messageId);
      });

      expect(mockHandlers.onReply).toHaveBeenCalledWith(messageId);
      expect(result.current.menuState.open).toBe(false);
    });

    it('handles copy action correctly', async () => {
      const { result } = renderHook(() => useMessageMenu(mockHandlers));
      const messageId = 'test-message-id';

      await act(async () => {
        await result.current.handleCopy(messageId);
      });

      expect(mockHandlers.onCopy).toHaveBeenCalledWith(messageId);
      expect(result.current.menuState.open).toBe(false);
    });

    it('handles forward action correctly', () => {
      const { result } = renderHook(() => useMessageMenu(mockHandlers));
      const messageId = 'test-message-id';

      act(() => {
        result.current.handleForward(messageId);
      });

      expect(mockHandlers.onForward).toHaveBeenCalledWith(messageId);
      expect(result.current.menuState.open).toBe(false);
    });

    it('handles delete action correctly', () => {
      const { result } = renderHook(() => useMessageMenu(mockHandlers));
      const messageId = 'test-message-id';
      const deleteType = 'delete_for_everyone';

      act(() => {
        result.current.handleDelete(messageId, deleteType);
      });

      expect(mockHandlers.onDelete).toHaveBeenCalledWith(messageId, deleteType);
      expect(result.current.menuState.open).toBe(false);
    });

    it('handles info action correctly', () => {
      const { result } = renderHook(() => useMessageMenu(mockHandlers));
      const messageId = 'test-message-id';

      act(() => {
        result.current.handleInfo(messageId);
      });

      expect(mockHandlers.onInfo).toHaveBeenCalledWith(messageId);
      expect(result.current.menuState.open).toBe(false);
    });

    it('handles report action correctly', () => {
      const { result } = renderHook(() => useMessageMenu(mockHandlers));
      const messageId = 'test-message-id';

      act(() => {
        result.current.handleReport(messageId);
      });

      expect(mockHandlers.onReport).toHaveBeenCalledWith(messageId);
      expect(result.current.menuState.open).toBe(false);
    });

    it('handles custom message action correctly', () => {
      const { result } = renderHook(() => useMessageMenu(mockHandlers));
      const messageId = 'test-message-id';
      const customAction = 'custom_action';

      act(() => {
        result.current.handleMessageAction(messageId, customAction);
      });

      expect(mockHandlers.onMessageAction).toHaveBeenCalledWith(messageId, customAction);
      expect(result.current.menuState.open).toBe(false);
    });
  });

  describe('Message Event Handlers', () => {
    it('returns proper event handlers for a message', () => {
      const { result } = renderHook(() => useMessageMenu(mockHandlers));
      const messageId = 'test-message-id';

      const handlers = result.current.getMessageEventHandlers(messageId);

      expect(handlers).toHaveProperty('onContextMenu');
      expect(handlers).toHaveProperty('onTouchStart');
      expect(handlers).toHaveProperty('onTouchMove');
      expect(handlers).toHaveProperty('onTouchEnd');
      expect(handlers).toHaveProperty('onClick');
      expect(handlers).toHaveProperty('onTouchCancel');
      expect(handlers).toHaveProperty('style');

      expect(typeof handlers.onContextMenu).toBe('function');
      expect(typeof handlers.onTouchStart).toBe('function');
      expect(typeof handlers.onTouchMove).toBe('function');
      expect(typeof handlers.onTouchEnd).toBe('function');
      expect(typeof handlers.onClick).toBe('function');
    });

    it('includes proper touch handling styles', () => {
      const { result } = renderHook(() => useMessageMenu(mockHandlers));
      const messageId = 'test-message-id';

      const handlers = result.current.getMessageEventHandlers(messageId);

      expect(handlers.style).toEqual({
        touchAction: 'manipulation',
        userSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none'
      });
    });
  });

  describe('Cleanup', () => {
    it('cleans up timers on unmount', () => {
      const { result, unmount } = renderHook(() => useMessageMenu(mockHandlers));
      const touchStartEvent = {
        touches: [{ clientX: 100, clientY: 200 }]
      };

      act(() => {
        result.current.handleTouchStart(touchStartEvent, 'test-message-id', document.createElement('div'));
      });

      // Unmount before timer completes
      unmount();

      // Fast-forward time - should not trigger anything
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // No errors should occur and no handlers should be called
      expect(mockHandlers.onReact).not.toHaveBeenCalled();
    });
  });

  describe('Haptic Feedback', () => {
    it('triggers vibration on long press when available', () => {
      const { result } = renderHook(() => useMessageMenu(mockHandlers));
      const touchStartEvent = {
        touches: [{ clientX: 100, clientY: 200 }]
      };

      act(() => {
        result.current.handleTouchStart(touchStartEvent, 'test-message-id', document.createElement('div'));
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(navigator.vibrate).toHaveBeenCalledWith(50);
    });
  });
});