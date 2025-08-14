import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Chip,
  Typography,
  Tooltip
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import AttachmentPicker from '../Attachments/AttachmentPicker';
import useAttachmentPicker from '../../../hooks/useAttachmentPicker';
import MobileOptimizedInput from '../Common/MobileOptimizedInput';
import { useResponsive } from '../../../hooks/useResponsive';

/**
 * Message input component with attachment support and reply functionality
 * Adapts to both group and private chat contexts
 */
const MessageInput = React.forwardRef(({
  onSendMessage,
  onAttachmentSelect,
  onTyping,
  onStopTyping,
  replyingTo,
  onCancelReply,
  chatType = 'group',
  disabled = false,
  placeholder,
  availableAttachmentTypes = ['camera', 'gallery', 'document', 'location', 'contact'],
  onFocus,
  onBlur
}, ref) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { isMobile } = useResponsive();
  
  // Combine refs
  const combinedRef = useCallback((node) => {
    inputRef.current = node;
    if (ref) {
      if (typeof ref === 'function') {
        ref(node);
      } else {
        ref.current = node;
      }
    }
  }, [ref]);

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
    disabled: disabled || isSending
  });

  // Get appropriate placeholder text
  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    return chatType === 'private' ? 'Type a message...' : 'Type a message to the group...';
  };

  // Handle typing with debouncing
  const handleTyping = useCallback(() => {
    if (onTyping) {
      onTyping();
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (onStopTyping) {
        onStopTyping();
      }
    }, 2000);
  }, [onTyping, onStopTyping]);

  // Handle message change
  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    handleTyping();
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!message.trim() || isSending || disabled) return;

    setIsSending(true);
    
    try {
      if (onSendMessage) {
        await onSendMessage(message.trim());
      }
      setMessage('');
      
      // Stop typing indicator
      if (onStopTyping) {
        onStopTyping();
      }
      
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle attachment click
  const handleAttachmentClick = (event) => {
    openAttachmentPicker(event);
  };

  // Clean up typing timeout on unmount
  React.useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Paper 
      elevation={0}
      data-message-input
      sx={{
        p: 2,
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        position: 'relative',
        zIndex: 2
      }}
    >
      {/* Reply Preview */}
      {replyingTo && (
        <Box sx={{ mb: 1 }}>
          <Chip
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                  Replying to {replyingTo.senderName}:
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  {replyingTo.content.length > 50 
                    ? `${replyingTo.content.substring(0, 50)}...` 
                    : replyingTo.content
                  }
                </Typography>
              </Box>
            }
            onDelete={onCancelReply}
            deleteIcon={<CloseIcon />}
            variant="outlined"
            size="small"
            sx={{
              maxWidth: '100%',
              '& .MuiChip-label': {
                display: 'block',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }
            }}
          />
        </Box>
      )}

      {/* Input Area */}
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
        {/* Attachment Button */}
        <Tooltip title="Attach file">
          <IconButton
            onClick={handleAttachmentClick}
            disabled={disabled || isSending || isAttachmentProcessing}
            sx={{ 
              color: 'text.secondary',
              '&:hover': {
                color: 'primary.main'
              }
            }}
          >
            <AttachIcon />
          </IconButton>
        </Tooltip>

        {/* Message Input */}
        {isMobile ? (
          <MobileOptimizedInput
            ref={combinedRef}
            value={message}
            onChange={handleMessageChange}
            onSend={handleSendMessage}
            onAttachment={openAttachmentPicker}
            placeholder={getPlaceholder()}
            disabled={disabled || isSending}
            showAttachmentButton={availableAttachmentTypes.length > 0}
            showVoiceButton={true}
            onFocus={onFocus}
            onBlur={onBlur}
            sx={{ flex: 1 }}
          />
        ) : (
          <>
            <TextField
              ref={combinedRef}
              fullWidth
              multiline
              maxRows={4}
              value={message}
              onChange={handleMessageChange}
              onKeyPress={handleKeyPress}
              onFocus={onFocus}
              onBlur={onBlur}
              placeholder={getPlaceholder()}
              disabled={disabled || isSending}
              variant="outlined"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  bgcolor: 'background.default',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main'
                  }
                }
              }}
            />

            {/* Send Button */}
            <Tooltip title="Send message">
              <span>
                <IconButton
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isSending || disabled}
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.dark'
                    },
                    '&.Mui-disabled': {
                      bgcolor: 'action.disabled',
                      color: 'action.disabled'
                    }
                  }}
                >
                  <SendIcon />
                </IconButton>
              </span>
            </Tooltip>
          </>
        )}
      </Box>

      {/* Attachment Picker */}
      <AttachmentPicker
        open={isAttachmentPickerOpen}
        onClose={closeAttachmentPicker}
        onAttachmentSelect={handleAttachmentSelect}
        anchorEl={attachmentAnchorEl}
        disabled={disabled || isSending}
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
    </Paper>
  );
});

MessageInput.displayName = 'MessageInput';

export default MessageInput;