import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useVirtualScroll } from '../../../hooks/useVirtualScroll';
import { useMessageCache } from '../../../hooks/useMessageCache';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import './VirtualizedMessageList.css';

/**
 * Virtualized message list component for efficient rendering of large message lists
 */
const VirtualizedMessageList = ({
  chatId,
  messages = [],
  currentUserId,
  onLoadMoreMessages,
  onMessageAction,
  onReaction,
  onReply,
  scrollToBottom = false,
  typingUsers = [],
  className = ''
}) => {
  const [containerHeight, setContainerHeight] = useState(400);
  const containerRef = useRef(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(scrollToBottom);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // Message cache for pagination
  const {
    loadPage,
    getMessagesInRange,
    addMessage,
    updateMessage,
    removeMessage,
    hasMoreBefore,
    isLoading
  } = useMessageCache({
    chatId,
    pageSize: 50,
    maxCacheSize: 500,
    onLoadMessages: onLoadMoreMessages
  });

  // Calculate item height based on message content
  const calculateItemHeight = useCallback((message) => {
    // Base height for message bubble
    let height = 60;
    
    // Add height for content
    if (message.content) {
      const lines = Math.ceil(message.content.length / 50);
      height += lines * 20;
    }
    
    // Add height for attachments
    if (message.attachments?.length > 0) {
      height += message.attachments.length * 40;
    }
    
    // Add height for reactions
    if (message.reactions?.length > 0) {
      height += 30;
    }
    
    // Add height for reply preview
    if (message.replyTo) {
      height += 40;
    }
    
    return Math.min(height, 300); // Cap at 300px
  }, []);

  // Virtual scrolling
  const {
    scrollElementRef,
    visibleItems,
    totalHeight,
    handleScroll,
    scrollToItem,
    visibleRange
  } = useVirtualScroll({
    items: messages,
    itemHeight: 80, // Average height
    containerHeight,
    overscan: 5,
    scrollToIndex: shouldScrollToBottom ? messages.length - 1 : null,
    onScroll: ({ scrollTop, scrollDirection }) => {
      const threshold = 100;
      const isAtBottom = scrollTop + containerHeight >= totalHeight - threshold;
      setIsNearBottom(isAtBottom);
      
      // Load more messages when scrolling up
      if (scrollDirection === 'up' && scrollTop < threshold && hasMoreBefore) {
        const currentPage = Math.floor(visibleRange.startIndex / 50);
        loadPage(currentPage + 1, 'before');
      }
    }
  });

  // Update container height on resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerHeight(rect.height);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (shouldScrollToBottom && isNearBottom) {
      scrollToItem(messages.length - 1);
    }
  }, [messages.length, shouldScrollToBottom, isNearBottom, scrollToItem]);

  // Handle new messages
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage.senderId === currentUserId || isNearBottom) {
        setShouldScrollToBottom(true);
      }
    }
  }, [messages, currentUserId, isNearBottom]);

  // Render message item
  const renderMessage = useCallback((item) => {
    const message = item;
    const isOwn = message.senderId === currentUserId;
    
    return (
      <div
        key={message.id}
        className={`virtualized-message-item ${isOwn ? 'own' : 'other'}`}
        style={{
          position: 'absolute',
          top: item.offsetY,
          left: 0,
          right: 0,
          height: calculateItemHeight(message)
        }}
      >
        <MessageBubble
          message={message}
          isOwn={isOwn}
          onAction={onMessageAction}
          onReaction={onReaction}
          onReply={onReply}
          showAvatar={!isOwn}
          showTimestamp={true}
        />
      </div>
    );
  }, [currentUserId, calculateItemHeight, onMessageAction, onReaction, onReply]);

  // Scroll to bottom button
  const ScrollToBottomButton = () => {
    if (isNearBottom) return null;
    
    return (
      <button
        className="scroll-to-bottom-btn"
        onClick={() => {
          setShouldScrollToBottom(true);
          scrollToItem(messages.length - 1);
        }}
        aria-label="Scroll to bottom"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 14l5 5 5-5H7z"/>
        </svg>
      </button>
    );
  };

  return (
    <div 
      ref={containerRef}
      className={`virtualized-message-list ${className}`}
    >
      <div
        ref={scrollElementRef}
        className="virtualized-scroll-container"
        onScroll={handleScroll}
        style={{ height: '100%', overflowY: 'auto' }}
      >
        <div
          className="virtualized-content"
          style={{ height: totalHeight, position: 'relative' }}
        >
          {/* Loading indicator for older messages */}
          {isLoading && (
            <div className="loading-indicator">
              <div className="loading-spinner" />
              <span>Loading messages...</span>
            </div>
          )}
          
          {/* Render visible messages */}
          {visibleItems.map(renderMessage)}
          
          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div
              className="typing-indicator-container"
              style={{
                position: 'absolute',
                top: totalHeight,
                left: 0,
                right: 0
              }}
            >
              <TypingIndicator users={typingUsers} />
            </div>
          )}
        </div>
      </div>
      
      <ScrollToBottomButton />
    </div>
  );
};

export default VirtualizedMessageList;