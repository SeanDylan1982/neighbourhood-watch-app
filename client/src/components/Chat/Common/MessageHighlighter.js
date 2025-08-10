import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * MessageHighlighter component for highlighting search terms in message text
 * 
 * Features:
 * - Highlights search terms with customizable styling
 * - Preserves original text formatting
 * - Handles multiple matches in the same text
 * - Case-insensitive highlighting
 */
const MessageHighlighter = ({
  text = '',
  searchQuery = '',
  highlightStyle = {},
  component = 'span',
  className = '',
  ...props
}) => {
  /**
   * Escape special regex characters in search query
   */
  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  /**
   * Split text into parts and highlight matches
   */
  const getHighlightedText = () => {
    if (!searchQuery || !text) {
      return text;
    }

    try {
      const escapedQuery = escapeRegExp(searchQuery.trim());
      const regex = new RegExp(`(${escapedQuery})`, 'gi');
      const parts = text.split(regex);

      return parts.map((part, index) => {
        // Check if this part matches the search query (case insensitive)
        const isMatch = part.toLowerCase() === searchQuery.toLowerCase();
        
        if (isMatch) {
          return (
            <Box
              key={index}
              component="mark"
              sx={{
                backgroundColor: 'warning.light',
                color: 'warning.contrastText',
                padding: '0 2px',
                borderRadius: '2px',
                fontWeight: 'bold',
                ...highlightStyle
              }}
            >
              {part}
            </Box>
          );
        }
        
        return part;
      });
    } catch (error) {
      // If regex fails, return original text
      console.warn('MessageHighlighter: Invalid regex pattern', error);
      return text;
    }
  };

  const highlightedContent = getHighlightedText();

  // If using Typography component
  if (component === Typography || (typeof component === 'string' && component.startsWith('h'))) {
    return (
      <Typography
        component={component}
        className={className}
        {...props}
      >
        {highlightedContent}
      </Typography>
    );
  }

  // For other components or spans
  return (
    <Box
      component={component}
      className={className}
      {...props}
    >
      {highlightedContent}
    </Box>
  );
};

/**
 * Hook for getting highlighted text without rendering
 */
export const useMessageHighlighter = () => {
  const getHighlightedText = (text, searchQuery, options = {}) => {
    const {
      caseSensitive = false,
      wholeWord = false,
      maxMatches = -1
    } = options;

    if (!searchQuery || !text) {
      return { text, matches: [], hasMatches: false, matchCount: 0 };
    }

    try {
      const flags = caseSensitive ? 'g' : 'gi';
      const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = wholeWord ? `\\b${escapedQuery}\\b` : escapedQuery;
      const regex = new RegExp(`(${pattern})`, flags);
      
      const matches = [];
      let match;
      let matchCount = 0;
      
      while ((match = regex.exec(text)) !== null && (maxMatches === -1 || matchCount < maxMatches)) {
        matches.push({
          text: match[1],
          index: match.index,
          length: match[1].length
        });
        matchCount++;
        
        // Prevent infinite loop on zero-length matches
        if (match.index === regex.lastIndex) {
          regex.lastIndex++;
        }
      }

      return {
        text,
        matches,
        hasMatches: matches.length > 0,
        matchCount: matches.length
      };
    } catch (error) {
      console.warn('useMessageHighlighter: Invalid regex pattern', error);
      return { text, matches: [], hasMatches: false, matchCount: 0 };
    }
  };

  const highlightMatches = (text, matches, highlightClass = 'highlight') => {
    if (!matches.length) return text;

    let result = '';
    let lastIndex = 0;

    matches.forEach((match) => {
      // Add text before the match
      result += text.slice(lastIndex, match.index);
      
      // Add highlighted match
      result += `<span class="${highlightClass}">${match.text}</span>`;
      
      lastIndex = match.index + match.length;
    });

    // Add remaining text
    result += text.slice(lastIndex);

    return result;
  };

  return {
    getHighlightedText,
    highlightMatches
  };
};

export default MessageHighlighter;