import { useState, useCallback, useRef, useEffect } from 'react';

const useReactionPicker = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [targetMessageId, setTargetMessageId] = useState(null);
  const triggerElementRef = useRef(null);

  const showReactionPicker = useCallback((messageId, triggerElement) => {
    if (!triggerElement) return;

    const rect = triggerElement.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    // Calculate position above the trigger element
    const x = rect.left + scrollLeft + (rect.width / 2);
    const y = rect.top + scrollTop;

    // Adjust position if picker would go off-screen
    const pickerWidth = 280; // Approximate width of reaction picker
    const pickerHeight = 60; // Approximate height of reaction picker
    
    let adjustedX = x;
    let adjustedY = y;

    // Prevent horizontal overflow
    if (x + pickerWidth / 2 > window.innerWidth) {
      adjustedX = window.innerWidth - pickerWidth / 2 - 10;
    } else if (x - pickerWidth / 2 < 0) {
      adjustedX = pickerWidth / 2 + 10;
    }

    // Prevent vertical overflow (show below if not enough space above)
    if (y - pickerHeight < 0) {
      adjustedY = rect.bottom + scrollTop + 10;
    }

    setPosition({ x: adjustedX, y: adjustedY });
    setTargetMessageId(messageId);
    setIsVisible(true);
    triggerElementRef.current = triggerElement;
  }, []);

  const hideReactionPicker = useCallback(() => {
    setIsVisible(false);
    setTargetMessageId(null);
    triggerElementRef.current = null;
  }, []);

  const toggleReactionPicker = useCallback((messageId, triggerElement) => {
    if (isVisible && targetMessageId === messageId) {
      hideReactionPicker();
    } else {
      showReactionPicker(messageId, triggerElement);
    }
  }, [isVisible, targetMessageId, showReactionPicker, hideReactionPicker]);

  // Handle window resize to reposition picker
  useEffect(() => {
    const handleResize = () => {
      if (isVisible && triggerElementRef.current) {
        showReactionPicker(targetMessageId, triggerElementRef.current);
      }
    };

    if (isVisible) {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isVisible, targetMessageId, showReactionPicker]);

  // Handle scroll to reposition picker
  useEffect(() => {
    const handleScroll = () => {
      if (isVisible && triggerElementRef.current) {
        showReactionPicker(targetMessageId, triggerElementRef.current);
      }
    };

    if (isVisible) {
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [isVisible, targetMessageId, showReactionPicker]);

  return {
    isVisible,
    position,
    targetMessageId,
    showReactionPicker,
    hideReactionPicker,
    toggleReactionPicker
  };
};

export default useReactionPicker;