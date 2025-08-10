import icons from '../Common/Icons'
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  Box,
  CircularProgress,
  ClickAwayListener,
  Typography,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon
} from '@mui/icons-material';
import SearchResults from './SearchResults';
import useSearchHistory from '../../hooks/useSearchHistory';
import useSearchNavigation from '../../hooks/useSearchNavigation';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * SearchBar component with autocomplete dropdown
 * 
 * Features:
 * - Real-time search suggestions
 * - Grouped results (People, Notices, Reports, Chats)
 * - Keyboard navigation
 * - Search history
 */
const SearchBar = ({ onResultSelect, placeholder = "Search...", isSearchPage = false, onSearchPageQuery }) => {
  const theme = useTheme();
  const { token } = useAuth();
  const navigate = useNavigate();
  const { navigateToResult } = useSearchNavigation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [activeResultIndex, setActiveResultIndex] = useState(-1);
  const [activeSection, setActiveSection] = useState(null);
  const [totalResults, setTotalResults] = useState(0);
  const searchInputRef = useRef(null);
  const resultsRef = useRef(null);
  const { addToHistory, getHistory, clearHistory } = useSearchHistory();
  const [showHistory, setShowHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);

  /**
   * Perform search API call
   */
  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) return;
    
    try {
      // Check if token exists
      if (!token) {
        console.error('No authentication token available');
        setResults(null);
        setShowResults(false);
        setLoading(false);
        return;
      }

      const response = await axios.get('/api/search/autocomplete', {
        params: { q: searchQuery },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setResults(response.data);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        console.error('Authentication failed - token may be expired');
      } else if (error.response?.status === 400) {
        console.error('Bad request - check search query format');
      } else if (error.response?.status >= 500) {
        console.error('Server error - search service may be unavailable');
      }
      
      setResults(null);
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load search history only once on mount
  useEffect(() => {
    setSearchHistory(getHistory());
  }, [getHistory]); // Empty dependency array to run only once

  // Debounce search to avoid too many API calls
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      setShowResults(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      performSearch(query);
    }, 500); // Increased debounce time to reduce API calls

    return () => clearTimeout(timer);
  }, [performSearch, query]);

  // Reset active result when results change
  useEffect(() => {
    setActiveResultIndex(-1);
    setActiveSection(null);
  }, [results]);

  // Calculate total results count
  useEffect(() => {
    if (!results) {
      setTotalResults(0);
      return;
    }

    let count = 0;
    if (results.users) count += results.users.length;
    if (results.notices) count += results.notices.length;
    if (results.reports) count += results.reports.length;
    if (results.chats) count += results.chats.length;
    if (results.messages) count += results.messages.length;
    setTotalResults(count);
  }, [results]);

  /**
   * Handle input change
   */
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.trim()) {
      setShowHistory(false);
    } else {
      setShowHistory(true);
      setSearchHistory(getHistory());
    }
  }, [getHistory]);

  /**
   * Handle search submission
   */
  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    addToHistory(query);
    setSearchHistory(getHistory());
    
    // If onResultSelect is provided, use it for navigation
    // Otherwise, navigate to search results page
    if (onResultSelect) {
      // For now, just perform the search and show results
      performSearch(query);
    } else {
      // Navigate to search results page
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
    
    // Close dropdowns
    setShowResults(false);
    setShowHistory(false);
  }, [query, addToHistory, getHistory, navigate, onResultSelect, performSearch]);

  /**
   * Clear search input
   */
  const handleClearSearch = useCallback(() => {
    setQuery('');
    setResults(null);
    setShowResults(false);
    setShowHistory(true);
    setSearchHistory(getHistory());
    searchInputRef.current?.focus();
  }, [getHistory]);

  /**
   * Handle click away from search component
   */
  const handleClickAway = useCallback(() => {
    setShowResults(false);
    setShowHistory(false);
  }, []);

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (e) => {
    // If no results are showing, don't handle keyboard navigation
    if (!showResults && !showHistory) return;
    
    const historyItems = showHistory ? searchHistory : [];
    const sections = showResults ? ['users', 'notices', 'reports', 'chats', 'messages'] : [];
    const sectionResults = {};
    let totalItems = historyItems.length;
    
    // Count items in each section
    if (showResults && results) {
      sections.forEach(section => {
        if (results[section] && results[section].length > 0) {
          sectionResults[section] = results[section];
          totalItems += results[section].length;
        }
      });
    }
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (totalItems === 0) return;
        
        if (activeResultIndex < totalItems - 1) {
          setActiveResultIndex(prevIndex => prevIndex + 1);
        } else {
          setActiveResultIndex(0); // Loop back to the first item
        }
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        if (totalItems === 0) return;
        
        if (activeResultIndex > 0) {
          setActiveResultIndex(prevIndex => prevIndex - 1);
        } else {
          setActiveResultIndex(totalItems - 1); // Loop to the last item
        }
        break;
        
      case 'Enter':
        e.preventDefault();
        if (activeResultIndex === -1) {
          // If no item is selected, navigate to search results page
          if (query.trim()) {
            addToHistory(query);
            navigate(`/search?q=${encodeURIComponent(query)}`);
            setShowResults(false);
            setShowHistory(false);
          }
        } else {
          // If history item is selected
          if (showHistory && activeResultIndex < historyItems.length) {
            const selectedQuery = historyItems[activeResultIndex];
            setQuery(selectedQuery);
            performSearch(selectedQuery);
            return;
          }
          
          // If result item is selected
          let currentIndex = showHistory ? historyItems.length : 0;
          
          for (const section of sections) {
            if (!sectionResults[section]) continue;
            
            const sectionLength = sectionResults[section].length;
            if (activeResultIndex >= currentIndex && activeResultIndex < currentIndex + sectionLength) {
              const itemIndex = activeResultIndex - currentIndex;
              const selectedItem = sectionResults[section][itemIndex];
              handleResultSelect(selectedItem, section);
              break;
            }
            
            currentIndex += sectionLength;
          }
        }
        break;
        
      case 'Escape':
        setShowResults(false);
        setShowHistory(false);
        break;
        
      default:
        break;
    }
  };

  /**
   * Handle result selection
   */
  const handleResultSelect = useCallback((item, type) => {
    addToHistory(query);
    setShowResults(false);
    setShowHistory(false);
    
    if (onResultSelect) {
      onResultSelect(item, type);
    }
  }, [query, addToHistory, onResultSelect]);

  /**
   * Handle history item click
   */
  const handleHistoryItemClick = useCallback((historyItem) => {
    setQuery(historyItem);
    performSearch(historyItem);
    setShowHistory(false);
  }, [performSearch]);

  /**
   * Handle focus on search input
   */
  const handleFocus = useCallback(() => {
    if (!query.trim()) {
      setShowHistory(true);
      setSearchHistory(getHistory());
    } else if (results) {
      setShowResults(true);
    }
  }, [query, results, getHistory]);

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box sx={{ position: 'relative', width: '100%', maxWidth: '500px', height: "70%", maxHeight: "80%" }}>
        <form onSubmit={handleSearch}>
          <TextField
            fullWidth
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            inputRef={searchInputRef}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <icons.Search color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {loading ? (
                    <CircularProgress size={20} />
                  ) : query ? (
                    <IconButton
                      aria-label="clear search"
                      onClick={handleClearSearch}
                      edge="end"
                      size="small"
                    >
                      <ClearIcon />
                    </IconButton>
                  ) : null}
                </InputAdornment>
              ),
              sx: {
                borderRadius: 2,
                bgcolor: theme.palette.background.paper,
                '&:hover': {
                  bgcolor: theme.palette.background.paper,
                },
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: theme.palette.divider,
                },
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />
        </form>

        {/* Search Results Dropdown */}
        {(showResults && results && totalResults > 0) && (
          <Paper
            ref={resultsRef}
            elevation={3}
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              mt: 0.5,
              zIndex: 1000,
              maxHeight: 400,
              overflow: 'auto',
              borderRadius: 2,
            }}
          >
            <SearchResults
              results={results}
              onResultSelect={handleResultSelect}
              activeResultIndex={activeResultIndex}
              setActiveResultIndex={setActiveResultIndex}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              query={query}
            />
          </Paper>
        )}

        {/* Search History Dropdown */}
        {(showHistory && searchHistory.length > 0) && (
          <Paper
            elevation={3}
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              mt: 0.5,
              zIndex: 1000,
              maxHeight: 400,
              overflow: 'auto',
              borderRadius: 2,
              p: 1,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Recent Searches
              </Typography>
              <Typography 
                variant="caption" 
                color="primary" 
                sx={{ cursor: 'pointer' }}
                onClick={() => {
                  clearHistory();
                  setSearchHistory([]);
                  setShowHistory(false);
                }}
              >
                Clear All
              </Typography>
            </Box>
            
            {searchHistory.map((item, index) => (
              <Box
                key={`history-${index}`}
                onClick={() => handleHistoryItemClick(item)}
                sx={{
                  p: 1,
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  borderRadius: 1,
                  bgcolor: activeResultIndex === index ? 'action.selected' : 'transparent',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <icons.Search fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" noWrap>
                  {item}
                </Typography>
              </Box>
            ))}
          </Paper>
        )}

        {/* No Results Message */}
        {(showResults && results && totalResults === 0 && !loading && query.trim()) && (
          <Paper
            elevation={3}
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              mt: 0.5,
              zIndex: 1000,
              p: 2,
              textAlign: 'center',
              borderRadius: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No results found for "{query}"
            </Typography>
          </Paper>
        )}

        {/* Keyboard Navigation Hint */}
        {(showResults || showHistory) && (
          <Box
            sx={{
              position: 'absolute',
              bottom: -40,
              right: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              opacity: 0.7,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <icons.KeyboardArrowUp fontSize="small" />
              <icons.KeyboardArrowDown fontSize="small" />
              <Typography variant="caption" sx={{ ml: 0.5 }}>
                to navigate
              </Typography>
            </Box>
            <Typography variant="caption">
              Enter to select
            </Typography>
            <Typography variant="caption">
              Esc to close
            </Typography>
          </Box>
        )}
      </Box>
    </ClickAwayListener>
  );
};

export default SearchBar;