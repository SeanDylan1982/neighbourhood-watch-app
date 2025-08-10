import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
  Chip,
  Avatar,
  Divider,
  CircularProgress,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Star,
  StarBorder,
  Close,
  Search,
  Delete,
  Reply,
  Forward,
  MoreVert
} from '@mui/icons-material';
import { useMessageStarring } from '../../../hooks/useMessageStarring';
import { formatDistanceToNow } from 'date-fns';

/**
 * StarredMessages component displays a dialog with all starred messages
 * Allows users to view, search, and manage their starred messages
 */
const StarredMessages = ({ 
  open, 
  onClose, 
  chatId, 
  chatType = 'group',
  onMessageClick,
  onReplyToMessage,
  onForwardMessage 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [starredMessagesList, setStarredMessagesList] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);

  const {
    getStarredMessages,
    toggleStar,
    clearStarredMessages,
    loading,
    isMessageStarred
  } = useMessageStarring(chatId, chatType);

  // Load starred messages when dialog opens
  useEffect(() => {
    if (open && chatId) {
      loadStarredMessages();
    }
  }, [open, chatId, loadStarredMessages]);

  // Filter messages based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMessages(starredMessagesList);
    } else {
      const filtered = starredMessagesList.filter(message =>
        message.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.sender?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMessages(filtered);
    }
  }, [searchQuery, starredMessagesList]);

  const loadStarredMessages = useCallback(async () => {
    try {
      const messages = await getStarredMessages();
      setStarredMessagesList(messages);
    } catch (error) {
      console.error('Error loading starred messages:', error);
    }
  }, [getStarredMessages]);

  const handleUnstarMessage = useCallback(async (messageId) => {
    try {
      await toggleStar(messageId, true);
      // Remove from local state immediately
      setStarredMessagesList(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Error unstarring message:', error);
    }
  }, [toggleStar]);

  const handleClearAll = useCallback(async () => {
    if (window.confirm('Are you sure you want to clear all starred messages?')) {
      try {
        await clearStarredMessages();
        setStarredMessagesList([]);
      } catch (error) {
        console.error('Error clearing starred messages:', error);
      }
    }
  }, [clearStarredMessages]);

  const handleMessageClick = useCallback((message) => {
    if (onMessageClick) {
      onMessageClick(message);
      onClose();
    }
  }, [onMessageClick, onClose]);

  const handleReply = useCallback((message) => {
    if (onReplyToMessage) {
      onReplyToMessage(message);
      onClose();
    }
  }, [onReplyToMessage, onClose]);

  const handleForward = useCallback((message) => {
    if (onForwardMessage) {
      onForwardMessage(message);
      onClose();
    }
  }, [onForwardMessage, onClose]);

  const formatMessageContent = (message) => {
    if (message.type === 'text') {
      return message.content;
    } else if (message.type === 'image') {
      return '📷 Image';
    } else if (message.type === 'video') {
      return '🎥 Video';
    } else if (message.type === 'audio') {
      return '🎙️ Audio';
    } else if (message.type === 'document') {
      return `📄 ${message.fileName || 'Document'}`;
    } else if (message.type === 'location') {
      return '📍 Location';
    } else if (message.type === 'contact') {
      return '👤 Contact';
    }
    return message.content || 'Message';
  };

  const formatTimestamp = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          height: '80vh',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <Star color="primary" />
            <Typography variant="h6">
              Starred Messages
            </Typography>
            {starredMessagesList.length > 0 && (
              <Chip 
                label={starredMessagesList.length} 
                size="small" 
                color="primary" 
                variant="outlined"
              />
            )}
          </Box>
          <Box>
            {starredMessagesList.length > 0 && (
              <Button
                size="small"
                color="error"
                onClick={handleClearAll}
                startIcon={<Delete />}
                sx={{ mr: 1 }}
              >
                Clear All
              </Button>
            )}
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 0 }}>
        {/* Search Bar */}
        {starredMessagesList.length > 0 && (
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search starred messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                )
              }}
            />
          </Box>
        )}

        {/* Messages List */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
              <CircularProgress />
            </Box>
          ) : filteredMessages.length === 0 ? (
            <Box 
              display="flex" 
              flexDirection="column" 
              alignItems="center" 
              justifyContent="center" 
              height="200px"
              sx={{ color: 'text.secondary' }}
            >
              <StarBorder sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" gutterBottom>
                {searchQuery ? 'No matching messages' : 'No starred messages'}
              </Typography>
              <Typography variant="body2">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Star important messages to find them here'
                }
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {filteredMessages.map((message, index) => (
                <React.Fragment key={message.id}>
                  <ListItem
                    sx={{
                      alignItems: 'flex-start',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                    onClick={() => handleMessageClick(message)}
                  >
                    <Avatar
                      src={message.sender?.avatar}
                      sx={{ mr: 2, mt: 0.5, width: 32, height: 32 }}
                    >
                      {message.sender?.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <Typography variant="subtitle2" color="primary">
                            {message.sender?.name || 'Unknown'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatTimestamp(message.starredAt || message.timestamp)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography 
                          variant="body2" 
                          color="text.primary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {formatMessageContent(message)}
                        </Typography>
                      }
                    />

                    <ListItemSecondaryAction>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReply(message);
                          }}
                          title="Reply"
                        >
                          <Reply fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleForward(message);
                          }}
                          title="Forward"
                        >
                          <Forward fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnstarMessage(message.id);
                          }}
                          title="Remove star"
                        >
                          <Star color="primary" fontSize="small" />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < filteredMessages.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StarredMessages;