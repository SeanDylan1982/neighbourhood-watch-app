import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import GroupChatTab from '../GroupChatTab';

// Mock the child components
jest.mock('../../../components/Chat/ChatList/ChatList', () => {
  return function MockChatList({ chats, onChatSelect, onChatAction }) {
    return (
      <div data-testid="chat-list">
        {chats.map(chat => (
          <div key={chat.id} data-testid={`chat-${chat.id}`}>
            <button onClick={() => onChatSelect(chat.id)}>
              {chat.name}
            </button>
            <button onClick={() => onChatAction(chat.id, 'delete')}>
              Delete
            </button>
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
        <div>Chat: {chat.name}</div>
        {onBack && <button onClick={onBack}>Back</button>}
      </div>
    );
  };
});

jest.mock('../../../components/Welcome/ChatWelcomeMessage', () => {
  return function MockChatWelcomeMessage({ hasGroupChats }) {
    return (
      <div data-testid="welcome-message">
        {hasGroupChats ? 'Has groups' : 'No groups'}
      </div>
    );
  };
});

// Mock the contexts
const mockGroupChats = [
  {
    id: 'group1',
    type: 'group',
    name: 'Test Group 1',
    memberCount: 5,
    lastMessage: { content: 'Hello', timestamp: new Date() }
  },
  {
    id: 'group2',
    type: 'group',
    name: 'Test Group 2',
    memberCount: 3,
    lastMessage: { content: 'Hi there', timestamp: new Date() }
  }
];

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', firstName: 'Test', lastName: 'User' }
  })
}));

const mockChatContext = {
  chats: [...mockGroupChats, { id: 'private1', type: 'private', name: 'Private Chat' }],
  selectedChatId: null,
  selectedChat: null,
  isLoadingChats: false,
  selectChat: jest.fn(),
  updateChatSettings: jest.fn(),
  deleteChat: jest.fn()
};

jest.mock('../../../contexts/ChatContext', () => ({
  useChat: () => mockChatContext
}));

const theme = createTheme();

const renderWithProviders = (component, { route = '/chat' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('GroupChatTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders group chats title', () => {
    renderWithProviders(<GroupChatTab />);
    
    expect(screen.getByText('Group Chats')).toBeInTheDocument();
  });

  it('filters and displays only group chats', () => {
    renderWithProviders(<GroupChatTab />);
    
    expect(screen.getByTestId('chat-list')).toBeInTheDocument();
    expect(screen.getByText('Test Group 1')).toBeInTheDocument();
    expect(screen.getByText('Test Group 2')).toBeInTheDocument();
    expect(screen.queryByText('Private Chat')).not.toBeInTheDocument();
  });

  it('shows welcome message when no group chats exist', () => {
    // Mock empty context for this test
    jest.doMock('../../../contexts/ChatContext', () => ({
      useChat: () => ({
        ...mockChatContext,
        chats: [{ id: 'private1', type: 'private', name: 'Private Chat' }]
      })
    }));
    
    renderWithProviders(<GroupChatTab />);
    
    expect(screen.getByTestId('welcome-message')).toBeInTheDocument();
    expect(screen.getByText('No groups')).toBeInTheDocument();
  });

  it('handles chat selection', async () => {
    renderWithProviders(<GroupChatTab />);
    
    const chatButton = screen.getByText('Test Group 1');
    fireEvent.click(chatButton);
    
    await waitFor(() => {
      expect(mockChatContext.selectChat).toHaveBeenCalledWith('group1');
    });
  });

  it('handles chat actions', async () => {
    window.confirm = jest.fn(() => true);
    renderWithProviders(<GroupChatTab />);
    
    const deleteButton = screen.getAllByText('Delete')[0];
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(mockChatContext.deleteChat).toHaveBeenCalledWith('group1');
    });
  });

  it('displays chat window when chat is selected', () => {
    // Mock context with selection for this test
    jest.doMock('../../../contexts/ChatContext', () => ({
      useChat: () => ({
        ...mockChatContext,
        selectedChat: mockGroupChats[0]
      })
    }));
    
    renderWithProviders(<GroupChatTab />);
    
    expect(screen.getByTestId('chat-window')).toBeInTheDocument();
    expect(screen.getByText('Chat: Test Group 1')).toBeInTheDocument();
  });

  it('shows welcome alert when no chat is selected', () => {
    renderWithProviders(<GroupChatTab />);
    
    expect(screen.getByText('Welcome to Group Chats')).toBeInTheDocument();
    expect(screen.getByText(/Select a group chat from the list/)).toBeInTheDocument();
  });
});