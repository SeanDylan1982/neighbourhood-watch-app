import React from 'react';
import { Box } from '@mui/material';
import FluentEmoji from './FluentEmoji';

/**
 * Component to render emojis within text content
 * 
 * @param {Object} props
 * @param {string} props.content - Text content that may contain emoji codes
 * @param {number} props.size - Size of the emoji in pixels
 * @param {Object} props.sx - Additional styles for the container
 */
const EmojiRenderer = ({ content, size = 20, sx = {} }) => {
  if (!content) return null;

  // Regular expression to match emoji codes in the format {{EMOJI:1F600}}
  const emojiRegex = /\{\{EMOJI:([A-Fa-f0-9-]+)\}\}/g;
  
  // Split content by emoji codes
  const parts = [];
  let lastIndex = 0;
  let match;
  
  while ((match = emojiRegex.exec(content)) !== null) {
    // Add text before the emoji
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex, match.index)
      });
    }
    
    // Add the emoji
    parts.push({
      type: 'emoji',
      code: match[1] // The captured emoji code
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text after the last emoji
  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.substring(lastIndex)
    });
  }
  
  // If no emojis found, return the original content
  if (parts.length === 0) {
    return <span>{content}</span>;
  }
  
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', ...sx }}>
      {parts.map((part, index) => {
        if (part.type === 'text') {
          return <span key={index}>{part.content}</span>;
        } else {
          return (
            <Box 
              key={index} 
              component="span" 
              sx={{ 
                display: 'inline-flex', 
                alignItems: 'center',
                mx: 0.25,
                verticalAlign: 'middle'
              }}
            >
              <FluentEmoji
                emoji={part.code}
                size={size}
              />
            </Box>
          );
        }
      })}
    </Box>
  );
};

export default EmojiRenderer;