import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  List,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Fade,
  Collapse
} from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import { useChat } from '../../../hooks/useChat';
import { sortChatsByActivity, searchChats } from '../../../utils/chatUtils';
import ChatListItem from './ChatListItem';
import EmptyState from '../../Common/EmptyState';
import { CHAT_TYPES } from '../../../constants/chat';

const ChatList = ({ 
  chatType = 'all', // 'all', 'group', 'private'
  onChatSelect,
  selectedChatId,
  showSearch = true,
  maxHeight = '100%',
  className = '',
  emptyStateMessage,
  emptyStateAction
}) => {
  const {
    chats,
    isLoadingChats,
    error,
    searchQuery,
    searchChats: performSearch,
    clearSearch,
    clearError
  } = useChat();

  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Filter chats based on type
  const filteredChats = useMemo(() => {
    let filtered = chats;
    
    // Filter by chat type
    if (chatType !== 'all') {
      filtered = filtered.filter(chat => {
        if (chatType === 'group') return chat.type === CHAT_TYPES.GROUP;
        if (chatType === 'private') return chat.type === CHAT_TYPES.PRIVATE;
        return true;
      });
    }
    
    // Apply search if query exists
    if (localSearchQuery.trim()) {
      filtered = searchChats(filtered, localSearchQuery);
    }
    
    // Sort by activity (most recent first)
    return sortChatsByActivity(filtered);
  }, [chats, chatType, localSearchQuery]);

  // Handle search input changes
  const handleSearchChange = (event) => {
    const query = event.target.value;
    setLocalSearchQuery(query);
    
    if (query.trim()) {
      setShowSearchResults(true);
      performSearch(query);
    } else {
      setShowSearchResults(false);
      clearSearch();
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setLocalSearchQuery('');
    setShowSearchResults(false);
    clearSearch();
  };

  // Handle chat selection
  const handleChatSelect = (chatId) => {
    if (onChatSelect) {
      onChatSelect(chatId);
    }
  };

  // Get empty state message
  const getEmptyStateMessage = () => {
    if (emptyStateMessage) return emptyStateMessage;
    
    if (localSearchQuery.trim()) {
      return `No chats found for "${localSearchQuery}"`;
    }
    
    switch (chatType) {
      case 'group':
        return 'No group chats available. Create your first group chat to get started!';
      case 'private':
        return 'No private chats available. Start a conversation with a friend!';
      default:
        return 'No chats available. Start a conversation to get started!';
    }
  };

  // Get empty state type
  const getEmptyStateType = () => {
    if (localSearchQuery.trim()) return 'search';
    return chatType === 'group' ? 'groupChat' : 'privateChat';
  };

  // Effect to sync with global search
  useEffect(() => {
    if (searchQuery !== localSearchQuery) {
      setLocalSearchQuery(searchQuery);
      setShowSearchResults(!!searchQuery);
    }
  }, [searchQuery, localSearchQuery]);

  return (
    <Box 
      className={`chat-list ${className}`}
      sx={{ 
        height: maxHeight,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Search Bar */}
      {showSearch && (
        <Box sx={{ p: 2, pb: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search chats..."
            value={localSearchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: localSearchQuery && (
                <InputAdornment position="end">
                  <Box
                    component="button"
                    onClick={handleClearSearch}
                    sx={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 0.5,
                      borderRadius: '50%',
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                  >
                    <ClearIcon fontSize="small" color="action" />
                  </Box>
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                backgroundColor: 'background.paper'
              }
            }}
          />
        </Box>
      )}

      {/* Search Results Indicator */}
      <Collapse in={showSearchResults}>
        <Box sx={{ px: 2, pb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {filteredChats.length} result{filteredChats.length !== 1 ? 's' : ''} found
          </Typography>
        </Box>
      </Collapse>

      {/* Error Display */}
      {error && (
        <Box sx={{ p: 2 }}>
          <Alert 
            severity="error" 
            onClose={clearError}
            sx={{ borderRadius: 2 }}
          >
            {error}
          </Alert>
        </Box>
      )}

      {/* Loading State */}
      {isLoadingChats && (
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            py: 4
          }}
        >
          <CircularProgress size={32} />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
            Loading chats...
          </Typography>
        </Box>
      )}

      {/* Chat List */}
      {!isLoadingChats && (
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          {filteredChats.length > 0 ? (
            <List 
              sx={{ 
                py: 0,
                height: '100%',
                overflow: 'auto',
                '&::-webkit-scrollbar': {
                  width: '6px'
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: 'transparent'
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'action.disabled',
                  borderRadius: '3px',
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }
              }}
            >
              {filteredChats.map((chat, index) => (
                <Fade 
                  key={chat.id} 
                  in={true} 
                  timeout={200 + (index * 50)}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <div>
                    <ChatListItem
                      chat={chat}
                      isSelected={selectedChatId === chat.id}
                      onClick={() => handleChatSelect(chat.id)}
                      searchQuery={localSearchQuery}
                    />
                  </div>
                </Fade>
              ))}
            </List>
          ) : (
            <Box 
              sx={{ 
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 3
              }}
            >
              <EmptyState
                type={getEmptyStateType()}
                message={getEmptyStateMessage()}
                onAction={emptyStateAction}
                showCard={false}
              />
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ChatList;