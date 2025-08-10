import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  Typography,
  Chip,
  Fade,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ArrowDownIcon
} from '@mui/icons-material';

/**
 * InChatSearchBar component for searching within chat messages
 * 
 * Features:
 * - Real-time message search with highlighting
 * - Navigation between search results
 * - Context display around matches
 * - Keyboard shortcuts support
 */
const InChatSearchBar = ({
  messages = [],
  onSearchResults,
  onHighlightMessage,
  onClose,
  isVisible = false,
  className = '',
  ...props
}) => {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Focus input when search bar becomes visible
  useEffect(() => {
    if (isVisible && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isVisible]);

  // Clear search when component unmounts or becomes invisible
  useEffect(() => {
    if (!isVisible) {
      setQuery('');
      setSearchResults([]);
      setCurrentResultIndex(-1);
    }
  }, [isVisible]);

  /**
   * Search through messages for matching text
   */
  const searchMessages = useCallback((searchQuery) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setCurrentResultIndex(-1);
      if (onSearchResults) {
        onSearchResults([]);
      }
      return;
    }

    setIsSearching(true);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search to avoid excessive processing
    searchTimeoutRef.current = setTimeout(() => {
      const results = [];
      const searchTerm = searchQuery.toLowerCase();

      messages.forEach((message, messageIndex) => {
        const content = (message.content || message.message || '').toLowerCase();
        const senderName = (message.senderName || message.sender || '').toLowerCase();
        
        // Search in message content
        if (content.includes(searchTerm)) {
          const startIndex = content.indexOf(searchTerm);
          const contextStart = Math.max(0, startIndex - 30);
          const contextEnd = Math.min(content.length, startIndex + searchTerm.length + 30);
          
          results.push({
            messageId: message.id || messageIndex,
            messageIndex,
            type: 'content',
            match: searchQuery,
            context: (message.content || message.message || '').substring(contextStart, contextEnd),
            fullContent: message.content || message.message || '',
            senderName: message.senderName || message.sender || 'Unknown',
            timestamp: message.timestamp || message.createdAt,
            matchStart: startIndex - contextStart,
            matchEnd: startIndex - contextStart + searchTerm.length
          });
        }

        // Search in sender name
        if (senderName.includes(searchTerm)) {
          results.push({
            messageId: message.id || messageIndex,
            messageIndex,
            type: 'sender',
            match: searchQuery,
            context: `Message from ${message.senderName || message.sender}`,
            fullContent: message.content || message.message || '',
            senderName: message.senderName || message.sender || 'Unknown',
            timestamp: message.timestamp || message.createdAt,
            matchStart: 0,
            matchEnd: searchTerm.length
          });
        }
      });

      // Sort results by timestamp (newest first)
      results.sort((a, b) => {
        const timeA = new Date(a.timestamp || 0);
        const timeB = new Date(b.timestamp || 0);
        return timeB - timeA;
      });

      setSearchResults(results);
      setCurrentResultIndex(results.length > 0 ? 0 : -1);
      setIsSearching(false);

      // Notify parent component
      if (onSearchResults) {
        onSearchResults(results);
      }

      // Highlight first result
      if (results.length > 0 && onHighlightMessage) {
        onHighlightMessage(results[0].messageId, searchQuery);
      }
    }, 300);
  }, [messages, onSearchResults, onHighlightMessage]);

  /**
   * Handle input change
   */
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setQuery(value);
    searchMessages(value);
  }, [searchMessages]);

  /**
   * Navigate to previous search result
   */
  const handlePreviousResult = useCallback(() => {
    if (searchResults.length === 0) return;
    
    const newIndex = currentResultIndex > 0 
      ? currentResultIndex - 1 
      : searchResults.length - 1;
    
    setCurrentResultIndex(newIndex);
    
    if (onHighlightMessage) {
      onHighlightMessage(searchResults[newIndex].messageId, query);
    }
  }, [searchResults, currentResultIndex, onHighlightMessage, query]);

  /**
   * Navigate to next search result
   */
  const handleNextResult = useCallback(() => {
    if (searchResults.length === 0) return;
    
    const newIndex = currentResultIndex < searchResults.length - 1 
      ? currentResultIndex + 1 
      : 0;
    
    setCurrentResultIndex(newIndex);
    
    if (onHighlightMessage) {
      onHighlightMessage(searchResults[newIndex].messageId, query);
    }
  }, [searchResults, currentResultIndex, onHighlightMessage, query]);

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = useCallback((e) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        if (onClose) {
          onClose();
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (e.shiftKey) {
          handlePreviousResult();
        } else {
          handleNextResult();
        }
        break;
      case 'ArrowUp':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          handlePreviousResult();
        }
        break;
      case 'ArrowDown':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          handleNextResult();
        }
        break;
      default:
        break;
    }
  }, [onClose, handlePreviousResult, handleNextResult]);

  /**
   * Clear search
   */
  const handleClearSearch = useCallback(() => {
    setQuery('');
    setSearchResults([]);
    setCurrentResultIndex(-1);
    
    if (onSearchResults) {
      onSearchResults([]);
    }
    
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [onSearchResults]);

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Fade in={isVisible}>
      <Paper
        elevation={2}
        className={className}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          borderRadius: 0,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          ...props.sx
        }}
        {...props}
      >
        {/* Search Input */}
        <Box sx={{ p: 2, pb: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search in this chat..."
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            inputRef={searchInputRef}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {query && (
                      <IconButton
                        size="small"
                        onClick={handleClearSearch}
                        sx={{ p: 0.5 }}
                        aria-label="clear search"
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={onClose}
                      sx={{ p: 0.5 }}
                      aria-label="close search"
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </InputAdornment>
              ),
              sx: {
                borderRadius: 1,
                backgroundColor: theme.palette.background.default,
              }
            }}
          />
        </Box>

        {/* Search Results Info */}
        {query && (
          <Box sx={{ px: 2, pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                {isSearching ? (
                  'Searching...'
                ) : searchResults.length > 0 ? (
                  `${currentResultIndex + 1} of ${searchResults.length} results`
                ) : (
                  'No results found'
                )}
              </Typography>
              
              {searchResults.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <IconButton
                    size="small"
                    onClick={handlePreviousResult}
                    disabled={searchResults.length === 0}
                    sx={{ p: 0.5 }}
                    aria-label="previous result"
                  >
                    <ArrowUpIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={handleNextResult}
                    disabled={searchResults.length === 0}
                    sx={{ p: 0.5 }}
                    aria-label="next result"
                  >
                    <ArrowDownIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </Box>

            {/* Current Result Context */}
            {searchResults.length > 0 && currentResultIndex >= 0 && (
              <Box sx={{ mt: 1 }}>
                <Chip
                  size="small"
                  label={`${searchResults[currentResultIndex].senderName} • ${formatTimestamp(searchResults[currentResultIndex].timestamp)}`}
                  variant="outlined"
                  sx={{ fontSize: '0.75rem', height: 24 }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 0.5,
                    p: 1,
                    backgroundColor: theme.palette.action.hover,
                    borderRadius: 1,
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    lineHeight: 1.4,
                    maxHeight: 60,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {searchResults[currentResultIndex].context}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Keyboard Shortcuts Hint */}
        <Box sx={{ px: 2, pb: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            Press Enter to navigate • Shift+Enter for previous • Esc to close
          </Typography>
        </Box>
      </Paper>
    </Fade>
  );
};

export default InChatSearchBar;