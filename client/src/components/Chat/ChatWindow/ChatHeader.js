import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  Badge,
  Tooltip,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Call as CallIcon,
  VideoCall as VideoCallIcon,
  MoreVert as MoreIcon,
  Info as InfoIcon,
  Group as GroupIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

/**
 * Chat header component with avatar, name, and status information
 * Adapts to both group and private chat contexts
 * Includes action buttons for call, video, and info
 */
const ChatHeader = ({ 
  chat, 
  onAction, 
  onBack,
  showBackButton = false,
  rightActions = null
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [menuAnchor, setMenuAnchor] = useState(null);

  // Handle menu open/close
  const handleMenuOpen = (event) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  // Handle header actions
  const handleAction = (action) => {
    handleMenuClose();
    if (onAction) {
      onAction(action);
    }
  };

  // Get chat display information
  const getChatInfo = () => {
    if (!chat) return { name: '', subtitle: '', avatar: null };

    if (chat.type === 'private') {
      return {
        name: chat.participantName || chat.name,
        subtitle: chat.isOnline 
          ? 'Online' 
          : chat.lastSeen 
            ? `Last seen ${formatLastSeen(chat.lastSeen)}`
            : 'Offline',
        avatar: chat.participantAvatar || chat.avatar,
        isOnline: chat.isOnline
      };
    } else {
      return {
        name: chat.name,
        subtitle: `${chat.memberCount || chat.members || 0} members`,
        avatar: null, // Group chats use group icon
        isOnline: false
      };
    }
  };

  // Format last seen time
  const formatLastSeen = (lastSeen) => {
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMs = now - lastSeenDate;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return lastSeenDate.toLocaleDateString();
  };

  const chatInfo = getChatInfo();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        position: 'relative',
        zIndex: 2
      }}
    >
      {/* Back Button (Mobile) */}
      {(showBackButton || isMobile) && onBack && (
        <IconButton
          onClick={onBack}
          sx={{ 
            color: 'text.primary',
            '&:hover': {
              bgcolor: 'action.hover'
            }
          }}
        >
          <BackIcon />
        </IconButton>
      )}

      {/* Chat Avatar */}
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        badgeContent={
          chat?.type === 'private' && chatInfo.isOnline ? (
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: 'success.main',
                border: 2,
                borderColor: 'background.paper'
              }}
            />
          ) : null
        }
      >
        <Avatar
          src={chatInfo.avatar}
          sx={{
            width: 40,
            height: 40,
            bgcolor: chat?.type === 'group' ? 'primary.main' : 'secondary.main'
          }}
        >
          {chat?.type === 'group' ? (
            <GroupIcon />
          ) : chatInfo.avatar ? null : (
            <PersonIcon />
          )}
        </Avatar>
      </Badge>

      {/* Chat Info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 'medium',
            fontSize: '1.1rem',
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {chatInfo.name}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: chat?.type === 'private' && chatInfo.isOnline 
              ? 'success.main' 
              : 'text.secondary',
            fontSize: '0.875rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {chatInfo.subtitle}
        </Typography>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Call Button (Private chats only) */}
        {chat?.type === 'private' && (
          <Tooltip title="Voice call">
            <IconButton
              onClick={() => handleAction('call')}
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                  bgcolor: 'action.hover'
                }
              }}
            >
              <CallIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Video Call Button (Private chats only) */}
        {chat?.type === 'private' && (
          <Tooltip title="Video call">
            <IconButton
              onClick={() => handleAction('video_call')}
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                  bgcolor: 'action.hover'
                }
              }}
            >
              <VideoCallIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Info Button */}
        <Tooltip title={chat?.type === 'group' ? 'Group info' : 'Contact info'}>
          <IconButton
            onClick={() => handleAction('info')}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                color: 'primary.main',
                bgcolor: 'action.hover'
              }
            }}
          >
            <InfoIcon />
          </IconButton>
        </Tooltip>

        {/* Custom Right Actions */}
        {rightActions}

        {/* More Options Menu */}
        <Tooltip title="More options">
          <IconButton
            onClick={handleMenuOpen}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                color: 'primary.main',
                bgcolor: 'action.hover'
              }
            }}
          >
            <MoreIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* More Options Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
      >
        <MenuItem onClick={() => handleAction('search')}>
          <Typography>Search messages</Typography>
        </MenuItem>
        
        {chat?.type === 'group' && (
          <>
            <MenuItem onClick={() => handleAction('group_info')}>
              <Typography>Group info</Typography>
            </MenuItem>
            <MenuItem onClick={() => handleAction('group_media')}>
              <Typography>Group media</Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => handleAction('mute')}>
              <Typography>Mute notifications</Typography>
            </MenuItem>
            <MenuItem onClick={() => handleAction('leave_group')}>
              <Typography sx={{ color: 'error.main' }}>Leave group</Typography>
            </MenuItem>
          </>
        )}

        {chat?.type === 'private' && (
          <>
            <MenuItem onClick={() => handleAction('contact_info')}>
              <Typography>Contact info</Typography>
            </MenuItem>
            <MenuItem onClick={() => handleAction('media')}>
              <Typography>Media, links, docs</Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => handleAction('mute')}>
              <Typography>Mute notifications</Typography>
            </MenuItem>
            <MenuItem onClick={() => handleAction('block')}>
              <Typography sx={{ color: 'warning.main' }}>Block contact</Typography>
            </MenuItem>
            <MenuItem onClick={() => handleAction('report')}>
              <Typography sx={{ color: 'error.main' }}>Report contact</Typography>
            </MenuItem>
          </>
        )}

        <Divider />
        <MenuItem onClick={() => handleAction('clear_chat')}>
          <Typography>Clear chat</Typography>
        </MenuItem>
        <MenuItem onClick={() => handleAction('export_chat')}>
          <Typography>Export chat</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ChatHeader;