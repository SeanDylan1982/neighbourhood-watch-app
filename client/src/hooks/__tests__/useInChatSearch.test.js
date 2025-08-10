import { renderHook, act } from '@testing-library/react';
import useInChatSearch from '../useInChatSearch';

// Mock DOM methods
const mockScrollIntoView = jest.fn();

// Mock scrollIntoView for all elements
beforeAll(() => {
  Element.prototype.scrollIntoView = mockScrollIntoView;
});

const mockMessages = [
  {
    id: '1',
    content: 'Hello world, this is a test message',
    senderName: 'John Doe',
    timestamp: new Date('2023-01-01T10:00:00Z')
  },
  {
    id: '2',
    content: 'Another message with different content',
    senderName: 'Jane Smith',
    timestamp: new Date('2023-01-01T11:00:00Z')
  },
  {
    id: '3',
    content: 'Hello again from John',
    senderName: 'John Doe',
    timestamp: new Date('2023-01-01T12:00:00Z')
  }
];

describe('useInChatSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useInChatSearch(mockMessages));

    expect(result.current.isSearchVisible).toBe(false);
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.currentResultIndex).toBe(-1);
    expect(result.current.highlightedMessageId).toBe(null);
    expect(result.current.searchQuery).toBe('');
    expect(result.current.hasResults).toBe(false);
    expect(result.current.resultCount).toBe(0);
  });

  it('shows and hides search', () => {
    const { result } = renderHook(() => useInChatSearch(mockMessages));

    act(() => {
      result.current.showSearch();
    });

    expect(result.current.isSearchVisible).toBe(true);

    act(() => {
      result.current.hideSearch();
    });

    expect(result.current.isSearchVisible).toBe(false);
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.currentResultIndex).toBe(-1);
    expect(result.current.highlightedMessageId).toBe(null);
    expect(result.current.searchQuery).toBe('');
  });

  it('toggles search visibility', () => {
    const { result } = renderHook(() => useInChatSearch(mockMessages));

    act(() => {
      result.current.toggleSearch();
    });

    expect(result.current.isSearchVisible).toBe(true);

    act(() => {
      result.current.toggleSearch();
    });

    expect(result.current.isSearchVisible).toBe(false);
  });

  it('handles search results', () => {
    const { result } = renderHook(() => useInChatSearch(mockMessages));

    const mockResults = [
      { messageId: '1', content: 'Hello world' },
      { messageId: '3', content: 'Hello again' }
    ];

    act(() => {
      result.current.handleSearchResults(mockResults);
    });

    expect(result.current.searchResults).toEqual(mockResults);
    expect(result.current.currentResultIndex).toBe(0);
    expect(result.current.hasResults).toBe(true);
    expect(result.current.resultCount).toBe(2);
  });

  it('handles empty search results', () => {
    const { result } = renderHook(() => useInChatSearch(mockMessages));

    act(() => {
      result.current.handleSearchResults([]);
    });

    expect(result.current.searchResults).toEqual([]);
    expect(result.current.currentResultIndex).toBe(-1);
    expect(result.current.hasResults).toBe(false);
    expect(result.current.resultCount).toBe(0);
  });

  it('highlights messages and scrolls to them', () => {
    const { result } = renderHook(() => useInChatSearch(mockMessages));

    // Create a mock element
    const mockElement = document.createElement('div');

    // Register the element
    act(() => {
      result.current.registerMessageRef('1', mockElement);
    });

    // Highlight the message
    act(() => {
      result.current.highlightMessage('1', 'hello');
    });

    expect(result.current.highlightedMessageId).toBe('1');
    expect(result.current.searchQuery).toBe('hello');
    expect(mockScrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center'
    });
  });

  it('navigates between search results', () => {
    const { result } = renderHook(() => useInChatSearch(mockMessages));

    const mockResults = [
      { messageId: '1', content: 'Hello world' },
      { messageId: '2', content: 'Another message' },
      { messageId: '3', content: 'Hello again' }
    ];

    act(() => {
      result.current.handleSearchResults(mockResults);
    });

    expect(result.current.currentResultIndex).toBe(0);

    // Go to next result
    act(() => {
      result.current.goToNextResult();
    });

    expect(result.current.currentResultIndex).toBe(1);

    // Go to next result again
    act(() => {
      result.current.goToNextResult();
    });

    expect(result.current.currentResultIndex).toBe(2);

    // Go to next result (should wrap to beginning)
    act(() => {
      result.current.goToNextResult();
    });

    expect(result.current.currentResultIndex).toBe(0);

    // Go to previous result (should wrap to end)
    act(() => {
      result.current.goToPreviousResult();
    });

    expect(result.current.currentResultIndex).toBe(2);

    // Go to previous result
    act(() => {
      result.current.goToPreviousResult();
    });

    expect(result.current.currentResultIndex).toBe(1);
  });

  it('handles navigation with no results', () => {
    const { result } = renderHook(() => useInChatSearch(mockMessages));

    // Try to navigate with no results
    act(() => {
      result.current.goToNextResult();
    });

    expect(result.current.currentResultIndex).toBe(-1);

    act(() => {
      result.current.goToPreviousResult();
    });

    expect(result.current.currentResultIndex).toBe(-1);
  });

  it('checks if message is highlighted', () => {
    const { result } = renderHook(() => useInChatSearch(mockMessages));

    act(() => {
      result.current.highlightMessage('1', 'hello');
    });

    expect(result.current.isMessageHighlighted('1')).toBe(true);
    expect(result.current.isMessageHighlighted('2')).toBe(false);
  });

  it('gets highlighted text', () => {
    const { result } = renderHook(() => useInChatSearch(mockMessages));

    const highlightedText = result.current.getHighlightedText('Hello world', 'hello');
    expect(highlightedText).toBe('<mark>Hello</mark> world');

    const noHighlight = result.current.getHighlightedText('Hello world', '');
    expect(noHighlight).toBe('Hello world');
  });

  it('provides search statistics', () => {
    const { result } = renderHook(() => useInChatSearch(mockMessages));

    const mockResults = [
      { messageId: '1', content: 'Hello world' },
      { messageId: '2', content: 'Another message' },
      { messageId: '3', content: 'Hello again' }
    ];

    act(() => {
      result.current.handleSearchResults(mockResults);
    });

    const stats = result.current.getSearchStats();
    expect(stats).toEqual({
      total: 3,
      current: 1,
      hasNext: true,
      hasPrevious: false
    });

    // Navigate to middle result
    act(() => {
      result.current.goToNextResult();
    });

    const middleStats = result.current.getSearchStats();
    expect(middleStats).toEqual({
      total: 3,
      current: 2,
      hasNext: true,
      hasPrevious: true
    });

    // Navigate to last result
    act(() => {
      result.current.goToNextResult();
    });

    const lastStats = result.current.getSearchStats();
    expect(lastStats).toEqual({
      total: 3,
      current: 3,
      hasNext: false,
      hasPrevious: true
    });
  });

  it('gets current result', () => {
    const { result } = renderHook(() => useInChatSearch(mockMessages));

    const mockResults = [
      { messageId: '1', content: 'Hello world' },
      { messageId: '2', content: 'Another message' }
    ];

    act(() => {
      result.current.handleSearchResults(mockResults);
    });

    expect(result.current.currentResult).toEqual(mockResults[0]);

    act(() => {
      result.current.goToNextResult();
    });

    expect(result.current.currentResult).toEqual(mockResults[1]);
  });

  it('handles keyboard shortcuts', () => {
    const { result } = renderHook(() => useInChatSearch(mockMessages));

    // Test Ctrl+F to show search
    const ctrlFEvent = new KeyboardEvent('keydown', {
      key: 'f',
      ctrlKey: true
    });

    act(() => {
      const handled = result.current.handleKeyboardShortcut(ctrlFEvent);
      expect(handled).toBe(true);
    });

    expect(result.current.isSearchVisible).toBe(true);

    // Test Escape to hide search
    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape'
    });

    act(() => {
      const handled = result.current.handleKeyboardShortcut(escapeEvent);
      expect(handled).toBe(true);
    });

    expect(result.current.isSearchVisible).toBe(false);
  });

  it('registers and unregisters message refs', () => {
    const { result } = renderHook(() => useInChatSearch(mockMessages));

    const mockElement = document.createElement('div');

    act(() => {
      result.current.registerMessageRef('1', mockElement);
    });

    // Element should be registered (we can't directly test the internal map)
    // but we can test that highlighting works
    act(() => {
      result.current.highlightMessage('1', 'hello');
    });

    expect(result.current.highlightedMessageId).toBe('1');

    // Unregister element
    act(() => {
      result.current.registerMessageRef('1', null);
    });

    // Should still work but won't scroll
    act(() => {
      result.current.highlightMessage('1', 'world');
    });

    expect(result.current.highlightedMessageId).toBe('1');
    expect(result.current.searchQuery).toBe('world');
  });

  it('validates search results when messages change', () => {
    const { result, rerender } = renderHook(
      ({ messages }) => useInChatSearch(messages),
      { initialProps: { messages: mockMessages } }
    );

    const mockResults = [
      { messageId: '1', content: 'Hello world' },
      { messageId: '2', content: 'Another message' }
    ];

    act(() => {
      result.current.handleSearchResults(mockResults);
    });

    expect(result.current.searchResults).toEqual(mockResults);

    // Update messages to remove message with id '2'
    const updatedMessages = mockMessages.filter(msg => msg.id !== '2');
    
    rerender({ messages: updatedMessages });

    // Should filter out invalid results
    expect(result.current.searchResults.length).toBeLessThan(mockResults.length);
  });
});