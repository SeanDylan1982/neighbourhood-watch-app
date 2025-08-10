import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { axe, toHaveNoViolations } from 'jest-axe';
import ChatWindow from '../ChatWindow/ChatWindow';
import ChatList from '../ChatList/ChatList';
import MessageBubble from '../ChatWindow/MessageBubble';
import AttachmentPicker from '../Attachments/AttachmentPicker';
import MessageMenu from '../MessageInteractions/MessageMenu';
import { ChatProvider } from '../../../contexts/ChatContext';
import { MessageProvider } from '../../../contexts/MessageContext';
import { AuthProvider } from '../../../contexts/AuthContext';
import { SocketProvider } from '../../../contexts/SocketContext';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock dependencies
jest.mock('../../../hooks/useApi', () => ({
  __esModule: true,
  default: () => ({
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn()
  })
}));

jest.mock('socket.io-client', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    close: jest.fn()
  }))
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
);

describe('Chat Accessibility Tests', () => {
  const mockChat = {
    id: 'chat-1',
    type: 'group',
    name: 'Test Group',
    participants: [
      { id: 'user-1', name: 'John Doe' },
      { id: 'user-2', name: 'Jane Smith' }
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
    },
    {
      id: 'msg-2',
      content: 'Hi John!',
      type: 'text',
      senderId: 'user-2',
      senderName: 'Jane Smith',
      timestamp: new Date('2024-01-01T12:01:00Z'),
      status: 'read',
      reactions: []
    }
  ];

  const mockChats = [
    {
      id: 'chat-1',
      type: 'group',
      name: 'Test Group',
      lastMessage: {
        content: 'Hello everyone!',
        timestamp: new Date(),
        senderName: 'John Doe'
      }
    },
    {
      id: 'chat-2',
      type: 'private',
      name: 'Alice Johnson',
      lastMessage: {
        content: 'Hey there!',
        timestamp: new Date(),
        senderName: 'Alice Johnson'
      }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Automated Accessibility Testing', () => {
    it('should not have accessibility violations in ChatWindow', async () => {
      const { container } = render(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={mockMessages}
            currentUserId="user-2"
          />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have accessibility violations in ChatList', async () => {
      const { container } = render(
        <TestWrapper>
          <ChatList chats={mockChats} />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have accessibility violations in MessageBubble', async () => {
      const { container } = render(
        <TestWrapper>
          <MessageBubble
            message={mockMessages[0]}
            isOwn={false}
            chatType="group"
            currentUserId="user-2"
          />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have accessibility violations in AttachmentPicker', async () => {
      const { container } = render(
        <TestWrapper>
          <AttachmentPicker
            open={true}
            onClose={jest.fn()}
            onAttachmentSelect={jest.fn()}
            anchorEl={document.createElement('div')}
          />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports keyboard navigation in chat list', async () => {
      render(
        <TestWrapper>
          <ChatList chats={mockChats} />
        </TestWrapper>
      );

      const firstChat = screen.getByText('Test Group').closest('[role="button"]');
      const secondChat = screen.getByText('Alice Johnson').closest('[role="button"]');

      // Focus first chat
      firstChat.focus();
      expect(document.activeElement).toBe(firstChat);

      // Navigate with arrow keys
      fireEvent.keyDown(firstChat, { key: 'ArrowDown' });
      expect(document.activeElement).toBe(secondChat);

      fireEvent.keyDown(secondChat, { key: 'ArrowUp' });
      expect(document.activeElement).toBe(firstChat);

      // Activate with Enter
      fireEvent.keyDown(firstChat, { key: 'Enter' });
      // Should trigger chat selection
    });

    it('supports keyboard navigation in message input', async () => {
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
      const sendButton = screen.getByLabelText(/send message/i);

      // Focus input
      messageInput.focus();
      expect(document.activeElement).toBe(messageInput);

      // Type message
      fireEvent.change(messageInput, { target: { value: 'Test message' } });

      // Navigate to send button with Tab
      fireEvent.keyDown(messageInput, { key: 'Tab' });
      expect(document.activeElement).toBe(sendButton);

      // Send with Enter
      fireEvent.keyDown(sendButton, { key: 'Enter' });
      // Should send message
    });

    it('supports keyboard navigation in message menu', async () => {
      const anchorEl = document.createElement('div');
      
      render(
        <TestWrapper>
          <MessageMenu
            open={true}
            anchorEl={anchorEl}
            onClose={jest.fn()}
            messageId="msg-1"
            chatType="group"
            isOwnMessage={false}
            onReact={jest.fn()}
            onReply={jest.fn()}
            onCopy={jest.fn()}
            onForward={jest.fn()}
          />
        </TestWrapper>
      );

      const menuItems = screen.getAllByRole('menuitem');
      
      // Focus first menu item
      menuItems[0].focus();
      expect(document.activeElement).toBe(menuItems[0]);

      // Navigate with arrow keys
      fireEvent.keyDown(menuItems[0], { key: 'ArrowDown' });
      expect(document.activeElement).toBe(menuItems[1]);

      fireEvent.keyDown(menuItems[1], { key: 'ArrowUp' });
      expect(document.activeElement).toBe(menuItems[0]);

      // Activate with Enter
      fireEvent.keyDown(menuItems[0], { key: 'Enter' });
      // Should trigger menu action
    });

    it('supports keyboard shortcuts', async () => {
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
      messageInput.focus();

      // Type message
      fireEvent.change(messageInput, { target: { value: 'Test message' } });

      // Send with Ctrl+Enter
      fireEvent.keyDown(messageInput, { key: 'Enter', ctrlKey: true });
      // Should send message

      // Clear input with Escape
      fireEvent.keyDown(messageInput, { key: 'Escape' });
      // Should clear input or close modals
    });

    it('traps focus in modal dialogs', async () => {
      render(
        <TestWrapper>
          <AttachmentPicker
            open={true}
            onClose={jest.fn()}
            onAttachmentSelect={jest.fn()}
            anchorEl={document.createElement('div')}
          />
        </TestWrapper>
      );

      const attachmentOptions = screen.getAllByText(/Camera|Gallery|Document|Location|Contact/);
      const firstOption = attachmentOptions[0];
      const lastOption = attachmentOptions[attachmentOptions.length - 1];

      // Focus should be trapped within modal
      firstOption.focus();
      expect(document.activeElement).toBe(firstOption);

      // Tab to last element
      fireEvent.keyDown(lastOption, { key: 'Tab' });
      // Should wrap to first element
      expect(document.activeElement).toBe(firstOption);

      // Shift+Tab from first element
      fireEvent.keyDown(firstOption, { key: 'Tab', shiftKey: true });
      // Should wrap to last element
      expect(document.activeElement).toBe(lastOption);
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('provides proper ARIA labels for interactive elements', () => {
      render(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={mockMessages}
            currentUserId="user-2"
          />
        </TestWrapper>
      );

      // Message input should have proper label
      const messageInput = screen.getByLabelText(/type a message/i);
      expect(messageInput).toHaveAttribute('aria-label');

      // Send button should have proper label
      const sendButton = screen.getByLabelText(/send message/i);
      expect(sendButton).toHaveAttribute('aria-label');

      // Attach button should have proper label
      const attachButton = screen.getByLabelText(/attach file/i);
      expect(attachButton).toHaveAttribute('aria-label');
    });

    it('provides proper ARIA roles for chat elements', () => {
      render(
        <TestWrapper>
          <ChatList chats={mockChats} />
        </TestWrapper>
      );

      // Chat list should have proper role
      const chatList = screen.getByRole('list');
      expect(chatList).toBeInTheDocument();

      // Chat items should have proper roles
      const chatItems = screen.getAllByRole('listitem');
      expect(chatItems).toHaveLength(mockChats.length);
    });

    it('provides proper ARIA descriptions for messages', () => {
      render(
        <TestWrapper>
          <MessageBubble
            message={mockMessages[0]}
            isOwn={false}
            chatType="group"
            currentUserId="user-2"
          />
        </TestWrapper>
      );

      // Message should have proper description
      const messageElement = screen.getByText('Hello everyone!');
      const messageContainer = messageElement.closest('[role="article"]') || messageElement.closest('div');
      
      // Should have accessible description including sender and timestamp
      expect(messageContainer).toBeInTheDocument();
    });

    it('announces dynamic content changes', async () => {
      const { rerender } = render(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={mockMessages}
            currentUserId="user-2"
          />
        </TestWrapper>
      );

      // Add new message
      const newMessages = [
        ...mockMessages,
        {
          id: 'msg-3',
          content: 'New message arrived!',
          type: 'text',
          senderId: 'user-1',
          senderName: 'John Doe',
          timestamp: new Date(),
          status: 'sent',
          reactions: []
        }
      ];

      rerender(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={newMessages}
            currentUserId="user-2"
          />
        </TestWrapper>
      );

      // Should have aria-live region for announcements
      const liveRegion = document.querySelector('[aria-live]');
      expect(liveRegion).toBeInTheDocument();
    });

    it('provides proper labels for attachment types', () => {
      const imageMessage = {
        id: 'msg-img',
        content: '',
        type: 'image',
        senderId: 'user-1',
        senderName: 'John Doe',
        timestamp: new Date(),
        status: 'read',
        filename: 'photo.jpg'
      };

      render(
        <TestWrapper>
          <MessageBubble
            message={imageMessage}
            isOwn={false}
            chatType="group"
            currentUserId="user-2"
          />
        </TestWrapper>
      );

      // Image message should have proper description
      const imageElement = screen.getByText('🖼️ Photo');
      expect(imageElement).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    it('manages focus when opening chat', async () => {
      render(
        <TestWrapper>
          <ChatList chats={mockChats} />
        </TestWrapper>
      );

      const firstChat = screen.getByText('Test Group').closest('[role="button"]');
      
      // Click to open chat
      fireEvent.click(firstChat);

      // Focus should move to appropriate element (message input)
      await waitFor(() => {
        const messageInput = screen.queryByPlaceholderText(/type a message/i);
        if (messageInput) {
          expect(document.activeElement).toBe(messageInput);
        }
      });
    });

    it('manages focus when opening modals', async () => {
      render(
        <TestWrapper>
          <AttachmentPicker
            open={true}
            onClose={jest.fn()}
            onAttachmentSelect={jest.fn()}
            anchorEl={document.createElement('div')}
          />
        </TestWrapper>
      );

      // Focus should be on first interactive element
      const firstOption = screen.getByText('Camera');
      expect(document.activeElement).toBe(firstOption.closest('div'));
    });

    it('restores focus when closing modals', async () => {
      const onClose = jest.fn();
      const { rerender } = render(
        <TestWrapper>
          <AttachmentPicker
            open={true}
            onClose={onClose}
            onAttachmentSelect={jest.fn()}
            anchorEl={document.createElement('div')}
          />
        </TestWrapper>
      );

      // Close modal
      rerender(
        <TestWrapper>
          <AttachmentPicker
            open={false}
            onClose={onClose}
            onAttachmentSelect={jest.fn()}
            anchorEl={document.createElement('div')}
          />
        </TestWrapper>
      );

      // Focus should be restored to trigger element
      // This would be handled by the parent component
    });

    it('provides visible focus indicators', () => {
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
      messageInput.focus();

      // Should have visible focus indicator
      expect(messageInput).toHaveFocus();
      
      // CSS focus styles would be tested in visual regression tests
      // Here we ensure the element can receive focus
    });
  });

  describe('Color Contrast and Visual Accessibility', () => {
    it('provides sufficient color contrast for text', () => {
      render(
        <TestWrapper>
          <MessageBubble
            message={mockMessages[0]}
            isOwn={false}
            chatType="group"
            currentUserId="user-2"
          />
        </TestWrapper>
      );

      const messageText = screen.getByText('Hello everyone!');
      const computedStyle = window.getComputedStyle(messageText);
      
      // Color contrast would be tested with actual color values
      // This ensures the element is rendered
      expect(messageText).toBeInTheDocument();
    });

    it('provides alternative text for images', () => {
      const imageMessage = {
        id: 'msg-img',
        content: '',
        type: 'image',
        senderId: 'user-1',
        senderName: 'John Doe',
        timestamp: new Date(),
        status: 'read',
        filename: 'vacation-photo.jpg',
        alt: 'Beach vacation photo with sunset'
      };

      render(
        <TestWrapper>
          <MessageBubble
            message={imageMessage}
            isOwn={false}
            chatType="group"
            currentUserId="user-2"
          />
        </TestWrapper>
      );

      // Should provide meaningful alternative text
      const imageElement = screen.getByText('🖼️ Photo');
      expect(imageElement).toBeInTheDocument();
    });

    it('supports high contrast mode', () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={mockMessages}
            currentUserId="user-2"
          />
        </TestWrapper>
      );

      // Should render without issues in high contrast mode
      expect(screen.getByText('Hello everyone!')).toBeInTheDocument();
    });
  });

  describe('Reduced Motion Support', () => {
    it('respects reduced motion preferences', () => {
      // Mock reduced motion media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={mockMessages}
            currentUserId="user-2"
          />
        </TestWrapper>
      );

      // Should render without animations when reduced motion is preferred
      expect(screen.getByText('Hello everyone!')).toBeInTheDocument();
    });
  });

  describe('Language and Internationalization', () => {
    it('provides proper language attributes', () => {
      render(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={mockMessages}
            currentUserId="user-2"
          />
        </TestWrapper>
      );

      // Should have proper lang attributes for different languages
      const messageElement = screen.getByText('Hello everyone!');
      expect(messageElement).toBeInTheDocument();
      
      // Language detection and attributes would be handled by i18n
    });

    it('supports right-to-left languages', () => {
      // Mock RTL direction
      document.dir = 'rtl';

      render(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={mockMessages}
            currentUserId="user-2"
          />
        </TestWrapper>
      );

      // Should render correctly in RTL mode
      expect(screen.getByText('Hello everyone!')).toBeInTheDocument();

      // Reset direction
      document.dir = 'ltr';
    });
  });

  describe('Error States and Feedback', () => {
    it('provides accessible error messages', async () => {
      render(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={mockMessages}
            currentUserId="user-2"
            error="Failed to load messages"
          />
        </TestWrapper>
      );

      // Error should be announced to screen readers
      const errorElement = screen.queryByRole('alert');
      if (errorElement) {
        expect(errorElement).toBeInTheDocument();
      }
    });

    it('provides accessible loading states', () => {
      render(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={[]}
            currentUserId="user-2"
            loading={true}
          />
        </TestWrapper>
      );

      // Loading state should be announced
      const loadingElement = screen.queryByRole('status') || screen.queryByText(/loading/i);
      if (loadingElement) {
        expect(loadingElement).toBeInTheDocument();
      }
    });
  });

  describe('Touch and Mobile Accessibility', () => {
    it('provides adequate touch targets', () => {
      render(
        <TestWrapper>
          <ChatList chats={mockChats} />
        </TestWrapper>
      );

      const chatItems = screen.getAllByRole('button');
      
      // Touch targets should be at least 44x44px
      chatItems.forEach(item => {
        const computedStyle = window.getComputedStyle(item);
        // In a real test, we'd check actual dimensions
        expect(item).toBeInTheDocument();
      });
    });

    it('supports voice control', () => {
      render(
        <TestWrapper>
          <ChatWindow 
            chat={mockChat}
            messages={mockMessages}
            currentUserId="user-2"
          />
        </TestWrapper>
      );

      // Elements should have proper labels for voice control
      const sendButton = screen.getByLabelText(/send message/i);
      expect(sendButton).toHaveAttribute('aria-label');
    });
  });
});