import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';
import EmojiPicker from '../Common/EmojiPicker';

const MessageComposer = ({ onSendMessage, disabled, onTypingStart, onTypingStop }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const textFieldRef = useRef(null);

  // Handle typing indicator
  useEffect(() => {
    if (message && !isTyping) {
      setIsTyping(true);
      onTypingStart && onTypingStart();
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        onTypingStop && onTypingStop();
      }, 2000); // Stop typing indicator after 2 seconds of inactivity
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, isTyping, onTypingStart, onTypingStop]);

  const handleSendMessage = async () => {
    if (message.trim() && !sending && !disabled) {
      setSending(true);
      const messageContent = message.trim();
      setMessage('');
      
      try {
        await onSendMessage(messageContent);
      } catch (error) {
        console.error('Error sending message:', error);
        setMessage(messageContent); // Restore message on error
      } finally {
        setSending(false);
        setIsTyping(false);
        onTypingStop && onTypingStop();
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    // Get current cursor position
    const textField = textFieldRef.current;
    const cursorPosition = textField ? textField.selectionStart : message.length;
    
    // Insert emoji at cursor position
    const emojiCode = `{{EMOJI:${emoji.code}}}`;
    const newMessage = 
      message.substring(0, cursorPosition) + 
      emojiCode + 
      message.substring(cursorPosition);
    
    setMessage(newMessage);
    
    // Focus back on the text field
    setTimeout(() => {
      if (textField) {
        textField.focus();
        const newPosition = cursorPosition + emojiCode.length;
        textField.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  // File upload feature will be implemented in a future task
  const handleAttachFile = () => {
    // Placeholder for file attachment
    console.log('File upload will be implemented in task 4');
  };

  return (
    <Box sx={{ p: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
      <EmojiPicker 
        onEmojiSelect={handleEmojiSelect} 
        size={32} 
      />
      
      <Tooltip title="Attach file">
        <IconButton color="primary" onClick={handleAttachFile} disabled={disabled}>
          <AttachFileIcon />
        </IconButton>
      </Tooltip>
      
      <TextField
        fullWidth
        multiline
        maxRows={4}
        placeholder="Type a message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={disabled}
        inputRef={textFieldRef}
        sx={{ 
          '& .MuiOutlinedInput-root': {
            borderRadius: 4
          }
        }}
      />
      
      <IconButton 
        color="primary" 
        onClick={handleSendMessage}
        disabled={!message.trim() || sending || disabled}
      >
        {sending ? <CircularProgress size={24} /> : <SendIcon />}
      </IconButton>
    </Box>
  );
};

export default MessageComposer;