import React from 'react';
import {
  Avatar,
  Badge,
  Box,
  useTheme
} from '@mui/material';
import {
  Group as GroupIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useChat } from '../../../hooks/useChat';
import { 
  getChatDisplayName, 
  getChatAvatar, 
  getInitials, 
  getAvatarColor 
} from '../../../utils/chatUtils';
import { CHAT_TYPES } from '../../../constants/chat';

const ChatAvatar = ({ 
  chat, 
  size = 48, 
  showOnlineStatus = false,
  onClick,
  className = ''
}) => {
  const theme = useTheme();
  const { isUserOnline } = useChat();

  // Determine if user is online (for private chats)
  const isOnline = showOnlineStatus && 
    chat.type === CHAT_TYPES.PRIVATE && 
    chat.participantId && 
    isUserOnline(chat.participantId);

  // Get avatar source
  const avatarSrc = getChatAvatar(chat);
  const displayName = getChatDisplayName(chat);
  const initials = getInitials(displayName);
  const avatarColor = getAvatarColor(displayName);

  // Create avatar content
  const getAvatarContent = () => {
    // If we have an image, use it
    if (avatarSrc) {
      return (
        <Avatar
          src={avatarSrc}
          alt={displayName}
          sx={{
            width: size,
            height: size,
            fontSize: size * 0.4,
            fontWeight: 600,
            backgroundColor: avatarColor,
            cursor: onClick ? 'pointer' : 'default'
          }}
          onClick={onClick}
          className={className}
        >
          {initials}
        </Avatar>
      );
    }

    // For group chats without image, show group icon
    if (chat.type === CHAT_TYPES.GROUP) {
      return (
        <Avatar
          sx={{
            width: size,
            height: size,
            backgroundColor: avatarColor,
            cursor: onClick ? 'pointer' : 'default'
          }}
          onClick={onClick}
          className={className}
        >
          <GroupIcon 
            sx={{ 
              fontSize: size * 0.5,
              color: 'white'
            }} 
          />
        </Avatar>
      );
    }

    // For private chats without image, show initials or person icon
    return (
      <Avatar
        sx={{
          width: size,
          height: size,
          fontSize: size * 0.4,
          fontWeight: 600,
          backgroundColor: avatarColor,
          color: 'white',
          cursor: onClick ? 'pointer' : 'default'
        }}
        onClick={onClick}
        className={className}
      >
        {initials || <PersonIcon sx={{ fontSize: size * 0.5 }} />}
      </Avatar>
    );
  };

  // Wrap with online status badge if needed
  if (showOnlineStatus && chat.type === CHAT_TYPES.PRIVATE) {
    return (
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        badgeContent={
          <Box
            sx={{
              width: size * 0.25,
              height: size * 0.25,
              borderRadius: '50%',
              backgroundColor: isOnline ? 'success.main' : 'grey.400',
              border: `2px solid ${theme.palette.background.paper}`,
              transition: 'background-color 0.3s ease'
            }}
          />
        }
      >
        {getAvatarContent()}
      </Badge>
    );
  }

  return getAvatarContent();
};

export default ChatAvatar;