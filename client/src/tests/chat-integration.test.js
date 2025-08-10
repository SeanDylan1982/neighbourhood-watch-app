import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { SocketProvider } from '../contexts/SocketContext';
import { AuthProvider } from '../contexts/AuthContext';
import Chat from '../pages/Chat/Chat';
import useApi from '../hooks/useApi';

// Mock the useApi hook
jest.mock('../hooks/useApi', () => ({
  __esModule: true,
  default: jest.fn()
}));

// Mock socket.io-client
jest.mock('socket.io-client', () => {
  const mockSocket = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn()
  };
  return jest.fn(() => mockSocket);
});

describe('Chat Component Integration Tests', () => {
  const mockChatGroups = [
    {
      _id: 'group1',
      name: 'General Chat',
      members: [{ userId: 'user1' }, { userId: 'user2' }],
      lastMessage: {
        content: 'Hello everyone',
        timestamp: new Date().toISOString()
      }
    },
    {
      _id: 'group2',
      name: 'Announcements',
      members: [{ userId: 'user1' }, { userId: 'user3' }],
      lastMessage: {
        content: 'Important announcement',
        timestamp: new Date().toISOString()
      }
    }
  ];

  const mockMessages = [
    {
      _id: 'msg1',
      senderId: { firstName: 'John', lastName: 'Doe' },
      content: 'Hello there',
      createdAt: new Date().toISOString()
    },
    {
      _id: 'msg2',
      senderId: { firstName: 'Jane', lastName: 'Smith' },
      content: 'Hi John',
      createdAt: new Date().toISOString()
    }
  ];

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementation for useApi
    useApi.mockImplementation(() => ({
      loading: false,
      error: null,
      clearError: jest.fn(),
      get: jest.fn().mockImplementation((url) => {
        if (url === '/api/chat/groups') {
          return Promise.resolve(mockChatGroups);
        } else if (url.includes('/api/chat/groups/') && url.includes('/messages')) {
          return Promise.resolve(mockMessages);
        }
        return Promise.resolve([]);
      }),
      post: jest.fn().mockImplementation(() => {
        return Promise.resolve({
          _id: 'new-msg-id',
          content: 'Test message',
          createdAt: new Date().toISOString()
        });
      })
    }));
  });

  const renderChatComponent = () => {
    return render(
      <MemoryRouter>
        <AuthProvider>
          <SocketProvider>
            <Chat />
          </SocketProvider>
        </AuthProvider>
      </MemoryRouter>
    );
  };

  test('should load and display chat groups', async () => {
    renderChatComponent();
    
    await waitFor(() => {
      expect(screen.getByText('General Chat')).toBeInTheDocument();
      expect(screen.getByText('Announcements')).toBeInTheDocument();
    });
  });

  test('should select a chat group and load messages', async () => {
    renderChatComponent();
    
    await waitFor(() => {
      expect(screen.getByText('General Chat')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('General Chat'));
    
    await waitFor(() => {
      expect(screen.getByText('Hello there')).toBeInTheDocument();
      expect(screen.getByText('Hi John')).toBeInTheDocument();
    });
  });

  test('should send a message with optimistic UI update', async () => {
    renderChatComponent();
    
    await waitFor(() => {
      expect(screen.getByText('General Chat')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('General Chat'));
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    });
    
    const messageInput = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(messageInput, { target: { value: 'Test message' } });
    fireEvent.click(screen.getByRole('button', { name: '' })); // Send button
    
    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
      expect(screen.getByText('sending')).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.getByText('sent')).toBeInTheDocument();
    });
  });

  test('should handle failed message send and retry', async () => {
    // Mock post to fail once then succeed
    let firstAttempt = true;
    useApi.mockImplementation(() => ({
      loading: false,
      error: null,
      clearError: jest.fn(),
      get: jest.fn().mockImplementation((url) => {
        if (url === '/api/chat/groups') {
          return Promise.resolve(mockChatGroups);
        } else if (url.includes('/api/chat/groups/') && url.includes('/messages')) {
          return Promise.resolve(mockMessages);
        }
        return Promise.resolve([]);
      }),
      post: jest.fn().mockImplementation(() => {
        if (firstAttempt) {
          firstAttempt = false;
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          _id: 'new-msg-id',
          content: 'Test message',
          createdAt: new Date().toISOString()
        });
      })
    }));
    
    renderChatComponent();
    
    await waitFor(() => {
      expect(screen.getByText('General Chat')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('General Chat'));
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    });
    
    const messageInput = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(messageInput, { target: { value: 'Test message' } });
    fireEvent.click(screen.getByRole('button', { name: '' })); // Send button
    
    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
      expect(screen.getByText('failed')).toBeInTheDocument();
    });
    
    // Find and click the retry button
    const retryButton = screen.getByRole('button', { name: 'Retry sending' });
    fireEvent.click(retryButton);
    
    await waitFor(() => {
      expect(screen.getByText('sent')).toBeInTheDocument();
    });
  });

  test('should show typing indicator when another user is typing', async () => {
    renderChatComponent();
    
    await waitFor(() => {
      expect(screen.getByText('General Chat')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('General Chat'));
    
    // Simulate receiving a typing event
    act(() => {
      const socketProvider = document.querySelector('[data-testid="socket-provider"]');
      const typingEvent = new CustomEvent('user_typing', {
        detail: {
          userId: 'user2',
          userName: 'Jane Smith',
          groupId: 'group1'
        }
      });
      socketProvider.dispatchEvent(typingEvent);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/is typing/)).toBeInTheDocument();
    });
  });
});