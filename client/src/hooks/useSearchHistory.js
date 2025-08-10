import { useCallback } from 'react';

/**
 * Custom hook for managing search history
 * 
 * Features:
 * - Add search queries to history
 * - Get search history
 * - Clear search history
 * - Limit history size
 * - Prevent duplicates
 */
const useSearchHistory = (maxHistorySize = 10) => {
  const STORAGE_KEY = 'neighbourhood_app_search_history';

  /**
   * Get search history from localStorage
   */
  const getHistory = useCallback(() => {
    try {
      const history = localStorage.getItem(STORAGE_KEY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error retrieving search history:', error);
      return [];
    }
  }, []); // STORAGE_KEY is constant, no need in dependency array

  /**
   * Add a search query to history
   */
  const addToHistory = useCallback((query) => {
    if (!query || query.trim() === '') return;
    
    try {
      const trimmedQuery = query.trim();
      const history = getHistory();
      
      // Remove the query if it already exists (to move it to the top)
      const filteredHistory = history.filter(item => item.toLowerCase() !== trimmedQuery.toLowerCase());
      
      // Add the new query to the beginning
      const newHistory = [trimmedQuery, ...filteredHistory].slice(0, maxHistorySize);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error adding to search history:', error);
    }
  }, [getHistory, maxHistorySize]); // Removed STORAGE_KEY as it's constant

  /**
   * Clear search history
   */
  const clearHistory = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  }, []); // STORAGE_KEY is constant, no need in dependency array

  return { addToHistory, getHistory, clearHistory };
};

export default useSearchHistory;