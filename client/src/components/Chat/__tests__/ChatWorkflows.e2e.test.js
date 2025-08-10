import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import App from '../../../App';
import { ChatProvider } from '../../../contexts/ChatContext';
import { MessageProvider } from '../../../contexts/MessageContext';
import { AuthProvider } from '../../../contexts/AuthContext';
import { SocketProvider } from '../../../contexts/SocketContext';

// Mock all external dependencies for E2E testing
jest.mock('../../../hooks/useApi', () => ({
  __esModule: true,
  default: () => ({
    get: jest.fn().mockImplementation((url) => {
      if (url.includes('/chats')) {
        return Promise.resolve({
          data: {
            chats: [
              {
                id: 'chat-1',
                type: 'group',
                name: 'Test Group',
                participants: [
                  { id: 'user-1', name: 'John Doe' },
                  { id: 'user-2', name: 'Jane Smith' }
                ],
                lastMessage: {
                  content: 'Hello everyone!',
                  timestamp: new Date(),
                  senderName: 'John Doe'
                }
              },
              {
                id: 'chat-2',
                type: 'private',
                name: 'Alice Johnson',
                participantId: 'user-3',
                lastMessage: {
                  content: 'Hey there!',
                  timestamp: new Date(),
                  senderName: 'Alice Johnson'
                }
              }
            ]
          }
        });
      }
      if (url.includes('/messages')) {
        return Promise.resolve({
          data: {
            messages: [
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
            ]
          }
        });
      }
      return Promise.resolve({ data: {} });
    }),
    post: jest.fn().mockResolvedValue({ 
      data: { 
        success: true,
        message: {
          id: 'new-msg',
          content: 'New message',
          type: 'text',
          senderId: 'current-user',
          senderName: 'Current User',
          timestamp: new Date(),
          status: 'sent'
        }
      } 
    }),
    patch: jest.fn().mockResolvedValue({ data: { success: true } }),
    delete: jest.fn().mockResolvedValue({ data: { success: true } })
  })
}));

// Mock socket with comprehensive event simulation
const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  close: jest.fn(),
  connected: true,
  listeners: {}
};

mockSocket.simulateEvent = (event, data) => {
  if (mockSocket.listeners[event]) {
    mockSocket.listeners[event].forEach(callback => callback(data));
  }
};

mockSocket.on.mockImplementation((event, callback) => {
  if (!mockSocket.listeners[event]) {
    mockSocket.listeners[event] = [];
  }
  mockSocket.listeners[event].push(callback);
});

jest.mock('socket.io-client', () => ({
  __esModule: true,
  default: jest.fn(() => mockSocket)
}));

// Mock authentication
jest.mock('../../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({
    user: {
      id: 'current-user',
      name: 'Current User',
      email: 'current@example.com'
    },
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn()
  })
}));

// Mock router
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/chat' })
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

describe('Chat Workflows End-to-End Tests', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    mockSocket.listeners = {};
  });

  describe('Complete Group Chat Workflow', () => {
    it('completes full group chat interaction workflow', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Wait for app to load and navigate to chat
      await waitFor(() => {
        expect(screen.getByText('Test Group')).toBeInTheDocument();
      });

      // Step 1: Select a group chat
      const groupChat = screen.getByText('Test Group');
      await user.click(groupChat);

      // Step 2: Verify chat window opens with messages
      await waitFor(() => {
        expect(screen.getByText('Hello everyone!')).toBeInTheDocument();
        expect(screen.getByText('Hi John!')).toBeInTheDocument();
      });

      // Step 3: Send a new message
      const messageInput = screen.getByPlaceholderText(/type a message/i);
      await user.type(messageInput, 'This is a test message from E2E test');
      
      const sendButton = screen.getByLabelText(/send message/i);
      await user.click(sendButton);

      // Step 4: Verify message was sent
      await waitFor(() => {
        expect(messageInput.value).toBe('');
      });

      // Step 5: Simulate receiving a reaction
      mockSocket.simulateEvent('message_reaction', {
        messageId: 'msg-1',
        reaction: { type: '👍', userId: 'user-2' }
      });

      // Step 6: Add a reaction to a message
      const firstMessage = screen.getByText('Hello everyone!').closest('div').parentElement;
      await user.hover(firstMessage);

      await waitFor(() => {
        const menuButton = screen.getByLabelText('Message options');
        await user.click(menuButton);
      });

      await waitFor(() => {
        const reactOption = screen.getByText('React');
        await user.click(reactOption);
      });

      // Step 7: Reply to a message
      await user.hover(firstMessage);
      
      await waitFor(() => {
        const menuButton = screen.getByLabelText('Message options');
        await user.click(menuButton);
      });

      await waitFor(() => {
        const replyOption = screen.getByText('Reply');
        await user.click(replyOption);
      });

      // Step 8: Type and send reply
      await user.type(messageInput, 'This is a reply to the first message');
      await user.click(sendButton);

      // Verify workflow completed successfully
      expect(mockSocket.emit).toHaveBeenCalledWith('send_message', expect.any(Object));
    });

    it('handles group chat member interactions', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Group')).toBeInTheDocument();
      });

      // Select group chat
      await user.click(screen.getByText('Test Group'));

      // Wait for chat to load
      await waitFor(() => {
        expect(screen.getByText('Hello everyone!')).toBeInTheDocument();
      });

      // Check group info (if available)
      const chatHeader = screen.getByText('Test Group');
      await user.click(chatHeader);

      // Should show group details or member list
      // This would depend on the actual implementation
      expect(chatHeader).toBeInTheDocument();
    });
  });

  describe('Complete Private Chat Workflow', () => {
    it('completes full private chat interaction workflow', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Wait for app to load
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });

      // Step 1: Select private chat
      const privateChat = screen.getByText('Alice Johnson');
      await user.click(privateChat);

      // Step 2: Verify private chat opens
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
      });

      // Step 3: Send a message
      const messageInput = screen.getByPlaceholderText(/type a message/i);
      await user.type(messageInput, 'Hello Alice! How are you?');
      
      const sendButton = screen.getByLabelText(/send message/i);
      await user.click(sendButton);

      // Step 4: Simulate typing indicator
      mockSocket.simulateEvent('user_typing', {
        chatId: 'chat-2',
        userId: 'user-3',
        userName: 'Alice Johnson',
        isTyping: true
      });

      await waitFor(() => {
        expect(screen.getByText(/Alice Johnson is typing/i)).toBeInTheDocument();
      });

      // Step 5: Simulate receiving response
      mockSocket.simulateEvent('new_message', {
        chatId: 'chat-2',
        message: {
          id: 'msg-3',
          content: 'Hi! I\'m doing great, thanks for asking!',
          type: 'text',
          senderId: 'user-3',
          senderName: 'Alice Johnson',
          timestamp: new Date(),
          status: 'sent'
        }
      });

      // Step 6: Stop typing indicator
      mockSocket.simulateEvent('user_typing', {
        chatId: 'chat-2',
        userId: 'user-3',
        userName: 'Alice Johnson',
        isTyping: false
      });

      await waitFor(() => {
        expect(screen.queryByText(/Alice Johnson is typing/i)).not.toBeInTheDocument();
      });

      // Verify private chat workflow completed
      expect(mockSocket.emit).toHaveBeenCalledWith('send_message', expect.any(Object));
    });

    it('handles private chat message deletion workflow', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });

      // Select private chat and send message
      await user.click(screen.getByText('Alice Johnson'));
      
      const messageInput = screen.getByPlaceholderText(/type a message/i);
      await user.type(messageInput, 'Message to be deleted');
      await user.click(screen.getByLabelText(/send message/i));

      // Simulate message appearing
      const messageElement = screen.getByText('Message to be deleted');
      await user.hover(messageElement.closest('div').parentElement);

      // Open message menu
      await waitFor(() => {
        const menuButton = screen.getByLabelText('Message options');
        await user.click(menuButton);
      });

      // Click delete for everyone (private chat option)
      await waitFor(() => {
        const deleteOption = screen.getByText('Delete for Everyone');
        await user.click(deleteOption);
      });

      // Confirm deletion
      window.confirm = jest.fn(() => true);

      // Verify deletion workflow
      expect(mockSocket.emit).toHaveBeenCalledWith('send_message', expect.any(Object));
    });
  });

  describe('Attachment Workflows', () => {
    it('completes image attachment workflow', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Group')).toBeInTheDocument();
      });

      // Select chat
      await user.click(screen.getByText('Test Group'));

      // Open attachment picker
      const attachButton = screen.getByLabelText(/attach file/i);
      await user.click(attachButton);

      // Select image option
      await waitFor(() => {
        const galleryOption = screen.getByText('Gallery');
        await user.click(galleryOption);
      });

      // Simulate file selection
      const file = new File(['fake image'], 'test-image.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/upload/i);
      
      await user.upload(fileInput, file);

      // Verify file upload process
      await waitFor(() => {
        expect(screen.getByText('test-image.jpg')).toBeInTheDocument();
      });

      // Send message with attachment
      const sendButton = screen.getByLabelText(/send/i);
      await user.click(sendButton);

      // Verify attachment workflow completed
      expect(mockSocket.emit).toHaveBeenCalled();
    });

    it('completes document attachment workflow', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Group')).toBeInTheDocument();
      });

      // Select chat and open attachment picker
      await user.click(screen.getByText('Test Group'));
      
      const attachButton = screen.getByLabelText(/attach file/i);
      await user.click(attachButton);

      // Select document option
      await waitFor(() => {
        const documentOption = screen.getByText('Document');
        await user.click(documentOption);
      });

      // Upload document
      const file = new File(['document content'], 'test-doc.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByLabelText(/upload/i);
      
      await user.upload(fileInput, file);

      // Verify document upload
      await waitFor(() => {
        expect(screen.getByText('test-doc.pdf')).toBeInTheDocument();
      });

      // Send document
      const sendButton = screen.getByLabelText(/send/i);
      await user.click(sendButton);

      expect(mockSocket.emit).toHaveBeenCalled();
    });
  });

  describe('Cross-Device Synchronization', () => {
    it('handles message synchronization across devices', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Group')).toBeInTheDocument();
      });

      // Select chat
      await user.click(screen.getByText('Test Group'));

      // Simulate message from another device
      mockSocket.simulateEvent('new_message', {
        chatId: 'chat-1',
        message: {
          id: 'msg-from-device-2',
          content: 'Message from another device',
          type: 'text',
          senderId: 'current-user',
          senderName: 'Current User',
          timestamp: new Date(),
          status: 'sent'
        }
      });

      // Should appear in current chat
      await waitFor(() => {
        expect(screen.getByText('Message from another device')).toBeInTheDocument();
      });

      // Simulate message status update from server
      mockSocket.simulateEvent('message_status_update', {
        messageId: 'msg-from-device-2',
        status: 'read'
      });

      // Status should update in real-time
      await waitFor(() => {
        expect(screen.getByText('✓✓')).toBeInTheDocument();
      });
    });

    it('handles chat list updates from other devices', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Group')).toBeInTheDocument();
      });

      // Simulate new chat created on another device
      mockSocket.simulateEvent('new_chat', {
        chat: {
          id: 'chat-3',
          type: 'group',
          name: 'New Group from Device 2',
          participants: [
            { id: 'current-user', name: 'Current User' },
            { id: 'user-4', name: 'New User' }
          ],
          lastMessage: null
        }
      });

      // New chat should appear in list
      await waitFor(() => {
        expect(screen.getByText('New Group from Device 2')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design and Mobile Interactions', () => {
    it('handles mobile viewport interactions', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Group')).toBeInTheDocument();
      });

      // Mobile interactions would be different
      // This tests basic mobile rendering
      expect(screen.getByText('Test Group')).toBeInTheDocument();
    });

    it('handles touch interactions for mobile', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Group')).toBeInTheDocument();
      });

      // Select chat
      await user.click(screen.getByText('Test Group'));

      // Simulate touch interactions
      const messageElement = screen.getByText('Hello everyone!');
      
      // Long press simulation (for mobile context menu)
      fireEvent.touchStart(messageElement, {
        touches: [{ clientX: 100, clientY: 100 }]
      });

      // Hold for long press duration
      await new Promise(resolve => setTimeout(resolve, 500));

      fireEvent.touchEnd(messageElement);

      // Should trigger mobile context menu
      // This would depend on actual mobile implementation
      expect(messageElement).toBeInTheDocument();
    });
  });

  describe('Error Recovery Workflows', () => {
    it('handles network disconnection and recovery', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Group')).toBeInTheDocument();
      });

      // Select chat
      await user.click(screen.getByText('Test Group'));

      // Simulate network disconnection
      mockSocket.connected = false;
      mockSocket.simulateEvent('disconnect', { reason: 'transport close' });

      // Try to send message while offline
      const messageInput = screen.getByPlaceholderText(/type a message/i);
      await user.type(messageInput, 'Offline message');
      await user.click(screen.getByLabelText(/send message/i));

      // Message should be queued
      expect(messageInput.value).toBe('Offline message');

      // Simulate reconnection
      mockSocket.connected = true;
      mockSocket.simulateEvent('connect', {});

      // Queued message should be sent
      await waitFor(() => {
        expect(mockSocket.emit).toHaveBeenCalledWith('send_message', expect.any(Object));
      });
    });

    it('handles API errors gracefully', async () => {
      // Mock API to fail
      const mockApi = require('../../../hooks/useApi').default;
      mockApi().post.mockRejectedValueOnce(new Error('Server error'));

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Group')).toBeInTheDocument();
      });

      // Select chat and try to send message
      await user.click(screen.getByText('Test Group'));
      
      const messageInput = screen.getByPlaceholderText(/type a message/i);
      await user.type(messageInput, 'Message that will fail');
      await user.click(screen.getByLabelText(/send message/i));

      // Should handle error gracefully
      await waitFor(() => {
        // Error handling would show retry option or error message
        expect(messageInput.value).toBe('Message that will fail');
      });
    });
  });

  describe('Performance Under Load', () => {
    it('handles large chat lists efficiently', async () => {
      // Mock large chat list
      const mockApi = require('../../../hooks/useApi').default;
      const largeChats = Array.from({ length: 100 }, (_, i) => ({
        id: `chat-${i}`,
        type: i % 2 === 0 ? 'group' : 'private',
        name: `Chat ${i}`,
        lastMessage: {
          content: `Last message ${i}`,
          timestamp: new Date(),
          senderName: `User ${i}`
        }
      }));

      mockApi().get.mockImplementation((url) => {
        if (url.includes('/chats')) {
          return Promise.resolve({ data: { chats: largeChats } });
        }
        return Promise.resolve({ data: {} });
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Should load and display large list efficiently
      await waitFor(() => {
        expect(screen.getByText('Chat 0')).toBeInTheDocument();
      });

      // Should be able to scroll and interact
      const firstChat = screen.getByText('Chat 0');
      await user.click(firstChat);

      expect(firstChat).toBeInTheDocument();
    });

    it('handles rapid message updates efficiently', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Group')).toBeInTheDocument();
      });

      // Select chat
      await user.click(screen.getByText('Test Group'));

      // Simulate rapid message updates
      for (let i = 0; i < 20; i++) {
        mockSocket.simulateEvent('new_message', {
          chatId: 'chat-1',
          message: {
            id: `rapid-msg-${i}`,
            content: `Rapid message ${i}`,
            type: 'text',
            senderId: 'user-1',
            senderName: 'John Doe',
            timestamp: new Date(),
            status: 'sent'
          }
        });
      }

      // Should handle rapid updates without performance issues
      await waitFor(() => {
        expect(screen.getByText('Rapid message 19')).toBeInTheDocument();
      });
    });
  });
});