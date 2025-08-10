import React, { useState, useRef, useEffect } from 'react';
import { 
  TextField, 
  IconButton, 
  Box,
  InputAdornment,
  Typography
} from '@mui/material';
import { 
  Send as SendIcon,
  AttachFile as AttachIcon,
  EmojiEmotions as EmojiIcon
} from '@mui/icons-material';
import ReplyPreview from './ReplyPreview';
import AttachmentPicker from '../Attachments/AttachmentPicker';
import useReply from '../../../hooks/useReply';
import useAttachmentPicker from '../../../hooks/useAttachmentPicker';
import './MessageInputWithReply.css';

/**
 * MessageInputWithReply Component
 * 
 * Enhanced message input component that integrates reply functionality.
 * Shows reply preview when replying to a message and handles reply submission.
 * 
 * Features:
 * - Reply preview integration
 * - Message composition with reply context
 * - Keyboard shortcuts (Enter to send, Escape to cancel reply)
 * - Auto-focus and auto-resize
 * - Attachment and emoji buttons
 * - Loading states and error handling
 */
const MessageInputWithReply = ({
  // Message handling
  onSendMessage,
  onStartReply, // External trigger for starting reply
  
  // Input props
  placeholder = 'Type a message...',
  disabled = false,
  maxLength = 1000,
  
  // Features
  showAttachButton = true,
  showEmojiButton = true,
  autoFocus = false,
  
  // Styling
  className = '',
  variant = 'outlined',
  
  // Callbacks
  onAttachClick, // Legacy callback for backward compatibility
  onAttachmentSelect, // New callback for attachment selection
  onEmojiClick,
  onTypingStart,
  onTypingStop,
  
  // Attachment configuration
  availableAttachmentTypes = ['camera', 'gallery', 'document', 'location', 'contact'],
  
  // State
  isLoading = false
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textFieldRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Attachment picker hook
  const {
    isOpen: isAttachmentPickerOpen,
    anchorEl: attachmentAnchorEl,
    openPicker: openAttachmentPicker,
    closePicker: closeAttachmentPicker,
    handleAttachmentSelect,
    isProcessing: isAttachmentProcessing,
    error: attachmentError
  } = useAttachmentPicker({
    onAttachmentSelect,
    availableTypes: availableAttachmentTypes,
    disabled: disabled || isLoading
  });

  const {
    replyTo,
    isReplying,
    startReply,
    cancelReply,
    clearReply,
    getReplyData,
    isValidReply,
    inputRef
  } = useReply();

  // Connect the reply hook's input ref to our TextField
  useEffect(() => {
    inputRef.current = textFieldRef.current?.querySelector('input') || textFieldRef.current?.querySelector('textarea');
  }, [inputRef]);

  // Handle external reply triggers
  useEffect(() => {
    if (onStartReply && typeof onStartReply === 'function') {
      // This allows parent components to trigger replies
      window.startReplyFromParent = startReply;
      return () => {
        delete window.startReplyFromParent;
      };
    }
  }, [startReply, onStartReply]);

  // Handle message input change
  const handleMessageChange = (event) => {
    const value = event.target.value;
    
    if (value.length <= maxLength) {
      setMessage(value);
      
      // Handle typing indicators
      if (value.trim() && !isTyping) {
        setIsTyping(true);
        onTypingStart?.();
      } else if (!value.trim() && isTyping) {
        setIsTyping(false);
        onTypingStop?.();
      }
      
      // Reset typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      if (value.trim()) {
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          onTypingStop?.();
        }, 3000);
      }
    }
  };

  // Handle message submission
  const handleSendMessage = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isLoading) return;

    try {
      const messageData = {
        content: trimmedMessage,
        type: 'text',
        replyTo: isReplying ? getReplyData() : null
      };

      await onSendMessage?.(messageData);
      
      // Clear input and reply state
      setMessage('');
      if (isReplying) {
        clearReply();
      }
      
      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        onTypingStop?.();
      }
      
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
    } catch (error) {
      console.error('Failed to send message:', error);
      // Handle error (could show toast notification)
    }
  };

  // Handle key press events
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        // Allow new line with Shift+Enter
        return;
      } else {
        // Send message with Enter
        event.preventDefault();
        handleSendMessage();
      }
    }
  };

  // Handle attachment button click
  const handleAttachClick = (event) => {
    // If new attachment picker is available, use it
    if (onAttachmentSelect) {
      openAttachmentPicker(event);
    } else {
      // Fallback to legacy callback for backward compatibility
      onAttachClick?.();
    }
  };

  // Handle emoji button click
  const handleEmojiClick = () => {
    onEmojiClick?.();
  };

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const canSend = message.trim().length > 0 && !isLoading;
  const characterCount = message.length;
  const isNearLimit = characterCount > maxLength * 0.8;

  return (
    <Box className={`message-input-with-reply ${className}`}>
      {/* Reply Preview */}
      {isReplying && replyTo && (
        <ReplyPreview
          replyTo={replyTo}
          onClose={cancelReply}
          variant="compact"
          position="top"
        />
      )}
      
      {/* Message Input */}
      <Box className="message-input-container">
        <TextField
          ref={textFieldRef}
          fullWidth
          multiline
          maxRows={4}
          variant={variant}
          placeholder={isReplying ? `Reply to ${replyTo?.senderName}...` : placeholder}
          value={message}
          onChange={handleMessageChange}
          onKeyPress={handleKeyPress}
          disabled={disabled || isLoading}
          autoFocus={autoFocus}
          className="message-input-field"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                {showAttachButton && (
                  <IconButton
                    size="small"
                    onClick={handleAttachClick}
                    disabled={disabled || isLoading || isAttachmentProcessing}
                    aria-label="Attach file"
                    title="Attach file"
                  >
                    <AttachIcon />
                  </IconButton>
                )}
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Box className="input-end-actions">
                  {showEmojiButton && (
                    <IconButton
                      size="small"
                      onClick={handleEmojiClick}
                      disabled={disabled || isLoading}
                      aria-label="Add emoji"
                      title="Add emoji"
                    >
                      <EmojiIcon />
                    </IconButton>
                  )}
                  
                  <IconButton
                    size="small"
                    onClick={handleSendMessage}
                    disabled={!canSend}
                    color={canSend ? 'primary' : 'default'}
                    aria-label="Send message"
                    title="Send message"
                    className={`send-button ${canSend ? 'can-send' : ''}`}
                  >
                    <SendIcon />
                  </IconButton>
                </Box>
              </InputAdornment>
            )
          }}
          helperText={
            isNearLimit ? (
              <span className={`character-count ${characterCount >= maxLength ? 'limit-exceeded' : ''}`}>
                {characterCount}/{maxLength}
              </span>
            ) : null
          }
        />
      </Box>

      {/* Attachment Picker */}
      <AttachmentPicker
        open={isAttachmentPickerOpen}
        onClose={closeAttachmentPicker}
        onAttachmentSelect={handleAttachmentSelect}
        anchorEl={attachmentAnchorEl}
        disabled={disabled || isLoading}
        availableTypes={availableAttachmentTypes}
      />

      {/* Attachment Error Display */}
      {attachmentError && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="error">
            {attachmentError}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default MessageInputWithReply;