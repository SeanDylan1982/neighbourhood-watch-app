import React from 'react';
import {
  Box,
  Typography,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import {
  Image as ImageIcon,
  AudioFile as AudioIcon,
  Description as DocumentIcon,
  LocationOn as LocationIcon,
  ContactPhone as ContactIcon,
  Reply as ReplyIcon
} from '@mui/icons-material';
import { 
  truncateMessage, 
  getMessagePreview,
  highlightSearchTerm 
} from '../../../utils/chatUtils';
import { MESSAGE_TYPES } from '../../../constants/chat';

const MessagePreview = ({ 
  message, 
  maxLength = 50,
  showSender = false,
  searchQuery = '',
  isTyping = false,
  typingUsers = []
}) => {
  const theme = useTheme();

  // Handle typing indicator
  if (isTyping && typingUsers.length > 0) {
    const typingText = typingUsers.length === 1 
      ? `${typingUsers[0].userName} is typing...`
      : `${typingUsers.length} people are typing...`;
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography 
          variant="body2" 
          color="primary" 
          sx={{ 
            fontStyle: 'italic',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {typingText}
          <Box
            component="span"
            sx={{
              ml: 0.5,
              '&::after': {
                content: '"..."',
                animation: 'typing 1.5s infinite',
                '@keyframes typing': {
                  '0%, 20%': { opacity: 0 },
                  '50%': { opacity: 1 },
                  '100%': { opacity: 0 }
                }
              }
            }}
          />
        </Typography>
      </Box>
    );
  }

  // Handle no message
  if (!message) {
    return (
      <Typography variant="body2" color="text.disabled">
        No messages yet
      </Typography>
    );
  }

  // Get message type icon
  const getMessageTypeIcon = (type) => {
    const iconProps = { 
      fontSize: 'small', 
      sx: { mr: 0.5, color: 'text.secondary' } 
    };

    switch (type) {
      case MESSAGE_TYPES.IMAGE:
        return <ImageIcon {...iconProps} />;
      case MESSAGE_TYPES.AUDIO:
        return <AudioIcon {...iconProps} />;
      case MESSAGE_TYPES.DOCUMENT:
        return <DocumentIcon {...iconProps} />;
      case MESSAGE_TYPES.LOCATION:
        return <LocationIcon {...iconProps} />;
      case MESSAGE_TYPES.CONTACT:
        return <ContactIcon {...iconProps} />;
      default:
        return null;
    }
  };

  // Get message content preview
  const getContentPreview = () => {
    let preview = getMessagePreview(message);
    
    // Truncate if needed
    if (preview.length > maxLength) {
      preview = truncateMessage(preview, maxLength);
    }

    // Highlight search terms
    if (searchQuery) {
      return (
        <span
          dangerouslySetInnerHTML={{
            __html: highlightSearchTerm(preview, searchQuery)
          }}
        />
      );
    }

    return preview;
  };

  // Check if message is a reply
  const isReply = message.replyTo && message.replyTo.messageId;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      {/* Reply indicator */}
      {isReply && (
        <ReplyIcon 
          fontSize="small" 
          sx={{ 
            mr: 0.5, 
            color: 'text.secondary',
            transform: 'scaleX(-1)' // Flip horizontally for reply
          }} 
        />
      )}

      {/* Message type icon */}
      {getMessageTypeIcon(message.type)}

      {/* Message content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* Sender name for group chats */}
        {showSender && message.senderName && message.senderName !== 'You' && (
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ 
              display: 'block',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {searchQuery ? (
              <span
                dangerouslySetInnerHTML={{
                  __html: highlightSearchTerm(message.senderName, searchQuery)
                }}
              />
            ) : (
              message.senderName
            )}:
          </Typography>
        )}

        {/* Reply preview */}
        {isReply && (
          <Typography 
            variant="caption" 
            color="text.disabled"
            sx={{ 
              display: 'block',
              fontStyle: 'italic',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              mb: 0.25
            }}
          >
            Replying to: {truncateMessage(message.replyTo.content, 30)}
          </Typography>
        )}

        {/* Main message content */}
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: message.type === MESSAGE_TYPES.SYSTEM ? 500 : 400,
            fontStyle: message.type === MESSAGE_TYPES.SYSTEM ? 'italic' : 'normal'
          }}
        >
          {getContentPreview()}
        </Typography>

        {/* Attachment count indicator */}
        {message.attachments && message.attachments.length > 0 && (
          <Box sx={{ mt: 0.25 }}>
            <Chip
              size="small"
              label={`${message.attachments.length} attachment${message.attachments.length > 1 ? 's' : ''}`}
              sx={{
                height: 16,
                fontSize: '0.65rem',
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
                '& .MuiChip-label': {
                  px: 0.5
                }
              }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MessagePreview;