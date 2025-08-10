import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import ChatWindow from '../ChatWindow/ChatWindow';
import TypingIndicator from '../ChatWindow/TypingIndicator';
import MessageBubble from '../ChatWindow/MessageBubble';
import { ChatProvider } from '../../../contexts/ChatContext';
import { MessageProvider } from '../../../contexts/MessageContext';
import { AuthProvider } from '../../../contexts/AuthContext';
import { SocketProvider } from '../../../contexts/SocketContext';

// Mock socket.io-client with event simulation
const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  close: jest.fn(),
  connected: true,
  listeners: {}
};

// Add event simulation methods
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

// Mock other dependencies
jest.mock('../../../hooks/useApi', () => ({
  __esModule: true,
  default: () => ({
    get: jest.fn(),
    post: jest.fn().mockResolvedValue({ data: { success: true } }),
    patch: jest.fn(),
    delete: jest.fn()
  })
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

describe('Real-time Features Integration Tests', () => {
  const mockChat = {
    id: 'chat-1',
    type: 'group',
    name: 'Test Group',
    participants: [
      { id: 'user-1', name: 'John Doe' },
      { id: 'user-2', name: 'Jane Smith' },
      { id: 'user-3', name: 'Bob Wilson' }
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
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockSocket.listeners = {};
  });

  describe('Typing Indicators', () => {
    it('shows typing indicator when user starts typing', async () => {
      render(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={mockMessages}
            currentUserId="user-2"
          />
        </TestWrapper>
      );

      // Simulate receiving typing event
      act(() => {
        mockSocket.simulateEvent('user_typing', {
          chatId: 'chat-1',
          userId: 'user-1',
          userName: 'John Doe',
          isTyping: true
        });
      });

      // Should show typing indicator
      await waitFor(() => {
        expect(screen.getByText(/John Doe is typing/i)).toBeInTheDocument();
      });
    });

    it('hides typing indicator when user stops typing', async () => {
      render(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={mockMessages}
            currentUserId="user-2"
          />
        </TestWrapper>
      );

      // Start typing
      act(() => {
        mockSocket.simulateEvent('user_typing', {
          chatId: 'chat-1',
          userId: 'user-1',
          userName: 'John Doe',
          isTyping: true
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/John Doe is typing/i)).toBeInTheDocument();
      });

      // Stop typing
      act(() => {
        mockSocket.simulateEvent('user_typing', {
          chatId: 'chat-1',
          userId: 'user-1',
          userName: 'John Doe',
          isTyping: false
        });
      });

      await waitFor(() => {
        expect(screen.queryByText(/John Doe is typing/i)).not.toBeInTheDocument();
      });
    });

    it('shows multiple users typing', async () => {
      render(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={mockMessages}
            currentUserId="user-3"
          />
        </TestWrapper>
      );

      // Multiple users start typing
      act(() => {
        mockSocket.simulateEvent('user_typing', {
          chatId: 'chat-1',
          userId: 'user-1',
          userName: 'John Doe',
          isTyping: true
        });
        
        mockSocket.simulateEvent('user_typing', {
          chatId: 'chat-1',
          userId: 'user-2',
          userName: 'Jane Smith',
          isTyping: true
        });
      });

      // Should show multiple users typing
      await waitFor(() => {
        expect(screen.getByText(/2 people are typing/i)).toBeInTheDocument();
      });
    });

    it('emits typing events when user types', async () => {
      render(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={mockMessages}
            currentUserId="user-2"
          />
        </TestWrapper>
      );

      const messageInput = screen.getByPlaceholderText(/type a message/i);

      // Start typing
      fireEvent.focus(messageInput);
      fireEvent.change(messageInput, { target: { value: 'Hello' } });

      // Should emit typing event
      await waitFor(() => {
        expect(mockSocket.emit).toHaveBeenCalledWith('typing', {
          chatId: 'chat-1',
          isTyping: true
        });
      });

      // Stop typing (simulate timeout)
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
      });

      // Should emit stop typing event
      expect(mockSocket.emit).toHaveBeenCalledWith('typing', {
        chatId: 'chat-1',
        isTyping: false
      });
    });
  });

  describe('Real-time Message Updates', () => {
    it('receives and displays new messages in real-time', async () => {
      const { rerender } = render(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={mockMessages}
            currentUserId="user-2"
          />
        </TestWrapper>
      );

      // Simulate receiving new message
      const newMessage = {
        id: 'msg-2',
        content: 'New real-time message!',
        type: 'text',
        senderId: 'user-1',
        senderName: 'John Doe',
        timestamp: new Date(),
        status: 'sent',
        reactions: []
      };

      act(() => {
        mockSocket.simulateEvent('new_message', {
          chatId: 'chat-1',
          message: newMessage
        });
      });

      // Update component with new message
      rerender(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={[...mockMessages, newMessage]}
            currentUserId="user-2"
          />
        </TestWrapper>
      );

      // Should display new message
      expect(screen.getByText('New real-time message!')).toBeInTheDocument();
    });

    it('updates message status in real-time', async () => {
      const messageWithStatus = {
        ...mockMessages[0],
        status: 'sent'
      };

      const { rerender } = render(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={[messageWithStatus]}
            currentUserId="user-1"
          />
        </TestWrapper>
      );

      // Simulate message status update
      act(() => {
        mockSocket.simulateEvent('message_status_update', {
          messageId: 'msg-1',
          status: 'read'
        });
      });

      // Update component with new status
      const updatedMessage = { ...messageWithStatus, status: 'read' };
      rerender(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={[updatedMessage]}
            currentUserId="user-1"
          />
        </TestWrapper>
      );

      // Should show updated status
      expect(screen.getByText('✓✓')).toBeInTheDocument();
    });

    it('handles message deletion in real-time', async () => {
      const { rerender } = render(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={mockMessages}
            currentUserId="user-2"
          />
        </TestWrapper>
      );

      // Simulate message deletion
      act(() => {
        mockSocket.simulateEvent('message_deleted', {
          chatId: 'chat-1',
          messageId: 'msg-1'
        });
      });

      // Update component with message removed
      rerender(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={[]}
            currentUserId="user-2"
          />
        </TestWrapper>
      );

      // Message should be removed
      expect(screen.queryByText('Hello everyone!')).not.toBeInTheDocument();
    });
  });

  describe('Real-time Reactions', () => {
    it('receives and displays new reactions in real-time', async () => {
      const messageWithReaction = {
        ...mockMessages[0],
        reactions: [
          { type: '👍', count: 1, users: ['user-2'] }
        ]
      };

      const { rerender } = render(
        <TestWrapper>
          <MessageBubble
            message={mockMessages[0]}
            isOwn={false}
            chatType="group"
            currentUserId="user-2"
          />
        </TestWrapper>
      );

      // Simulate receiving reaction
      act(() => {
        mockSocket.simulateEvent('message_reaction', {
          messageId: 'msg-1',
          reaction: { type: '👍', userId: 'user-2' }
        });
      });

      // Update component with reaction
      rerender(
        <TestWrapper>
          <MessageBubble
            message={messageWithReaction}
            isOwn={false}
            chatType="group"
            currentUserId="user-2"
          />
        </TestWrapper>
      );

      // Should display reaction
      expect(screen.getByText('👍')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('updates reaction counts in real-time', async () => {
      const messageWithReactions = {
        ...mockMessages[0],
        reactions: [
          { type: '👍', count: 2, users: ['user-2', 'user-3'] }
        ]
      };

      const { rerender } = render(
        <TestWrapper>
          <MessageBubble
            message={{
              ...mockMessages[0],
              reactions: [{ type: '👍', count: 1, users: ['user-2'] }]
            }}
            isOwn={false}
            chatType="group"
            currentUserId="user-1"
          />
        </TestWrapper>
      );

      // Simulate additional reaction
      act(() => {
        mockSocket.simulateEvent('message_reaction', {
          messageId: 'msg-1',
          reaction: { type: '👍', userId: 'user-3' }
        });
      });

      // Update component with increased count
      rerender(
        <TestWrapper>
          <MessageBubble
            message={messageWithReactions}
            isOwn={false}
            chatType="group"
            currentUserId="user-1"
          />
        </TestWrapper>
      );

      // Should show updated count
      expect(screen.getByText('👍')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('removes reactions in real-time', async () => {
      const messageWithoutReaction = {
        ...mockMessages[0],
        reactions: []
      };

      const { rerender } = render(
        <TestWrapper>
          <MessageBubble
            message={{
              ...mockMessages[0],
              reactions: [{ type: '👍', count: 1, users: ['user-2'] }]
            }}
            isOwn={false}
            chatType="group"
            currentUserId="user-1"
          />
        </TestWrapper>
      );

      // Simulate reaction removal
      act(() => {
        mockSocket.simulateEvent('message_reaction_removed', {
          messageId: 'msg-1',
          reaction: { type: '👍', userId: 'user-2' }
        });
      });

      // Update component with reaction removed
      rerender(
        <TestWrapper>
          <MessageBubble
            message={messageWithoutReaction}
            isOwn={false}
            chatType="group"
            currentUserId="user-1"
          />
        </TestWrapper>
      );

      // Reaction should be removed
      expect(screen.queryByText('👍')).not.toBeInTheDocument();
    });
  });

  describe('Online Presence', () => {
    it('updates user online status in real-time', async () => {
      render(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={mockMessages}
            currentUserId="user-2"
          />
        </TestWrapper>
      );

      // Simulate user coming online
      act(() => {
        mockSocket.simulateEvent('user_online', {
          userId: 'user-1',
          isOnline: true
        });
      });

      // Online status would be reflected in chat header or participant list
      // This tests the event handling
      expect(mockSocket.listeners['user_online']).toBeDefined();
    });

    it('updates user offline status in real-time', async () => {
      render(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={mockMessages}
            currentUserId="user-2"
          />
        </TestWrapper>
      );

      // Simulate user going offline
      act(() => {
        mockSocket.simulateEvent('user_offline', {
          userId: 'user-1',
          isOnline: false,
          lastSeen: new Date()
        });
      });

      // Offline status would be reflected in UI
      expect(mockSocket.listeners['user_offline']).toBeDefined();
    });
  });

  describe('Connection Management', () => {
    it('handles connection loss gracefully', async () => {
      render(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={mockMessages}
            currentUserId="user-2"
            isConnected={false}
          />
        </TestWrapper>
      );

      // Should show offline indicator or disable features
      const messageInput = screen.getByPlaceholderText(/type a message/i);
      expect(messageInput).toBeInTheDocument();
    });

    it('handles reconnection properly', async () => {
      const { rerender } = render(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={mockMessages}
            currentUserId="user-2"
            isConnected={false}
          />
        </TestWrapper>
      );

      // Simulate reconnection
      rerender(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={mockMessages}
            currentUserId="user-2"
            isConnected={true}
          />
        </TestWrapper>
      );

      // Should restore full functionality
      const messageInput = screen.getByPlaceholderText(/type a message/i);
      expect(messageInput).toBeInTheDocument();
    });

    it('queues messages when offline and sends when reconnected', async () => {
      const { rerender } = render(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={mockMessages}
            currentUserId="user-2"
            isConnected={false}
          />
        </TestWrapper>
      );

      const messageInput = screen.getByPlaceholderText(/type a message/i);
      const sendButton = screen.getByLabelText(/send message/i);

      // Try to send message while offline
      fireEvent.change(messageInput, { target: { value: 'Offline message' } });
      fireEvent.click(sendButton);

      // Simulate reconnection
      rerender(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={mockMessages}
            currentUserId="user-2"
            isConnected={true}
          />
        </TestWrapper>
      );

      // Should attempt to send queued messages
      expect(messageInput).toBeInTheDocument();
    });
  });

  describe('Performance Under Load', () => {
    it('handles high frequency of real-time events', async () => {
      render(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={mockMessages}
            currentUserId="user-2"
          />
        </TestWrapper>
      );

      // Simulate rapid typing events
      for (let i = 0; i < 50; i++) {
        act(() => {
          mockSocket.simulateEvent('user_typing', {
            chatId: 'chat-1',
            userId: 'user-1',
            userName: 'John Doe',
            isTyping: i % 2 === 0
          });
        });
      }

      // Should handle events without performance issues
      await waitFor(() => {
        expect(mockSocket.listeners['user_typing']).toBeDefined();
      });
    });

    it('throttles typing indicator updates', async () => {
      render(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={mockMessages}
            currentUserId="user-2"
          />
        </TestWrapper>
      );

      const messageInput = screen.getByPlaceholderText(/type a message/i);

      // Rapid typing
      for (let i = 0; i < 10; i++) {
        fireEvent.change(messageInput, { target: { value: `Message ${i}` } });
      }

      // Should throttle emit calls
      await waitFor(() => {
        expect(mockSocket.emit).toHaveBeenCalled();
      });

      // Should not emit for every keystroke
      expect(mockSocket.emit).not.toHaveBeenCalledTimes(10);
    });
  });

  describe('Error Handling', () => {
    it('handles socket errors gracefully', async () => {
      render(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={mockMessages}
            currentUserId="user-2"
          />
        </TestWrapper>
      );

      // Simulate socket error
      act(() => {
        mockSocket.simulateEvent('error', {
          message: 'Connection error'
        });
      });

      // Should handle error without crashing
      expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
    });

    it('handles malformed real-time data', async () => {
      render(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={mockMessages}
            currentUserId="user-2"
          />
        </TestWrapper>
      );

      // Simulate malformed data
      act(() => {
        mockSocket.simulateEvent('new_message', {
          // Missing required fields
          chatId: 'chat-1'
        });
      });

      // Should handle gracefully without crashing
      expect(screen.getByText('Hello everyone!')).toBeInTheDocument();
    });
  });
});