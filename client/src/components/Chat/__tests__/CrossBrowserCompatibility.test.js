/**
 * Cross-browser compatibility tests for chat functionality
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import { 
  BrowserDetection, 
  FeatureDetection, 
  CSSFeatureDetection,
  CompatibilityTester,
  BrowserWorkarounds 
} from '../../../utils/browserCompatibility';
import ChatWindow from '../ChatWindow/ChatWindow';
import ChatList from '../ChatList/ChatList';
import MessageBubble from '../ChatWindow/MessageBubble';

// Mock browser environments
const mockBrowserEnvironments = {
  chrome: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    features: {
      webRTC: true,
      webSocket: true,
      serviceWorker: true,
      pushNotifications: true,
      fileAPI: true,
      geolocation: true,
      localStorage: true,
      indexedDB: true,
      webCrypto: true,
      clipboardAPI: true
    }
  },
  firefox: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    features: {
      webRTC: true,
      webSocket: true,
      serviceWorker: true,
      pushNotifications: true,
      fileAPI: true,
      geolocation: true,
      localStorage: true,
      indexedDB: true,
      webCrypto: true,
      clipboardAPI: false // Firefox has limited clipboard API support
    }
  },
  safari: {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    features: {
      webRTC: true,
      webSocket: true,
      serviceWorker: true,
      pushNotifications: false, // Safari requires user interaction
      fileAPI: true,
      geolocation: true,
      localStorage: true,
      indexedDB: true,
      webCrypto: true,
      clipboardAPI: false // Safari has limited clipboard API support
    }
  },
  edge: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
    features: {
      webRTC: true,
      webSocket: true,
      serviceWorker: true,
      pushNotifications: true,
      fileAPI: true,
      geolocation: true,
      localStorage: true,
      indexedDB: true,
      webCrypto: true,
      clipboardAPI: true
    }
  },
  mobileSafari: {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    features: {
      webRTC: true,
      webSocket: true,
      serviceWorker: true,
      pushNotifications: false,
      fileAPI: true, // Limited on iOS
      geolocation: true,
      localStorage: true,
      indexedDB: true,
      webCrypto: true,
      clipboardAPI: false
    }
  }
};

// Helper to mock browser environment
const mockBrowser = (browserName) => {
  const env = mockBrowserEnvironments[browserName];
  
  // Mock navigator.userAgent
  Object.defineProperty(navigator, 'userAgent', {
    writable: true,
    value: env.userAgent
  });

  // Mock feature availability
  Object.keys(env.features).forEach(feature => {
    switch (feature) {
      case 'webRTC':
        global.RTCPeerConnection = env.features[feature] ? jest.fn() : undefined;
        global.navigator.mediaDevices = env.features[feature] ? { getUserMedia: jest.fn() } : undefined;
        break;
      case 'webSocket':
        global.WebSocket = env.features[feature] ? jest.fn() : undefined;
        break;
      case 'serviceWorker':
        global.navigator.serviceWorker = env.features[feature] ? { register: jest.fn() } : undefined;
        break;
      case 'pushNotifications':
        global.Notification = env.features[feature] ? jest.fn() : undefined;
        global.PushManager = env.features[feature] ? jest.fn() : undefined;
        break;
      case 'fileAPI':
        global.File = env.features[feature] ? jest.fn() : undefined;
        global.FileReader = env.features[feature] ? jest.fn() : undefined;
        global.FileList = env.features[feature] ? jest.fn() : undefined;
        global.Blob = env.features[feature] ? jest.fn() : undefined;
        break;
      case 'geolocation':
        global.navigator.geolocation = env.features[feature] ? { getCurrentPosition: jest.fn() } : undefined;
        break;
      case 'localStorage':
        if (!env.features[feature]) {
          delete global.localStorage;
        }
        break;
      case 'indexedDB':
        global.indexedDB = env.features[feature] ? { open: jest.fn() } : undefined;
        break;
      case 'webCrypto':
        global.crypto = env.features[feature] ? { subtle: {} } : undefined;
        break;
      case 'clipboardAPI':
        global.navigator.clipboard = env.features[feature] ? { writeText: jest.fn() } : undefined;
        break;
    }
  });
};

// Test wrapper component
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

describe('Cross-Browser Compatibility Tests', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('Browser Detection', () => {
    test('should correctly detect Chrome', () => {
      mockBrowser('chrome');
      expect(BrowserDetection.getBrowser()).toBe('Chrome');
      expect(BrowserDetection.getBrowserVersion()).toBe('91');
      expect(BrowserDetection.isMobile()).toBe(false);
    });

    test('should correctly detect Firefox', () => {
      mockBrowser('firefox');
      expect(BrowserDetection.getBrowser()).toBe('Firefox');
      expect(BrowserDetection.getBrowserVersion()).toBe('89');
      expect(BrowserDetection.isMobile()).toBe(false);
    });

    test('should correctly detect Safari', () => {
      mockBrowser('safari');
      expect(BrowserDetection.getBrowser()).toBe('Safari');
      expect(BrowserDetection.getBrowserVersion()).toBe('14');
      expect(BrowserDetection.isMobile()).toBe(false);
    });

    test('should correctly detect Edge', () => {
      mockBrowser('edge');
      expect(BrowserDetection.getBrowser()).toBe('Edge');
      expect(BrowserDetection.getBrowserVersion()).toBe('91');
      expect(BrowserDetection.isMobile()).toBe(false);
    });

    test('should correctly detect mobile Safari', () => {
      mockBrowser('mobileSafari');
      expect(BrowserDetection.getBrowser()).toBe('Safari');
      expect(BrowserDetection.isMobile()).toBe(true);
      expect(BrowserDetection.isIOS()).toBe(true);
    });
  });

  describe('Feature Detection', () => {
    test('should detect features correctly in Chrome', () => {
      mockBrowser('chrome');
      
      expect(FeatureDetection.hasWebRTC()).toBe(true);
      expect(FeatureDetection.hasWebSocket()).toBe(true);
      expect(FeatureDetection.hasServiceWorker()).toBe(true);
      expect(FeatureDetection.hasPushNotifications()).toBe(true);
      expect(FeatureDetection.hasFileAPI()).toBe(true);
      expect(FeatureDetection.hasGeolocation()).toBe(true);
      expect(FeatureDetection.hasLocalStorage()).toBe(true);
      expect(FeatureDetection.hasIndexedDB()).toBe(true);
      expect(FeatureDetection.hasWebCrypto()).toBe(true);
      expect(FeatureDetection.hasClipboardAPI()).toBe(true);
    });

    test('should detect limited features in Safari', () => {
      mockBrowser('safari');
      
      expect(FeatureDetection.hasWebRTC()).toBe(true);
      expect(FeatureDetection.hasWebSocket()).toBe(true);
      expect(FeatureDetection.hasPushNotifications()).toBe(false);
      expect(FeatureDetection.hasClipboardAPI()).toBe(false);
    });

    test('should detect mobile limitations', () => {
      mockBrowser('mobileSafari');
      
      expect(FeatureDetection.hasFileAPI()).toBe(true);
      expect(FeatureDetection.hasPushNotifications()).toBe(false);
      expect(FeatureDetection.hasClipboardAPI()).toBe(false);
    });
  });

  describe('Chat Component Compatibility', () => {
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

    test('should render ChatWindow in all browsers', () => {
      const browsers = ['chrome', 'firefox', 'safari', 'edge'];
      
      browsers.forEach(browser => {
        mockBrowser(browser);
        
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

    test('should handle file uploads with browser-specific limitations', () => {
      // Test Safari iOS limitations
      mockBrowser('mobileSafari');
      const safariWorkaround = BrowserWorkarounds.safari.fixFileUpload();
      
      expect(safariWorkaround).toEqual({
        accept: 'image/*,video/*',
        multiple: false
      });
    });

    test('should apply WebRTC configuration for Safari', () => {
      mockBrowser('safari');
      const safariWebRTCConfig = BrowserWorkarounds.safari.fixWebRTC();
      
      expect(safariWebRTCConfig).toEqual({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });
    });

    test('should handle WebSocket configuration for Firefox', () => {
      mockBrowser('firefox');
      const firefoxWebSocketConfig = BrowserWorkarounds.firefox.fixWebSocket();
      
      expect(firefoxWebSocketConfig).toEqual({
        maxReconnectAttempts: 5,
        reconnectInterval: 3000
      });
    });
  });

  describe('CSS Feature Compatibility', () => {
    test('should detect CSS Grid support', () => {
      // Mock CSS.supports
      global.CSS = {
        supports: jest.fn((property, value) => {
          if (property === 'display' && value === 'grid') return true;
          if (property === 'display' && value === 'flex') return true;
          if (property === '--custom-property' && value === 'value') return true;
          if (property === 'backdrop-filter' && value === 'blur(10px)') return false; // Not supported in all browsers
          return false;
        })
      };

      expect(CSSFeatureDetection.hasGridSupport()).toBe(true);
      expect(CSSFeatureDetection.hasFlexboxSupport()).toBe(true);
      expect(CSSFeatureDetection.hasCustomPropertiesSupport()).toBe(true);
      expect(CSSFeatureDetection.hasBackdropFilterSupport()).toBe(false);
    });
  });

  describe('Compatibility Testing Suite', () => {
    test('should run comprehensive compatibility tests', () => {
      mockBrowser('chrome');
      
      const tester = new CompatibilityTester();
      const results = tester.runAllTests();
      
      expect(results.browser).toBe('Chrome');
      expect(results.browserVersion).toBe('91');
      expect(results.isMobile).toBe(false);
      expect(results.features).toBeDefined();
      expect(results.cssFeatures).toBeDefined();
      expect(results.issues).toBeDefined();
      expect(results.recommendations).toBeDefined();
    });

    test('should identify issues in limited browsers', () => {
      // Mock a browser with limited features
      mockBrowser('safari');
      global.Notification = undefined;
      global.navigator.clipboard = undefined;
      
      const tester = new CompatibilityTester();
      const results = tester.runAllTests();
      
      expect(results.issues.length).toBeGreaterThan(0);
      expect(results.issues).toContain('Push Notifications not supported - message notifications limited');
    });

    test('should generate browser-specific recommendations', () => {
      mockBrowser('safari');
      
      const tester = new CompatibilityTester();
      const results = tester.runAllTests();
      
      expect(results.recommendations).toContain('Safari may have limited WebRTC support');
    });

    test('should generate mobile-specific recommendations', () => {
      mockBrowser('mobileSafari');
      
      const tester = new CompatibilityTester();
      const results = tester.runAllTests();
      
      expect(results.recommendations).toContain('Mobile detected - ensure touch interactions work properly');
      expect(results.recommendations).toContain('iOS detected - test file upload limitations');
    });
  });

  describe('Touch and Mobile Interactions', () => {
    test('should handle touch events on mobile', () => {
      mockBrowser('mobileSafari');
      
      render(
        <TestWrapper>
          <MessageBubble
            message={{
              id: '1',
              text: 'Test message',
              sender: 'user1',
              timestamp: new Date().toISOString()
            }}
            isOwn={false}
          />
        </TestWrapper>
      );
      
      const messageBubble = screen.getByText('Test message');
      
      // Simulate touch events
      fireEvent.touchStart(messageBubble);
      fireEvent.touchEnd(messageBubble);
      
      // Should not throw errors
      expect(messageBubble).toBeInTheDocument();
    });
  });

  describe('Accessibility Across Browsers', () => {
    test('should maintain accessibility features across browsers', () => {
      const browsers = ['chrome', 'firefox', 'safari', 'edge'];
      
      browsers.forEach(browser => {
        mockBrowser(browser);
        
        render(
          <TestWrapper>
            <ChatWindow
              chat={mockChat}
              messages={mockMessages}
              onSendMessage={jest.fn()}
            />
          </TestWrapper>
        );
        
        // Check for ARIA labels and roles
        const chatWindow = screen.getByRole('main');
        expect(chatWindow).toBeInTheDocument();
        
        // Check for keyboard navigation support
        const messageInput = screen.getByRole('textbox');
        expect(messageInput).toBeInTheDocument();
        
        fireEvent.keyDown(messageInput, { key: 'Enter' });
        // Should not throw errors
      });
    });
  });

  describe('Performance Across Browsers', () => {
    test('should handle large message lists efficiently', async () => {
      const browsers = ['chrome', 'firefox', 'safari', 'edge'];
      const largeMessageList = Array.from({ length: 1000 }, (_, i) => ({
        id: i.toString(),
        text: `Message ${i}`,
        sender: 'user1',
        timestamp: new Date().toISOString()
      }));
      
      browsers.forEach(browser => {
        mockBrowser(browser);
        
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
        
        // Should render within reasonable time (adjust threshold as needed)
        expect(renderTime).toBeLessThan(1000); // 1 second
      });
    });
  });
});