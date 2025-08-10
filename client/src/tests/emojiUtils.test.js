import { 
  containsEmojis, 
  extractEmojiCodes, 
  emojiToPlainText, 
  countEmojis 
} from '../utils/emojiUtils';

describe('Emoji Utilities', () => {
  describe('containsEmojis', () => {
    test('returns true when text contains emoji codes', () => {
      expect(containsEmojis('Hello {{EMOJI:1F600}} world')).toBe(true);
    });
    
    test('returns false when text does not contain emoji codes', () => {
      expect(containsEmojis('Hello world')).toBe(false);
    });
    
    test('handles null or undefined input', () => {
      expect(containsEmojis(null)).toBe(false);
      expect(containsEmojis(undefined)).toBe(false);
    });
    
    test('handles non-string input', () => {
      expect(containsEmojis(123)).toBe(false);
      expect(containsEmojis({})).toBe(false);
    });
  });
  
  describe('extractEmojiCodes', () => {
    test('extracts single emoji code', () => {
      const result = extractEmojiCodes('Hello {{EMOJI:1F600}} world');
      expect(result).toEqual(['1F600']);
    });
    
    test('extracts multiple emoji codes', () => {
      const result = extractEmojiCodes('Hello {{EMOJI:1F600}} world {{EMOJI:1F60D}}');
      expect(result).toEqual(['1F600', '1F60D']);
    });
    
    test('returns empty array when no emoji codes are present', () => {
      const result = extractEmojiCodes('Hello world');
      expect(result).toEqual([]);
    });
    
    test('handles null or undefined input', () => {
      expect(extractEmojiCodes(null)).toEqual([]);
      expect(extractEmojiCodes(undefined)).toEqual([]);
    });
    
    test('handles non-string input', () => {
      expect(extractEmojiCodes(123)).toEqual([]);
      expect(extractEmojiCodes({})).toEqual([]);
    });
  });
  
  describe('emojiToPlainText', () => {
    test('converts emoji codes to text representations', () => {
      const result = emojiToPlainText('Hello {{EMOJI:1F600}} world');
      expect(result).toBe('Hello 😀 world');
    });
    
    test('converts multiple emoji codes', () => {
      const result = emojiToPlainText('Hello {{EMOJI:1F600}} world {{EMOJI:1F60D}}');
      expect(result).toBe('Hello 😀 world 😍');
    });
    
    test('uses fallback for unknown emoji codes', () => {
      const result = emojiToPlainText('Hello {{EMOJI:UNKNOWN}} world');
      expect(result).toBe('Hello 📍 world');
    });
    
    test('returns original text when no emoji codes are present', () => {
      const result = emojiToPlainText('Hello world');
      expect(result).toBe('Hello world');
    });
    
    test('handles null or undefined input', () => {
      expect(emojiToPlainText(null)).toBeNull();
      expect(emojiToPlainText(undefined)).toBeUndefined();
    });
  });
  
  describe('countEmojis', () => {
    test('counts single emoji', () => {
      expect(countEmojis('Hello {{EMOJI:1F600}} world')).toBe(1);
    });
    
    test('counts multiple emojis', () => {
      expect(countEmojis('Hello {{EMOJI:1F600}} world {{EMOJI:1F60D}}')).toBe(2);
    });
    
    test('returns 0 when no emojis are present', () => {
      expect(countEmojis('Hello world')).toBe(0);
    });
    
    test('handles null or undefined input', () => {
      expect(countEmojis(null)).toBe(0);
      expect(countEmojis(undefined)).toBe(0);
    });
    
    test('handles non-string input', () => {
      expect(countEmojis(123)).toBe(0);
      expect(countEmojis({})).toBe(0);
    });
  });
});