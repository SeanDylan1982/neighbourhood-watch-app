/**
 * Browser compatibility utilities and testing helpers
 */

/**
 * Browser detection utilities
 */
export const BrowserDetection = {
  // Detect browser type
  getBrowser: () => {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      return 'Chrome';
    } else if (userAgent.includes('Firefox')) {
      return 'Firefox';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      return 'Safari';
    } else if (userAgent.includes('Edg')) {
      return 'Edge';
    } else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
      return 'Internet Explorer';
    }
    
    return 'Unknown';
  },

  // Detect browser version
  getBrowserVersion: () => {
    const userAgent = navigator.userAgent;
    const browser = BrowserDetection.getBrowser();
    
    let version = 'Unknown';
    
    switch (browser) {
      case 'Chrome':
        const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
        version = chromeMatch ? chromeMatch[1] : 'Unknown';
        break;
      case 'Firefox':
        const firefoxMatch = userAgent.match(/Firefox\/(\d+)/);
        version = firefoxMatch ? firefoxMatch[1] : 'Unknown';
        break;
      case 'Safari':
        const safariMatch = userAgent.match(/Version\/(\d+)/);
        version = safariMatch ? safariMatch[1] : 'Unknown';
        break;
      case 'Edge':
        const edgeMatch = userAgent.match(/Edg\/(\d+)/);
        version = edgeMatch ? edgeMatch[1] : 'Unknown';
        break;
    }
    
    return version;
  },

  // Check if browser is mobile
  isMobile: () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  // Check if browser is iOS
  isIOS: () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  },

  // Check if browser is Android
  isAndroid: () => {
    return /Android/.test(navigator.userAgent);
  }
};

/**
 * Feature detection utilities
 */
export const FeatureDetection = {
  // Check WebRTC support
  hasWebRTC: () => {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.RTCPeerConnection
    );
  },

  // Check WebSocket support
  hasWebSocket: () => {
    return 'WebSocket' in window;
  },

  // Check Service Worker support
  hasServiceWorker: () => {
    return 'serviceWorker' in navigator;
  },

  // Check Push Notification support
  hasPushNotifications: () => {
    return 'Notification' in window && 'PushManager' in window;
  },

  // Check File API support
  hasFileAPI: () => {
    return window.File && window.FileReader && window.FileList && window.Blob;
  },

  // Check Geolocation support
  hasGeolocation: () => {
    return 'geolocation' in navigator;
  },

  // Check Local Storage support
  hasLocalStorage: () => {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  },

  // Check IndexedDB support
  hasIndexedDB: () => {
    return 'indexedDB' in window;
  },

  // Check Web Crypto API support
  hasWebCrypto: () => {
    return 'crypto' in window && 'subtle' in window.crypto;
  },

  // Check Clipboard API support
  hasClipboardAPI: () => {
    return 'clipboard' in navigator;
  }
};

/**
 * CSS feature detection
 */
export const CSSFeatureDetection = {
  // Check CSS Grid support
  hasGridSupport: () => {
    return CSS.supports('display', 'grid');
  },

  // Check CSS Flexbox support
  hasFlexboxSupport: () => {
    return CSS.supports('display', 'flex');
  },

  // Check CSS Custom Properties support
  hasCustomPropertiesSupport: () => {
    return CSS.supports('--custom-property', 'value');
  },

  // Check CSS backdrop-filter support
  hasBackdropFilterSupport: () => {
    return CSS.supports('backdrop-filter', 'blur(10px)');
  }
};

/**
 * Compatibility testing suite
 */
export class CompatibilityTester {
  constructor() {
    this.results = {
      browser: BrowserDetection.getBrowser(),
      browserVersion: BrowserDetection.getBrowserVersion(),
      isMobile: BrowserDetection.isMobile(),
      features: {},
      cssFeatures: {},
      issues: [],
      recommendations: []
    };
  }

  // Run all compatibility tests
  runAllTests() {
    this.testFeatures();
    this.testCSSFeatures();
    this.testChatFeatures();
    this.generateRecommendations();
    return this.results;
  }

  // Test browser features
  testFeatures() {
    const features = [
      'hasWebRTC',
      'hasWebSocket',
      'hasServiceWorker',
      'hasPushNotifications',
      'hasFileAPI',
      'hasGeolocation',
      'hasLocalStorage',
      'hasIndexedDB',
      'hasWebCrypto',
      'hasClipboardAPI'
    ];

    features.forEach(feature => {
      this.results.features[feature] = FeatureDetection[feature]();
    });
  }

  // Test CSS features
  testCSSFeatures() {
    const cssFeatures = [
      'hasGridSupport',
      'hasFlexboxSupport',
      'hasCustomPropertiesSupport',
      'hasBackdropFilterSupport'
    ];

    cssFeatures.forEach(feature => {
      this.results.cssFeatures[feature] = CSSFeatureDetection[feature]();
    });
  }

  // Test chat-specific features
  testChatFeatures() {
    // Test WebSocket connection
    if (!this.results.features.hasWebSocket) {
      this.results.issues.push('WebSocket not supported - real-time chat features will not work');
    }

    // Test File API for attachments
    if (!this.results.features.hasFileAPI) {
      this.results.issues.push('File API not supported - file attachments may not work');
    }

    // Test Geolocation for location sharing
    if (!this.results.features.hasGeolocation) {
      this.results.issues.push('Geolocation not supported - location sharing will not work');
    }

    // Test Local Storage for offline functionality
    if (!this.results.features.hasLocalStorage) {
      this.results.issues.push('Local Storage not supported - offline functionality limited');
    }

    // Test Web Crypto for encryption
    if (!this.results.features.hasWebCrypto) {
      this.results.issues.push('Web Crypto API not supported - end-to-end encryption may not work');
    }

    // Test Push Notifications
    if (!this.results.features.hasPushNotifications) {
      this.results.issues.push('Push Notifications not supported - message notifications limited');
    }
  }

  // Generate browser-specific recommendations
  generateRecommendations() {
    const { browser, browserVersion } = this.results;

    // Chrome-specific recommendations
    if (browser === 'Chrome') {
      if (parseInt(browserVersion) < 80) {
        this.results.recommendations.push('Consider updating Chrome for better performance');
      }
    }

    // Firefox-specific recommendations
    if (browser === 'Firefox') {
      if (parseInt(browserVersion) < 75) {
        this.results.recommendations.push('Consider updating Firefox for better WebRTC support');
      }
    }

    // Safari-specific recommendations
    if (browser === 'Safari') {
      this.results.recommendations.push('Safari may have limited WebRTC support');
      if (parseInt(browserVersion) < 14) {
        this.results.recommendations.push('Consider updating Safari for better PWA support');
      }
    }

    // Edge-specific recommendations
    if (browser === 'Edge') {
      if (parseInt(browserVersion) < 80) {
        this.results.recommendations.push('Consider updating Edge for better compatibility');
      }
    }

    // Mobile-specific recommendations
    if (this.results.isMobile) {
      this.results.recommendations.push('Mobile detected - ensure touch interactions work properly');
      if (BrowserDetection.isIOS()) {
        this.results.recommendations.push('iOS detected - test file upload limitations');
      }
    }
  }

  // Get compatibility report
  getReport() {
    return {
      summary: {
        browser: `${this.results.browser} ${this.results.browserVersion}`,
        compatible: this.results.issues.length === 0,
        issueCount: this.results.issues.length,
        recommendationCount: this.results.recommendations.length
      },
      details: this.results
    };
  }
}

/**
 * Polyfill utilities
 */
export const Polyfills = {
  // Load polyfills based on feature detection
  loadRequired: async () => {
    const polyfillsToLoad = [];

    // Check for missing features and add polyfills
    if (!FeatureDetection.hasWebSocket()) {
      polyfillsToLoad.push('websocket');
    }

    if (!FeatureDetection.hasFileAPI()) {
      polyfillsToLoad.push('file-api');
    }

    if (!FeatureDetection.hasLocalStorage()) {
      polyfillsToLoad.push('localstorage');
    }

    // Load polyfills dynamically
    for (const polyfill of polyfillsToLoad) {
      try {
        await import(`../polyfills/${polyfill}.js`);
        console.log(`Loaded polyfill: ${polyfill}`);
      } catch (error) {
        console.warn(`Failed to load polyfill: ${polyfill}`, error);
      }
    }
  }
};

/**
 * Browser-specific workarounds
 */
export const BrowserWorkarounds = {
  // Safari-specific fixes
  safari: {
    // Fix for Safari's WebRTC issues
    fixWebRTC: () => {
      if (BrowserDetection.getBrowser() === 'Safari') {
        // Add Safari-specific WebRTC configuration
        return {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        };
      }
      return null;
    },

    // Fix for Safari's file upload issues
    fixFileUpload: () => {
      if (BrowserDetection.getBrowser() === 'Safari' && BrowserDetection.isIOS()) {
        // iOS Safari has limitations with file uploads
        return {
          accept: 'image/*,video/*', // Limit to media files
          multiple: false // Disable multiple file selection
        };
      }
      return null;
    }
  },

  // Firefox-specific fixes
  firefox: {
    // Fix for Firefox's WebSocket issues
    fixWebSocket: () => {
      if (BrowserDetection.getBrowser() === 'Firefox') {
        // Firefox-specific WebSocket configuration
        return {
          maxReconnectAttempts: 5,
          reconnectInterval: 3000
        };
      }
      return null;
    }
  },

  // Edge-specific fixes
  edge: {
    // Fix for older Edge versions
    fixLegacyEdge: () => {
      const version = parseInt(BrowserDetection.getBrowserVersion());
      if (BrowserDetection.getBrowser() === 'Edge' && version < 80) {
        // Legacy Edge fixes
        return {
          usePolyfills: true,
          disableAdvancedFeatures: true
        };
      }
      return null;
    }
  }
};

// Export default compatibility tester instance
export default new CompatibilityTester();