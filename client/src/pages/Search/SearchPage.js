import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  IconButton,
  Paper,
  Tabs,
  Tab,
  Divider,
  useTheme,
  useMediaQuery,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import icons from '../../components/Common/Icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SearchBar from '../../components/Search/SearchBar';
import SearchResults from '../../components/Search/SearchResults';
import useSearchNavigation from '../../hooks/useSearchNavigation';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Simple search bar for the search page
 */
const SearchPageSearchBar = ({ placeholder, onResultSelect, onSearch, initialQuery }) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleClear = () => {
    setSearchQuery('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <TextField
        fullWidth
        placeholder={placeholder}
        value={searchQuery}
        onChange={handleInputChange}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: searchQuery && (
            <InputAdornment position="end">
              <IconButton
                aria-label="clear search"
                onClick={handleClear}
                edge="end"
                size="small"
              >
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
          },
        }}
      />
    </form>
  );
};

/**
 * Dedicated search page for mobile users
 */
const SearchPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const { token } = useAuth();
  const { navigateToResult } = useSearchNavigation();
  const [activeTab, setActiveTab] = useState(0);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState(initialQuery);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Perform search when user submits query
  const handleSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) return;
    
    setQuery(searchQuery);
    setLoading(true);
    setError(null);
    
    // Update URL with search query
    setSearchParams({ q: searchQuery });
    
    try {
      // Get search type based on active tab
      const searchType = ['all', 'users', 'notices', 'reports', 'chats'][activeTab];
      
      const response = await axios.get('/api/search', {
        params: { 
          q: searchQuery,
          type: searchType,
          limit: 20
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to perform search. Please try again.');
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [activeTab, token, setSearchParams]);

  // Automatically search when page loads with query parameter
  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery, handleSearch]);

  // Re-search when tab changes and we have a query
  useEffect(() => {
    if (query) {
      handleSearch(query);
    }
  }, [activeTab, handleSearch, query]);

  // Handle result selection
  const handleResultSelect = (item, type) => {
    navigateToResult(item, type);
  };

  // Handle back navigation with fallback
  const handleBackNavigation = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // Fallback to dashboard if no history
      navigate('/dashboard');
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <IconButton 
          edge="start" 
          onClick={handleBackNavigation} 
          sx={{ mr: 1 }}
          title="Go back"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6">Search</Typography>
      </Box>
      
      <Paper elevation={1} sx={{ mb: 2, p: 2, borderRadius: 2 }}>
        <SearchPageSearchBar 
          placeholder="Search people, notices, reports, chats..." 
          onResultSelect={handleResultSelect}
          onSearch={handleSearch}
          initialQuery={initialQuery}
        />
      </Paper>
      
      <Paper elevation={1} sx={{ borderRadius: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All" />
          <Tab label="People" />
          <Tab label="Notices" />
          <Tab label="Reports" />
          <Tab label="Chats" />
        </Tabs>
        
        <Box sx={{ p: 2 }}>
          {loading && (
            <Typography variant="body2" color="text.secondary" align="center">
              Searching...
            </Typography>
          )}
          
          {error && (
            <Typography variant="body2" color="error" align="center">
              {error}
            </Typography>
          )}
          
          {!loading && !error && results && (
            <SearchResults 
              results={results} 
              onResultSelect={handleResultSelect}
              activeResultIndex={-1}
              setActiveResultIndex={() => {}}
              activeSection={null}
              setActiveSection={() => {}}
              query={query}
            />
          )}
          
          {!loading && !error && !results && (
            <Typography variant="body2" color="text.secondary" align="center">
              Enter a search term to find people, notices, reports, and chats
            </Typography>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default SearchPage;