/**
 * Test Setup for Service Tests
 * Common setup and utilities for service testing
 */

// Mock global objects that are commonly used across tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

// Mock window.dispatchEvent
Object.defineProperty(window, 'dispatchEvent', {
  value: jest.fn(() => true),
  writable: true
});

// Mock document methods
Object.defineProperty(document, 'addEventListener', {
  value: jest.fn(),
  writable: true
});

Object.defineProperty(document, 'removeEventListener', {
  value: jest.fn(),
  writable: true
});

Object.defineProperty(document, 'querySelector', {
  value: jest.fn(),
  writable: true
});

Object.defineProperty(document, 'createElement', {
  value: jest.fn(() => ({
    rel: '',
    href: '',
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  })),
  writable: true
});

Object.defineProperty(document.head, 'appendChild', {
  value: jest.fn(),
  writable: true
});

// Mock navigator.userAgent
Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  writable: true
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: ''
  },
  writable: true
});

// Mock setTimeout and clearTimeout for tests that use timers
global.setTimeout = jest.fn((callback, delay) => {
  if (delay === 0) {
    setImmediate(callback);
  }
  return 123; // Mock timer ID
});

global.clearTimeout = jest.fn();

// Mock setInterval and clearInterval
global.setInterval = jest.fn(() => 456); // Mock timer ID
global.clearInterval = jest.fn();

// Mock performance.now for timing tests
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now())
  },
  writable: true
});

// Mock Blob and URL for manifest tests
global.Blob = jest.fn((content, options) => ({
  content,
  options,
  size: content ? content[0].length : 0
}));

global.URL = {
  createObjectURL: jest.fn(() => 'blob:mock-url'),
  revokeObjectURL: jest.fn()
};

// Mock MediaError constants
global.MediaError = {
  MEDIA_ERR_ABORTED: 1,
  MEDIA_ERR_NETWORK: 2,
  MEDIA_ERR_DECODE: 3,
  MEDIA_ERR_SRC_NOT_SUPPORTED: 4
};

// Mock DOMException
global.DOMException = class DOMException extends Error {
  constructor(message, name) {
    super(message);
    this.name = name || 'DOMException';
  }
};

// Utility functions for tests
export const createMockAudioContext = () => ({
  state: 'running',
  currentTime: 0,
  destination: {},
  resume: jest.fn().mockResolvedValue(),
  createBufferSource: jest.fn(() => ({
    buffer: null,
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn()
  })),
  createGain: jest.fn(() => ({
    gain: {
      value: 0.7,
      setValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn()
    },
    connect: jest.fn()
  })),
  createOscillator: jest.fn(() => ({
    frequency: { value: 440 },
    type: 'sine',
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn()
  })),
  decodeAudioData: jest.fn().mockResolvedValue({
    duration: 1.0,
    numberOfChannels: 2
  })
});

export const createMockAudio = () => ({
  preload: 'auto',
  volume: 0.7,
  currentTime: 0,
  addEventListener: jest.fn((event, callback) => {
    if (event === 'canplaythrough') {
      setTimeout(callback, 0);
    }
  }),
  removeEventListener: jest.fn(),
  load: jest.fn(),
  play: jest.fn().mockResolvedValue(),
  pause: jest.fn(),
  error: null,
  src: ''
});

export const createMockServiceWorkerRegistration = () => ({
  scope: '/',
  active: { state: 'activated' },
  installing: null,
  waiting: null,
  addEventListener: jest.fn(),
  unregister: jest.fn().mockResolvedValue(true)
});

export const createMockFetch = (responses = []) => {
  const mockFetch = jest.fn();
  
  responses.forEach((response, index) => {
    if (index === 0) {
      mockFetch.mockResolvedValueOnce(response);
    } else {
      mockFetch.mockResolvedValueOnce(response);
    }
  });
  
  return mockFetch;
};

export const createValidManifest = () => ({
  name: 'Test App',
  short_name: 'Test',
  start_url: '/',
  display: 'standalone',
  theme_color: '#000000',
  background_color: '#ffffff',
  icons: [
    {
      src: '/icon-192.png',
      sizes: '192x192',
      type: 'image/png'
    },
    {
      src: '/icon-512.png',
      sizes: '512x512',
      type: 'image/png'
    }
  ]
});

export const waitForPromises = () => new Promise(resolve => setImmediate(resolve));

export const mockConsoleMethod = (method) => {
  const originalMethod = console[method];
  console[method] = jest.fn();
  return () => {
    console[method] = originalMethod;
  };
};

// Test environment cleanup
afterEach(() => {
  // Clear all timers
  jest.clearAllTimers();
  
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset modules
  jest.resetModules();
});

// Global test timeout
jest.setTimeout(10000);