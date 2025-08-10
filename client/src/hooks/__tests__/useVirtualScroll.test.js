import { renderHook, act } from '@testing-library/react';
import { useVirtualScroll } from '../useVirtualScroll';

describe('useVirtualScroll', () => {
  const mockItems = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    content: `Message ${i}`
  }));

  const defaultProps = {
    items: mockItems,
    itemHeight: 60,
    containerHeight: 400,
    overscan: 5
  };

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useVirtualScroll(defaultProps));

    expect(result.current.totalHeight).toBe(6000); // 100 * 60
    expect(result.current.visibleItems).toHaveLength(12); // ~7 visible + 5 overscan
    expect(result.current.scrollTop).toBe(0);
  });

  it('should calculate visible range correctly', () => {
    const { result } = renderHook(() => useVirtualScroll(defaultProps));

    expect(result.current.visibleRange.startIndex).toBe(0);
    expect(result.current.visibleRange.endIndex).toBe(11);
  });

  it('should update visible items when scrolling', () => {
    const { result } = renderHook(() => useVirtualScroll(defaultProps));

    act(() => {
      const mockEvent = {
        target: { scrollTop: 300 }
      };
      result.current.handleScroll(mockEvent);
    });

    expect(result.current.scrollTop).toBe(300);
    expect(result.current.visibleRange.startIndex).toBe(0); // 300/60 - 5 = 0 (clamped)
    expect(result.current.visibleRange.endIndex).toBe(16); // (300+400)/60 + 5
  });

  it('should handle scroll to item', () => {
    const mockScrollElement = {
      scrollTop: 0
    };
    
    const { result } = renderHook(() => useVirtualScroll(defaultProps));
    
    // Mock the ref
    result.current.scrollElementRef.current = mockScrollElement;

    act(() => {
      result.current.scrollToItem(10);
    });

    expect(mockScrollElement.scrollTop).toBe(600); // 10 * 60
  });

  it('should call onScroll callback with correct parameters', () => {
    const mockOnScroll = jest.fn();
    const { result } = renderHook(() => 
      useVirtualScroll({ ...defaultProps, onScroll: mockOnScroll })
    );

    act(() => {
      const mockEvent = {
        target: { scrollTop: 120 }
      };
      result.current.handleScroll(mockEvent);
    });

    expect(mockOnScroll).toHaveBeenCalledWith({
      scrollTop: 120,
      scrollDirection: 'down',
      visibleRange: expect.any(Object)
    });
  });

  it('should detect scroll direction correctly', () => {
    const mockOnScroll = jest.fn();
    const { result } = renderHook(() => 
      useVirtualScroll({ ...defaultProps, onScroll: mockOnScroll })
    );

    // Scroll down
    act(() => {
      result.current.handleScroll({ target: { scrollTop: 100 } });
    });

    // Scroll up
    act(() => {
      result.current.handleScroll({ target: { scrollTop: 50 } });
    });

    expect(mockOnScroll).toHaveBeenLastCalledWith({
      scrollTop: 50,
      scrollDirection: 'up',
      visibleRange: expect.any(Object)
    });
  });

  it('should handle empty items array', () => {
    const { result } = renderHook(() => 
      useVirtualScroll({ ...defaultProps, items: [] })
    );

    expect(result.current.totalHeight).toBe(0);
    expect(result.current.visibleItems).toHaveLength(0);
  });

  it('should check item visibility correctly', () => {
    const { result } = renderHook(() => useVirtualScroll(defaultProps));

    expect(result.current.isItemVisible(5)).toBe(true);
    expect(result.current.isItemVisible(50)).toBe(false);
  });

  it('should handle scrollToIndex prop', () => {
    const mockScrollElement = {
      scrollTop: 0
    };

    const { result, rerender } = renderHook(
      ({ scrollToIndex }) => useVirtualScroll({ ...defaultProps, scrollToIndex }),
      { initialProps: { scrollToIndex: null } }
    );

    result.current.scrollElementRef.current = mockScrollElement;

    rerender({ scrollToIndex: 20 });

    expect(mockScrollElement.scrollTop).toBe(1200); // 20 * 60
  });
});