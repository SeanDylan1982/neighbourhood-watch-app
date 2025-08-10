/**
 * Utility functions for emoji handling
 */

/**
 * Checks if a string contains emoji codes
 * @param {string} text - Text to check for emoji codes
 * @returns {boolean} - True if text contains emoji codes
 */
export const containsEmojis = (text) => {
  if (!text || typeof text !== 'string') return false;
  const emojiRegex = /\{\{EMOJI:([A-Fa-f0-9-]+)\}\}/;
  return emojiRegex.test(text);
};

/**
 * Extracts emoji codes from a string
 * @param {string} text - Text containing emoji codes
 * @returns {Array} - Array of emoji codes found in the text
 */
export const extractEmojiCodes = (text) => {
  if (!text || typeof text !== 'string') return [];
  
  const emojiRegex = /\{\{EMOJI:([A-Fa-f0-9-]+)\}\}/g;
  const codes = [];
  let match;
  
  while ((match = emojiRegex.exec(text)) !== null) {
    codes.push(match[1]);
  }
  
  return codes;
};

/**
 * Converts emoji codes to a plain text representation
 * @param {string} text - Text containing emoji codes
 * @returns {string} - Text with emoji codes replaced by emoji names
 */
export const emojiToPlainText = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  // Map of common emoji codes to text representations
  const emojiMap = {
    '1F600': '😀',
    '1F603': '😃',
    '1F604': '😄',
    '1F601': '😁',
    '1F606': '😆',
    '1F605': '😅',
    '1F602': '😂',
    '1F642': '🙂',
    '1F643': '🙃',
    '1F609': '😉',
    '1F60A': '😊',
    '1F607': '😇',
    '1F970': '🥰',
    '1F60D': '😍',
    '1F929': '🤩',
    '1F618': '😘',
    '1F617': '😗',
    '263A': '☺️',
    '1F914': '🤔',
    // Add more mappings as needed
  };
  
  return text.replace(/\{\{EMOJI:([A-Fa-f0-9-]+)\}\}/g, (match, code) => {
    return emojiMap[code] || '📍';
  });
};

/**
 * Counts the number of emojis in a text
 * @param {string} text - Text containing emoji codes
 * @returns {number} - Number of emojis in the text
 */
export const countEmojis = (text) => {
  if (!text || typeof text !== 'string') return 0;
  
  const emojiRegex = /\{\{EMOJI:([A-Fa-f0-9-]+)\}\}/g;
  let count = 0;
  let match;
  
  while ((match = emojiRegex.exec(text)) !== null) {
    count++;
  }
  
  return count;
};