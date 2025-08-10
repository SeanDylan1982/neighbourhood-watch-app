import React, { useState, useEffect, useRef, memo } from 'react';
import {
  Box,
  Paper,
  Typography
} from '@mui/material';
import MessageMenu from '../MessageInteractions/MessageMenu';
import useMessageMenu from '../../../hooks/useMessageMenu';
import MessageHighlighter from '../Common/MessageHighlighter';
import ForwardedMessageIndicator from '../MessageInteractions/ForwardedMessageIndicator';
import useMessageForwarding from '../../../hooks/useMessageForwarding';
import { CHAT_TYPES } from '../../../constants/chat';

/**
 * WhatsApp-style unified message bubble component
 * Green bubbles for sent messages, gray for received messages
 * Includes proper spacing, rounded corners, and typography
 * Supports both group and private chat contexts
 */
const MessageBubble = ({
  message,
  isOwn = false,
  chatType = 'group',
  currentUserId,
  showSender = false,
  showTime = true,
  showAvatar = false,
  onReaction,
  onReply,
  onMessageAction,
  onForward,
  onDelete,
  onInfo,
  onReport,
  className = '',
  searchQuery = '',
  isHighlighted = false,
  onRegisterRef
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const messageRef = useRef(null);

  // Initialize message forwarding hook
  const { getForwardingMetadata } = useMessageForwarding();
  
  // Initialize message menu hook
  const messageMenu = useMessageMenu({
    onReact: onReaction,
    onReply,
    onCopy: (messageId) => {
      // Copy message content to clipboard
      const content = message.content || message.message || '';
      navigator.clipboard.writeText(content);
    },
    onForward,
    onDelete,
    onInfo,
    onReport,
    onMessageAction
  });

  // Get message event handlers from the hook
  const messageEventHandlers = messageMenu.getMessageEventHandlers(message.id || message._id);

  // Register message ref for search functionality
  useEffect(() => {
    if (onRegisterRef && messageRef.current) {
      onRegisterRef(message.id || message._id, messageRef.current);
    }
    
    return () => {
      if (onRegisterRef) {
        onRegisterRef(message.id || message._id, null);
      }
    };
  }, [message.id, message._id, onRegisterRef]);

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get bubble colors based on theme and message type
  const getBubbleStyles = (theme) => {
    if (isOwn) {
      return {
        bgcolor: theme.palette.mode === 'dark' ? '#005c4b' : '#dcf8c6',
        color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
        borderBottomRightRadius: 4,
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 1px 2px rgba(0,0,0,0.3)' 
          : '0 1px 2px rgba(0,0,0,0.1)'
      };
    } else {
      return {
        bgcolor: theme.palette.mode === 'dark' ? '#262d31' : '#ffffff',
        color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
        borderBottomLeftRadius: 4,
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 1px 2px rgba(0,0,0,0.3)' 
          : '0 1px 2px rgba(0,0,0,0.1)'
      };
    }
  };

  // Get sender name for group chats
  const getSenderName = () => {
    if (chatType === 'group' && !isOwn && showSender) {
      return message.senderName || message.sender?.firstName + ' ' + message.sender?.lastName || 'Unknown';
    }
    return null;
  };

  // Get message content based on type
  const getMessageContent = () => {
    const content = message.content || message.message || '';
    
    // Handle different message types
    switch (message.type) {
      case 'image':
        return '🖼️ Photo';
      case 'audio':
        return `🎙️ Audio ${message.metadata?.duration ? `(${message.metadata.duration}s)` : ''}`;
      case 'document':
        return `📄 ${message.filename || 'Document'}`;
      case 'location':
        return '📍 Location';
      case 'contact':
        return '👤 Contact';
      default:
        return content;
    }
  };

  // Get forwarding metadata
  const forwardingMetadata = getForwardingMetadata(message);

  return (
    <Box
      ref={messageRef}
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...messageEventHandlers}
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 1,
        maxWidth: '70%',
        alignSelf: isOwn ? 'flex-end' : 'flex-start',
        transition: 'background-color 0.3s ease',
        borderRadius: 1,
        p: 0.5,
        m: -0.5,
        ...(isHighlighted && {
          backgroundColor: 'rgba(255, 235, 59, 0.2)',
          animation: 'pulse 1s ease-in-out'
        }),
        '@keyframes pulse': {
          '0%': { backgroundColor: 'rgba(255, 235, 59, 0.4)' },
          '50%': { backgroundColor: 'rgba(255, 235, 59, 0.2)' },
          '100%': { backgroundColor: 'rgba(255, 235, 59, 0.1)' }
        },
        ...messageEventHandlers.style
      }}
    >
      {/* Message Bubble */}
      <Paper
        elevation={1}
        sx={(theme) => ({
          ...getBubbleStyles(theme),
          px: 2,
          py: 1,
          borderRadius: 2,
          position: 'relative',
          wordBreak: 'break-word',
          // WhatsApp-style tail
          '&::before': isOwn ? {
            content: '""',
            position: 'absolute',
            bottom: 0,
            right: -6,
            width: 0,
            height: 0,
            borderLeft: `6px solid ${theme.palette.mode === 'dark' ? '#005c4b' : '#dcf8c6'}`,
            borderBottom: '6px solid transparent'
          } : {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: -6,
            width: 0,
            height: 0,
            borderRight: `6px solid ${theme.palette.mode === 'dark' ? '#262d31' : '#ffffff'}`,
            borderBottom: '6px solid transparent'
          }
        })}
      >
        {/* Forwarded Message Indicator */}
        {forwardingMetadata && (
          <ForwardedMessageIndicator
            originalSender={forwardingMetadata.originalSender}
            originalChatName={forwardingMetadata.originalChatName}
            forwardedBy={forwardingMetadata.forwardedBy}
            forwardedAt={forwardingMetadata.forwardedAt}
            variant="compact"
          />
        )}

        {/* Reply Preview */}
        {message.replyTo && (
          <Box
            sx={{
              mb: 1,
              p: 1,
              borderLeft: 3,
              borderColor: 'primary.main',
              bgcolor: 'rgba(0,0,0,0.1)',
              borderRadius: 1
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 'medium', opacity: 0.8 }}>
              {message.replyTo.senderName}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7, fontSize: '0.875rem' }}>
              {message.replyTo.content.length > 100 
                ? `${message.replyTo.content.substring(0, 100)}...`
                : message.replyTo.content
              }
            </Typography>
          </Box>
        )}

        {/* Sender Name for Group Chats */}
        {getSenderName() && (
          <Typography
            variant="caption"
            sx={{
              fontWeight: 'medium',
              color: 'primary.main',
              fontSize: '0.8rem',
              mb: 0.5,
              display: 'block'
            }}
          >
            {getSenderName()}
          </Typography>
        )}

        {/* Message Content */}
        {searchQuery && (message.type === 'text' || !message.type) ? (
          <MessageHighlighter
            text={getMessageContent()}
            searchQuery={searchQuery}
            component={Typography}
            variant="body2"
            sx={{
              lineHeight: 1.4,
              fontSize: '0.95rem'
            }}
            highlightStyle={{
              backgroundColor: 'warning.main',
              color: 'warning.contrastText',
              fontWeight: 'bold'
            }}
          />
        ) : (
          <Typography
            variant="body2"
            sx={{
              lineHeight: 1.4,
              fontSize: '0.95rem',
              fontFamily: 'system-ui, -apple-system, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {getMessageContent()}
          </Typography>
        )}

        {/* Message Footer */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 0.5,
            mt: 0.5
          }}
        >
          {/* Timestamp */}
          {showTime && (
            <Typography
              variant="caption"
              sx={{
                opacity: 0.6,
                fontSize: '0.75rem'
              }}
            >
              {formatTime(message.createdAt || message.timestamp)}
            </Typography>
          )}

          {/* Delivery Status for own messages */}
          {isOwn && (
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 0.5 }}>
              {message.status === 'queued' && (
                <Typography variant="caption" sx={{ opacity: 0.6, fontSize: '0.75rem', color: 'warning.main' }}>
                  📤
                </Typography>
              )}
              {message.status === 'sending' && (
                <Typography variant="caption" sx={{ opacity: 0.6, fontSize: '0.75rem' }}>
                  ⏳
                </Typography>
              )}
              {message.status === 'retry_pending' && (
                <Typography variant="caption" sx={{ opacity: 0.6, fontSize: '0.75rem', color: 'warning.main' }}>
                  🔄
                </Typography>
              )}
              {message.status === 'sent' && (
                <Typography variant="caption" sx={{ opacity: 0.6, fontSize: '0.75rem' }}>
                  ✓
                </Typography>
              )}
              {message.status === 'delivered' && (
                <Typography variant="caption" sx={{ opacity: 0.6, fontSize: '0.75rem' }}>
                  ✓✓
                </Typography>
              )}
              {message.status === 'read' && (
                <Typography variant="caption" sx={{ color: 'primary.main', fontSize: '0.75rem' }}>
                  ✓✓
                </Typography>
              )}
              {message.status === 'failed' && (
                <Typography variant="caption" sx={{ color: 'error.main', fontSize: '0.75rem' }}>
                  ❌
                </Typography>
              )}
            </Box>
          )}
        </Box>

        {/* Reactions Display */}
        {message.reactions && message.reactions.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.5,
              mt: 1
            }}
          >
            {message.reactions.map((reaction, index) => (
              <Box
                key={`${reaction.type}-${index}`}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1,
                  py: 0.25,
                  bgcolor: 'rgba(0,0,0,0.1)',
                  borderRadius: 2,
                  cursor: 'pointer'
                }}
                onClick={() => onReaction && onReaction(message.id, reaction.type)}
              >
                <Typography variant="caption">{reaction.type}</Typography>
                <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.8 }}>
                  {reaction.count}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      {/* Message Menu Component */}
      <MessageMenu
        open={messageMenu.isMenuOpen}
        anchorEl={messageMenu.menuState.anchorEl}
        onClose={messageMenu.closeMenu}
        messageId={message.id || message._id}
        chatType={chatType === 'group' ? CHAT_TYPES.GROUP : CHAT_TYPES.PRIVATE}
        isOwnMessage={isOwn}
        messageType={message.type || 'text'}
        onReact={messageMenu.handleReact}
        onReply={messageMenu.handleReply}
        onCopy={messageMenu.handleCopy}
        onForward={messageMenu.handleForward}
        onDelete={messageMenu.handleDelete}
        onInfo={messageMenu.handleInfo}
        onReport={messageMenu.handleReport}
        onMessageAction={messageMenu.handleMessageAction}
      />
    </Box>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(MessageBubble, (prevProps, nextProps) => {
  return (
    prevProps.message?.id === nextProps.message?.id &&
    prevProps.message?.content === nextProps.message?.content &&
    prevProps.message?.status === nextProps.message?.status &&
    prevProps.message?.reactions?.length === nextProps.message?.reactions?.length &&
    prevProps.isOwn === nextProps.isOwn &&
    prevProps.showAvatar === nextProps.showAvatar &&
    prevProps.showTimestamp === nextProps.showTimestamp &&
    prevProps.searchQuery === nextProps.searchQuery
  );
});