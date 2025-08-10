import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MessagePreview from '../MessagePreview';
import { MESSAGE_TYPES } from '../../../../constants/chat';

// Mock chat utils
jest.mock('../../../../utils/chatUtils', () => ({
  truncateMessage: jest.fn((text, maxLength) => 
    text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  ),
  getMessagePreview: jest.fn((message) => {
    switch (message.type) {
      case MESSAGE_TYPES.IMAGE:
        return '🖼️ Photo';
      case MESSAGE_TYPES.AUDIO:
        return `🎙️ Audio${message.metadata?.duration ? ` (${message.metadata.duration}s)` : ''}`;
      case MESSAGE_TYPES.DOCUMENT:
        return `📄 ${message.filename || 'Document'}`;
      case MESSAGE_TYPES.LOCATION:
        return '📍 Location';
      case MESSAGE_TYPES.CONTACT:
        return '👤 Contact';
      default:
        return message.content;
    }
  }),
  highlightSearchTerm: jest.fn((text, searchTerm) => 
    text.replace(new RegExp(`(${searchTerm})`, 'gi'), '<mark>$1</mark>')
  )
}));

const theme = createTheme();

const TestWrapper = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

describe('MessagePreview Component', () => {
  const mockTextMessage = {
    id: '1',
    content: 'Hello, this is a test message!',
    type: MESSAGE_TYPES.TEXT,
    senderName: 'John Doe',
    timestamp: new Date('2024-01-01T12:00:00Z')
  };

  const mockImageMessage = {
    id: '2',
    content: '',
    type: MESSAGE_TYPES.IMAGE,
    senderName: 'Jane Smith',
    filename: 'image.jpg'
  };

  const mockAudioMessage = {
    id: '3',
    content: '',
    type: MESSAGE_TYPES.AUDIO,
    senderName: 'Bob Wilson',
    metadata: { duration: 30 }
  };

  const mockDocumentMessage = {
    id: '4',
    content: '',
    type: MESSAGE_TYPES.DOCUMENT,
    senderName: 'Alice Brown',
    filename: 'document.pdf'
  };

  const mockReplyMessage = {
    id: '5',
    content: 'This is a reply',
    type: MESSAGE_TYPES.TEXT,
    senderName: 'John Doe',
    replyTo: {
      messageId: '1',
      content: 'Original message content',
      senderName: 'Jane Smith',
      type: MESSAGE_TYPES.TEXT
    }
  };

  const mockMessageWithAttachments = {
    id: '6',
    content: 'Message with attachments',
    type: MESSAGE_TYPES.TEXT,
    senderName: 'John Doe',
    attachments: [
      { id: '1', type: 'image', filename: 'image1.jpg' },
      { id: '2', type: 'document', filename: 'doc.pdf' }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders text message preview correctly', () => {
      render(
        <TestWrapper>
          <MessagePreview message={mockTextMessage} />
        </TestWrapper>
      );

      expect(screen.getByText('Hello, this is a test message!')).toBeInTheDocument();
    });

    it('renders "No messages yet" when no message provided', () => {
      render(
        <TestWrapper>
          <MessagePreview message={null} />
        </TestWrapper>
      );

      expect(screen.getByText('No messages yet')).toBeInTheDocument();
    });

    it('renders image message with icon', () => {
      render(
        <TestWrapper>
          <MessagePreview message={mockImageMessage} />
        </TestWrapper>
      );

      expect(screen.getByText('🖼️ Photo')).toBeInTheDocument();
      expect(screen.getByTestId('ImageIcon')).toBeInTheDocument();
    });

    it('renders audio message with icon and duration', () => {
      render(
        <TestWrapper>
          <MessagePreview message={mockAudioMessage} />
        </TestWrapper>
      );

      expect(screen.getByText('🎙️ Audio (30s)')).toBeInTheDocument();
      expect(screen.getByTestId('AudioFileIcon')).toBeInTheDocument();
    });

    it('renders document message with icon and filename', () => {
      render(
        <TestWrapper>
          <MessagePreview message={mockDocumentMessage} />
        </TestWrapper>
      );

      expect(screen.getByText('📄 document.pdf')).toBeInTheDocument();
      expect(screen.getByTestId('DescriptionIcon')).toBeInTheDocument();
    });
  });

  describe('Sender Name Display', () => {
    it('shows sender name when showSender is true', () => {
      render(
        <TestWrapper>
          <MessagePreview 
            message={mockTextMessage} 
            showSender={true} 
          />
        </TestWrapper>
      );

      expect(screen.getByText('John Doe:')).toBeInTheDocument();
    });

    it('does not show sender name when showSender is false', () => {
      render(
        <TestWrapper>
          <MessagePreview 
            message={mockTextMessage} 
            showSender={false} 
          />
        </TestWrapper>
      );

      expect(screen.queryByText('John Doe:')).not.toBeInTheDocument();
    });

    it('does not show sender name for "You"', () => {
      const ownMessage = { ...mockTextMessage, senderName: 'You' };

      render(
        <TestWrapper>
          <MessagePreview 
            message={ownMessage} 
            showSender={true} 
          />
        </TestWrapper>
      );

      expect(screen.queryByText('You:')).not.toBeInTheDocument();
    });
  });

  describe('Reply Messages', () => {
    it('renders reply indicator and preview', () => {
      render(
        <TestWrapper>
          <MessagePreview message={mockReplyMessage} />
        </TestWrapper>
      );

      expect(screen.getByTestId('ReplyIcon')).toBeInTheDocument();
      expect(screen.getByText(/Replying to:/)).toBeInTheDocument();
      expect(screen.getByText('This is a reply')).toBeInTheDocument();
    });

    it('truncates long reply content', () => {
      const longReplyMessage = {
        ...mockReplyMessage,
        replyTo: {
          ...mockReplyMessage.replyTo,
          content: 'A'.repeat(50) // Long content
        }
      };

      render(
        <TestWrapper>
          <MessagePreview message={longReplyMessage} />
        </TestWrapper>
      );

      // Should show truncated reply content
      expect(screen.getByText(/Replying to:/)).toBeInTheDocument();
    });
  });

  describe('Message Truncation', () => {
    it('truncates long messages based on maxLength', () => {
      const longMessage = {
        ...mockTextMessage,
        content: 'A'.repeat(100) // Very long message
      };

      render(
        <TestWrapper>
          <MessagePreview 
            message={longMessage} 
            maxLength={20} 
          />
        </TestWrapper>
      );

      // Should be truncated with ellipsis
      expect(screen.getByText(/A{20}\.\.\.$/)).toBeInTheDocument();
    });

    it('does not truncate short messages', () => {
      render(
        <TestWrapper>
          <MessagePreview 
            message={mockTextMessage} 
            maxLength={100} 
          />
        </TestWrapper>
      );

      expect(screen.getByText('Hello, this is a test message!')).toBeInTheDocument();
    });
  });

  describe('Search Highlighting', () => {
    it('highlights search terms in message content', () => {
      render(
        <TestWrapper>
          <MessagePreview 
            message={mockTextMessage} 
            searchQuery="test" 
          />
        </TestWrapper>
      );

      // Should contain highlighted search term
      const messageElement = screen.getByText(/Hello, this is a/);
      expect(messageElement.innerHTML).toContain('<mark>test</mark>');
    });

    it('highlights search terms in sender name', () => {
      render(
        <TestWrapper>
          <MessagePreview 
            message={mockTextMessage} 
            showSender={true}
            searchQuery="John" 
          />
        </TestWrapper>
      );

      // Should highlight sender name
      const senderElement = screen.getByText(/:/);
      expect(senderElement.innerHTML).toContain('<mark>John</mark>');
    });
  });

  describe('Typing Indicator', () => {
    it('shows typing indicator for single user', () => {
      render(
        <TestWrapper>
          <MessagePreview 
            message={null}
            isTyping={true}
            typingUsers={[{ userId: '1', userName: 'John Doe' }]}
          />
        </TestWrapper>
      );

      expect(screen.getByText('John Doe is typing...')).toBeInTheDocument();
    });

    it('shows typing indicator for multiple users', () => {
      render(
        <TestWrapper>
          <MessagePreview 
            message={null}
            isTyping={true}
            typingUsers={[
              { userId: '1', userName: 'John Doe' },
              { userId: '2', userName: 'Jane Smith' }
            ]}
          />
        </TestWrapper>
      );

      expect(screen.getByText('2 people are typing...')).toBeInTheDocument();
    });

    it('shows animated dots for typing indicator', () => {
      render(
        <TestWrapper>
          <MessagePreview 
            message={null}
            isTyping={true}
            typingUsers={[{ userId: '1', userName: 'John Doe' }]}
          />
        </TestWrapper>
      );

      // Check for typing animation element
      const typingElement = screen.getByText('John Doe is typing...');
      expect(typingElement).toBeInTheDocument();
    });
  });

  describe('Attachment Indicators', () => {
    it('shows attachment count chip for messages with attachments', () => {
      render(
        <TestWrapper>
          <MessagePreview message={mockMessageWithAttachments} />
        </TestWrapper>
      );

      expect(screen.getByText('2 attachments')).toBeInTheDocument();
    });

    it('shows singular attachment label for single attachment', () => {
      const singleAttachmentMessage = {
        ...mockMessageWithAttachments,
        attachments: [{ id: '1', type: 'image', filename: 'image.jpg' }]
      };

      render(
        <TestWrapper>
          <MessagePreview message={singleAttachmentMessage} />
        </TestWrapper>
      );

      expect(screen.getByText('1 attachment')).toBeInTheDocument();
    });
  });

  describe('Message Types', () => {
    it('renders location message correctly', () => {
      const locationMessage = {
        id: '7',
        type: MESSAGE_TYPES.LOCATION,
        senderName: 'John Doe'
      };

      render(
        <TestWrapper>
          <MessagePreview message={locationMessage} />
        </TestWrapper>
      );

      expect(screen.getByText('📍 Location')).toBeInTheDocument();
      expect(screen.getByTestId('LocationOnIcon')).toBeInTheDocument();
    });

    it('renders contact message correctly', () => {
      const contactMessage = {
        id: '8',
        type: MESSAGE_TYPES.CONTACT,
        senderName: 'John Doe'
      };

      render(
        <TestWrapper>
          <MessagePreview message={contactMessage} />
        </TestWrapper>
      );

      expect(screen.getByText('👤 Contact')).toBeInTheDocument();
      expect(screen.getByTestId('ContactPhoneIcon')).toBeInTheDocument();
    });

    it('renders system message with special styling', () => {
      const systemMessage = {
        id: '9',
        type: MESSAGE_TYPES.SYSTEM,
        content: 'User joined the group',
        senderName: 'System'
      };

      render(
        <TestWrapper>
          <MessagePreview message={systemMessage} />
        </TestWrapper>
      );

      expect(screen.getByText('User joined the group')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles message without sender name', () => {
      const messageWithoutSender = {
        ...mockTextMessage,
        senderName: null
      };

      render(
        <TestWrapper>
          <MessagePreview 
            message={messageWithoutSender} 
            showSender={true} 
          />
        </TestWrapper>
      );

      expect(screen.getByText('Hello, this is a test message!')).toBeInTheDocument();
    });

    it('handles empty message content', () => {
      const emptyMessage = {
        ...mockTextMessage,
        content: ''
      };

      render(
        <TestWrapper>
          <MessagePreview message={emptyMessage} />
        </TestWrapper>
      );

      // Should still render something
      expect(screen.getByText('')).toBeInTheDocument();
    });

    it('handles message without attachments array', () => {
      const messageWithoutAttachments = {
        ...mockTextMessage,
        attachments: null
      };

      render(
        <TestWrapper>
          <MessagePreview message={messageWithoutAttachments} />
        </TestWrapper>
      );

      expect(screen.getByText('Hello, this is a test message!')).toBeInTheDocument();
      expect(screen.queryByText(/attachment/)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper text content for screen readers', () => {
      render(
        <TestWrapper>
          <MessagePreview message={mockTextMessage} />
        </TestWrapper>
      );

      const messageElement = screen.getByText('Hello, this is a test message!');
      expect(messageElement).toBeInTheDocument();
    });

    it('provides meaningful content for media messages', () => {
      render(
        <TestWrapper>
          <MessagePreview message={mockImageMessage} />
        </TestWrapper>
      );

      expect(screen.getByText('🖼️ Photo')).toBeInTheDocument();
    });
  });
});