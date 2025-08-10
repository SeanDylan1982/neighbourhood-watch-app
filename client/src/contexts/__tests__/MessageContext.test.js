/**
 * Basic test to verify MessageContext functionality
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MessageProvider, useMessage } from '../MessageContext';
import { ChatProvider } from '../ChatContext';
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

// Test component that uses the MessageContext
const TestComponent = () => {
  const { messages, currentMessage, isSendingMessage } = useMessage();
  
  return (
    <div>
      <div data-testid="messages-count">{messages.length}</div>
      <div data-testid="current-message">{currentMessage}</div>
      <div data-testid="sending-state">{isSendingMessage ? 'sending' : 'idle'}</div>
    </div>
  );
};

const renderWithProviders = (component) => {
  return render(
    <AuthProvider>
      <SocketProvider>
        <ChatProvider>
          <MessageProvider>
            {component}
          </MessageProvider>
        </ChatProvider>
      </SocketProvider>
    </AuthProvider>
  );
};

describe('MessageContext', () => {
  test('provides initial state correctly', () => {
    renderWithProviders(<TestComponent />);
    
    // Check initial state
    expect(screen.getByTestId('messages-count')).toHaveTextContent('0');
    expect(screen.getByTestId('current-message')).toHaveTextContent('');
    expect(screen.getByTestId('sending-state')).toHaveTextContent('idle');
  });

  test('context can be consumed without errors', () => {
    // This test just verifies that the context setup works
    expect(() => {
      renderWithProviders(<TestComponent />);
    }).not.toThrow();
  });
});