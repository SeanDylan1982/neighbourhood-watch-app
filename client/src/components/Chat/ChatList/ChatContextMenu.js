import React, { useEffect } from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  VolumeOff as MuteIcon,
  VolumeUp as UnmuteIcon,
  PushPin as PinIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Clear as ClearIcon,
  GetApp as ExportIcon
} from '@mui/icons-material';
import { useChat } from '../../../hooks/useChat';
import { CHAT_TYPES } from '../../../constants/chat';

const ChatContextMenu = ({ 
  chat, 
  anchorEl, 
  open, 
  onClose,
  position = { x: 0, y: 0 } // For touch/swipe positioning
}) => {
  const { updateChatSettings, deleteChat } = useChat();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Handle menu actions
  const handleMute = async () => {
    try {
      await updateChatSettings(chat.id, { isMuted: !chat.isMuted });
      onClose();
    } catch (error) {
      console.error('Failed to toggle mute:', error);
    }
  };

  const handlePin = async () => {
    try {
      await updateChatSettings(chat.id, { isPinned: !chat.isPinned });
      onClose();
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };

  const handleArchive = async () => {
    try {
      await updateChatSettings(chat.id, { isArchived: !chat.isArchived });
      onClose();
    } catch (error) {
      console.error('Failed to toggle archive:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete this ${chat.type} chat?`)) {
      try {
        await deleteChat(chat.id);
        onClose();
      } catch (error) {
        console.error('Failed to delete chat:', error);
      }
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear all messages in this chat?')) {
      // TODO: Implement clear chat functionality
      console.log('Clear chat:', chat.id);
      onClose();
    }
  };

  const handleViewInfo = () => {
    // TODO: Implement view info functionality
    console.log('View info:', chat.id);
    onClose();
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export chat:', chat.id);
    onClose();
  };

  // Close menu on escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && open) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, onClose]);

  // Determine menu positioning based on device type and position
  const getMenuProps = () => {
    if (isMobile && !anchorEl) {
      // For mobile swipe gestures, use absolute positioning
      return {
        open,
        onClose,
        anchorReference: 'anchorPosition',
        anchorPosition: { top: position.y, left: position.x },
        transformOrigin: { horizontal: 'left', vertical: 'top' },
        PaperProps: {
          sx: {
            minWidth: 180,
            maxWidth: 250,
            boxShadow: 4,
            borderRadius: 3,
            bgcolor: 'background.paper',
            border: `1px solid ${theme.palette.divider}`,
            '& .MuiMenuItem-root': {
              py: 1.5,
              px: 2,
              fontSize: '0.95rem',
              '&:hover': {
                bgcolor: 'action.hover',
              }
            }
          }
        }
      };
    }

    // Desktop right-click or mobile long-press with anchor element
    return {
      anchorEl,
      open,
      onClose,
      transformOrigin: { horizontal: 'right', vertical: 'top' },
      anchorOrigin: { horizontal: 'right', vertical: 'bottom' },
      PaperProps: {
        sx: {
          minWidth: 200,
          boxShadow: 3,
          borderRadius: 2,
          bgcolor: 'background.paper',
          border: `1px solid ${theme.palette.divider}`,
          '& .MuiMenuItem-root': {
            py: 1.2,
            px: 2,
            fontSize: '0.9rem',
            '&:hover': {
              bgcolor: 'action.hover',
            }
          }
        }
      }
    };
  };

  return (
    <Menu
      {...getMenuProps()}
    >
      {/* Mute/Unmute */}
      <MenuItem 
        onClick={handleMute}
        role="menuitem"
        aria-label={`${chat.isMuted ? 'Unmute' : 'Mute'} notifications for ${chat.name}`}
      >
        <ListItemIcon>
          {chat.isMuted ? <UnmuteIcon fontSize="small" /> : <MuteIcon fontSize="small" />}
        </ListItemIcon>
        <ListItemText>
          {chat.isMuted ? 'Unmute' : 'Mute'} notifications
        </ListItemText>
      </MenuItem>

      {/* Pin/Unpin */}
      <MenuItem 
        onClick={handlePin}
        role="menuitem"
        aria-label={`${chat.isPinned ? 'Unpin' : 'Pin'} ${chat.name} chat`}
      >
        <ListItemIcon>
          <PinIcon 
            fontSize="small" 
            sx={{ 
              transform: chat.isPinned ? 'rotate(45deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s'
            }} 
          />
        </ListItemIcon>
        <ListItemText>
          {chat.isPinned ? 'Unpin' : 'Pin'} chat
        </ListItemText>
      </MenuItem>

      {/* Archive/Unarchive */}
      <MenuItem 
        onClick={handleArchive}
        role="menuitem"
        aria-label={`${chat.isArchived ? 'Unarchive' : 'Archive'} ${chat.name} chat`}
      >
        <ListItemIcon>
          {chat.isArchived ? <UnarchiveIcon fontSize="small" /> : <ArchiveIcon fontSize="small" />}
        </ListItemIcon>
        <ListItemText>
          {chat.isArchived ? 'Unarchive' : 'Archive'} chat
        </ListItemText>
      </MenuItem>

      <Divider />

      {/* View Info */}
      <MenuItem 
        onClick={handleViewInfo}
        role="menuitem"
        aria-label={`View ${chat.type === CHAT_TYPES.GROUP ? 'group' : 'contact'} info for ${chat.name}`}
      >
        <ListItemIcon>
          <InfoIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>
          {chat.type === CHAT_TYPES.GROUP ? 'Group' : 'Contact'} info
        </ListItemText>
      </MenuItem>

      {/* Clear Chat */}
      <MenuItem 
        onClick={handleClearChat}
        role="menuitem"
        aria-label={`Clear all messages in ${chat.name} chat`}
      >
        <ListItemIcon>
          <ClearIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Clear chat</ListItemText>
      </MenuItem>

      {/* Export Chat */}
      <MenuItem 
        onClick={handleExport}
        role="menuitem"
        aria-label={`Export ${chat.name} chat`}
      >
        <ListItemIcon>
          <ExportIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Export chat</ListItemText>
      </MenuItem>

      <Divider />

      {/* Delete Chat */}
      <MenuItem 
        onClick={handleDelete} 
        sx={{ color: 'error.main' }}
        role="menuitem"
        aria-label={`Delete ${chat.name} chat`}
      >
        <ListItemIcon>
          <DeleteIcon fontSize="small" sx={{ color: 'error.main' }} />
        </ListItemIcon>
        <ListItemText>Delete chat</ListItemText>
      </MenuItem>
    </Menu>
  );
};

export default ChatContextMenu;