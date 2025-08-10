/**
 * Basic test to verify ChatContext functionality
 * This test focuses on the core infrastructure we just implemented
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChatProvider, useChat } from '../ChatContext';
import { AuthProvider } from '../AuthContext';
import { SocketProvider } from '../SocketContext';

// Mock the API hook
jest.mock('../../hooks/useApi', () => ({
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

// Test component that uses the ChatContext
const TestComponent = () => {
  const { chats, isLoadingChats, selectedChatId } = useChat();
  
  return (
    <div>
      <div data-testid="chats-count">{chats.length}</div>
      <div data-testid="loading-state">{isLoadingChats ? 'loading' : 'loaded'}</div>
      <div data-testid="selected-chat">{selectedChatId || 'none'}</div>
    </div>
  );
};

const renderWithProviders = (component) => {
  return render(
    <AuthProvider>
      <SocketProvider>
        <ChatProvider>
          {component}
        </ChatProvider>
      </SocketProvider>
    </AuthProvider>
  );
};

describe('ChatContext', () => {
  test('provides initial state correctly', () => {
    renderWithProviders(<TestComponent />);
    
    // Check initial state
    expect(screen.getByTestId('chats-count')).toHaveTextContent('0');
    expect(screen.getByTestId('selected-chat')).toHaveTextContent('none');
  });

  test('context can be consumed without errors', () => {
    // This test just verifies that the context setup works
    expect(() => {
      renderWithProviders(<TestComponent />);
    }).not.toThrow();
  });
});