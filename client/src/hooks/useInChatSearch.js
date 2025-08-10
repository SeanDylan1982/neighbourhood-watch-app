import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Hook for managing in-chat search functionality
 * 
 * Features:
 * - Message searching with highlighting
 * - Result navigation
 * - Search state management
 * - Keyboard shortcuts
 */
const useInChatSearch = (messages = []) => {
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(-1);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const messageRefs = useRef(new Map());

  /**
   * Show search bar
   */
  const showSearch = useCallback(() => {
    setIsSearchVisible(true);
  }, []);

  /**
   * Hide search bar and clear search state
   */
  const hideSearch = useCallback(() => {
    setIsSearchVisible(false);
    setSearchResults([]);
    setCurrentResultIndex(-1);
    setHighlightedMessageId(null);
    setSearchQuery('');
  }, []);

  /**
   * Toggle search bar visibility
   */
  const toggleSearch = useCallback(() => {
    if (isSearchVisible) {
      hideSearch();
    } else {
      showSearch();
    }
  }, [isSearchVisible, hideSearch, showSearch]);

  /**
   * Handle search results from search bar
   */
  const handleSearchResults = useCallback((results) => {
    setSearchResults(results);
    setCurrentResultIndex(results.length > 0 ? 0 : -1);
  }, []);

  /**
   * Highlight a specific message and scroll to it
   */
  const highlightMessage = useCallback((messageId, query) => {
    setHighlightedMessageId(messageId);
    setSearchQuery(query);

    // Scroll to the highlighted message
    const messageElement = messageRefs.current.get(messageId);
    if (messageElement) {
      messageElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

      // Add temporary highlight effect
      messageElement.style.transition = 'background-color 0.3s ease';
      messageElement.style.backgroundColor = 'rgba(255, 235, 59, 0.3)';
      
      setTimeout(() => {
        messageElement.style.backgroundColor = '';
      }, 2000);
    }
  }, []);

  /**
   * Navigate to previous search result
   */
  const goToPreviousResult = useCallback(() => {
    if (searchResults.length === 0) return;
    
    const newIndex = currentResultIndex > 0 
      ? currentResultIndex - 1 
      : searchResults.length - 1;
    
    setCurrentResultIndex(newIndex);
    highlightMessage(searchResults[newIndex].messageId, searchQuery);
  }, [searchResults, currentResultIndex, highlightMessage, searchQuery]);

  /**
   * Navigate to next search result
   */
  const goToNextResult = useCallback(() => {
    if (searchResults.length === 0) return;
    
    const newIndex = currentResultIndex < searchResults.length - 1 
      ? currentResultIndex + 1 
      : 0;
    
    setCurrentResultIndex(newIndex);
    highlightMessage(searchResults[newIndex].messageId, searchQuery);
  }, [searchResults, currentResultIndex, highlightMessage, searchQuery]);

  /**
   * Register a message element ref for scrolling
   */
  const registerMessageRef = useCallback((messageId, element) => {
    if (element) {
      messageRefs.current.set(messageId, element);
    } else {
      messageRefs.current.delete(messageId);
    }
  }, []);

  /**
   * Check if a message should be highlighted
   */
  const isMessageHighlighted = useCallback((messageId) => {
    return highlightedMessageId === messageId;
  }, [highlightedMessageId]);

  /**
   * Get highlighted text for a message
   */
  const getHighlightedText = useCallback((text, query) => {
    if (!query || !text) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }, []);

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyboardShortcut = useCallback((event) => {
    // Ctrl/Cmd + F to open search
    if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
      event.preventDefault();
      showSearch();
      return true;
    }

    // Escape to close search
    if (event.key === 'Escape' && isSearchVisible) {
      event.preventDefault();
      hideSearch();
      return true;
    }

    // F3 or Ctrl/Cmd + G for next result
    if ((event.key === 'F3' || ((event.ctrlKey || event.metaKey) && event.key === 'g')) && !event.shiftKey) {
      event.preventDefault();
      goToNextResult();
      return true;
    }

    // Shift + F3 or Shift + Ctrl/Cmd + G for previous result
    if ((event.key === 'F3' || ((event.ctrlKey || event.metaKey) && event.key === 'g')) && event.shiftKey) {
      event.preventDefault();
      goToPreviousResult();
      return true;
    }

    return false;
  }, [isSearchVisible, showSearch, hideSearch, goToNextResult, goToPreviousResult]);

  /**
   * Set up global keyboard event listeners
   */
  useEffect(() => {
    const handleKeyDown = (event) => {
      handleKeyboardShortcut(event);
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyboardShortcut]);

  /**
   * Clear search when messages change significantly
   */
  useEffect(() => {
    if (searchResults.length > 0) {
      // Check if current search results are still valid
      const validResults = searchResults.filter(result => 
        messages.some(msg => (msg.id || msg._id) === result.messageId)
      );
      
      if (validResults.length !== searchResults.length) {
        setSearchResults(validResults);
        setCurrentResultIndex(validResults.length > 0 ? 0 : -1);
      }
    }
  }, [messages, searchResults]);

  return {
    // State
    isSearchVisible,
    searchResults,
    currentResultIndex,
    highlightedMessageId,
    searchQuery,
    
    // Actions
    showSearch,
    hideSearch,
    toggleSearch,
    handleSearchResults,
    highlightMessage,
    goToPreviousResult,
    goToNextResult,
    registerMessageRef,
    
    // Utilities
    isMessageHighlighted,
    getHighlightedText,
    handleKeyboardShortcut,
    
    // Computed values
    hasResults: searchResults.length > 0,
    resultCount: searchResults.length,
    currentResult: searchResults[currentResultIndex] || null,
    
    // Search statistics
    getSearchStats: () => ({
      total: searchResults.length,
      current: currentResultIndex + 1,
      hasNext: currentResultIndex < searchResults.length - 1,
      hasPrevious: currentResultIndex > 0
    })
  };
};

export default useInChatSearch;