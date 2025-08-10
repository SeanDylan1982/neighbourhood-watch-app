/**
 * Development helper for browser compatibility testing
 * Provides easy-to-use functions for developers to test compatibility
 */

import { runQuickCompatibilityTest, testSpecificFeature } from './crossBrowserTesting';
import { BrowserDetection, CompatibilityTester } from './browserCompatibility';

/**
 * Development compatibility helper class
 */
export class DevCompatibilityHelper {
  constructor() {
    this.isDevMode = process.env.NODE_ENV === 'development';
    this.testResults = null;
  }

  // Initialize compatibility testing in development
  init() {
    if (!this.isDevMode) return;

    // Add global helper functions for console testing
    if (typeof window !== 'undefined') {
      window.testCompatibility = this.runQuickTest.bind(this);
      window.testChatFeatures = () => testSpecificFeature('chatFunctionality');
      window.testMediaFeatures = () => testSpecificFeature('mediaFunctionality');
      window.testUIFeatures = () => testSpecificFeature('uiFunctionality');
      window.getBrowserInfo = this.getBrowserInfo.bind(this);
      window.checkFeatureSupport = this.checkFeatureSupport.bind(this);
      
      console.log('🔧 Dev Compatibility Helper loaded!');
      console.log('Available functions:');
      console.log('  - testCompatibility() - Run all compatibility tests');
      console.log('  - testChatFeatures() - Test chat-specific features');
      console.log('  - testMediaFeatures() - Test media features');
      console.log('  - testUIFeatures() - Test UI features');
      console.log('  - getBrowserInfo() - Get current browser information');
      console.log('  - checkFeatureSupport(feature) - Check specific feature support');
    }
  }

  // Run quick compatibility test
  async runQuickTest() {
    try {
      console.log('🚀 Running compatibility tests...');
      this.testResults = await runQuickCompatibilityTest();
      return this.testResults;
    } catch (error) {
      console.error('❌ Compatibility test failed:', error);
      return null;
    }
  }

  // Get browser information
  getBrowserInfo() {
    const info = {
      browser: BrowserDetection.getBrowser(),
      version: BrowserDetection.getBrowserVersion(),
      userAgent: navigator.userAgent,
      isMobile: BrowserDetection.isMobile(),
      isIOS: BrowserDetection.isIOS(),
      isAndroid: BrowserDetection.isAndroid(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      screen: {
        width: screen.width,
        height: screen.height,
        pixelRatio: window.devicePixelRatio
      }
    };

    console.table(info);
    return info;
  }

  // Check specific feature support
  checkFeatureSupport(feature) {
    const features = {
      webrtc: () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.RTCPeerConnection),
      websocket: () => 'WebSocket' in window,
      serviceworker: () => 'serviceWorker' in navigator,
      pushnotifications: () => 'Notification' in window && 'PushManager' in window,
      fileapi: () => window.File && window.FileReader && window.FileList && window.Blob,
      geolocation: () => 'geolocation' in navigator,
      localstorage: () => {
        try {
          const test = 'test';
          localStorage.setItem(test, test);
          localStorage.removeItem(test);
          return true;
        } catch (e) {
          return false;
        }
      },
      indexeddb: () => 'indexedDB' in window,
      webcrypto: () => 'crypto' in window && 'subtle' in window.crypto,
      clipboard: () => 'clipboard' in navigator,
      touchevents: () => 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      cssgrid: () => CSS.supports('display', 'grid'),
      cssflexbox: () => CSS.supports('display', 'flex'),
      csscustomprops: () => CSS.supports('--custom-property', 'value'),
      cssbackdropfilter: () => CSS.supports('backdrop-filter', 'blur(10px)')
    };

    if (!feature) {
      console.log('Available features to check:');
      console.log(Object.keys(features).join(', '));
      return Object.keys(features);
    }

    const featureTest = features[feature.toLowerCase()];
    if (!featureTest) {
      console.error(`Unknown feature: ${feature}`);
      return false;
    }

    const supported = featureTest();
    console.log(`${feature}: ${supported ? '✅ Supported' : '❌ Not supported'}`);
    return supported;
  }

  // Generate compatibility report for current browser
  async generateReport() {
    const tester = new CompatibilityTester();
    const results = tester.runAllTests();
    const report = tester.getReport();

    console.group('📊 Browser Compatibility Report');
    console.log('Summary:', report.summary);
    console.log('Browser:', report.details.browser, report.details.browserVersion);
    console.log('Platform:', report.details.isMobile ? 'Mobile' : 'Desktop');
    
    if (report.details.issues.length > 0) {
      console.group('⚠️ Issues Found');
      report.details.issues.forEach(issue => console.warn(issue));
      console.groupEnd();
    }

    if (report.details.recommendations.length > 0) {
      console.group('💡 Recommendations');
      report.details.recommendations.forEach(rec => console.info(rec));
      console.groupEnd();
    }

    console.groupEnd();
    return report;
  }

  // Test specific chat component compatibility
  async testChatComponent(componentName) {
    const componentTests = {
      chatwindow: async () => {
        console.log('Testing ChatWindow compatibility...');
        const features = ['websocket', 'localstorage', 'fileapi'];
        const results = {};
        
        for (const feature of features) {
          results[feature] = this.checkFeatureSupport(feature);
        }
        
        return results;
      },
      
      attachments: async () => {
        console.log('Testing Attachment features compatibility...');
        const features = ['fileapi', 'geolocation', 'webcrypto'];
        const results = {};
        
        for (const feature of features) {
          results[feature] = this.checkFeatureSupport(feature);
        }
        
        return results;
      },
      
      notifications: async () => {
        console.log('Testing Notification features compatibility...');
        const features = ['pushnotifications', 'serviceworker'];
        const results = {};
        
        for (const feature of features) {
          results[feature] = this.checkFeatureSupport(feature);
        }
        
        return results;
      },
      
      media: async () => {
        console.log('Testing Media features compatibility...');
        const features = ['webrtc', 'fileapi'];
        const results = {};
        
        for (const feature of features) {
          results[feature] = this.checkFeatureSupport(feature);
        }
        
        // Test actual media access
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            stream.getTracks().forEach(track => track.stop());
            results.mediaAccess = true;
            console.log('✅ Media access granted');
          } catch (error) {
            results.mediaAccess = false;
            console.log('❌ Media access denied:', error.message);
          }
        }
        
        return results;
      }
    };

    const test = componentTests[componentName?.toLowerCase()];
    if (!test) {
      console.log('Available component tests:');
      console.log(Object.keys(componentTests).join(', '));
      return null;
    }

    return await test();
  }

  // Monitor performance during development
  startPerformanceMonitoring() {
    if (!this.isDevMode) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.duration > 100) { // Log slow operations
          console.warn(`⚠️ Slow operation detected: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
        }
      });
    });

    observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
    
    console.log('📊 Performance monitoring started');
    return observer;
  }

  // Test responsive behavior
  testResponsiveBehavior() {
    const breakpoints = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];

    console.group('📱 Testing Responsive Behavior');
    
    breakpoints.forEach(({ name, width, height }) => {
      console.log(`Testing ${name} (${width}x${height})`);
      
      // Simulate viewport change
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: width
      });
      
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: height
      });

      // Trigger resize event
      window.dispatchEvent(new Event('resize'));
      
      console.log(`  - Viewport: ${window.innerWidth}x${window.innerHeight}`);
      console.log(`  - Device pixel ratio: ${window.devicePixelRatio}`);
      console.log(`  - Touch support: ${this.checkFeatureSupport('touchevents')}`);
    });
    
    console.groupEnd();
  }

  // Export test results
  exportTestResults() {
    if (!this.testResults) {
      console.warn('No test results available. Run testCompatibility() first.');
      return;
    }

    const dataStr = JSON.stringify(this.testResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `compatibility-test-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('📁 Test results exported');
  }
}

// Create and initialize helper instance
const devHelper = new DevCompatibilityHelper();

// Auto-initialize in development mode
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => devHelper.init());
  } else {
    devHelper.init();
  }
}

export default devHelper;