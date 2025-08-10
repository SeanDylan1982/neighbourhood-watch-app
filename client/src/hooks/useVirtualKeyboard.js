import { useState, useEffect, useCallback, useRef } from 'react';
import { useResponsive } from './useResponsive';

/**
 * Custom hook for handling virtual keyboard interactions
 * Provides keyboard detection, height calculation, and scroll management
 */
export const useVirtualKeyboard = ({
  onKeyboardShow,
  onKeyboardHide,
  adjustScrollOnShow = true,
  maintainInputVisibility = true,
  keyboardThreshold = 150
} = {}) => {
  const { isMobile, isTouchDevice } = useResponsive();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [originalViewportHeight] = useState(window.innerHeight);
  const [activeInput, setActiveInput] = useState(null);
  
  const keyboardTimeoutRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  
  // Handle viewport changes
  const handleViewportChange = useCallback(() => {
    const currentHeight = window.innerHeight;
    const heightDifference = originalViewportHeight - currentHeight;
    
    setViewportHeight(currentHeight);
    
    // Clear any existing timeout
    if (keyboardTimeoutRef.current) {
      clearTimeout(keyboardTimeoutRef.current);
    }
    
    // Debounce keyboard detection to avoid false positives
    keyboardTimeoutRef.current = setTimeout(() => {
      const wasKeyboardOpen = isKeyboardOpen;
      const isNowKeyboardOpen = heightDifference > keyboardThreshold;
      
      if (isNowKeyboardOpen !== wasKeyboardOpen) {
        setIsKeyboardOpen(isNowKeyboardOpen);
        setKeyboardHeight(isNowKeyboardOpen ? heightDifference : 0);
        
        if (isNowKeyboardOpen) {
          onKeyboardShow?.(heightDifference);
        } else {
          onKeyboardHide?.();
        }
      } else if (isNowKeyboardOpen) {
        // Update keyboard height if it changed
        setKeyboardHeight(heightDifference);
      }
    }, 100);
  }, [originalViewportHeight, isKeyboardOpen, keyboardThreshold, onKeyboardShow, onKeyboardHide]);
  
  // Handle visual viewport changes (more accurate on supported browsers)
  const handleVisualViewportChange = useCallback(() => {
    if (!window.visualViewport) return;
    
    const heightDifference = window.innerHeight - window.visualViewport.height;
    const wasKeyboardOpen = isKeyboardOpen;
    const isNowKeyboardOpen = heightDifference > keyboardThreshold;
    
    setViewportHeight(window.visualViewport.height);
    setKeyboardHeight(heightDifference);
    
    if (isNowKeyboardOpen !== wasKeyboardOpen) {
      setIsKeyboardOpen(isNowKeyboardOpen);
      
      if (isNowKeyboardOpen) {
        onKeyboardShow?.(heightDifference);
      } else {
        onKeyboardHide?.();
      }
    }
  }, [isKeyboardOpen, keyboardThreshold, onKeyboardShow, onKeyboardHide]);
  
  // Set up event listeners
  useEffect(() => {
    if (!isMobile || !isTouchDevice) return;
    
    // Use Visual Viewport API if available (more accurate)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange);
      return () => {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
      };
    } else {
      // Fallback to window resize
      window.addEventListener('resize', handleViewportChange);
      return () => {
        window.removeEventListener('resize', handleViewportChange);
      };
    }
  }, [isMobile, isTouchDevice, handleViewportChange, handleVisualViewportChange]);
  
  // Track active input element
  useEffect(() => {
    if (!maintainInputVisibility) return;
    
    const handleFocusIn = (event) => {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        setActiveInput(event.target);
      }
    };
    
    const handleFocusOut = () => {
      setActiveInput(null);
    };
    
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, [maintainInputVisibility]);
  
  // Scroll active input into view when keyboard opens
  useEffect(() => {
    if (!isKeyboardOpen || !activeInput || !adjustScrollOnShow) return;
    
    // Clear any existing scroll timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Delay scroll to ensure keyboard is fully open
    scrollTimeoutRef.current = setTimeout(() => {
      const inputRect = activeInput.getBoundingClientRect();
      const availableHeight = viewportHeight;
      const inputBottom = inputRect.bottom;
      
      // Check if input is hidden behind keyboard
      if (inputBottom > availableHeight - 20) { // 20px buffer
        const scrollAmount = inputBottom - availableHeight + 60; // Extra space
        
        // Smooth scroll to bring input into view
        window.scrollBy({
          top: scrollAmount,
          behavior: 'smooth'
        });
        
        // Alternative: scroll input element into view
        activeInput.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }
    }, 300); // Wait for keyboard animation
  }, [isKeyboardOpen, activeInput, adjustScrollOnShow, viewportHeight]);
  
  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (keyboardTimeoutRef.current) {
        clearTimeout(keyboardTimeoutRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);
  
  // Helper function to adjust element position
  const adjustElementForKeyboard = useCallback((element, options = {}) => {
    if (!isKeyboardOpen || !element) return;
    
    const {
      offset = 20,
      behavior = 'smooth',
      block = 'center'
    } = options;
    
    const elementRect = element.getBoundingClientRect();
    const availableHeight = viewportHeight - offset;
    
    if (elementRect.bottom > availableHeight) {
      element.scrollIntoView({
        behavior,
        block,
        inline: 'nearest'
      });
    }
  }, [isKeyboardOpen, viewportHeight]);
  
  // Helper function to get safe area for content
  const getSafeArea = useCallback(() => {
    return {
      height: isKeyboardOpen ? viewportHeight : window.innerHeight,
      keyboardHeight: isKeyboardOpen ? keyboardHeight : 0,
      availableHeight: isKeyboardOpen ? viewportHeight - 20 : window.innerHeight - 20
    };
  }, [isKeyboardOpen, viewportHeight, keyboardHeight]);
  
  return {
    isKeyboardOpen,
    keyboardHeight,
    viewportHeight,
    originalViewportHeight,
    activeInput,
    adjustElementForKeyboard,
    getSafeArea,
    isMobile,
    isTouchDevice
  };
};

/**
 * Hook specifically for chat window keyboard handling
 * Provides chat-specific keyboard behavior
 */
export const useChatKeyboard = ({
  messagesContainerRef,
  inputRef,
  autoScrollToBottom = true
} = {}) => {
  const [shouldMaintainScroll, setShouldMaintainScroll] = useState(false);
  const [wasAtBottom, setWasAtBottom] = useState(true);
  const scrollPositionRef = useRef(0);
  
  const handleKeyboardShow = useCallback((keyboardHeight) => {
    if (!messagesContainerRef?.current) return;
    
    const container = messagesContainerRef.current;
    const wasAtBottomBefore = container.scrollTop + container.clientHeight >= container.scrollHeight - 10;
    
    setWasAtBottom(wasAtBottomBefore);
    scrollPositionRef.current = container.scrollTop;
    
    // If user was at bottom, maintain that position
    if (wasAtBottomBefore && autoScrollToBottom) {
      setShouldMaintainScroll(true);
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 100);
    }
  }, [messagesContainerRef, autoScrollToBottom]);
  
  const handleKeyboardHide = useCallback(() => {
    if (!messagesContainerRef?.current) return;
    
    const container = messagesContainerRef.current;
    
    // Restore scroll position if needed
    if (shouldMaintainScroll && wasAtBottom && autoScrollToBottom) {
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 100);
    }
    
    setShouldMaintainScroll(false);
  }, [messagesContainerRef, shouldMaintainScroll, wasAtBottom, autoScrollToBottom]);
  
  const keyboard = useVirtualKeyboard({
    onKeyboardShow: handleKeyboardShow,
    onKeyboardHide: handleKeyboardHide,
    adjustScrollOnShow: false // We handle this manually
  });
  
  // Scroll to bottom when new messages arrive and keyboard is open
  const scrollToBottom = useCallback(() => {
    if (!messagesContainerRef?.current) return;
    
    const container = messagesContainerRef.current;
    container.scrollTop = container.scrollHeight;
  }, [messagesContainerRef]);
  
  // Ensure input stays visible
  const ensureInputVisible = useCallback(() => {
    if (!inputRef?.current || !keyboard.isKeyboardOpen) return;
    
    setTimeout(() => {
      keyboard.adjustElementForKeyboard(inputRef.current, {
        offset: 40,
        block: 'end'
      });
    }, 100);
  }, [inputRef, keyboard]);
  
  return {
    ...keyboard,
    scrollToBottom,
    ensureInputVisible,
    shouldMaintainScroll,
    wasAtBottom
  };
};

export default useVirtualKeyboard;