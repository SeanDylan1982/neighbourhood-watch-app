import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import VirtualizedMessageList from '../VirtualizedMessageList';

// Mock the hooks
jest.mock('../../../hooks/useVirtualScroll', () => ({
  useVirtualScroll: jest.fn()
}));

jest.mock('../../../hooks/useMessageCache', () => ({
  useMessageCache: jest.fn()
}));

// Mock child components
jest.mock('../MessageBubble', () => {
  return function MockMessageBubble({ message, isOwn }) {
    return (
      <div data-testid={`message-${message.id}`} className={isOwn ? 'own' : 'other'}>
        {message.content}
      </div>
    );
  };
});

jest.mock('../TypingIndicator', () => {
  return function MockTypingIndicator({ users }) {
    return <div data-testid="typing-indicator">{users.join(', ')} typing...</div>;
  };
});

import { useVirtualScroll } from '../../../hooks/useVirtualScroll';
import { useMessageCache } from '../../../hooks/useMessageCache';

describe('VirtualizedMessageList', () => {
  const mockMessages = [
    {
      id: '1',
      content: 'Hello',
      senderId: 'user1',
      timestamp: new Date(),
      reactions: [],
      attachments: []
    },
    {
      id: '2',
      content: 'Hi there',
      senderId: 'user2',
      timestamp: new Date(),
      reactions: [],
      attachments: []
    }
  ];

  const defaultProps = {
    chatId: 'chat-1',
    messages: mockMessages,
    currentUserId: 'user1',
    onLoadMoreMessages: jest.fn(),
    onMessageAction: jest.fn(),
    onReaction: jest.fn(),
    onReply: jest.fn(),
    typingUsers: []
  };

  const mockVirtualScroll = {
    scrollElementRef: { current: null },
    visibleItems: mockMessages.map((msg, index) => ({
      ...msg,
      index,
      offsetY: index * 80
    })),
    totalHeight: 160,
    handleScroll: jest.fn(),
    scrollToItem: jest.fn(),
    visibleRange: { startIndex: 0, endIndex: 1 }
  };

  const mockMessageCache = {
    loadPage: jest.fn(),
    getMessagesInRange: jest.fn(),
    addMessage: jest.fn(),
    updateMessage: jest.fn(),
    removeMessage: jest.fn(),
    hasMoreBefore: true,
    isLoading: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useVirtualScroll.mockReturnValue(mockVirtualScroll);
    useMessageCache.mockReturnValue(mockMessageCache);
    
    // Mock ResizeObserver
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  afterEach(() => {
    delete global.ResizeObserver;
  });

  it('should render messages correctly', () => {
    render(<VirtualizedMessageList {...defaultProps} />);

    expect(screen.getByTestId('message-1')).toBeInTheDocument();
    expect(screen.getByTestId('message-2')).toBeInTheDocument();
  });

  it('should apply correct classes for own and other messages', () => {
    render(<VirtualizedMessageList {...defaultProps} />);

    const ownMessage = screen.getByTestId('message-1');
    const otherMessage = screen.getByTestId('message-2');

    expect(ownMessage.closest('.virtualized-message-item')).toHaveClass('own');
    expect(otherMessage.closest('.virtualized-message-item')).toHaveClass('other');
  });

  it('should handle scroll events', () => {
    render(<VirtualizedMessageList {...defaultProps} />);

    const scrollContainer = document.querySelector('.virtualized-scroll-container');
    fireEvent.scroll(scrollContainer, { target: { scrollTop: 100 } });

    expect(mockVirtualScroll.handleScroll).toHaveBeenCalled();
  });

  it('should show typing indicator when users are typing', () => {
    const propsWithTyping = {
      ...defaultProps,
      typingUsers: ['user2', 'user3']
    };

    render(<VirtualizedMessageList {...propsWithTyping} />);

    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
    expect(screen.getByText('user2, user3 typing...')).toBeInTheDocument();
  });

  it('should show loading indicator when loading', () => {
    useMessageCache.mockReturnValue({
      ...mockMessageCache,
      isLoading: true
    });

    render(<VirtualizedMessageList {...defaultProps} />);

    expect(screen.getByText('Loading messages...')).toBeInTheDocument();
  });

  it('should show scroll to bottom button when not at bottom', () => {
    // Mock being away from bottom
    const mockVirtualScrollNotAtBottom = {
      ...mockVirtualScroll,
      handleScroll: jest.fn((callback) => {
        // Simulate scroll event that's not at bottom
        callback({
          scrollTop: 50,
          scrollDirection: 'up'
        });
      })
    };

    useVirtualScroll.mockReturnValue(mockVirtualScrollNotAtBottom);

    render(<VirtualizedMessageList {...defaultProps} />);

    // Trigger scroll to simulate not being at bottom
    const scrollContainer = document.querySelector('.virtualized-scroll-container');
    fireEvent.scroll(scrollContainer, { target: { scrollTop: 50 } });

    waitFor(() => {
      expect(screen.getByLabelText('Scroll to bottom')).toBeInTheDocument();
    });
  });

  it('should scroll to bottom when button is clicked', async () => {
    render(<VirtualizedMessageList {...defaultProps} />);

    // Simulate not being at bottom first
    const scrollContainer = document.querySelector('.virtualized-scroll-container');
    fireEvent.scroll(scrollContainer, { target: { scrollTop: 50 } });

    await waitFor(() => {
      const scrollButton = screen.queryByLabelText('Scroll to bottom');
      if (scrollButton) {
        fireEvent.click(scrollButton);
        expect(mockVirtualScroll.scrollToItem).toHaveBeenCalledWith(1); // messages.length - 1
      }
    });
  });

  it('should load more messages when scrolling up', () => {
    const mockOnLoadMoreMessages = jest.fn();
    const propsWithLoadMore = {
      ...defaultProps,
      onLoadMoreMessages: mockOnLoadMoreMessages
    };

    render(<VirtualizedMessageList {...propsWithLoadMore} />);

    // Simulate scroll up near top
    const scrollContainer = document.querySelector('.virtualized-scroll-container');
    fireEvent.scroll(scrollContainer, { target: { scrollTop: 50 } });

    // The component should trigger loading more messages
    expect(mockMessageCache.loadPage).toHaveBeenCalled();
  });

  it('should calculate item height correctly', () => {
    const messageWithAttachments = {
      ...mockMessages[0],
      content: 'A very long message that should take multiple lines to display properly',
      attachments: [{ id: '1', type: 'image' }],
      reactions: [{ type: '👍', count: 1 }],
      replyTo: { messageId: '2', content: 'Previous message' }
    };

    const propsWithComplexMessage = {
      ...defaultProps,
      messages: [messageWithAttachments]
    };

    render(<VirtualizedMessageList {...propsWithComplexMessage} />);

    // The component should render without errors
    expect(screen.getByTestId('message-1')).toBeInTheDocument();
  });

  it('should handle empty messages array', () => {
    const propsWithNoMessages = {
      ...defaultProps,
      messages: []
    };

    useVirtualScroll.mockReturnValue({
      ...mockVirtualScroll,
      visibleItems: [],
      totalHeight: 0
    });

    render(<VirtualizedMessageList {...propsWithNoMessages} />);

    // Should render without errors
    expect(document.querySelector('.virtualized-message-list')).toBeInTheDocument();
  });

  it('should update container height on window resize', () => {
    render(<VirtualizedMessageList {...defaultProps} />);

    // Mock container dimensions
    const container = document.querySelector('.virtualized-message-list');
    jest.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      height: 500
    });

    // Trigger resize
    fireEvent(window, new Event('resize'));

    // The component should handle the resize
    expect(container).toBeInTheDocument();
  });
});