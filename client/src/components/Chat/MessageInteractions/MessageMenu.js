import React, { useCallback, useRef } from 'react';
import {
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  ClickAwayListener,
  Popper,
  Fade
} from '@mui/material';
import {
  Reply as ReplyIcon,
  ContentCopy as CopyIcon,
  Forward as ForwardIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Report as ReportIcon,
  EmojiEmotions as ReactIcon
} from '@mui/icons-material';
import { MESSAGE_ACTIONS, CHAT_TYPES } from '../../../constants/chat';

/**
 * MessageMenu Component
 * 
 * Provides context-sensitive message interaction options through long-press (mobile)
 * and right-click (desktop) menus. Options vary based on chat type and message ownership.
 * 
 * Features:
 * - Context-sensitive menu options based on chat type and message ownership
 * - Support for both desktop (right-click) and mobile (long-press) interactions
 * - Proper positioning and responsive behavior
 * - Keyboard navigation support
 * - Customizable menu options
 */
const MessageMenu = ({
  // Menu state
  open = false,
  anchorEl = null,
  onClose,
  
  // Message context
  messageId,
  chatType = CHAT_TYPES.GROUP,
  isOwnMessage = false,
  messageType = 'text',
  
  // Action handlers
  onReact,
  onReply,
  onCopy,
  onForward,
  onDelete,
  onInfo,
  onReport,
  onMessageAction,
  
  // Customization
  customActions = [],
  disabledActions = [],
  className = '',
  
  // Positioning (unused but kept for API compatibility)
  transformOrigin = { vertical: 'top', horizontal: 'left' },
  anchorOrigin = { vertical: 'bottom', horizontal: 'left' }
}) => {
  const menuRef = useRef(null);

  // Handle menu action with proper callback routing
  const handleAction = useCallback((action, event) => {
    event?.stopPropagation();
    onClose?.();
    
    switch (action) {
      case MESSAGE_ACTIONS.REACT:
        onReact?.(messageId);
        break;
      case MESSAGE_ACTIONS.REPLY:
        onReply?.(messageId);
        break;
      case MESSAGE_ACTIONS.COPY:
        onCopy?.(messageId);
        break;
      case MESSAGE_ACTIONS.FORWARD:
        onForward?.(messageId);
        break;
      case MESSAGE_ACTIONS.DELETE_FOR_ME:
        onDelete?.(messageId, MESSAGE_ACTIONS.DELETE_FOR_ME);
        break;
      case MESSAGE_ACTIONS.DELETE_FOR_EVERYONE:
        onDelete?.(messageId, MESSAGE_ACTIONS.DELETE_FOR_EVERYONE);
        break;
      case MESSAGE_ACTIONS.INFO:
        onInfo?.(messageId);
        break;
      case MESSAGE_ACTIONS.REPORT:
        onReport?.(messageId);
        break;
      default:
        // Handle custom actions
        onMessageAction?.(messageId, action);
    }
  }, [messageId, onReact, onReply, onCopy, onForward, onDelete, onInfo, onReport, onMessageAction, onClose]);

  // Get available menu options based on context
  const getMenuOptions = useCallback(() => {
    const options = [];

    // React option - available for all messages
    if (!disabledActions.includes(MESSAGE_ACTIONS.REACT)) {
      options.push({
        action: MESSAGE_ACTIONS.REACT,
        label: 'React',
        icon: <ReactIcon fontSize="small" />,
        color: 'default'
      });
    }

    // Reply option - available for all messages
    if (!disabledActions.includes(MESSAGE_ACTIONS.REPLY)) {
      options.push({
        action: MESSAGE_ACTIONS.REPLY,
        label: 'Reply',
        icon: <ReplyIcon fontSize="small" />,
        color: 'default'
      });
    }

    // Copy option - available for text messages
    if (messageType === 'text' && !disabledActions.includes(MESSAGE_ACTIONS.COPY)) {
      options.push({
        action: MESSAGE_ACTIONS.COPY,
        label: 'Copy',
        icon: <CopyIcon fontSize="small" />,
        color: 'default'
      });
    }

    // Forward option - available for all messages
    if (!disabledActions.includes(MESSAGE_ACTIONS.FORWARD)) {
      options.push({
        action: MESSAGE_ACTIONS.FORWARD,
        label: 'Forward',
        icon: <ForwardIcon fontSize="small" />,
        color: 'default'
      });
    }

    // Add divider before destructive/info actions
    if (options.length > 0) {
      options.push({ divider: true });
    }

    // Info option - available for group chat messages
    if (chatType === CHAT_TYPES.GROUP && !disabledActions.includes(MESSAGE_ACTIONS.INFO)) {
      options.push({
        action: MESSAGE_ACTIONS.INFO,
        label: 'Info',
        icon: <InfoIcon fontSize="small" />,
        color: 'default'
      });
    }

    // Delete options - context-sensitive based on chat type and ownership
    if (isOwnMessage) {
      if (chatType === CHAT_TYPES.PRIVATE) {
        // Private chat: Delete for me and Delete for everyone
        if (!disabledActions.includes(MESSAGE_ACTIONS.DELETE_FOR_ME)) {
          options.push({
            action: MESSAGE_ACTIONS.DELETE_FOR_ME,
            label: 'Delete for Me',
            icon: <DeleteIcon fontSize="small" />,
            color: 'default'
          });
        }
        
        if (!disabledActions.includes(MESSAGE_ACTIONS.DELETE_FOR_EVERYONE)) {
          options.push({
            action: MESSAGE_ACTIONS.DELETE_FOR_EVERYONE,
            label: 'Delete for Everyone',
            icon: <DeleteIcon fontSize="small" />,
            color: 'error'
          });
        }
      } else {
        // Group chat: Simple delete
        if (!disabledActions.includes(MESSAGE_ACTIONS.DELETE_FOR_ME)) {
          options.push({
            action: MESSAGE_ACTIONS.DELETE_FOR_ME,
            label: 'Delete',
            icon: <DeleteIcon fontSize="small" />,
            color: 'error'
          });
        }
      }
    }

    // Report option - available for non-own messages in group chats
    if (chatType === CHAT_TYPES.GROUP && !isOwnMessage && !disabledActions.includes(MESSAGE_ACTIONS.REPORT)) {
      options.push({
        action: MESSAGE_ACTIONS.REPORT,
        label: 'Report Message',
        icon: <ReportIcon fontSize="small" />,
        color: 'warning'
      });
    }

    // Add custom actions
    customActions.forEach(customAction => {
      if (!disabledActions.includes(customAction.action)) {
        options.push(customAction);
      }
    });

    return options;
  }, [chatType, isOwnMessage, messageType, disabledActions, customActions]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape') {
      onClose?.();
    }
  }, [onClose]);

  // Menu positioning is handled by Popper automatically

  const menuOptions = getMenuOptions();

  if (!open || !anchorEl) {
    return null;
  }

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement="bottom-start"
      transition
      disablePortal={false}
      modifiers={[
        {
          name: 'flip',
          enabled: true,
          options: {
            altBoundary: true,
            rootBoundary: 'viewport',
            padding: 8,
          },
        },
        {
          name: 'preventOverflow',
          enabled: true,
          options: {
            altAxis: true,
            altBoundary: true,
            tether: true,
            rootBoundary: 'viewport',
            padding: 8,
          },
        },
      ]}
      sx={{ zIndex: 1300 }}
    >
      {({ TransitionProps }) => (
        <Fade {...TransitionProps} timeout={200}>
          <Paper
            ref={menuRef}
            className={className}
            elevation={8}
            onKeyDown={handleKeyDown}
            sx={{
              minWidth: 180,
              maxWidth: 250,
              py: 1,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'background.paper',
              boxShadow: (theme) => theme.shadows[8]
            }}
          >
            <ClickAwayListener onClickAway={onClose}>
              <div>
                {menuOptions.map((option, index) => {
                  if (option.divider) {
                    return <Divider key={`divider-${index}`} sx={{ my: 0.5 }} />;
                  }

                  return (
                    <MenuItem
                      key={option.action}
                      onClick={(event) => handleAction(option.action, event)}
                      sx={{
                        py: 1,
                        px: 2,
                        minHeight: 40,
                        color: option.color === 'error' ? 'error.main' : 
                               option.color === 'warning' ? 'warning.main' : 'text.primary',
                        '&:hover': {
                          bgcolor: option.color === 'error' ? 'error.light' : 
                                   option.color === 'warning' ? 'warning.light' : 'action.hover',
                          color: option.color === 'error' ? 'error.contrastText' : 
                                 option.color === 'warning' ? 'warning.contrastText' : 'text.primary'
                        }
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 36,
                          color: 'inherit'
                        }}
                      >
                        {option.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={option.label}
                        primaryTypographyProps={{
                          fontSize: '0.875rem',
                          fontWeight: option.color === 'error' || option.color === 'warning' ? 500 : 400
                        }}
                      />
                    </MenuItem>
                  );
                })}
              </div>
            </ClickAwayListener>
          </Paper>
        </Fade>
      )}
    </Popper>
  );
};

export default MessageMenu;