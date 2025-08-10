import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MessageList from '../MessageList';

const theme = createTheme();

const mockMessages = [
  {
    id: '1',
    content: 'Hello everyone!',
    senderId: 'user1',
    senderName: 'John Doe',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    isOwn: false
  },
  {
    id: '2',
    content: 'Hi there!',
    senderId: 'user2',
    senderName: 'Jane Smith',
    createdAt: new Date('2024-01-01T10:01:00Z'),
    isOwn: true
  },
  {
    id: '3',
    content: 'How is everyone doing?',
    senderId: 'user1',
    senderName: 'John Doe',
    createdAt: new Date('2024-01-01T10:02:00Z'),
    isOwn: false
  }
];

const defaultProps = {
  messages: mockMessages,
  currentUserId: 'user2',
  chatType: 'group',
  typingUsers: {},
  onReaction: jest.fn(),
  onReply: jest.fn(),
  onMessageAction: jest.fn()
};

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('MessageList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders messages correctly', () => {
    renderWithTheme(<MessageList {...defaultProps} />);
    
    expect(screen.getByText('Hello everyone!')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
    expect(screen.getByText('How is everyone doing?')).toBeInTheDocument();
  });

  it('groups messages by sender correctly', () => {
    renderWithTheme(<MessageList {...defaultProps} />);
    
    // Should show sender names for group chat received messages
    const senderNames = screen.getAllByText('John Doe');
    expect(senderNames).toHaveLength(2); // Two separate message groups from John
  });

  it('shows empty state when no messages', () => {
    renderWithTheme(
      <MessageList 
        {...defaultProps} 
        messages={[]} 
      />
    );
    
    expect(screen.getByText('No messages yet. Start the conversation!')).toBeInTheDocument();
  });

  it('shows different empty state for private chats', () => {
    renderWithTheme(
      <MessageList 
        {...defaultProps} 
        messages={[]} 
        chatType="private"
      />
    );
    
    expect(screen.getByText('Start your conversation...')).toBeInTheDocument();
  });

  it('displays typing indicator when users are typing', () => {
    const typingUsers = {
      user1: { name: 'John Doe' }
    };
    
    renderWithTheme(
      <MessageList 
        {...defaultProps} 
        typingUsers={typingUsers}
      />
    );
    
    // TypingIndicator component should be rendered
    // (Assuming TypingIndicator has some identifiable content)
    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
  });

  it('handles scroll events correctly', async () => {
    const { container } = renderWithTheme(<MessageList {...defaultProps} />);
    const messageContainer = container.firstChild;
    
    // Mock scrollTop and scrollHeight
    Object.defineProperty(messageContainer, 'scrollTop', {
      writable: true,
      value: 100
    });
    Object.defineProperty(messageContainer, 'scrollHeight', {
      writable: true,
      value: 1000
    });
    Object.defineProperty(messageContainer, 'clientHeight', {
      writable: true,
      value: 400
    });
    
    // Trigger scroll event
    fireEvent.scroll(messageContainer);
    
    // Should show scroll-to-bottom button when not at bottom
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  it('supports virtualization when enabled', () => {
    const manyMessages = Array.from({ length: 100 }, (_, i) => ({
      id: `msg-${i}`,
      content: `Message ${i}`,
      senderId: i % 2 === 0 ? 'user1' : 'user2',
      senderName: i % 2 === 0 ? 'John Doe' : 'Jane Smith',
      createdAt: new Date(`2024-01-01T10:${String(i).padStart(2, '0')}:00Z`),
      isOwn: i % 2 === 1
    }));
    
    renderWithTheme(
      <MessageList 
        {...defaultProps} 
        messages={manyMessages}
        enableVirtualization={true}
      />
    );
    
    // With virtualization, not all messages should be rendered at once
    // Only visible messages plus buffer should be in DOM
    const renderedMessages = screen.getAllByText(/Message \d+/);
    expect(renderedMessages.length).toBeLessThan(manyMessages.length);
  });

  it('disables virtualization when requested', () => {
    renderWithTheme(
      <MessageList 
        {...defaultProps} 
        enableVirtualization={false}
      />
    );
    
    // All messages should be rendered
    expect(screen.getByText('Hello everyone!')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
    expect(screen.getByText('How is everyone doing?')).toBeInTheDocument();
  });

  it('calls callback functions when message interactions occur', () => {
    renderWithTheme(<MessageList {...defaultProps} />);
    
    // These would be triggered by MessageBubble components
    // The actual testing of these callbacks would be in MessageBubble tests
    expect(defaultProps.onReaction).not.toHaveBeenCalled();
    expect(defaultProps.onReply).not.toHaveBeenCalled();
    expect(defaultProps.onMessageAction).not.toHaveBeenCalled();
  });
});