import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import UnifiedChat from '../UnifiedChat';

// Mock the child components
jest.mock('../GroupChatTab', () => {
  return function MockGroupChatTab() {
    return <div data-testid="group-chat-tab">Group Chat Tab</div>;
  };
});

jest.mock('../PrivateChatTab', () => {
  return function MockPrivateChatTab() {
    return <div data-testid="private-chat-tab">Private Chat Tab</div>;
  };
});

// Mock the contexts
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', firstName: 'Test', lastName: 'User' },
    isAuthenticated: true
  })
}));

jest.mock('../../../contexts/ChatContext', () => ({
  useChat: () => ({
    chats: [],
    selectedChatId: null,
    selectedChat: null,
    isLoadingChats: false,
    error: null,
    loadChats: jest.fn(),
    selectChat: jest.fn(),
    clearError: jest.fn()
  })
}));

// Mock ErrorDisplay component
jest.mock('../../../components/Common/ErrorDisplay', () => {
  return function MockErrorDisplay() {
    return <div data-testid="error-display">Error Display</div>;
  };
});

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

describe('UnifiedChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the main header with Messages title', () => {
    renderWithProviders(<UnifiedChat />);
    
    expect(screen.getByText('Messages')).toBeInTheDocument();
  });

  it('renders both tab options', () => {
    renderWithProviders(<UnifiedChat />);
    
    expect(screen.getByText('Group Chats')).toBeInTheDocument();
    expect(screen.getByText('Private Messages')).toBeInTheDocument();
  });

  it('shows group chat tab by default', () => {
    renderWithProviders(<UnifiedChat />);
    
    expect(screen.getByTestId('group-chat-tab')).toBeInTheDocument();
    expect(screen.queryByTestId('private-chat-tab')).not.toBeInTheDocument();
  });

  it('switches to private chat tab when clicked', async () => {
    renderWithProviders(<UnifiedChat />);
    
    const privateTab = screen.getByText('Private Messages');
    fireEvent.click(privateTab);
    
    await waitFor(() => {
      expect(screen.getByTestId('private-chat-tab')).toBeInTheDocument();
      expect(screen.queryByTestId('group-chat-tab')).not.toBeInTheDocument();
    });
  });

  it('initializes with private tab when URL has tab=private', () => {
    renderWithProviders(<UnifiedChat />, { route: '/chat?tab=private' });
    
    expect(screen.getByTestId('private-chat-tab')).toBeInTheDocument();
    expect(screen.queryByTestId('group-chat-tab')).not.toBeInTheDocument();
  });

  it('renders create button with appropriate icon for group chats', () => {
    renderWithProviders(<UnifiedChat />);
    
    const createButton = screen.getByRole('button', { name: /create new group chat/i });
    expect(createButton).toBeInTheDocument();
  });

  it('renders create button with appropriate icon for private chats', async () => {
    renderWithProviders(<UnifiedChat />);
    
    const privateTab = screen.getByText('Private Messages');
    fireEvent.click(privateTab);
    
    await waitFor(() => {
      const createButton = screen.getByRole('button', { name: /start new private chat/i });
      expect(createButton).toBeInTheDocument();
    });
  });

  it('handles tab change and updates URL', async () => {
    const { container } = renderWithProviders(<UnifiedChat />);
    
    const privateTab = screen.getByText('Private Messages');
    fireEvent.click(privateTab);
    
    await waitFor(() => {
      expect(window.location.search).toContain('tab=private');
    });
  });
});