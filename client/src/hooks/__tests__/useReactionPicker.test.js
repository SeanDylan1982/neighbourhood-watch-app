import { renderHook, act } from '@testing-library/react';
import useReactionPicker from '../useReactionPicker';

// Mock getBoundingClientRect
const mockGetBoundingClientRect = jest.fn();

// Mock DOM element
const createMockElement = (rect) => ({
  getBoundingClientRect: () => rect,
  ...rect
});

describe('useReactionPicker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock window properties
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    });
    
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768
    });
    
    Object.defineProperty(window, 'pageYOffset', {
      writable: true,
      configurable: true,
      value: 0
    });
    
    Object.defineProperty(window, 'pageXOffset', {
      writable: true,
      configurable: true,
      value: 0
    });
  });

  describe('Initial State', () => {
    it('returns correct initial state', () => {
      const { result } = renderHook(() => useReactionPicker());

      expect(result.current.isVisible).toBe(false);
      expect(result.current.position).toEqual({ x: 0, y: 0 });
      expect(result.current.targetMessageId).toBe(null);
      expect(typeof result.current.showReactionPicker).toBe('function');
      expect(typeof result.current.hideReactionPicker).toBe('function');
      expect(typeof result.current.toggleReactionPicker).toBe('function');
    });
  });

  describe('showReactionPicker', () => {
    it('shows picker with correct position', () => {
      const { result } = renderHook(() => useReactionPicker());
      
      const mockElement = createMockElement({
        left: 100,
        top: 200,
        width: 50,
        height: 30,
        bottom: 230,
        right: 150
      });

      act(() => {
        result.current.showReactionPicker('message-123', mockElement);
      });

      expect(result.current.isVisible).toBe(true);
      expect(result.current.targetMessageId).toBe('message-123');
      expect(result.current.position).toEqual({
        x: 125, // left + width/2
        y: 200  // top
      });
    });

    it('does not show picker if no trigger element provided', () => {
      const { result } = renderHook(() => useReactionPicker());

      act(() => {
        result.current.showReactionPicker('message-123', null);
      });

      expect(result.current.isVisible).toBe(false);
      expect(result.current.targetMessageId).toBe(null);
    });

    it('adjusts position to prevent horizontal overflow on right', () => {
      const { result } = renderHook(() => useReactionPicker());
      
      const mockElement = createMockElement({
        left: 900, // Near right edge
        top: 200,
        width: 50,
        height: 30,
        bottom: 230,
        right: 950
      });

      act(() => {
        result.current.showReactionPicker('message-123', mockElement);
      });

      expect(result.current.position.x).toBe(874); // innerWidth - pickerWidth/2 - 10
    });

    it('adjusts position to prevent horizontal overflow on left', () => {
      const { result } = renderHook(() => useReactionPicker());
      
      const mockElement = createMockElement({
        left: 10, // Near left edge
        top: 200,
        width: 50,
        height: 30,
        bottom: 230,
        right: 60
      });

      act(() => {
        result.current.showReactionPicker('message-123', mockElement);
      });

      expect(result.current.position.x).toBe(150); // pickerWidth/2 + 10
    });

    it('adjusts position to prevent vertical overflow', () => {
      const { result } = renderHook(() => useReactionPicker());
      
      const mockElement = createMockElement({
        left: 100,
        top: 30, // Near top edge
        width: 50,
        height: 30,
        bottom: 60,
        right: 150
      });

      act(() => {
        result.current.showReactionPicker('message-123', mockElement);
      });

      expect(result.current.position.y).toBe(70); // bottom + 10
    });

    it('accounts for page scroll offset', () => {
      Object.defineProperty(window, 'pageYOffset', {
        writable: true,
        configurable: true,
        value: 100
      });
      
      Object.defineProperty(window, 'pageXOffset', {
        writable: true,
        configurable: true,
        value: 50
      });

      const { result } = renderHook(() => useReactionPicker());
      
      const mockElement = createMockElement({
        left: 100,
        top: 200,
        width: 50,
        height: 30,
        bottom: 230,
        right: 150
      });

      act(() => {
        result.current.showReactionPicker('message-123', mockElement);
      });

      expect(result.current.position).toEqual({
        x: 175, // left + scrollLeft + width/2
        y: 300  // top + scrollTop
      });
    });
  });

  describe('hideReactionPicker', () => {
    it('hides picker and resets state', () => {
      const { result } = renderHook(() => useReactionPicker());
      
      const mockElement = createMockElement({
        left: 100,
        top: 200,
        width: 50,
        height: 30,
        bottom: 230,
        right: 150
      });

      // First show the picker
      act(() => {
        result.current.showReactionPicker('message-123', mockElement);
      });

      expect(result.current.isVisible).toBe(true);

      // Then hide it
      act(() => {
        result.current.hideReactionPicker();
      });

      expect(result.current.isVisible).toBe(false);
      expect(result.current.targetMessageId).toBe(null);
    });
  });

  describe('toggleReactionPicker', () => {
    it('shows picker when hidden', () => {
      const { result } = renderHook(() => useReactionPicker());
      
      const mockElement = createMockElement({
        left: 100,
        top: 200,
        width: 50,
        height: 30,
        bottom: 230,
        right: 150
      });

      act(() => {
        result.current.toggleReactionPicker('message-123', mockElement);
      });

      expect(result.current.isVisible).toBe(true);
      expect(result.current.targetMessageId).toBe('message-123');
    });

    it('hides picker when visible for same message', () => {
      const { result } = renderHook(() => useReactionPicker());
      
      const mockElement = createMockElement({
        left: 100,
        top: 200,
        width: 50,
        height: 30,
        bottom: 230,
        right: 150
      });

      // First show the picker
      act(() => {
        result.current.showReactionPicker('message-123', mockElement);
      });

      expect(result.current.isVisible).toBe(true);

      // Then toggle it (should hide)
      act(() => {
        result.current.toggleReactionPicker('message-123', mockElement);
      });

      expect(result.current.isVisible).toBe(false);
    });

    it('switches to different message when visible for different message', () => {
      const { result } = renderHook(() => useReactionPicker());
      
      const mockElement1 = createMockElement({
        left: 100,
        top: 200,
        width: 50,
        height: 30,
        bottom: 230,
        right: 150
      });

      const mockElement2 = createMockElement({
        left: 200,
        top: 300,
        width: 50,
        height: 30,
        bottom: 330,
        right: 250
      });

      // Show picker for first message
      act(() => {
        result.current.showReactionPicker('message-123', mockElement1);
      });

      expect(result.current.targetMessageId).toBe('message-123');

      // Toggle for different message (should switch)
      act(() => {
        result.current.toggleReactionPicker('message-456', mockElement2);
      });

      expect(result.current.isVisible).toBe(true);
      expect(result.current.targetMessageId).toBe('message-456');
      expect(result.current.position).toEqual({
        x: 225, // new position
        y: 300
      });
    });
  });

  describe('Event Listeners', () => {
    let addEventListenerSpy;
    let removeEventListenerSpy;

    beforeEach(() => {
      addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    });

    afterEach(() => {
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('adds resize event listener when picker is visible', () => {
      const { result } = renderHook(() => useReactionPicker());
      
      const mockElement = createMockElement({
        left: 100,
        top: 200,
        width: 50,
        height: 30,
        bottom: 230,
        right: 150
      });

      act(() => {
        result.current.showReactionPicker('message-123', mockElement);
      });

      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
    });

    it('removes event listeners when picker is hidden', () => {
      const { result } = renderHook(() => useReactionPicker());
      
      const mockElement = createMockElement({
        left: 100,
        top: 200,
        width: 50,
        height: 30,
        bottom: 230,
        right: 150
      });

      // Show picker
      act(() => {
        result.current.showReactionPicker('message-123', mockElement);
      });

      // Hide picker
      act(() => {
        result.current.hideReactionPicker();
      });

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    });

    it('removes event listeners on unmount', () => {
      const { result, unmount } = renderHook(() => useReactionPicker());
      
      const mockElement = createMockElement({
        left: 100,
        top: 200,
        width: 50,
        height: 30,
        bottom: 230,
        right: 150
      });

      act(() => {
        result.current.showReactionPicker('message-123', mockElement);
      });

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    });
  });
});