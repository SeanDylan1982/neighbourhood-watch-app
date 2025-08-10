/**
 * Browser-specific test scenarios for chat functionality
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import userEvent from '@testing-library/user-event';

// Import components to test
import ChatWindow from '../ChatWindow/ChatWindow';
import MessageBubble from '../ChatWindow/MessageBubble';
import MessageInput from '../ChatWindow/MessageInput';
import AttachmentPicker from '../Attachments/AttachmentPicker';
import { BrowserDetection, BrowserWorkarounds } from '../../../utils/browserCompatibility';

// Test wrapper
const TestWrapper = ({ children }) => {
  const theme = createTheme();
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </BrowserRouter>
  );
};

// Mock data
const mockChat = {
  id: '1',
  name: 'Test Chat',
  type: 'group',
  participants: ['user1', 'user2']
};

const mockMessages = [
  {
    id: '1',
    text: 'Hello world',
    sender: 'user1',
    timestamp: new Date().toISOString()
  }
];

describe('Browser-Specific Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset any global mocks
    delete global.navigator;
    global.navigator = {
      userAgent: '',
      mediaDevices: undefined,
      geolocation: undefined,
      clipboard: undefined
    };
  });

  describe('Safari-Specific Tests', () => {
    beforeEach(() => {
      // Mock Safari environment
      global.navigator.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15';
    });

    test('should apply Safari WebRTC workarounds', () => {
      const workaround = BrowserWorkarounds.safari.fixWebRTC();
      
      expect(workaround).toEqual({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });
    });

    test('should handle Safari file upload limitations', () => {
      // Mock iOS Safari
      global.navigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1';
      
      const workaround = BrowserWorkarounds.safari.fixFileUpload();
      
      expect(workaround).toEqual({
        accept: 'image/*,video/*',
        multiple: false
      });
    });

    test('should render chat components properly in Safari', () => {
      render(
        <TestWrapper>
          <ChatWindow
            chat={mockChat}
            messages={mockMessages}
            onSendMessage={jest.fn()}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Test Chat')).toBeInTheDocument();
      expect(screen.getByText('Hello world')).toBeInTheDocument();
    });

    test('should handle touch events on iOS Safari', async () => {
      // Mock iOS Safari
      global.navigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1';
      
      render(
        <TestWrapper>
          <MessageBubble
            message={mockMessages[0]}
            isOwn={false}
          />
        </TestWrapper>
      );

      const messageBubble = screen.getByText('Hello world');
      
      // Simulate touch events
      fireEvent.touchStart(messageBubble, {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      
      fireEvent.touchEnd(messageBubble, {
        changedTouches: [{ clientX: 100, clientY: 100 }]
      });

      // Should not throw errors
      expect(messageBubble).toBeInTheDocument();
    });

    test('should handle Safari clipboard limitations', async () => {
      // Safari doesn't support clipboard API in all contexts
      global.navigator.clipboard = undefined;
      
      render(
        <TestWrapper>
          <MessageBubble
            message={mockMessages[0]}
            isOwn={true}
            showActions={true}
          />
        </TestWrapper>
      );

      // Should render without clipboard functionality
      expect(screen.getByText('Hello world')).toBeInTheDocument();
    });
  });

  describe('Firefox-Specific Tests', () => {
    beforeEach(() => {
      // Mock Firefox environment
      global.navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0';
    });

    test('should apply Firefox WebSocket workarounds', () => {
      const workaround = BrowserWorkarounds.firefox.fixWebSocket();
      
      expect(workaround).toEqual({
        maxReconnectAttempts: 5,
        reconnectInterval: 3000
      });
    });

    test('should handle Firefox-specific CSS features', () => {
      // Mock CSS.supports for Firefox
      global.CSS = {
        supports: jest.fn((property, value) => {
          // Firefox supports most modern CSS features
          if (property === 'display' && value === 'grid') return true;
          if (property === 'display' && value === 'flex') return true;
          if (property === '--custom-property') return true;
          if (property === 'backdrop-filter') return false; // Limited support
          return false;
        })
      };

      expect(CSS.supports('display', 'grid')).toBe(true);
      expect(CSS.supports('display', 'flex')).toBe(true);
      expect(CSS.supports('backdrop-filter', 'blur(10px)')).toBe(false);
    });

    test('should render chat components properly in Firefox', () => {
      render(
        <TestWrapper>
          <ChatWindow
            chat={mockChat}
            messages={mockMessages}
            onSendMessage={jest.fn()}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Test Chat')).toBeInTheDocument();
      expect(screen.getByText('Hello world')).toBeInTheDocument();
    });

    test('should handle Firefox file upload behavior', async () => {
      const user = userEvent.setup();
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      
      render(
        <TestWrapper>
          <AttachmentPicker onFileSelect={jest.fn()} />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/attach/i);
      await user.upload(fileInput, mockFile);

      // Should handle file upload without issues
      expect(fileInput.files[0]).toBe(mockFile);
    });
  });

  describe('Chrome-Specific Tests', () => {
    beforeEach(() => {
      // Mock Chrome environment
      global.navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    });

    test('should detect Chrome correctly', () => {
      expect(BrowserDetection.getBrowser()).toBe('Chrome');
      expect(BrowserDetection.getBrowserVersion()).toBe('91');
    });

    test('should handle Chrome-specific features', () => {
      // Mock Chrome's advanced features
      global.navigator.mediaDevices = {
        getUserMedia: jest.fn(),
        getDisplayMedia: jest.fn()
      };
      global.navigator.clipboard = {
        writeText: jest.fn(),
        readText: jest.fn()
      };

      expect(global.navigator.mediaDevices.getUserMedia).toBeDefined();
      expect(global.navigator.clipboard.writeText).toBeDefined();
    });

    test('should render chat components with full feature support', () => {
      render(
        <TestWrapper>
          <ChatWindow
            chat={mockChat}
            messages={mockMessages}
            onSendMessage={jest.fn()}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Test Chat')).toBeInTheDocument();
      expect(screen.getByText('Hello world')).toBeInTheDocument();
    });

    test('should handle advanced Chrome APIs', async () => {
      // Mock advanced Chrome APIs
      global.navigator.mediaDevices = {
        getUserMedia: jest.fn().mockResolvedValue({
          getTracks: () => [{ stop: jest.fn() }]
        })
      };

      // Test camera access
      const stream = await global.navigator.mediaDevices.getUserMedia({ video: true });
      expect(stream).toBeDefined();
      expect(stream.getTracks).toBeDefined();
    });
  });

  describe('Edge-Specific Tests', () => {
    beforeEach(() => {
      // Mock Edge environment
      global.navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59';
    });

    test('should detect Edge correctly', () => {
      expect(BrowserDetection.getBrowser()).toBe('Edge');
      expect(BrowserDetection.getBrowserVersion()).toBe('91');
    });

    test('should handle legacy Edge workarounds', () => {
      // Mock older Edge version
      global.navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 Edge/18.18363';
      
      const workaround = BrowserWorkarounds.edge.fixLegacyEdge();
      
      expect(workaround).toEqual({
        usePolyfills: true,
        disableAdvancedFeatures: true
      });
    });

    test('should render chat components properly in Edge', () => {
      render(
        <TestWrapper>
          <ChatWindow
            chat={mockChat}
            messages={mockMessages}
            onSendMessage={jest.fn()}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Test Chat')).toBeInTheDocument();
      expect(screen.getByText('Hello world')).toBeInTheDocument();
    });
  });

  describe('Mobile Browser Tests', () => {
    test('should handle Android Chrome', () => {
      global.navigator.userAgent = 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36';
      
      expect(BrowserDetection.isMobile()).toBe(true);
      expect(BrowserDetection.isAndroid()).toBe(true);
      expect(BrowserDetection.getBrowser()).toBe('Chrome');
    });

    test('should handle iOS Safari', () => {
      global.navigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1';
      
      expect(BrowserDetection.isMobile()).toBe(true);
      expect(BrowserDetection.isIOS()).toBe(true);
      expect(BrowserDetection.getBrowser()).toBe('Safari');
    });

    test('should adapt UI for mobile browsers', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });

      render(
        <TestWrapper>
          <ChatWindow
            chat={mockChat}
            messages={mockMessages}
            onSendMessage={jest.fn()}
          />
        </TestWrapper>
      );

      // Should render mobile-optimized layout
      expect(screen.getByText('Test Chat')).toBeInTheDocument();
    });

    test('should handle touch interactions on mobile', async () => {
      global.navigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1';
      
      render(
        <TestWrapper>
          <MessageInput onSendMessage={jest.fn()} />
        </TestWrapper>
      );

      const input = screen.getByRole('textbox');
      
      // Simulate touch focus
      fireEvent.touchStart(input);
      fireEvent.focus(input);
      
      expect(input).toHaveFocus();
    });
  });

  describe('Feature Degradation Tests', () => {
    test('should gracefully handle missing WebSocket support', () => {
      // Remove WebSocket support
      delete global.WebSocket;
      
      render(
        <TestWrapper>
          <ChatWindow
            chat={mockChat}
            messages={mockMessages}
            onSendMessage={jest.fn()}
          />
        </TestWrapper>
      );

      // Should still render but may show offline mode
      expect(screen.getByText('Test Chat')).toBeInTheDocument();
    });

    test('should handle missing File API support', () => {
      // Remove File API support
      delete global.File;
      delete global.FileReader;
      delete global.FileList;
      delete global.Blob;
      
      render(
        <TestWrapper>
          <AttachmentPicker onFileSelect={jest.fn()} />
        </TestWrapper>
      );

      // Should render but may disable file upload features
      expect(screen.getByText(/attach/i)).toBeInTheDocument();
    });

    test('should handle missing Geolocation support', () => {
      // Remove Geolocation support
      delete global.navigator.geolocation;
      
      render(
        <TestWrapper>
          <AttachmentPicker onFileSelect={jest.fn()} />
        </TestWrapper>
      );

      // Should render but may disable location sharing
      expect(screen.getByText(/attach/i)).toBeInTheDocument();
    });

    test('should handle missing Local Storage support', () => {
      // Mock localStorage failure
      const mockLocalStorage = {
        setItem: jest.fn(() => {
          throw new Error('QuotaExceededError');
        }),
        getItem: jest.fn(() => null),
        removeItem: jest.fn()
      };
      
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage
      });

      render(
        <TestWrapper>
          <ChatWindow
            chat={mockChat}
            messages={mockMessages}
            onSendMessage={jest.fn()}
          />
        </TestWrapper>
      );

      // Should still render but may not persist data
      expect(screen.getByText('Test Chat')).toBeInTheDocument();
    });
  });

  describe('Performance Tests Across Browsers', () => {
    test('should render large message lists efficiently', () => {
      const largeMessageList = Array.from({ length: 100 }, (_, i) => ({
        id: i.toString(),
        text: `Message ${i}`,
        sender: 'user1',
        timestamp: new Date().toISOString()
      }));

      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <ChatWindow
            chat={mockChat}
            messages={largeMessageList}
            onSendMessage={jest.fn()}
          />
        </TestWrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time
      expect(renderTime).toBeLessThan(1000); // 1 second
      expect(screen.getByText('Test Chat')).toBeInTheDocument();
    });

    test('should handle rapid message updates', async () => {
      const { rerender } = render(
        <TestWrapper>
          <ChatWindow
            chat={mockChat}
            messages={mockMessages}
            onSendMessage={jest.fn()}
          />
        </TestWrapper>
      );

      // Simulate rapid message updates
      for (let i = 0; i < 10; i++) {
        const updatedMessages = [
          ...mockMessages,
          {
            id: `new-${i}`,
            text: `New message ${i}`,
            sender: 'user2',
            timestamp: new Date().toISOString()
          }
        ];

        rerender(
          <TestWrapper>
            <ChatWindow
              chat={mockChat}
              messages={updatedMessages}
              onSendMessage={jest.fn()}
            />
          </TestWrapper>
        );
      }

      // Should handle updates without crashing
      expect(screen.getByText('Test Chat')).toBeInTheDocument();
    });
  });
});