import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MessageBubble from '../MessageBubble';

// Mock theme
const theme = createTheme();

// Test wrapper component
const TestWrapper = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

// Mock message data
const mockTextMessage = {
  id: '1',
  content: 'Hello, this is a test message!',
  type: 'text',
  senderId: 'user1',
  senderName: 'John Doe',
  timestamp: new Date('2024-01-01T12:00:00Z'),
  status: 'read',
  reactions: [],
  replyTo: null
};

const mockGroupMessage = {
  ...mockTextMessage,
  id: '2',
  content: 'Group message content',
  senderName: 'Jane Smith'
};

const mockReplyMessage = {
  ...mockTextMessage,
  id: '3',
  content: 'This is a reply',
  replyTo: {
    messageId: '1',
    content: 'Original message content',
    senderName: 'John Doe',
    type: 'text'
  }
};

const mockImageMessage = {
  ...mockTextMessage,
  id: '4',
  type: 'image',
  content: '',
  filename: 'image.jpg'
};

const mockMessageWithReactions = {
  ...mockTextMessage,
  id: '5',
  reactions: [
    { type: '👍', count: 3, users: ['user1', 'user2', 'user3'] },
    { type: '😂', count: 1, users: ['user4'] }
  ]
};

describe('MessageBubble Component', () => {
  const defaultProps = {
    message: mockTextMessage,
    isOwn: false,
    chatType: 'group',
    currentUserId: 'currentUser',
    showSender: true,
    showTime: true,
    onReaction: jest.fn(),
    onReply: jest.fn(),
    onMessageAction: jest.fn(),
    onForward: jest.fn(),
    onDelete: jest.fn(),
    onInfo: jest.fn(),
    onReport: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders message content correctly', () => {
      render(
        <TestWrapper>
          <MessageBubble {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Hello, this is a test message!')).toBeInTheDocument();
    });

    it('renders timestamp when showTime is true', () => {
      render(
        <TestWrapper>
          <MessageBubble {...defaultProps} showTime={true} />
        </TestWrapper>
      );

      // Check for any time format (could be 12:00 PM or 2:00 PM depending on timezone)
      expect(screen.getByText(/\d{1,2}:\d{2} [AP]M/)).toBeInTheDocument();
    });

    it('does not render timestamp when showTime is false', () => {
      render(
        <TestWrapper>
          <MessageBubble {...defaultProps} showTime={false} />
        </TestWrapper>
      );

      expect(screen.queryByText(/\d{1,2}:\d{2} [AP]M/)).not.toBeInTheDocument();
    });

    it('renders sender name for group chats when showSender is true', () => {
      render(
        <TestWrapper>
          <MessageBubble 
            {...defaultProps} 
            message={mockGroupMessage}
            chatType="group"
            showSender={true}
            isOwn={false}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('does not render sender name for own messages', () => {
      render(
        <TestWrapper>
          <MessageBubble 
            {...defaultProps} 
            message={mockGroupMessage}
            chatType="group"
            showSender={true}
            isOwn={true}
          />
        </TestWrapper>
      );

      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    it('does not render sender name for private chats', () => {
      render(
        <TestWrapper>
          <MessageBubble 
            {...defaultProps} 
            message={mockGroupMessage}
            chatType="private"
            showSender={true}
            isOwn={false}
          />
        </TestWrapper>
      );

      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });

  describe('Message Types', () => {
    it('renders image message with icon', () => {
      render(
        <TestWrapper>
          <MessageBubble 
            {...defaultProps} 
            message={mockImageMessage}
          />
        </TestWrapper>
      );

      expect(screen.getByText('🖼️ Photo')).toBeInTheDocument();
    });

    it('renders audio message with icon', () => {
      const audioMessage = {
        ...mockTextMessage,
        type: 'audio',
        metadata: { duration: 30 }
      };

      render(
        <TestWrapper>
          <MessageBubble 
            {...defaultProps} 
            message={audioMessage}
          />
        </TestWrapper>
      );

      expect(screen.getByText('🎙️ Audio (30s)')).toBeInTheDocument();
    });

    it('renders document message with icon', () => {
      const docMessage = {
        ...mockTextMessage,
        type: 'document',
        filename: 'document.pdf'
      };

      render(
        <TestWrapper>
          <MessageBubble 
            {...defaultProps} 
            message={docMessage}
          />
        </TestWrapper>
      );

      expect(screen.getByText('📄 document.pdf')).toBeInTheDocument();
    });
  });

  describe('Reply Functionality', () => {
    it('renders reply preview when message is a reply', () => {
      render(
        <TestWrapper>
          <MessageBubble 
            {...defaultProps} 
            message={mockReplyMessage}
          />
        </TestWrapper>
      );

      expect(screen.getAllByText('John Doe')).toHaveLength(2); // One in reply, one as sender
      expect(screen.getByText('Original message content')).toBeInTheDocument();
      expect(screen.getByText('This is a reply')).toBeInTheDocument();
    });

    it('truncates long reply content', () => {
      const longReplyMessage = {
        ...mockReplyMessage,
        replyTo: {
          ...mockReplyMessage.replyTo,
          content: 'A'.repeat(150) // Long content that should be truncated
        }
      };

      render(
        <TestWrapper>
          <MessageBubble 
            {...defaultProps} 
            message={longReplyMessage}
          />
        </TestWrapper>
      );

      expect(screen.getByText(/A{100}\.\.\.$/)).toBeInTheDocument();
    });
  });

  describe('Reactions', () => {
    it('renders reactions when present', () => {
      render(
        <TestWrapper>
          <MessageBubble 
            {...defaultProps} 
            message={mockMessageWithReactions}
          />
        </TestWrapper>
      );

      expect(screen.getByText('👍')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('😂')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('calls onReaction when reaction is clicked', () => {
      const onReaction = jest.fn();
      
      render(
        <TestWrapper>
          <MessageBubble 
            {...defaultProps} 
            message={mockMessageWithReactions}
            onReaction={onReaction}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('👍').closest('div'));
      expect(onReaction).toHaveBeenCalledWith('5', '👍'); // Use correct message ID
    });
  });

  describe('Message Status', () => {
    it('renders sending status for own messages', () => {
      const sendingMessage = { ...mockTextMessage, status: 'sending' };
      
      render(
        <TestWrapper>
          <MessageBubble 
            {...defaultProps} 
            message={sendingMessage}
            isOwn={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('⏳')).toBeInTheDocument();
    });

    it('renders sent status for own messages', () => {
      const sentMessage = { ...mockTextMessage, status: 'sent' };
      
      render(
        <TestWrapper>
          <MessageBubble 
            {...defaultProps} 
            message={sentMessage}
            isOwn={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('renders delivered status for own messages', () => {
      const deliveredMessage = { ...mockTextMessage, status: 'delivered' };
      
      render(
        <TestWrapper>
          <MessageBubble 
            {...defaultProps} 
            message={deliveredMessage}
            isOwn={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('✓✓')).toBeInTheDocument();
    });

    it('renders read status for own messages', () => {
      const readMessage = { ...mockTextMessage, status: 'read' };
      
      render(
        <TestWrapper>
          <MessageBubble 
            {...defaultProps} 
            message={readMessage}
            isOwn={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('✓✓')).toBeInTheDocument();
    });

    it('renders failed status for own messages', () => {
      const failedMessage = { ...mockTextMessage, status: 'failed' };
      
      render(
        <TestWrapper>
          <MessageBubble 
            {...defaultProps} 
            message={failedMessage}
            isOwn={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('❌')).toBeInTheDocument();
    });

    it('does not render status for received messages', () => {
      render(
        <TestWrapper>
          <MessageBubble 
            {...defaultProps} 
            message={mockTextMessage}
            isOwn={false}
          />
        </TestWrapper>
      );

      expect(screen.queryByText('✓')).not.toBeInTheDocument();
      expect(screen.queryByText('✓✓')).not.toBeInTheDocument();
    });
  });

  describe('Context Menu', () => {
    it('shows menu button on hover', async () => {
      render(
        <TestWrapper>
          <MessageBubble {...defaultProps} />
        </TestWrapper>
      );

      const messageContainer = screen.getByText('Hello, this is a test message!').closest('div').parentElement;
      fireEvent.mouseEnter(messageContainer);

      await waitFor(() => {
        expect(screen.getByLabelText('Message options')).toBeInTheDocument();
      });
    });

    it('opens context menu when menu button is clicked', async () => {
      render(
        <TestWrapper>
          <MessageBubble {...defaultProps} />
        </TestWrapper>
      );

      const messageContainer = screen.getByText('Hello, this is a test message!').closest('div').parentElement;
      fireEvent.mouseEnter(messageContainer);

      const menuButton = await screen.findByLabelText('Message options');
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Reply')).toBeInTheDocument();
        expect(screen.getByText('Copy')).toBeInTheDocument();
        expect(screen.getByText('Forward')).toBeInTheDocument();
        expect(screen.getByText('React')).toBeInTheDocument();
      });
    });

    it('shows group-specific menu options', async () => {
      render(
        <TestWrapper>
          <MessageBubble 
            {...defaultProps} 
            chatType="group"
            isOwn={false}
          />
        </TestWrapper>
      );

      const messageContainer = screen.getByText('Hello, this is a test message!').closest('div').parentElement;
      fireEvent.mouseEnter(messageContainer);

      const menuButton = await screen.findByLabelText('Message options');
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Info')).toBeInTheDocument();
        expect(screen.getByText('Report Message')).toBeInTheDocument();
      });
    });

    it('shows delete options for own messages in private chat', async () => {
      render(
        <TestWrapper>
          <MessageBubble 
            {...defaultProps} 
            chatType="private"
            isOwn={true}
          />
        </TestWrapper>
      );

      const messageContainer = screen.getByText('Hello, this is a test message!').closest('div').parentElement;
      fireEvent.mouseEnter(messageContainer);

      const menuButton = await screen.findByLabelText('Message options');
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Delete for Me')).toBeInTheDocument();
        expect(screen.getByText('Delete for Everyone')).toBeInTheDocument();
      });
    });

    it('calls onReply when Reply is clicked', async () => {
      const onReply = jest.fn();
      
      render(
        <TestWrapper>
          <MessageBubble 
            {...defaultProps} 
            onReply={onReply}
          />
        </TestWrapper>
      );

      const messageContainer = screen.getByText('Hello, this is a test message!').closest('div').parentElement;
      fireEvent.mouseEnter(messageContainer);

      const menuButton = await screen.findByLabelText('Message options');
      fireEvent.click(menuButton);

      const replyOption = await screen.findByText('Reply');
      fireEvent.click(replyOption);

      expect(onReply).toHaveBeenCalledWith('1');
    });

    it('calls onForward when Forward is clicked', async () => {
      const onForward = jest.fn();
      
      render(
        <TestWrapper>
          <MessageBubble 
            {...defaultProps} 
            onForward={onForward}
          />
        </TestWrapper>
      );

      const messageContainer = screen.getByText('Hello, this is a test message!').closest('div').parentElement;
      fireEvent.mouseEnter(messageContainer);

      const menuButton = await screen.findByLabelText('Message options');
      fireEvent.click(menuButton);

      const forwardOption = await screen.findByText('Forward');
      fireEvent.click(forwardOption);

      expect(onForward).toHaveBeenCalledWith('1');
    });

    it('copies message content when Copy is clicked', async () => {
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn()
        }
      });

      render(
        <TestWrapper>
          <MessageBubble {...defaultProps} />
        </TestWrapper>
      );

      const messageContainer = screen.getByText('Hello, this is a test message!').closest('div').parentElement;
      fireEvent.mouseEnter(messageContainer);

      const menuButton = await screen.findByLabelText('Message options');
      fireEvent.click(menuButton);

      const copyOption = await screen.findByText('Copy');
      fireEvent.click(copyOption);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Hello, this is a test message!');
    });
  });

  describe('Styling and Layout', () => {
    it('applies correct alignment for own messages', () => {
      render(
        <TestWrapper>
          <MessageBubble 
            {...defaultProps} 
            isOwn={true}
          />
        </TestWrapper>
      );

      const messageContainer = screen.getByText('Hello, this is a test message!').closest('div').parentElement;
      expect(messageContainer).toHaveStyle('align-self: flex-end');
    });

    it('applies correct alignment for received messages', () => {
      render(
        <TestWrapper>
          <MessageBubble 
            {...defaultProps} 
            isOwn={false}
          />
        </TestWrapper>
      );

      const messageContainer = screen.getByText('Hello, this is a test message!').closest('div').parentElement;
      expect(messageContainer).toHaveStyle('align-self: flex-start');
    });

    it('applies custom className', () => {
      render(
        <TestWrapper>
          <MessageBubble 
            {...defaultProps} 
            className="custom-message-bubble"
          />
        </TestWrapper>
      );

      const messageContainer = screen.getByText('Hello, this is a test message!').closest('div').parentElement;
      expect(messageContainer).toHaveClass('custom-message-bubble');
    });
  });
});