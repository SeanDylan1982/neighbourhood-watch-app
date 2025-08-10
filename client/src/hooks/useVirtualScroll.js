import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * Custom hook for virtual scrolling implementation
 * Optimizes rendering of large lists by only rendering visible items
 */
export const useVirtualScroll = ({
  items = [],
  itemHeight = 60,
  containerHeight = 400,
  overscan = 5,
  scrollToIndex = null,
  onScroll = null
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  // Get visible items
  const visibleItems = useMemo(() => {
    const { startIndex, endIndex } = visibleRange;
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      ...item,
      index: startIndex + index,
      offsetY: (startIndex + index) * itemHeight
    }));
  }, [items, visibleRange, itemHeight]);

  // Total height of all items
  const totalHeight = items.length * itemHeight;

  // Handle scroll events
  const handleScroll = useCallback((event) => {
    const newScrollTop = event.target.scrollTop;
    setScrollTop(newScrollTop);
    
    if (onScroll) {
      onScroll({
        scrollTop: newScrollTop,
        scrollDirection: newScrollTop > scrollTop ? 'down' : 'up',
        visibleRange
      });
    }
  }, [scrollTop, onScroll, visibleRange]);

  // Scroll to specific index
  const scrollToItem = useCallback((index) => {
    if (scrollElementRef.current && index >= 0 && index < items.length) {
      const targetScrollTop = index * itemHeight;
      scrollElementRef.current.scrollTop = targetScrollTop;
      setScrollTop(targetScrollTop);
    }
  }, [itemHeight, items.length]);

  // Auto-scroll to index when scrollToIndex changes
  useEffect(() => {
    if (scrollToIndex !== null) {
      scrollToItem(scrollToIndex);
    }
  }, [scrollToIndex, scrollToItem]);

  // Check if item is visible
  const isItemVisible = useCallback((index) => {
    const { startIndex, endIndex } = visibleRange;
    return index >= startIndex && index <= endIndex;
  }, [visibleRange]);

  return {
    scrollElementRef,
    visibleItems,
    totalHeight,
    handleScroll,
    scrollToItem,
    isItemVisible,
    visibleRange,
    scrollTop
  };
};

export default useVirtualScroll;