import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import useVirtualKeyboard, { useChatKeyboard } from '../useVirtualKeyboard';

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

// Mock window properties
const mockWindow = {
  innerHeight: 800,
  visualViewport: null
};

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: mockWindow.innerHeight
});

describe('useVirtualKeyboard', () => {
  let mockOnKeyboardShow, mockOnKeyboardHide;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnKeyboardShow = jest.fn();
    mockOnKeyboardHide = jest.fn();
    
    // Reset window height
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800
    });
    
    // Mock visualViewport
    Object.defineProperty(window, 'visualViewport', {
      writable: true,
      configurable: true,
      value: null
    });
    
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useVirtualKeyboard(), { wrapper });

    expect(result.current.isKeyboardOpen).toBe(false);
    expect(result.current.keyboardHeight).toBe(0);
    expect(result.current.viewportHeight).toBe(800);
    expect(result.current.originalViewportHeight).toBe(800);
    expect(result.current.activeInput).toBe(null);
  });

  it('should detect keyboard opening when viewport height decreases', () => {
    const { result } = renderHook(() => useVirtualKeyboard({
      onKeyboardShow: mockOnKeyboardShow,
      onKeyboardHide: mockOnKeyboardHide,
      keyboardThreshold: 150
    }), { wrapper });

    // Simulate keyboard opening by reducing window height
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 500 // 300px difference
    });

    // Trigger resize event
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    // Fast forward timers to trigger debounced callback
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current.isKeyboardOpen).toBe(true);
    expect(result.current.keyboardHeight).toBe(300);
    expect(mockOnKeyboardShow).toHaveBeenCalledWith(300);
  });

  it('should detect keyboard closing when viewport height increases', () => {
    const { result } = renderHook(() => useVirtualKeyboard({
      onKeyboardShow: mockOnKeyboardShow,
      onKeyboardHide: mockOnKeyboardHide,
      keyboardThreshold: 150
    }), { wrapper });

    // First open keyboard
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 500
    });

    act(() => {
      window.dispatchEvent(new Event('resize'));
      jest.advanceTimersByTime(100);
    });

    expect(result.current.isKeyboardOpen).toBe(true);

    // Then close keyboard
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800
    });

    act(() => {
      window.dispatchEvent(new Event('resize'));
      jest.advanceTimersByTime(100);
    });

    expect(result.current.isKeyboardOpen).toBe(false);
    expect(result.current.keyboardHeight).toBe(0);
    expect(mockOnKeyboardHide).toHaveBeenCalled();
  });

  it('should use visual viewport API when available', () => {
    const mockVisualViewport = {
      height: 500,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };

    Object.defineProperty(window, 'visualViewport', {
      writable: true,
      configurable: true,
      value: mockVisualViewport
    });

    const { unmount } = renderHook(() => useVirtualKeyboard({
      onKeyboardShow: mockOnKeyboardShow
    }), { wrapper });

    expect(mockVisualViewport.addEventListener).toHaveBeenCalledWith(
      'resize',
      expect.any(Function)
    );

    unmount();

    expect(mockVisualViewport.removeEventListener).toHaveBeenCalledWith(
      'resize',
      expect.any(Function)
    );
  });

  it('should provide safe area calculations', () => {
    const { result } = renderHook(() => useVirtualKeyboard(), { wrapper });

    // Initially no keyboard
    let safeArea = result.current.getSafeArea();
    expect(safeArea.height).toBe(800);
    expect(safeArea.keyboardHeight).toBe(0);
    expect(safeArea.availableHeight).toBe(780); // 800 - 20

    // Simulate keyboard opening
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 500
    });

    act(() => {
      window.dispatchEvent(new Event('resize'));
      jest.advanceTimersByTime(100);
    });

    safeArea = result.current.getSafeArea();
    expect(safeArea.height).toBe(500);
    expect(safeArea.keyboardHeight).toBe(300);
    expect(safeArea.availableHeight).toBe(480); // 500 - 20
  });

  it('should track active input element', () => {
    const { result } = renderHook(() => useVirtualKeyboard({
      maintainInputVisibility: true
    }), { wrapper });

    // Create mock input element
    const mockInput = document.createElement('input');
    mockInput.tagName = 'INPUT';

    // Simulate focus event
    act(() => {
      const focusEvent = new FocusEvent('focusin', { target: mockInput });
      Object.defineProperty(focusEvent, 'target', {
        value: mockInput,
        enumerable: true
      });
      document.dispatchEvent(focusEvent);
    });

    expect(result.current.activeInput).toBe(mockInput);

    // Simulate blur event
    act(() => {
      document.dispatchEvent(new FocusEvent('focusout'));
    });

    expect(result.current.activeInput).toBe(null);
  });
});

describe('useChatKeyboard', () => {
  let mockMessagesContainer, mockInputRef;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock container element
    mockMessagesContainer = {
      scrollTop: 0,
      clientHeight: 400,
      scrollHeight: 800,
      current: null
    };

    mockMessagesContainer.current = mockMessagesContainer;

    mockInputRef = {
      current: document.createElement('input')
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should provide chat-specific keyboard handling', () => {
    const { result } = renderHook(() => useChatKeyboard({
      messagesContainerRef: mockMessagesContainer,
      inputRef: mockInputRef,
      autoScrollToBottom: true
    }), { wrapper });

    expect(result.current.scrollToBottom).toBeDefined();
    expect(result.current.ensureInputVisible).toBeDefined();
    expect(result.current.shouldMaintainScroll).toBe(false);
    expect(result.current.wasAtBottom).toBe(true);
  });

  it('should scroll to bottom when requested', () => {
    const { result } = renderHook(() => useChatKeyboard({
      messagesContainerRef: mockMessagesContainer,
      inputRef: mockInputRef
    }), { wrapper });

    act(() => {
      result.current.scrollToBottom();
    });

    expect(mockMessagesContainer.scrollTop).toBe(800); // scrollHeight
  });

  it('should maintain scroll position when keyboard opens', () => {
    // Set container to be at bottom
    mockMessagesContainer.scrollTop = 400; // clientHeight + scrollTop >= scrollHeight - 10
    mockMessagesContainer.clientHeight = 400;
    mockMessagesContainer.scrollHeight = 800;

    const { result } = renderHook(() => useChatKeyboard({
      messagesContainerRef: mockMessagesContainer,
      inputRef: mockInputRef,
      autoScrollToBottom: true
    }), { wrapper });

    // Simulate keyboard opening
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 500
    });

    act(() => {
      window.dispatchEvent(new Event('resize'));
      jest.advanceTimersByTime(200); // Wait for debounce + scroll timeout
    });

    expect(result.current.shouldMaintainScroll).toBe(true);
    expect(result.current.wasAtBottom).toBe(true);
  });
});