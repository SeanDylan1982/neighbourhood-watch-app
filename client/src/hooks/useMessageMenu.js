import { useState, useCallback, useRef, useEffect } from 'react';
import { MESSAGE_ACTIONS } from '../constants/chat';

/**
 * useMessageMenu Hook
 * 
 * Handles message menu interactions including:
 * - Long-press detection for mobile devices
 * - Right-click detection for desktop
 * - Menu positioning and state management
 * - Touch event handling with proper cleanup
 */
const useMessageMenu = ({
  onReact,
  onReply,
  onCopy,
  onForward,
  onDelete,
  onInfo,
  onReport,
  onMessageAction
} = {}) => {
  const [menuState, setMenuState] = useState({
    open: false,
    anchorEl: null,
    messageId: null,
    position: { x: 0, y: 0 }
  });

  const longPressTimer = useRef(null);
  const touchStartPos = useRef({ x: 0, y: 0 });
  const isLongPress = useRef(false);
  const LONG_PRESS_DURATION = 500; // 500ms for long press
  const TOUCH_MOVE_THRESHOLD = 10; // 10px movement threshold

  // Open menu at specific position
  const openMenu = useCallback((messageId, anchorEl, position = null) => {
    setMenuState({
      open: true,
      anchorEl,
      messageId,
      position: position || { x: 0, y: 0 }
    });
  }, []);

  // Close menu
  const closeMenu = useCallback(() => {
    setMenuState({
      open: false,
      anchorEl: null,
      messageId: null,
      position: { x: 0, y: 0 }
    });
    isLongPress.current = false;
  }, []);

  // Handle right-click (desktop)
  const handleContextMenu = useCallback((event, messageId) => {
    event.preventDefault();
    event.stopPropagation();
    
    const position = {
      x: event.clientX,
      y: event.clientY
    };
    
    // Create virtual anchor element for positioning
    const virtualAnchor = {
      getBoundingClientRect: () => ({
        top: position.y,
        left: position.x,
        right: position.x,
        bottom: position.y,
        width: 0,
        height: 0
      })
    };
    
    openMenu(messageId, virtualAnchor, position);
  }, [openMenu]);

  // Handle touch start (mobile long-press detection)
  const handleTouchStart = useCallback((event, messageId, targetElement) => {
    const touch = event.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    isLongPress.current = false;
    
    // Clear any existing timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    
    // Start long-press timer
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      
      // Trigger haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      const position = {
        x: touchStartPos.current.x,
        y: touchStartPos.current.y
      };
      
      // Create virtual anchor element for positioning
      const virtualAnchor = {
        getBoundingClientRect: () => ({
          top: position.y,
          left: position.x,
          right: position.x,
          bottom: position.y,
          width: 0,
          height: 0
        })
      };
      
      openMenu(messageId, virtualAnchor, position);
    }, LONG_PRESS_DURATION);
  }, [openMenu]);

  // Handle touch move (cancel long-press if moved too much)
  const handleTouchMove = useCallback((event) => {
    if (longPressTimer.current) {
      const touch = event.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);
      
      // Cancel long-press if moved beyond threshold
      if (deltaX > TOUCH_MOVE_THRESHOLD || deltaY > TOUCH_MOVE_THRESHOLD) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
  }, []);

  // Handle touch end (cleanup and prevent click if long-press occurred)
  const handleTouchEnd = useCallback((event) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    // Prevent click event if long-press was triggered
    if (isLongPress.current) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, []);

  // Handle click (ensure it doesn't interfere with long-press)
  const handleClick = useCallback((event) => {
    if (isLongPress.current) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    return true;
  }, []);

  // Message action handlers
  const handleReact = useCallback((messageId) => {
    onReact?.(messageId);
    closeMenu();
  }, [onReact, closeMenu]);

  const handleReply = useCallback((messageId) => {
    onReply?.(messageId);
    closeMenu();
  }, [onReply, closeMenu]);

  const handleCopy = useCallback(async (messageId) => {
    try {
      // This will be handled by the MessageMenu component
      // which has access to the actual message content
      onCopy?.(messageId);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
    closeMenu();
  }, [onCopy, closeMenu]);

  const handleForward = useCallback((messageId) => {
    onForward?.(messageId);
    closeMenu();
  }, [onForward, closeMenu]);

  const handleDelete = useCallback((messageId, deleteType = MESSAGE_ACTIONS.DELETE_FOR_ME) => {
    onDelete?.(messageId, deleteType);
    closeMenu();
  }, [onDelete, closeMenu]);

  const handleInfo = useCallback((messageId) => {
    onInfo?.(messageId);
    closeMenu();
  }, [onInfo, closeMenu]);

  const handleReport = useCallback((messageId) => {
    onReport?.(messageId);
    closeMenu();
  }, [onReport, closeMenu]);

  const handleMessageAction = useCallback((messageId, action) => {
    onMessageAction?.(messageId, action);
    closeMenu();
  }, [onMessageAction, closeMenu]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  // Create event handlers for a message element
  const getMessageEventHandlers = useCallback((messageId) => {
    return {
      onContextMenu: (event) => handleContextMenu(event, messageId),
      onTouchStart: (event) => handleTouchStart(event, messageId, event.currentTarget),
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onClick: handleClick,
      // Prevent default context menu on mobile
      onTouchCancel: handleTouchEnd,
      // Additional properties for better touch handling
      style: {
        touchAction: 'manipulation', // Prevent double-tap zoom
        userSelect: 'none', // Prevent text selection during long-press
        WebkitTouchCallout: 'none', // Prevent iOS callout menu
        WebkitUserSelect: 'none'
      }
    };
  }, [handleContextMenu, handleTouchStart, handleTouchMove, handleTouchEnd, handleClick]);

  return {
    // Menu state
    menuState,
    isMenuOpen: menuState.open,
    
    // Menu controls
    openMenu,
    closeMenu,
    
    // Event handlers
    getMessageEventHandlers,
    handleContextMenu,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleClick,
    
    // Action handlers
    handleReact,
    handleReply,
    handleCopy,
    handleForward,
    handleDelete,
    handleInfo,
    handleReport,
    handleMessageAction
  };
};

export default useMessageMenu;