import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { SocketProvider } from '../contexts/SocketContext';
import PrivateChatList from '../components/PrivateChat/PrivateChatList';
import PrivateMessageThread from '../components/PrivateChat/PrivateMessageThread';
import MessageComposer from '../components/PrivateChat/MessageComposer';
import MessageStatus from '../components/PrivateChat/MessageStatus';
import PrivateChat from '../pages/PrivateChat/PrivateChat';

// Mock the API hook
jest.mock('../hooks/useApi', () => ({
  __esModule: true,
  default: () => ({
    loading: false,
    error: null,
    clearError: jest.fn(),
    get: jest.fn().mockImplementation((url) => {
      if (url === '/api/privateChat') {
        return Promise.resolve([
          {
            _id: 'chat1',
            otherParticipant: {
              _id: 'user1',
              firstName: 'John',
              lastName: 'Doe',
              profileImageUrl: null,
              status: 'online'
            },
            lastMessage: {
              content: 'Hello there!',
              sender: 'user1',
              timestamp: new Date().toISOString()
            },
            unreadCount: 2,
            updatedAt: new Date().toISOString()
          },
          {
            _id: 'chat2',
            otherParticipant: {
              _id: 'user2',
              firstName: 'Jane',
              lastName: 'Smith',
              profileImageUrl: null,
              status: 'offline'
            },
            lastMessage: {
              content: 'How are you?',
              sender: 'user2',
              timestamp: new Date().toISOString()
            },
            unreadCount: 0,
            updatedAt: new Date().toISOString()
          }
        ]);
      } else if (url.includes('/api/privateChat/chat1/messages')) {
        return Promise.resolve([
          {
            _id: 'msg1',
            senderId: {
              _id: 'user1',
              firstName: 'John',
              lastName: 'Doe',
              profileImageUrl: null
            },
            content: 'Hello there!',
            createdAt: new Date().toISOString(),
            status: 'read'
          },
          {
            _id: 'msg2',
            senderId: {
              _id: 'currentUser',
              firstName: 'Current',
              lastName: 'User',
              profileImageUrl: null
            },
            content: 'Hi John!',
            createdAt: new Date().toISOString(),
            status: 'read'
          }
        ]);
      }
      return Promise.resolve([]);
    }),
    post: jest.fn().mockImplementation(() => {
      return Promise.resolve({
        _id: 'newMsg',
        senderId: {
          _id: 'currentUser',
          firstName: 'Current',
          lastName: 'User',
          profileImageUrl: null
        },
        content: 'Test message',
        createdAt: new Date().toISOString(),
        status: 'sent'
      });
    })
  })
}));

// Mock the auth context
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      _id: 'currentUser',
      firstName: 'Current',
      lastName: 'User',
      profileImageUrl: null
    },
    token: 'mock-token',
    isAuthenticated: true
  }),
  AuthProvider: ({ children }) => <div>{children}</div>
}));

// Mock the socket context
jest.mock('../contexts/SocketContext', () => ({
  useSocket: () => ({
    socket: {
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn()
    },
    onlineUsers: []
  }),
  SocketProvider: ({ children }) => <div>{children}</div>
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ chatId: 'chat1' }),
  useNavigate: () => jest.fn()
}));

describe('PrivateChatList Component', () => {
  test('renders chat list correctly', async () => {
    const onSelectChat = jest.fn();
    
    render(<PrivateChatList onSelectChat={onSelectChat} selectedChatId="chat1" />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Hello there!')).toBeInTheDocument();
      expect(screen.getByText('How are you?')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Jane Smith'));
    expect(onSelectChat).toHaveBeenCalledWith('chat2');
  });
});

describe('MessageStatus Component', () => {
  test('renders different message statuses correctly', () => {
    const { rerender } = render(
      <MessageStatus status="sending" timestamp={new Date().toISOString()} />
    );
    expect(screen.getByTitle('Sending')).toBeInTheDocument();
    
    rerender(<MessageStatus status="sent" timestamp={new Date().toISOString()} />);
    expect(screen.getByTitle('Sent')).toBeInTheDocument();
    
    rerender(<MessageStatus status="delivered" timestamp={new Date().toISOString()} />);
    expect(screen.getByTitle('Delivered')).toBeInTheDocument();
    
    rerender(<MessageStatus status="read" timestamp={new Date().toISOString()} />);
    expect(screen.getByTitle('Read')).toBeInTheDocument();
  });
});

describe('MessageComposer Component', () => {
  test('sends message when button is clicked', async () => {
    const onSendMessage = jest.fn();
    const onTypingStart = jest.fn();
    const onTypingStop = jest.fn();
    
    render(
      <MessageComposer 
        onSendMessage={onSendMessage} 
        disabled={false}
        onTypingStart={onTypingStart}
        onTypingStop={onTypingStop}
      />
    );
    
    const input = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(input, { target: { value: 'Test message' } });
    
    // Should trigger typing start
    await waitFor(() => {
      expect(onTypingStart).toHaveBeenCalled();
    });
    
    const sendButton = screen.getByRole('button', { name: '' });
    fireEvent.click(sendButton);
    
    expect(onSendMessage).toHaveBeenCalledWith('Test message');
    expect(input.value).toBe('');
  });
});

describe('PrivateMessageThread Component', () => {
  test('renders messages correctly', () => {
    const messages = [
      {
        _id: 'msg1',
        senderId: {
          _id: 'user1',
          firstName: 'John',
          lastName: 'Doe',
          profileImageUrl: null
        },
        content: 'Hello there!',
        createdAt: new Date().toISOString(),
        status: 'read'
      },
      {
        _id: 'msg2',
        senderId: {
          _id: 'currentUser',
          firstName: 'Current',
          lastName: 'User',
          profileImageUrl: null
        },
        content: 'Hi John!',
        createdAt: new Date().toISOString(),
        status: 'read'
      }
    ];
    
    const otherUser = {
      _id: 'user1',
      firstName: 'John',
      lastName: 'Doe',
      profileImageUrl: null
    };
    
    render(
      <PrivateMessageThread 
        messages={messages} 
        loading={false} 
        error={null}
        otherUser={otherUser}
      />
    );
    
    expect(screen.getByText('Hello there!')).toBeInTheDocument();
    expect(screen.getByText('Hi John!')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
  });
  
  test('shows empty state when no messages', () => {
    render(
      <PrivateMessageThread 
        messages={[]} 
        loading={false} 
        error={null}
        otherUser={null}
      />
    );
    
    expect(screen.getByText('No messages yet')).toBeInTheDocument();
    expect(screen.getByText('Send a message to start the conversation')).toBeInTheDocument();
  });
});

describe('PrivateChat Page', () => {
  test('renders private chat page correctly', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <PrivateChat />
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Private Messages')).toBeInTheDocument();
      expect(screen.getByText('Conversations')).toBeInTheDocument();
    });
  });
});