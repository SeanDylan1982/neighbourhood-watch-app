import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Box, Typography, IconButton, Fade } from '@mui/material';
import { KeyboardArrowDown as ArrowDownIcon } from '@mui/icons-material';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import MessageRetryButton from '../Common/MessageRetryButton';

/**
 * Scrollable message container with virtualization support
 * Includes proper spacing, message grouping logic, scroll-to-bottom functionality,
 * and offline message handling with retry buttons
 */
const MessageList = ({
  messages = [],
  currentUserId,
  chatType = 'group',
  typingUsers = {},
  onReaction,
  onReply,
  onMessageAction,
  className = '',
  enableVirtualization = true,
  searchQuery = '',
  highlightedMessageId = null,
  onRegisterMessageRef,
  offlineMode = false
}) => {
  const containerRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef(null);
  
  // Virtualization state
  const [containerHeight, setContainerHeight] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const ITEM_HEIGHT = 80; // Estimated height per message group
  const BUFFER_SIZE = 5; // Number of items to render outside visible area

  // Check if user is near bottom of messages
  const isNearBottom = useCallback(() => {
    if (!containerRef.current) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    return scrollHeight - scrollTop - clientHeight < 100; // Within 100px of bottom
  }, []);

  // Auto-scroll to bottom when new messages arrive (only if user is near bottom)
  const scrollToBottom = useCallback((force = false) => {
    if (containerRef.current && (force || (!isUserScrolling && isNearBottom()))) {
      // Use scrollTo if available (modern browsers), fallback to scrollTop for tests
      if (typeof containerRef.current.scrollTo === 'function') {
        containerRef.current.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      } else {
        // Fallback for test environments
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }
  }, [isUserScrolling, isNearBottom]);

  // Handle scroll events to show/hide scroll-to-bottom button
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const nearBottom = isNearBottom();
    setShowScrollButton(!nearBottom);
    
    // Update scroll position for virtualization
    setScrollTop(containerRef.current.scrollTop);
    
    // Set user scrolling flag
    setIsUserScrolling(true);
    
    // Clear previous timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Reset user scrolling flag after 1 second of no scrolling
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 1000);
  }, [isNearBottom]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Set up scroll listener and resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      
      // Set up resize observer for container height
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerHeight(entry.contentRect.height);
        }
      });
      
      resizeObserver.observe(container);
      
      return () => {
        container.removeEventListener('scroll', handleScroll);
        resizeObserver.disconnect();
      };
    }
  }, [handleScroll]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Group messages by sender and time proximity for better visual grouping
  const groupMessages = (messages) => {
    const groups = [];
    let currentGroup = null;

    messages.forEach((message, index) => {
      const isOwn = message.senderId === currentUserId || 
                   (message.isOwn !== undefined ? message.isOwn : false);
      const prevMessage = messages[index - 1];
      const prevIsOwn = prevMessage ? 
        (prevMessage.senderId === currentUserId || 
         (prevMessage.isOwn !== undefined ? prevMessage.isOwn : false)) : null;

      // Start new group if:
      // - First message
      // - Different sender
      // - More than 5 minutes between messages
      const shouldStartNewGroup = !currentGroup || 
        isOwn !== prevIsOwn ||
        (message.createdAt && prevMessage?.createdAt && 
         new Date(message.createdAt) - new Date(prevMessage.createdAt) > 5 * 60 * 1000);

      if (shouldStartNewGroup) {
        currentGroup = {
          isOwn,
          senderId: message.senderId,
          senderName: message.senderName || message.sender,
          messages: [message]
        };
        groups.push(currentGroup);
      } else {
        currentGroup.messages.push(message);
      }
    });

    return groups;
  };

  const messageGroups = groupMessages(messages);
  const typingUsersList = Object.values(typingUsers).filter(user => user.name);

  // Virtualization calculations
  const virtualizedData = useMemo(() => {
    if (!enableVirtualization || messageGroups.length === 0) {
      return {
        visibleItems: messageGroups,
        startIndex: 0,
        endIndex: messageGroups.length - 1,
        totalHeight: messageGroups.length * ITEM_HEIGHT,
        offsetY: 0
      };
    }

    const totalHeight = messageGroups.length * ITEM_HEIGHT;
    const visibleCount = Math.ceil(containerHeight / ITEM_HEIGHT);
    const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE);
    const endIndex = Math.min(
      messageGroups.length - 1,
      startIndex + visibleCount + BUFFER_SIZE * 2
    );
    
    const visibleItems = messageGroups.slice(startIndex, endIndex + 1);
    const offsetY = startIndex * ITEM_HEIGHT;

    return {
      visibleItems,
      startIndex,
      endIndex,
      totalHeight,
      offsetY
    };
  }, [messageGroups, containerHeight, scrollTop, enableVirtualization]);

  return (
    <Box
      ref={containerRef}
      className={className}
      sx={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        px: 2,
        py: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        position: 'relative', // For absolute positioned scroll button
        // Custom scrollbar styling
        '&::-webkit-scrollbar': {
          width: '6px'
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent'
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '3px',
          '&:hover': {
            background: 'rgba(0,0,0,0.3)'
          }
        }
      }}
    >
      {/* Empty state */}
      {messages.length === 0 && (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.secondary'
          }}
        >
          <Typography variant="body2">
            {chatType === 'private' 
              ? 'Start your conversation...' 
              : 'No messages yet. Start the conversation!'
            }
          </Typography>
        </Box>
      )}

      {/* Virtualized Message Groups */}
      {enableVirtualization && messageGroups.length > 0 ? (
        <Box
          sx={{
            height: virtualizedData.totalHeight,
            position: 'relative'
          }}
        >
          <Box
            sx={{
              transform: `translateY(${virtualizedData.offsetY}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0
            }}
          >
            {virtualizedData.visibleItems.map((group, visibleIndex) => {
              const actualIndex = virtualizedData.startIndex + visibleIndex;
              return (
                <Box
                  key={`group-${actualIndex}`}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: group.isOwn ? 'flex-end' : 'flex-start',
                    gap: 0.5,
                    mb: 1,
                    minHeight: ITEM_HEIGHT
                  }}
                >
                  {/* Sender name for group chats (only for received messages) */}
                  {chatType === 'group' && !group.isOwn && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        ml: 1,
                        mb: 0.5
                      }}
                    >
                      {group.senderName}
                    </Typography>
                  )}

                  {/* Messages in group */}
                  {group.messages.map((message, messageIndex) => (
                    <React.Fragment key={message.id || `msg-${actualIndex}-${messageIndex}`}>
                      <MessageBubble
                        message={message}
                        isOwn={group.isOwn}
                        chatType={chatType}
                        showSender={chatType === 'group' && !group.isOwn && messageIndex === 0}
                        showTime={messageIndex === group.messages.length - 1}
                        onReaction={onReaction}
                        onReply={onReply}
                        onMessageAction={onMessageAction}
                        searchQuery={searchQuery}
                        isHighlighted={highlightedMessageId === (message.id || `msg-${actualIndex}-${messageIndex}`)}
                        onRegisterRef={onRegisterMessageRef}
                        offlineMode={offlineMode}
                      />
                      
                      {/* Retry button for failed messages */}
                      {message.status === 'failed' && group.isOwn && (
                        <MessageRetryButton
                          message={message}
                          onRetry={(messageId) => onMessageAction(messageId, 'retry_message')}
                          onRemove={(messageId) => onMessageAction(messageId, 'remove_failed_message')}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </Box>
              );
            })}
          </Box>
        </Box>
      ) : (
        // Non-virtualized rendering for smaller lists
        messageGroups.map((group, groupIndex) => (
          <Box
            key={`group-${groupIndex}`}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: group.isOwn ? 'flex-end' : 'flex-start',
              gap: 0.5,
              mb: 1
            }}
          >
            {/* Sender name for group chats (only for received messages) */}
            {chatType === 'group' && !group.isOwn && (
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  ml: 1,
                  mb: 0.5
                }}
              >
                {group.senderName}
              </Typography>
            )}

            {/* Messages in group */}
            {group.messages.map((message, messageIndex) => (
              <React.Fragment key={message.id || `msg-${groupIndex}-${messageIndex}`}>
                <MessageBubble
                  message={message}
                  isOwn={group.isOwn}
                  chatType={chatType}
                  showSender={chatType === 'group' && !group.isOwn && messageIndex === 0}
                  showTime={messageIndex === group.messages.length - 1}
                  onReaction={onReaction}
                  onReply={onReply}
                  onMessageAction={onMessageAction}
                  searchQuery={searchQuery}
                  isHighlighted={highlightedMessageId === (message.id || `msg-${groupIndex}-${messageIndex}`)}
                  onRegisterRef={onRegisterMessageRef}
                  offlineMode={offlineMode}
                />
                
                {/* Retry button for failed messages */}
                {message.status === 'failed' && group.isOwn && (
                  <MessageRetryButton
                    message={message}
                    onRetry={(messageId) => onMessageAction(messageId, 'retry_message')}
                    onRemove={(messageId) => onMessageAction(messageId, 'remove_failed_message')}
                  />
                )}
              </React.Fragment>
            ))}
          </Box>
        ))
      )}

      {/* Typing Indicator */}
      {typingUsersList.length > 0 && (
        <Box sx={{ alignSelf: 'flex-start', ml: 1 }}>
          <TypingIndicator users={typingUsersList} />
        </Box>
      )}

      {/* Scroll to Bottom Button */}
      <Fade in={showScrollButton}>
        <IconButton
          onClick={() => scrollToBottom(true)}
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            backgroundColor: 'primary.main',
            color: 'white',
            width: 40,
            height: 40,
            boxShadow: 2,
            '&:hover': {
              backgroundColor: 'primary.dark'
            }
          }}
        >
          <ArrowDownIcon />
        </IconButton>
      </Fade>
    </Box>
  );
};

export default MessageList;