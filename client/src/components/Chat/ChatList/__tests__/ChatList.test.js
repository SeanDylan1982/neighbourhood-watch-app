/**
 * Basic test to verify ChatList functionality
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ChatList from '../ChatList';
import { ChatProvider } from '../../../../contexts/ChatContext';
import { MessageProvider } from '../../../../contexts/MessageContext';
import { AuthProvider } from '../../../../contexts/AuthContext';
import { SocketProvider } from '../../../../contexts/SocketContext';

// Mock the API hook
jest.mock('../../../../hooks/useApi', () => ({
  __esModule: true,
  default: () => ({
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn()
  })
}));

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    close: jest.fn()
  }))
}));

// Mock axios
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

const renderWithProviders = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <SocketProvider>
          <ChatProvider>
            <MessageProvider>
              {component}
            </MessageProvider>
          </ChatProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

describe('ChatList', () => {
  test('renders without crashing', () => {
    renderWithProviders(<ChatList />);
    expect(screen.getByPlaceholderText('Search chats...')).toBeInTheDocument();
  });

  test('shows empty state when no chats available', () => {
    renderWithProviders(<ChatList />);
    expect(screen.getByText(/No Private Messages/)).toBeInTheDocument();
  });

  test('search input works correctly', () => {
    renderWithProviders(<ChatList />);
    
    const searchInput = screen.getByPlaceholderText('Search chats...');
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    
    expect(searchInput.value).toBe('test search');
  });

  test('can be rendered without search bar', () => {
    renderWithProviders(<ChatList showSearch={false} />);
    expect(screen.queryByPlaceholderText('Search chats...')).not.toBeInTheDocument();
  });
});