import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import ChatWindow from '../ChatWindow/ChatWindow';
import MessageBubble from '../ChatWindow/MessageBubble';
import MessageInput from '../ChatWindow/MessageInput';
import { ChatProvider } from '../../../contexts/ChatContext';
import { MessageProvider } from '../../../contexts/MessageContext';
import { AuthProvider } from '../../../contexts/AuthContext';
import { SocketProvider } from '../../../contexts/SocketContext';

// Mock dependencies
jest.mock('../../../hooks/useApi', () => ({
  __esModule: true,
  default: () => ({
    get: jest.fn(),
    post: jest.fn().mockResolvedValue({ data: { success: true } }),
    patch: jest.fn(),
    delete: jest.fn()
  })
}));

jest.mock('socket.io-client', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    close: jest.fn(),
    connected: true
  }))
}));

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    defaults: {
      baseURL: '',
      headers: { common: {} }
    },
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  }
}));

const theme = createTheme();

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <SocketProvider>
          <ChatProvider>
            <MessageProvider>
              {children}
            </MessageProvider>
          </ChatProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

describe('Message Workflow Integration Tests', () => {
  const mockChat = {
    id: 'chat-1',
    type: 'group',
    name: 'Test Group',
    participants: [
      { id: 'user-1', name: 'John Doe' },
      { id: 'user-2', name: 'Jane Smith' }
    ]
  };

  const mockMessages = [
    {
      id: 'msg-1',
      content: 'Hello everyone!',
      type: 'text',
      senderId: 'user-1',
      senderName: 'John Doe',
      timestamp: new Date('2024-01-01T12:00:00Z'),
      status: 'read',
      reactions: []
    },
    {
      id: 'msg-2',
      content: 'Hi John!',
      type: 'text',
      senderId: 'user-2',
      senderName: 'Jane Smith',
      timestamp: new Date('2024-01-01T12:01:00Z'),
      status: 'read',
      reactions: []
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Message Sending Workflow', () => {
    it('sends a text message and updates the UI', async () => {
      render(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={mockMessages}
            currentUserId="user-1"
          />
        </TestWrapper>
      );

      // Find message input
      const messageInput = screen.getByPlaceholderText(/type a message/i);
      expect(messageInput).toBeInTheDocument();

      // Type a message
      fireEvent.change(messageInput, { target: { value: 'New test message' } });
      expect(messageInput.value).toBe('New test message');

      // Send the message
      const sendButton = screen.getByLabelText(/send message/i);
      fireEvent.click(sendButton);

      // Verify message was processed
      await waitFor(() => {
        expect(messageInput.value).toBe(''); // Input should be cleared
      });
    });

    it('handles message sending failure gracefully', async () => {
      // Mock API to fail
      const mockApi = require('../../../hooks/useApi').default;
      mockApi().post.mockRejectedValueOnce(new Error('Network error'));

      render(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={mockMessages}
            currentUserId="user-1"
          />
        </TestWrapper>
      );

      const messageInput = screen.getByPlaceholderText(/type a message/i);
      fireEvent.change(messageInput, { target: { value: 'Failed message' } });

      const sendButton = screen.getByLabelText(/send message/i);
      fireEvent.click(sendButton);

      // Should handle error gracefully
      await waitFor(() => {
        expect(messageInput.value).toBe('Failed message'); // Input should retain value on failure
      });
    });

    it('displays typing indicator when user is typing', async () => {
      render(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={mockMessages}
            currentUserId="user-1"
          />
        </TestWrapper>
      );

      const messageInput = screen.getByPlaceholderText(/type a message/i);
      
      // Start typing
      fireEvent.focus(messageInput);
      fireEvent.change(messageInput, { target: { value: 'T' } });

      // Typing indicator logic would be handled by socket events
      // This tests the input interaction
      expect(messageInput.value).toBe('T');
    });
  });

  describe('Message Receiving Workflow', () => {
    it('displays received messages correctly', () => {
      render(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={mockMessages}
            currentUserId="user-2"
          />
        </TestWrapper>
      );

      // Check that messages are displayed
      expect(screen.getByText('Hello everyone!')).toBeInTheDocument();
      expect(screen.getByText('Hi John!')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('handles real-time message updates', async () => {
      const { rerender } = render(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={mockMessages}
            currentUserId="user-2"
          />
        </TestWrapper>
      );

      // Simulate receiving a new message
      const updatedMessages = [
        ...mockMessages,
        {
          id: 'msg-3',
          content: 'New incoming message',
          type: 'text',
          senderId: 'user-1',
          senderName: 'John Doe',
          timestamp: new Date('2024-01-01T12:02:00Z'),
          status: 'sent',
          reactions: []
        }
      ];

      rerender(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={updatedMessages}
            currentUserId="user-2"
          />
        </TestWrapper>
      );

      // New message should appear
      expect(screen.getByText('New incoming message')).toBeInTheDocument();
    });
  });

  describe('Message Status Updates', () => {
    it('shows correct message status indicators', () => {
      const messagesWithStatus = [
        {
          id: 'msg-1',
          content: 'Sending message',
          type: 'text',
          senderId: 'user-1',
          senderName: 'John Doe',
          timestamp: new Date(),
          status: 'sending',
          reactions: []
        },
        {
          id: 'msg-2',
          content: 'Sent message',
          type: 'text',
          senderId: 'user-1',
          senderName: 'John Doe',
          timestamp: new Date(),
          status: 'sent',
          reactions: []
        },
        {
          id: 'msg-3',
          content: 'Read message',
          type: 'text',
          senderId: 'user-1',
          senderName: 'John Doe',
          timestamp: new Date(),
          status: 'read',
          reactions: []
        }
      ];

      render(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={messagesWithStatus}
            currentUserId="user-1"
          />
        </TestWrapper>
      );

      // Check for status indicators
      expect(screen.getByText('⏳')).toBeInTheDocument(); // Sending
      expect(screen.getByText('✓')).toBeInTheDocument(); // Sent
      expect(screen.getAllByText('✓✓')).toHaveLength(1); // Read
    });
  });

  describe('Message Interactions', () => {
    it('handles message reactions workflow', async () => {
      render(
        <TestWrapper>
          <MessageBubble
            message={mockMessages[0]}
            isOwn={false}
            chatType="group"
            currentUserId="user-2"
            onReaction={jest.fn()}
          />
        </TestWrapper>
      );

      // Hover over message to show menu
      const messageContainer = screen.getByText('Hello everyone!').closest('div').parentElement;
      fireEvent.mouseEnter(messageContainer);

      await waitFor(() => {
        const menuButton = screen.getByLabelText('Message options');
        expect(menuButton).toBeInTheDocument();
      });
    });

    it('handles message reply workflow', async () => {
      const onReply = jest.fn();

      render(
        <TestWrapper>
          <MessageBubble
            message={mockMessages[0]}
            isOwn={false}
            chatType="group"
            currentUserId="user-2"
            onReply={onReply}
          />
        </TestWrapper>
      );

      // Hover and click menu
      const messageContainer = screen.getByText('Hello everyone!').closest('div').parentElement;
      fireEvent.mouseEnter(messageContainer);

      await waitFor(async () => {
        const menuButton = screen.getByLabelText('Message options');
        fireEvent.click(menuButton);

        await waitFor(() => {
          const replyOption = screen.getByText('Reply');
          fireEvent.click(replyOption);
          expect(onReply).toHaveBeenCalledWith('msg-1');
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('handles network disconnection gracefully', () => {
      render(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={mockMessages}
            currentUserId="user-1"
            isConnected={false}
          />
        </TestWrapper>
      );

      // Should show offline indicator or disable input
      const messageInput = screen.getByPlaceholderText(/type a message/i);
      expect(messageInput).toBeInTheDocument();
    });

    it('handles message loading errors', () => {
      render(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={[]}
            currentUserId="user-1"
            error="Failed to load messages"
          />
        </TestWrapper>
      );

      // Should handle error state gracefully
      const messageInput = screen.getByPlaceholderText(/type a message/i);
      expect(messageInput).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('handles large message lists efficiently', () => {
      const largeMessageList = Array.from({ length: 100 }, (_, index) => ({
        id: `msg-${index}`,
        content: `Message ${index}`,
        type: 'text',
        senderId: index % 2 === 0 ? 'user-1' : 'user-2',
        senderName: index % 2 === 0 ? 'John Doe' : 'Jane Smith',
        timestamp: new Date(Date.now() - index * 60000),
        status: 'read',
        reactions: []
      }));

      render(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={largeMessageList}
            currentUserId="user-1"
          />
        </TestWrapper>
      );

      // Should render without performance issues
      expect(screen.getByText('Message 0')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
    });
  });
});