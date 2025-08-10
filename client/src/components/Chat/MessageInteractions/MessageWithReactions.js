import React, { useState, useRef } from 'react';
import MessageMenu from './MessageMenu';
import ReactionPicker from './ReactionPicker';
import useReactionPicker from '../../../hooks/useReactionPicker';
import { MESSAGE_ACTIONS, CHAT_TYPES } from '../../../constants/chat';
import './MessageWithReactions.css';

/**
 * MessageWithReactions Component
 * 
 * Example component demonstrating integration of MessageMenu and ReactionPicker
 * with a message bubble. Shows how to handle reactions, menu interactions, and
 * proper positioning of both components.
 */
const MessageWithReactions = ({
  message,
  chatType = CHAT_TYPES.GROUP,
  currentUserId,
  onReact,
  onReply,
  onCopy,
  onForward,
  onDelete,
  onInfo,
  onReport,
  className = ''
}) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const messageRef = useRef(null);
  
  const {
    isVisible: isReactionPickerVisible,
    position: reactionPickerPosition,
    targetMessageId,
    showReactionPicker,
    hideReactionPicker
  } = useReactionPicker();

  const isOwnMessage = message.senderId === currentUserId;
  const isMenuOpen = Boolean(menuAnchorEl);

  // Handle long press for mobile
  const handleLongPress = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
  };

  // Handle right click for desktop
  const handleContextMenu = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
  };

  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  // Handle reaction button click from menu
  const handleReactFromMenu = (messageId) => {
    handleMenuClose();
    showReactionPicker(messageId, messageRef.current);
  };

  // Handle reaction selection
  const handleReactionSelect = (messageId, reactionType) => {
    onReact?.(messageId, reactionType);
    hideReactionPicker();
  };

  // Handle other menu actions
  const handleMenuAction = (action) => {
    switch (action) {
      case MESSAGE_ACTIONS.REPLY:
        onReply?.(message.id);
        break;
      case MESSAGE_ACTIONS.COPY:
        onCopy?.(message.id);
        break;
      case MESSAGE_ACTIONS.FORWARD:
        onForward?.(message.id);
        break;
      case MESSAGE_ACTIONS.DELETE_FOR_ME:
      case MESSAGE_ACTIONS.DELETE_FOR_EVERYONE:
        onDelete?.(message.id, action);
        break;
      case MESSAGE_ACTIONS.INFO:
        onInfo?.(message.id);
        break;
      case MESSAGE_ACTIONS.REPORT:
        onReport?.(message.id);
        break;
      default:
        break;
    }
  };

  // Render existing reactions
  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) {
      return null;
    }

    return (
      <div className="message-reactions">
        {message.reactions.map((reaction) => (
          <button
            key={reaction.type}
            className={`reaction-badge ${reaction.users.includes(currentUserId) ? 'user-reacted' : ''}`}
            onClick={() => handleReactionSelect(message.id, reaction.type)}
            title={`${reaction.type} (${reaction.count})`}
          >
            <span className="reaction-emoji">
              {getEmojiForReaction(reaction.type)}
            </span>
            <span className="reaction-count">{reaction.count}</span>
          </button>
        ))}
      </div>
    );
  };

  // Helper function to get emoji for reaction type
  const getEmojiForReaction = (reactionType) => {
    const emojiMap = {
      thumbs_up: '👍',
      laugh: '😂',
      wow: '😮',
      heart: '❤️',
      sad: '😢',
      angry: '😡'
    };
    return emojiMap[reactionType] || '👍';
  };

  return (
    <div className={`message-with-reactions ${className}`}>
      <div
        ref={messageRef}
        className={`message-bubble ${isOwnMessage ? 'own-message' : 'other-message'}`}
        onContextMenu={handleContextMenu}
        onTouchStart={(e) => {
          // Simple long press detection
          const timer = setTimeout(() => {
            handleLongPress(e);
          }, 500);
          
          const cleanup = () => {
            clearTimeout(timer);
            document.removeEventListener('touchend', cleanup);
            document.removeEventListener('touchmove', cleanup);
          };
          
          document.addEventListener('touchend', cleanup);
          document.addEventListener('touchmove', cleanup);
        }}
      >
        <div className="message-content">
          <div className="message-text">{message.content}</div>
          <div className="message-meta">
            <span className="message-time">
              {new Date(message.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
            {isOwnMessage && (
              <span className="message-status">
                {message.status === 'read' && '✓✓'}
                {message.status === 'delivered' && '✓'}
                {message.status === 'sent' && '✓'}
              </span>
            )}
          </div>
        </div>
        
        {renderReactions()}
      </div>

      {/* Message Menu */}
      <MessageMenu
        open={isMenuOpen}
        anchorEl={menuAnchorEl}
        onClose={handleMenuClose}
        messageId={message.id}
        chatType={chatType}
        isOwnMessage={isOwnMessage}
        messageType={message.type}
        onReact={handleReactFromMenu}
        onReply={() => handleMenuAction(MESSAGE_ACTIONS.REPLY)}
        onCopy={() => handleMenuAction(MESSAGE_ACTIONS.COPY)}
        onForward={() => handleMenuAction(MESSAGE_ACTIONS.FORWARD)}
        onDelete={(messageId, deleteType) => handleMenuAction(deleteType)}
        onInfo={() => handleMenuAction(MESSAGE_ACTIONS.INFO)}
        onReport={() => handleMenuAction(MESSAGE_ACTIONS.REPORT)}
      />

      {/* Reaction Picker */}
      <ReactionPicker
        messageId={targetMessageId}
        existingReactions={message.reactions || []}
        currentUserId={currentUserId}
        onReact={handleReactionSelect}
        onClose={hideReactionPicker}
        position={reactionPickerPosition}
        isVisible={isReactionPickerVisible && targetMessageId === message.id}
      />
    </div>
  );
};

export default MessageWithReactions;