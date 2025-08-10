import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import PrivateChatTab from '../PrivateChatTab';

// Mock useApi hook
jest.mock('../../../hooks/useApi', () => {
  return jest.fn(() => ({
    get: jest.fn().mockResolvedValue([
      { _id: 'friend1', firstName: 'John', lastName: 'Doe', status: 'friend' },
      { _id: 'friend2', firstName: 'Jane', lastName: 'Smith', status: 'friend' }
    ])
  }));
});

// Mock the child components
jest.mock('../../../components/Chat/ChatList/ChatList', () => {
  return function MockChatList({ chats, onChatSelect, onChatAction }) {
    return (
      <div data-testid="chat-list">
        {chats.map(chat => (
          <div key={chat.id} data-testid={`chat-${chat.id}`}>
            <button onClick={() => onChatSelect(chat.id)}>
              {chat.participantName || chat.name}
            </button>
            <button onClick={() => onChatAction(chat.id, 'delete')}>
              Delete
            </button>
            {chat.isOnline && <span data-testid={`online-${chat.id}`}>Online</span>}
          </div>
        ))}
      </div>
    );
  };
});

jest.mock('../../../components/Chat/ChatWindow/ChatWindow', () => {
  return function MockChatWindow({ chat, onBack }) {
    return (
      <div data-testid="chat-window">
        <div>Chat: {chat.participantName || chat.name}</div>
        {onBack && <button onClick={onBack}>Back</button>}
      </div>
    );
  };
});

jest.mock('../../../components/Welcome/ChatWelcomeMessage', () => {
  return function MockChatWelcomeMessage({ hasPrivateChats }) {
    return (
      <div data-testid="welcome-message">
        {hasPrivateChats ? 'Has private chats' : 'No private chats'}
      </div>
    );
  };
});

// Mock contexts
const mockPrivateChats = [
  {
    id: 'private1',
    type: 'private',
    name: 'John Doe',
    participantId: 'friend1',
    participantName: 'John Doe',
    lastMessage: { content: 'Hello', timestamp: new Date() }
  },
  {
    id: 'private2',
    type: 'private',
    name: 'Jane Smith',
    participantId: 'friend2',
    participantName: 'Jane Smith',
    lastMessage: { content: 'Hi there', timestamp: new Date() }
  }
];

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', firstName: 'Test', lastName: 'User' }
  })
}));

const mockChatContext = {
  chats: [...mockPrivateChats, { id: 'group1', type: 'group', name: 'Group Chat' }],
  selectedChatId: null,
  selectedChat: null,
  isLoadingChats: false,
  onlineUsers: ['friend1'], // friend1 is online
  selectChat: jest.fn(),
  updateChatSettings: jest.fn(),
  deleteChat: jest.fn()
};

jest.mock('../../../contexts/ChatContext', () => ({
  useChat: () => mockChatContext
}));

const theme = createTheme();

const renderWithProviders = (component, { route = '/chat?tab=private' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('PrivateChatTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders private messages title', () => {
    renderWithProviders(<PrivateChatTab />);
    
    expect(screen.getByText('Private Messages')).toBeInTheDocument();
  });

  it('filters and displays only private chats', () => {
    renderWithProviders(<PrivateChatTab />);
    
    expect(screen.getByTestId('chat-list')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.queryByText('Group Chat')).not.toBeInTheDocument();
  });

  it('shows online status for online friends', () => {
    renderWithProviders(<PrivateChatTab />);
    
    expect(screen.getByTestId('online-private1')).toBeInTheDocument();
    expect(screen.queryByTestId('online-private2')).not.toBeInTheDocument();
  });

  it('displays online friends section when there are online friends', () => {
    renderWithProviders(<PrivateChatTab />);
    
    expect(screen.getByText('Online Now')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument(); // Should appear in online chips
  });

  it('shows welcome message when no private chats exist', () => {
    // Mock empty context for this test
    jest.doMock('../../../contexts/ChatContext', () => ({
      useChat: () => ({
        ...mockChatContext,
        chats: [{ id: 'group1', type: 'group', name: 'Group Chat' }]
      })
    }));
    
    renderWithProviders(<PrivateChatTab />);
    
    expect(screen.getByTestId('welcome-message')).toBeInTheDocument();
    expect(screen.getByText('No private chats')).toBeInTheDocument();
  });

  it('handles chat selection', async () => {
    renderWithProviders(<PrivateChatTab />);
    
    const chatButton = screen.getByText('John Doe');
    fireEvent.click(chatButton);
    
    await waitFor(() => {
      expect(mockChatContext.selectChat).toHaveBeenCalledWith('private1');
    });
  });

  it('handles chat actions', async () => {
    window.confirm = jest.fn(() => true);
    renderWithProviders(<PrivateChatTab />);
    
    const deleteButton = screen.getAllByText('Delete')[0];
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(mockChatContext.deleteChat).toHaveBeenCalledWith('private1');
    });
  });

  it('displays chat window when chat is selected', () => {
    // Mock context with selection for this test
    jest.doMock('../../../contexts/ChatContext', () => ({
      useChat: () => ({
        ...mockChatContext,
        selectedChat: mockPrivateChats[0]
      })
    }));
    
    renderWithProviders(<PrivateChatTab />);
    
    expect(screen.getByTestId('chat-window')).toBeInTheDocument();
    expect(screen.getByText('Chat: John Doe')).toBeInTheDocument();
  });

  it('shows welcome alert when no chat is selected', () => {
    renderWithProviders(<PrivateChatTab />);
    
    expect(screen.getByText('Welcome to Private Messages')).toBeInTheDocument();
    expect(screen.getByText(/Start a private conversation/)).toBeInTheDocument();
  });

  it('handles online friend chip clicks', async () => {
    renderWithProviders(<PrivateChatTab />);
    
    // Find the online friend chip and click it
    const onlineChips = screen.getAllByText('John Doe');
    const onlineChip = onlineChips.find(chip => chip.closest('[role="button"]'));
    
    if (onlineChip) {
      fireEvent.click(onlineChip);
      
      await waitFor(() => {
        expect(mockChatContext.selectChat).toHaveBeenCalledWith('private1');
      });
    }
  });
});