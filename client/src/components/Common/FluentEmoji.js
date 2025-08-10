import React from 'react';

/**
 * React wrapper for Fluent UI emoji using native emoji characters
 * This provides a simple, reliable emoji display that works consistently
 * @param {Object} props
 * @param {string} props.emoji - Unicode emoji code (e.g., "1F600")
 * @param {number} props.size - Size in pixels
 * @param {Object} props.style - Additional styles
 */
const FluentEmoji = ({ emoji, size = 20, style = {}, ...props }) => {
  // Convert hex code to emoji character
  let emojiChar;
  
  try {
    // Handle compound emojis (like flags with multiple code points)
    if (emoji.includes('-')) {
      const codePoints = emoji.split('-').map(code => parseInt(code, 16));
      emojiChar = String.fromCodePoint(...codePoints);
    } else {
      emojiChar = String.fromCodePoint(parseInt(emoji, 16));
    }
  } catch (error) {
    console.warn('Invalid emoji code:', emoji);
    emojiChar = '❓'; // Fallback to question mark
  }
  
  return (
    <span 
      style={{
        display: 'inline-block',
        fontSize: `${size}px`,
        lineHeight: 1,
        fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif',
        ...style
      }}
      {...props}
    >
      {emojiChar}
    </span>
  );
};

export default FluentEmoji;