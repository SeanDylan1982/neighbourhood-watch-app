import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import useMobileGestures, { useSwipeActions } from '../useMobileGestures';

// Mock useResponsive
jest.mock('../useResponsive', () => ({
  useResponsive: () => ({
    isMobile: true,
    isTouchDevice: true
  })
}));

const theme = createTheme();

const wrapper = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('useMobileGestures', () => {
  let mockOnLongPress, mockOnSwipeLeft, mockOnSwipeRight;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnLongPress = jest.fn();
    mockOnSwipeLeft = jest.fn();
    mockOnSwipeRight = jest.fn();
    
    // Mock navigator.vibrate
    Object.defineProperty(navigator, 'vibrate', {
      writable: true,
      value: jest.fn()
    });
    
    // Mock Date.now
    jest.spyOn(Date, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should provide gesture handlers for touch devices', () => {
    const { result } = renderHook(() => useMobileGestures({
      onLongPress: mockOnLongPress,
      onSwipeLeft: mockOnSwipeLeft
    }), { wrapper });

    expect(result.current.gestureHandlers).toBeDefined();
    expect(result.current.gestureHandlers.onTouchStart).toBeDefined();
    expect(result.current.gestureHandlers.onTouchMove).toBeDefined();
    expect(result.current.gestureHandlers.onTouchEnd).toBeDefined();
    expect(result.current.gestureHandlers.onTouchCancel).toBeDefined();
  });

  it('should detect long press gesture', async () => {
    jest.useFakeTimers();
    
    const { result } = renderHook(() => useMobileGestures({
      onLongPress: mockOnLongPress,
      longPressDelay: 500
    }), { wrapper });

    const mockTouchEvent = {
      touches: [{ clientX: 100, clientY: 100 }]
    };

    // Start touch
    act(() => {
      result.current.gestureHandlers.onTouchStart(mockTouchEvent);
    });

    expect(result.current.isLongPressing).toBe(false);

    // Fast forward time to trigger long press
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockOnLongPress).toHaveBeenCalledWith(
      mockTouchEvent,
      expect.objectContaining({
        x: 100,
        y: 100,
        time: 1000
      })
    );

    jest.useRealTimers();
  });

  it('should detect swipe left gesture', () => {
    const { result } = renderHook(() => useMobileGestures({
      onSwipeLeft: mockOnSwipeLeft,
      swipeThreshold: 50
    }), { wrapper });

    const startEvent = {
      touches: [{ clientX: 200, clientY: 100 }]
    };

    const endEvent = {
      changedTouches: [{ clientX: 100, clientY: 100 }] // Moved 100px left
    };

    // Start touch
    act(() => {
      result.current.gestureHandlers.onTouchStart(startEvent);
    });

    // End touch with swipe
    Date.now.mockReturnValue(1200); // 200ms later
    act(() => {
      result.current.gestureHandlers.onTouchEnd(endEvent);
    });

    expect(mockOnSwipeLeft).toHaveBeenCalledWith(
      endEvent,
      expect.objectContaining({
        deltaX: -100,
        deltaY: 0,
        duration: 200
      })
    );
  });

  it('should cancel long press on movement', () => {
    jest.useFakeTimers();
    
    const { result } = renderHook(() => useMobileGestures({
      onLongPress: mockOnLongPress,
      longPressDelay: 500
    }), { wrapper });

    const startEvent = {
      touches: [{ clientX: 100, clientY: 100 }]
    };

    const moveEvent = {
      touches: [{ clientX: 120, clientY: 120 }] // Moved more than 10px
    };

    // Start touch
    act(() => {
      result.current.gestureHandlers.onTouchStart(startEvent);
    });

    // Move finger
    act(() => {
      result.current.gestureHandlers.onTouchMove(moveEvent);
    });

    // Fast forward time
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockOnLongPress).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('should not provide handlers when disabled', () => {
    const { result } = renderHook(() => useMobileGestures({
      onLongPress: mockOnLongPress,
      disabled: true
    }), { wrapper });

    expect(result.current.gestureHandlers).toEqual({});
  });
});

describe('useSwipeActions', () => {
  let mockOnSwipeLeft, mockOnSwipeRight;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSwipeLeft = jest.fn();
    mockOnSwipeRight = jest.fn();
  });

  it('should provide swipe action handlers', () => {
    const { result } = renderHook(() => useSwipeActions({
      onSwipeLeft: mockOnSwipeLeft,
      onSwipeRight: mockOnSwipeRight,
      swipeThreshold: 80
    }), { wrapper });

    expect(result.current.gestureHandlers).toBeDefined();
    expect(result.current.swipeOffset).toBe(0);
    expect(result.current.isSwipeActive).toBe(false);
    expect(result.current.swipeDirection).toBe(null);
  });

  it('should reset swipe state', () => {
    const { result } = renderHook(() => useSwipeActions({
      onSwipeLeft: mockOnSwipeLeft
    }), { wrapper });

    act(() => {
      result.current.resetSwipe();
    });

    expect(result.current.swipeOffset).toBe(0);
    expect(result.current.isSwipeActive).toBe(false);
    expect(result.current.swipeDirection).toBe(null);
  });
});