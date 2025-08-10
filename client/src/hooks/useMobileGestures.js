import { useState, useRef, useCallback, useEffect } from 'react';
import { useResponsive } from './useResponsive';

/**
 * Custom hook for mobile gesture support
 * Provides long-press and swipe gesture detection
 */
export const useMobileGestures = ({
  onLongPress,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  longPressDelay = 500,
  swipeThreshold = 50,
  disabled = false
} = {}) => {
  const { isMobile, isTouchDevice } = useResponsive();
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [isGestureActive, setIsGestureActive] = useState(false);
  
  const touchStartRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const gestureStartRef = useRef(null);
  
  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);
  
  // Handle touch start
  const handleTouchStart = useCallback((event) => {
    if (disabled || !isTouchDevice) return;
    
    const touch = event.touches[0];
    const touchData = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    
    touchStartRef.current = touchData;
    gestureStartRef.current = touchData;
    setIsGestureActive(true);
    
    // Set up long press timer
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        if (touchStartRef.current && !isLongPressing) {
          setIsLongPressing(true);
          onLongPress(event, touchData);
          
          // Provide haptic feedback if available
          if (navigator.vibrate) {
            navigator.vibrate(50);
          }
        }
      }, longPressDelay);
    }
  }, [disabled, isTouchDevice, onLongPress, longPressDelay, isLongPressing]);
  
  // Handle touch move
  const handleTouchMove = useCallback((event) => {
    if (disabled || !isTouchDevice || !touchStartRef.current) return;
    
    const touch = event.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // If user moves finger too much, cancel long press
    if (distance > 10 && longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
      setIsLongPressing(false);
    }
  }, [disabled, isTouchDevice]);
  
  // Handle touch end
  const handleTouchEnd = useCallback((event) => {
    if (disabled || !isTouchDevice || !touchStartRef.current) return;
    
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const touchDuration = Date.now() - touchStartRef.current.time;
    
    // Only process swipes if it wasn't a long press and was quick enough
    if (!isLongPressing && touchDuration < 300) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      
      // Determine if it's a swipe gesture
      if (absX > swipeThreshold || absY > swipeThreshold) {
        if (absX > absY) {
          // Horizontal swipe
          if (deltaX > 0 && onSwipeRight) {
            onSwipeRight(event, { deltaX, deltaY, duration: touchDuration });
          } else if (deltaX < 0 && onSwipeLeft) {
            onSwipeLeft(event, { deltaX, deltaY, duration: touchDuration });
          }
        } else {
          // Vertical swipe
          if (deltaY > 0 && onSwipeDown) {
            onSwipeDown(event, { deltaX, deltaY, duration: touchDuration });
          } else if (deltaY < 0 && onSwipeUp) {
            onSwipeUp(event, { deltaX, deltaY, duration: touchDuration });
          }
        }
      }
    }
    
    // Reset state
    touchStartRef.current = null;
    gestureStartRef.current = null;
    setIsLongPressing(false);
    setIsGestureActive(false);
  }, [disabled, isTouchDevice, isLongPressing, swipeThreshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);
  
  // Handle touch cancel
  const handleTouchCancel = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    touchStartRef.current = null;
    gestureStartRef.current = null;
    setIsLongPressing(false);
    setIsGestureActive(false);
  }, []);
  
  // Return gesture handlers and state
  const gestureHandlers = (isMobile && isTouchDevice && !disabled) ? {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel
  } : {};
  
  return {
    gestureHandlers,
    isLongPressing,
    isGestureActive,
    isMobile,
    isTouchDevice
  };
};

/**
 * Hook for swipe-to-action functionality
 * Commonly used for chat actions like reply, delete, etc.
 */
export const useSwipeActions = ({
  onSwipeLeft,
  onSwipeRight,
  swipeThreshold = 80,
  disabled = false
} = {}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);
  
  const { gestureHandlers, isMobile, isTouchDevice } = useMobileGestures({
    onSwipeLeft: (event, data) => {
      if (Math.abs(data.deltaX) > swipeThreshold) {
        setSwipeDirection('left');
        if (onSwipeLeft) {
          onSwipeLeft(event, data);
        }
      }
      resetSwipe();
    },
    onSwipeRight: (event, data) => {
      if (Math.abs(data.deltaX) > swipeThreshold) {
        setSwipeDirection('right');
        if (onSwipeRight) {
          onSwipeRight(event, data);
        }
      }
      resetSwipe();
    },
    swipeThreshold: swipeThreshold * 0.6, // Lower threshold for visual feedback
    disabled
  });
  
  const resetSwipe = useCallback(() => {
    setSwipeOffset(0);
    setIsSwipeActive(false);
    setSwipeDirection(null);
  }, []);
  
  // Enhanced gesture handlers with visual feedback
  const enhancedGestureHandlers = {
    ...gestureHandlers,
    onTouchMove: (event) => {
      gestureHandlers.onTouchMove?.(event);
      
      if (!disabled && isTouchDevice) {
        const touch = event.touches[0];
        // Calculate swipe offset for visual feedback
        // This would need to be implemented based on your specific UI needs
      }
    }
  };
  
  return {
    gestureHandlers: enhancedGestureHandlers,
    swipeOffset,
    isSwipeActive,
    swipeDirection,
    resetSwipe,
    isMobile,
    isTouchDevice
  };
};

export default useMobileGestures;