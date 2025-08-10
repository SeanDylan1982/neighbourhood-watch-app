import React, { useState, useRef, useCallback, memo } from 'react';
import {
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Box,
  Typography,
  Badge,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';
import {
  VolumeOff as MuteIcon,
  PushPin as PinIcon,
  Archive as ArchiveIcon,
  MoreVert as MoreIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon
} from '@mui/icons-material';
import { useChat } from '../../../hooks/useChat';
import { useDesktopFeatures } from '../../../hooks/useResponsive';
import { useSwipeActions } from '../../../hooks/useMobileGestures';
import { 
  formatTime, 
  formatRelativeTime, 
  getMessagePreview, 
  highlightSearchTerm,
  getChatDisplayName 
} from '../../../utils/chatUtils';
import { CHAT_TYPES } from '../../../constants/chat';
import ChatAvatar from './ChatAvatar';
import ChatContextMenu from './ChatContextMenu';
import DesktopContextMenu from '../Common/DesktopContextMenu';
import HoverTimestamp from '../Common/HoverTimestamp';

const ChatListItem = ({ 
  chat, 
  isSelected = false, 
  onClick, 
  searchQuery = '',
  showContextMenu = true,
  dense = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { features, isHovering, hoverHandlers } = useDesktopFeatures();
  const { typingIndicators, isUserOnline } = useChat();
  const [contextMenuAnchor, setContextMenuAnchor] = useState(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  
  // Mobile swipe gestures
  const { gestureHandlers, swipeOffset, isSwipeActive } = useSwipeActions({
    onSwipeLeft: (event, data) => {
      // Show quick actions (archive, delete, etc.)
      if (Math.abs(data.deltaX) > 100) {
        // Trigger archive action
        console.log('Archive chat:', chat.id);
      }
    },
    onSwipeRight: (event, data) => {
      // Show quick reply or mark as read
      if (Math.abs(data.deltaX) > 100) {
        // Trigger quick reply
        console.log('Quick reply to:', chat.id);
      }
    },
    swipeThreshold: 80,
    disabled: !isMobile
  });
  
  // Touch/swipe handling (legacy - keeping for long press)
  const touchStartRef = useRef(null);
  const touchTimeRef = useRef(null);
  const longPressTimerRef = useRef(null);

  // Get typing users for this chat
  const typingUsers = typingIndicators[chat.id] || [];
  const isTyping = typingUsers.length > 0;

  // Format last message time
  const getLastMessageTime = () => {
    if (!chat.lastMessage?.timestamp) return '';
    
    const now = new Date();
    const messageTime = new Date(chat.lastMessage.timestamp);
    const diffInHours = (now - messageTime) / (1000 * 60 * 60);
    
    // Show relative time for recent messages, absolute time for older ones
    if (diffInHours < 24) {
      return formatTime(chat.lastMessage.timestamp);
    } else {
      return formatRelativeTime(chat.lastMessage.timestamp);
    }
  };

  // Get message preview with typing indicator
  const getMessageDisplay = () => {
    if (isTyping) {
      const typingText = typingUsers.length === 1 
        ? `${typingUsers[0].userName} is typing...`
        : `${typingUsers.length} people are typing...`;
      
      return (
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
      );
    }

    const preview = getMessagePreview(chat.lastMessage);
    
    if (searchQuery) {
      return (
        <Typography 
          variant="body2" 
          color="text.secondary"
          dangerouslySetInnerHTML={{
            __html: highlightSearchTerm(preview, searchQuery)
          }}
        />
      );
    }

    return (
      <Typography variant="body2" color="text.secondary">
        {preview}
      </Typography>
    );
  };

  // Handle context menu
  const handleContextMenu = (event) => {
    if (!showContextMenu) return;
    
    event.preventDefault();
    event.stopPropagation();
    setContextMenuAnchor(event.currentTarget);
  };

  const handleMoreClick = (event) => {
    event.stopPropagation();
    setContextMenuAnchor(event.currentTarget);
  };

  const handleContextMenuClose = () => {
    setContextMenuAnchor(null);
    setContextMenuPosition({ x: 0, y: 0 });
  };

  // Touch event handlers for mobile swipe/long-press
  const handleTouchStart = useCallback((event) => {
    if (!isMobile || !showContextMenu) return;
    
    const touch = event.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    touchTimeRef.current = Date.now();
    
    // Set up long press timer
    longPressTimerRef.current = setTimeout(() => {
      if (touchStartRef.current) {
        // Long press detected - show context menu
        setContextMenuPosition({
          x: touchStartRef.current.x,
          y: touchStartRef.current.y
        });
        setContextMenuAnchor(null); // Use position instead of anchor
        
        // Provide haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
    }, 500); // 500ms for long press
  }, [isMobile, showContextMenu]);

  const handleTouchMove = useCallback((event) => {
    if (!touchStartRef.current || !longPressTimerRef.current) return;
    
    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    
    // If user moves finger too much, cancel long press
    if (deltaX > 10 || deltaY > 10) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // Handle click
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(chat.id);
    }
  }, [onClick, chat.id]);

  const handleTouchEnd = useCallback((event) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    if (!touchStartRef.current) return;
    
    const touchDuration = Date.now() - touchTimeRef.current;
    
    // If it was a quick tap and not a long press, handle normal click
    if (touchDuration < 500 && !contextMenuAnchor) {
      handleClick();
    }
    
    touchStartRef.current = null;
    touchTimeRef.current = null;
  }, [contextMenuAnchor, handleClick]);

  // Clean up timer on unmount
  React.useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // Get online status for private chats
  const getOnlineStatus = () => {
    if (chat.type !== CHAT_TYPES.PRIVATE) return null;
    
    if (chat.participantId && isUserOnline(chat.participantId)) {
      return 'online';
    }
    
    if (chat.lastSeen) {
      return `Last seen ${formatRelativeTime(chat.lastSeen)}`;
    }
    
    return 'offline';
  };

  const onlineStatus = getOnlineStatus();

  // Desktop context menu items
  const desktopMenuItems = [
    {
      id: 'open',
      label: 'Open Chat',
      action: 'open',
      icon: <PersonIcon />,
      primary: true,
      shortcut: 'Enter'
    },
    { type: 'divider' },
    {
      id: 'mute',
      label: chat.isMuted ? 'Unmute' : 'Mute',
      action: 'toggle_mute',
      icon: chat.isMuted ? <NotificationsIcon /> : <NotificationsOffIcon />
    },
    {
      id: 'pin',
      label: chat.isPinned ? 'Unpin' : 'Pin',
      action: 'toggle_pin',
      icon: <PinIcon />
    },
    {
      id: 'archive',
      label: chat.isArchived ? 'Unarchive' : 'Archive',
      action: 'toggle_archive',
      icon: <ArchiveIcon />
    },
    { type: 'divider' },
    {
      id: 'mark_read',
      label: 'Mark as Read',
      action: 'mark_read',
      disabled: chat.unreadCount === 0
    },
    {
      id: 'clear',
      label: 'Clear Chat',
      action: 'clear_chat',
      danger: true
    },
    {
      id: 'delete',
      label: 'Delete Chat',
      action: 'delete_chat',
      danger: true,
      shortcut: 'Del'
    }
  ];

  const handleDesktopMenuAction = (action, data) => {
    switch (action) {
      case 'open':
        handleClick();
        break;
      default:
        // Handle other actions through existing context menu system
        break;
    }
  };

  return (
    <>
      <DesktopContextMenu
        menuItems={features.rightClickMenus ? desktopMenuItems : []}
        onAction={handleDesktopMenuAction}
        disabled={!showContextMenu}
      >
        <ListItem
          button
          selected={isSelected}
          onClick={!isMobile ? handleClick : undefined} // Only handle click on desktop
          onContextMenu={handleContextMenu}
          {...hoverHandlers}
          {...gestureHandlers}
          onTouchStart={(e) => {
            gestureHandlers.onTouchStart?.(e);
            handleTouchStart(e);
          }}
          onTouchMove={(e) => {
            gestureHandlers.onTouchMove?.(e);
            handleTouchMove(e);
          }}
          onTouchEnd={(e) => {
            gestureHandlers.onTouchEnd?.(e);
            handleTouchEnd(e);
          }}
        sx={{
          py: dense ? 1 : 1.5,
          px: 2,
          borderRadius: 0,
          transition: 'all 0.2s ease-in-out',
          backgroundColor: isSelected 
            ? alpha(theme.palette.primary.main, 0.1)
            : 'transparent',
          '&:hover': {
            backgroundColor: isSelected 
              ? alpha(theme.palette.primary.main, 0.15)
              : alpha(theme.palette.action.hover, 0.8)
          },
          '&.Mui-selected': {
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            borderRight: `3px solid ${theme.palette.primary.main}`,
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.15)
            }
          },
          cursor: 'pointer',
          position: 'relative',
          // Touch feedback
          '&:active': isMobile ? {
            backgroundColor: alpha(theme.palette.action.selected, 0.2),
            transform: 'scale(0.98)',
            transition: 'all 0.1s ease-in-out'
          } : {},
          // Prevent text selection on mobile
          userSelect: isMobile ? 'none' : 'auto',
          WebkitUserSelect: isMobile ? 'none' : 'auto',
          WebkitTouchCallout: 'none'
        }}
      >
        {/* Avatar */}
        <ListItemAvatar>
          <ChatAvatar 
            chat={chat}
            size={dense ? 40 : 48}
            showOnlineStatus={chat.type === CHAT_TYPES.PRIVATE}
          />
        </ListItemAvatar>

        {/* Chat Info */}
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: chat.unreadCount > 0 ? 600 : 400,
                  color: isSelected ? 'primary.main' : 'text.primary',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {searchQuery ? (
                  <span
                    dangerouslySetInnerHTML={{
                      __html: highlightSearchTerm(getChatDisplayName(chat), searchQuery)
                    }}
                  />
                ) : (
                  getChatDisplayName(chat)
                )}
              </Typography>

              {/* Status Icons */}
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                {chat.isPinned && (
                  <Tooltip title="Pinned">
                    <PinIcon 
                      fontSize="small" 
                      sx={{ 
                        color: 'action.active',
                        mr: 0.5,
                        transform: 'rotate(45deg)'
                      }} 
                    />
                  </Tooltip>
                )}
                
                {chat.isMuted && (
                  <Tooltip title="Muted">
                    <MuteIcon 
                      fontSize="small" 
                      sx={{ color: 'action.active', mr: 0.5 }} 
                    />
                  </Tooltip>
                )}
                
                {chat.isArchived && (
                  <Tooltip title="Archived">
                    <ArchiveIcon 
                      fontSize="small" 
                      sx={{ color: 'action.active', mr: 0.5 }} 
                    />
                  </Tooltip>
                )}
              </Box>
            </Box>
          }
          secondary={
            <Box>
              {/* Message Preview */}
              {getMessageDisplay()}
              
              {/* Online Status for Private Chats */}
              {onlineStatus && chat.type === CHAT_TYPES.PRIVATE && (
                <Typography 
                  variant="caption" 
                  color={onlineStatus === 'online' ? 'success.main' : 'text.disabled'}
                  sx={{ display: 'block', mt: 0.5 }}
                >
                  {onlineStatus}
                </Typography>
              )}
              
              {/* Member Count for Group Chats */}
              {chat.type === CHAT_TYPES.GROUP && chat.memberCount && (
                <Typography 
                  variant="caption" 
                  color="text.disabled"
                  sx={{ display: 'block', mt: 0.5 }}
                >
                  {chat.memberCount} member{chat.memberCount !== 1 ? 's' : ''}
                </Typography>
              )}
            </Box>
          }
          sx={{ pr: 6 }}
        />

        {/* Right Side Content */}
        <ListItemSecondaryAction>
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'flex-end',
              gap: 0.5
            }}
          >
            {/* Timestamp */}
            <HoverTimestamp
              timestamp={chat.lastMessage?.timestamp}
              status={chat.lastMessage?.status || 'sent'}
              showStatus={false} // Don't show status in chat list
              isOwnMessage={false}
              sx={{ fontSize: '0.75rem' }}
            />

            {/* Unread Badge */}
            {chat.unreadCount > 0 && (
              <Badge
                badgeContent={chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                color="primary"
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.75rem',
                    height: '18px',
                    minWidth: '18px',
                    borderRadius: '9px'
                  }
                }}
              />
            )}

            {/* Context Menu Button */}
            {showContextMenu && (
              <>
                {/* Desktop: Show on hover */}
                {!isMobile && isHovering && (
                  <IconButton
                    size="small"
                    onClick={handleMoreClick}
                    sx={{
                      opacity: 0.7,
                      '&:hover': { opacity: 1 }
                    }}
                  >
                    <MoreIcon fontSize="small" />
                  </IconButton>
                )}
                
                {/* Mobile: Always show subtle indicator */}
                {isMobile && (
                  <Box
                    sx={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      backgroundColor: 'action.disabled',
                      opacity: 0.3,
                      mt: 0.5
                    }}
                  />
                )}
              </>
            )}
          </Box>
        </ListItemSecondaryAction>
      </ListItem>
      </DesktopContextMenu>

      {/* Context Menu */}
      {showContextMenu && (
        <ChatContextMenu
          chat={chat}
          anchorEl={contextMenuAnchor}
          open={Boolean(contextMenuAnchor) || (contextMenuPosition.x > 0 && contextMenuPosition.y > 0)}
          onClose={handleContextMenuClose}
          position={contextMenuPosition}
        />
      )}
    </>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(ChatListItem, (prevProps, nextProps) => {
  // Compare essential props that affect rendering
  return (
    prevProps.chat?.id === nextProps.chat?.id &&
    prevProps.chat?.name === nextProps.chat?.name &&
    prevProps.chat?.lastMessage?.id === nextProps.chat?.lastMessage?.id &&
    prevProps.chat?.lastMessage?.content === nextProps.chat?.lastMessage?.content &&
    prevProps.chat?.unreadCount === nextProps.chat?.unreadCount &&
    prevProps.chat?.isOnline === nextProps.chat?.isOnline &&
    prevProps.selectedChatId === nextProps.selectedChatId &&
    prevProps.onChatSelect === nextProps.onChatSelect &&
    prevProps.onChatAction === nextProps.onChatAction
  );
});