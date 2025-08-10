import React, { useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Checkbox,
  Typography,
  Box,
  Chip,
  IconButton,
  InputAdornment,
  Divider,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { useChat } from '../../../contexts/ChatContext';
import { CHAT_TYPES } from '../../../constants/chat';

/**
 * MessageForwardDialog Component
 * 
 * Provides an interface for forwarding messages to other chats.
 * Supports both group and private chat selection with search functionality.
 * 
 * Features:
 * - Chat selection with search
 * - Multiple chat selection
 * - Visual differentiation between group and private chats
 * - Message preview
 * - Forwarding confirmation
 */
const MessageForwardDialog = ({
  open = false,
  onClose,
  message = null,
  onForward,
  maxSelections = 5
}) => {
  const { chats } = useChat();
  const [selectedChats, setSelectedChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isForwarding, setIsForwarding] = useState(false);
  const [error, setError] = useState(null);

  // Filter chats based on search query
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) {
      return chats;
    }
    
    const query = searchQuery.toLowerCase();
    return chats.filter(chat => 
      chat.name.toLowerCase().includes(query) ||
      chat.description?.toLowerCase().includes(query) ||
      (chat.type === CHAT_TYPES.PRIVATE && chat.participantName?.toLowerCase().includes(query))
    );
  }, [chats, searchQuery]);

  // Handle chat selection
  const handleChatToggle = useCallback((chat) => {
    setSelectedChats(prev => {
      const isSelected = prev.some(selected => selected.id === chat.id);
      
      if (isSelected) {
        return prev.filter(selected => selected.id !== chat.id);
      } else {
        if (prev.length >= maxSelections) {
          setError(`You can only forward to ${maxSelections} chats at once`);
          return prev;
        }
        setError(null);
        return [...prev, chat];
      }
    });
  }, [maxSelections]);

  // Handle forwarding
  const handleForward = useCallback(async () => {
    if (!message || selectedChats.length === 0) return;
    
    setIsForwarding(true);
    setError(null);
    
    try {
      await onForward?.(message, selectedChats);
      
      // Reset state and close dialog
      setSelectedChats([]);
      setSearchQuery('');
      onClose?.();
    } catch (err) {
      console.error('Error forwarding message:', err);
      setError(err.message || 'Failed to forward message');
    } finally {
      setIsForwarding(false);
    }
  }, [message, selectedChats, onForward, onClose]);

  // Handle dialog close
  const handleClose = useCallback(() => {
    if (isForwarding) return;
    
    setSelectedChats([]);
    setSearchQuery('');
    setError(null);
    onClose?.();
  }, [isForwarding, onClose]);

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Remove selected chat
  const handleRemoveSelected = useCallback((chatId) => {
    setSelectedChats(prev => prev.filter(chat => chat.id !== chatId));
    setError(null);
  }, []);

  // Get message preview text
  const getMessagePreview = useCallback((message) => {
    if (!message) return '';
    
    switch (message.type) {
      case 'text':
        return message.content.length > 100 
          ? `${message.content.substring(0, 100)}...`
          : message.content;
      case 'image':
        return '🖼️ Photo';
      case 'audio':
        return '🎙️ Audio message';
      case 'document':
        return `📄 ${message.attachments?.[0]?.filename || 'Document'}`;
      case 'location':
        return '📍 Location';
      case 'contact':
        return '👤 Contact';
      default:
        return 'Message';
    }
  }, []);

  // Get chat avatar
  const getChatAvatar = useCallback((chat) => {
    if (chat.type === CHAT_TYPES.GROUP) {
      return (
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          <GroupIcon />
        </Avatar>
      );
    } else {
      return chat.participantAvatar ? (
        <Avatar src={chat.participantAvatar} alt={chat.participantName} />
      ) : (
        <Avatar sx={{ bgcolor: 'secondary.main' }}>
          <PersonIcon />
        </Avatar>
      );
    }
  }, []);

  // Get chat display name
  const getChatDisplayName = useCallback((chat) => {
    if (chat.type === CHAT_TYPES.GROUP) {
      return chat.name;
    } else {
      return chat.participantName || chat.name;
    }
  }, []);

  // Get chat subtitle
  const getChatSubtitle = useCallback((chat) => {
    if (chat.type === CHAT_TYPES.GROUP) {
      return `${chat.memberCount || 0} members`;
    } else {
      return chat.isOnline ? 'Online' : 
             chat.lastSeen ? `Last seen ${chat.lastSeen.toLocaleTimeString()}` : 
             'Offline';
    }
  }, []);

  if (!open || !message) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" component="div">
            Forward Message
          </Typography>
          <IconButton
            onClick={handleClose}
            disabled={isForwarding}
            size="small"
            aria-label="Close dialog"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 0, pb: 1 }}>
        {/* Message Preview */}
        <Box sx={{ px: 3, pb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Message to forward:
          </Typography>
          <Box
            sx={{
              p: 2,
              bgcolor: 'grey.100',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography variant="body2">
              {getMessagePreview(message)}
            </Typography>
            {message.senderName && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                From: {message.senderName}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Selected Chats */}
        {selectedChats.length > 0 && (
          <Box sx={{ px: 3, pb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Selected chats ({selectedChats.length}/{maxSelections}):
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {selectedChats.map(chat => (
                <Chip
                  key={chat.id}
                  label={getChatDisplayName(chat)}
                  onDelete={() => handleRemoveSelected(chat.id)}
                  size="small"
                  variant="outlined"
                  icon={chat.type === CHAT_TYPES.GROUP ? <GroupIcon /> : <PersonIcon />}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Error Alert */}
        {error && (
          <Box sx={{ px: 3, pb: 2 }}>
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Box>
        )}

        {/* Search */}
        <Box sx={{ px: 3, pb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            inputProps={{
              'aria-label': 'Search chats'
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleClearSearch}
                    size="small"
                    edge="end"
                    aria-label="Clear search"
                  >
                    <CloseIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Box>

        <Divider />

        {/* Chat List */}
        <List sx={{ maxHeight: 300, overflow: 'auto' }}>
          {filteredChats.length === 0 ? (
            <ListItem>
              <ListItemText
                primary="No chats found"
                secondary={searchQuery ? "Try a different search term" : "No chats available"}
                sx={{ textAlign: 'center' }}
              />
            </ListItem>
          ) : (
            filteredChats.map(chat => {
              const isSelected = selectedChats.some(selected => selected.id === chat.id);
              
              return (
                <ListItem key={chat.id} disablePadding>
                  <ListItemButton
                    onClick={() => handleChatToggle(chat)}
                    disabled={isForwarding}
                    sx={{
                      px: 3,
                      py: 1.5,
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <Checkbox
                      checked={isSelected}
                      tabIndex={-1}
                      disableRipple
                      sx={{ mr: 1 }}
                      inputProps={{
                        'aria-label': `Select ${getChatDisplayName(chat)}`
                      }}
                    />
                    <ListItemAvatar>
                      {getChatAvatar(chat)}
                    </ListItemAvatar>
                    <ListItemText
                      primary={getChatDisplayName(chat)}
                      secondary={getChatSubtitle(chat)}
                      primaryTypographyProps={{
                        fontWeight: isSelected ? 600 : 400
                      }}
                    />
                    {chat.type === CHAT_TYPES.GROUP && (
                      <Chip
                        label="Group"
                        size="small"
                        variant="outlined"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              );
            })
          )}
        </List>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={handleClose}
          disabled={isForwarding}
          color="inherit"
        >
          Cancel
        </Button>
        <Button
          onClick={handleForward}
          disabled={selectedChats.length === 0 || isForwarding}
          variant="contained"
          startIcon={<SendIcon />}
          sx={{ minWidth: 120 }}
        >
          {isForwarding ? 'Forwarding...' : `Forward${selectedChats.length > 1 ? ` (${selectedChats.length})` : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MessageForwardDialog;