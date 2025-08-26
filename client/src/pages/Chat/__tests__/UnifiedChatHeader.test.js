import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import UnifiedChat from '../UnifiedChat';
import { AuthProvider } from '../../../contexts/AuthContext';
import { ChatProvider } from '../../../contexts/ChatContext';

// Mock the hooks and components
jest.mock('../../../hooks/useChat', () => ({
  useChat: () => ({
    error: null,
    clearError: jest.fn(),
    loadChats: jest.fn(),
    createGroupChat: jest.fn(),
    chats: [],
    isLoadingChats: false,
    selectedChatId: null,
    selectedChat: null,
    messages: [],
    selectChat: jest.fn(),
    loadMessages: jest.fn(),
    sendMessage: jest.fn()
  })
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user', firstName: 'Test', lastName: 'User' }
  }),
  AuthProvider: ({ children }) => <div>{children}</div>
}));

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

jest.mock('../../components/Chat/Common/CreateGroupChatModal', () => {
  return function MockCreateGroupChatModal({ open, onClose }) {
    return open ? (
      <div data-testid="create-group-modal">
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null;
  };
});

const theme = createTheme();

const renderUnifiedChat = (initialRoute = '/chat') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <ChatProvider>
            <UnifiedChat />
          </ChatProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe('UnifiedChat Header Interface', () => {
  test('displays unified header with Messages title and create button', () => {
    renderUnifiedChat();
    
    // Check header elements
    expect(screen.getByText('Messages')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create new group chat/i })).toBeInTheDocument();
  });

  test('shows group chat create button when on group tab', () => {
    renderUnifiedChat();
    
    // Should default to group tab
    const createButton = screen.getByRole('button', { name: /create new group chat/i });
    expect(createButton).toBeInTheDocument();
    
    // Button should have group icon (we can't easily test the icon, but we can test the tooltip)
    expect(screen.getByLabelText(/create new group chat/i)).toBeInTheDocument();
  });

  test('shows private chat create button when on private tab', async () => {
    renderUnifiedChat();
    
    // Click on private messages tab
    const privateTab = screen.getByRole('tab', { name: /private messages/i });
    fireEvent.click(privateTab);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /start new private chat/i })).toBeInTheDocument();
    });
  });

  test('opens create group modal when group create button is clicked', async () => {
    renderUnifiedChat();
    
    // Click create button on group tab
    const createButton = screen.getByRole('button', { name: /create new group chat/i });
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('create-group-modal')).toBeInTheDocument();
    });
  });

  test('has proper tab navigation with message type selector', () => {
    renderUnifiedChat();
    
    // Check both tabs are present
    expect(screen.getByRole('tab', { name: /group chats/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /private messages/i })).toBeInTheDocument();
    
    // Group tab should be selected by default
    expect(screen.getByRole('tab', { name: /group chats/i })).toHaveAttribute('aria-selected', 'true');
  });

  test('switches between tabs and updates create button accordingly', async () => {
    renderUnifiedChat();
    
    // Initially on group tab
    expect(screen.getByRole('button', { name: /create new group chat/i })).toBeInTheDocument();
    
    // Switch to private tab
    const privateTab = screen.getByRole('tab', { name: /private messages/i });
    fireEvent.click(privateTab);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /start new private chat/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /create new group chat/i })).not.toBeInTheDocument();
    });
    
    // Switch back to group tab
    const groupTab = screen.getByRole('tab', { name: /group chats/i });
    fireEvent.click(groupTab);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create new group chat/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /start new private chat/i })).not.toBeInTheDocument();
    });
  });

  test('consolidates all message creation controls in header', () => {
    renderUnifiedChat();
    
    // Should have exactly one create button in the header
    const createButtons = screen.getAllByRole('button').filter(button => 
      button.getAttribute('aria-label')?.includes('Create') || 
      button.getAttribute('aria-label')?.includes('Start')
    );
    
    expect(createButtons).toHaveLength(1);
    
    // The create button should be in the header area (we can check it's not in the tab content)
    const header = screen.getByText('Messages').closest('div');
    expect(header).toContainElement(createButtons[0]);
  });
});