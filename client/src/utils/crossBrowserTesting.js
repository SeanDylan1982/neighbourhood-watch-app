/**
 * Cross-browser testing utilities for development and debugging
 */

import { CompatibilityTester, BrowserDetection, BrowserWorkarounds } from './browserCompatibility';

/**
 * Browser testing scenarios
 */
export const BrowserTestScenarios = {
  // Test chat functionality across browsers
  chatFunctionality: {
    name: 'Chat Functionality',
    tests: [
      {
        name: 'WebSocket Connection',
        test: () => {
          return new Promise((resolve) => {
            try {
              const ws = new WebSocket('wss://echo.websocket.org');
              ws.onopen = () => {
                ws.close();
                resolve({ success: true, message: 'WebSocket connection successful' });
              };
              ws.onerror = () => {
                resolve({ success: false, message: 'WebSocket connection failed' });
              };
              setTimeout(() => {
                resolve({ success: false, message: 'WebSocket connection timeout' });
              }, 5000);
            } catch (error) {
              resolve({ success: false, message: `WebSocket error: ${error.message}` });
            }
          });
        }
      },
      {
        name: 'File Upload Support',
        test: () => {
          return new Promise((resolve) => {
            try {
              const input = document.createElement('input');
              input.type = 'file';
              input.multiple = true;
              input.accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx';
              
              // Test if file input is supported
              if (input.files !== undefined) {
                resolve({ success: true, message: 'File upload supported' });
              } else {
                resolve({ success: false, message: 'File upload not supported' });
              }
            } catch (error) {
              resolve({ success: false, message: `File upload error: ${error.message}` });
            }
          });
        }
      },
      {
        name: 'Local Storage',
        test: () => {
          return new Promise((resolve) => {
            try {
              const testKey = 'browserTest';
              const testValue = 'testValue';
              
              localStorage.setItem(testKey, testValue);
              const retrieved = localStorage.getItem(testKey);
              localStorage.removeItem(testKey);
              
              if (retrieved === testValue) {
                resolve({ success: true, message: 'Local Storage working' });
              } else {
                resolve({ success: false, message: 'Local Storage not working properly' });
              }
            } catch (error) {
              resolve({ success: false, message: `Local Storage error: ${error.message}` });
            }
          });
        }
      },
      {
        name: 'Geolocation API',
        test: () => {
          return new Promise((resolve) => {
            if (!navigator.geolocation) {
              resolve({ success: false, message: 'Geolocation not supported' });
              return;
            }
            
            navigator.geolocation.getCurrentPosition(
              () => resolve({ success: true, message: 'Geolocation supported' }),
              () => resolve({ success: false, message: 'Geolocation permission denied' }),
              { timeout: 5000 }
            );
          });
        }
      },
      {
        name: 'Push Notifications',
        test: () => {
          return new Promise((resolve) => {
            if (!('Notification' in window)) {
              resolve({ success: false, message: 'Notifications not supported' });
              return;
            }
            
            if (Notification.permission === 'granted') {
              resolve({ success: true, message: 'Notifications already granted' });
            } else if (Notification.permission === 'denied') {
              resolve({ success: false, message: 'Notifications denied' });
            } else {
              Notification.requestPermission().then((permission) => {
                if (permission === 'granted') {
                  resolve({ success: true, message: 'Notifications granted' });
                } else {
                  resolve({ success: false, message: 'Notifications not granted' });
                }
              });
            }
          });
        }
      }
    ]
  },

  // Test media functionality
  mediaFunctionality: {
    name: 'Media Functionality',
    tests: [
      {
        name: 'Camera Access',
        test: () => {
          return new Promise((resolve) => {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
              resolve({ success: false, message: 'Camera API not supported' });
              return;
            }
            
            navigator.mediaDevices.getUserMedia({ video: true })
              .then((stream) => {
                stream.getTracks().forEach(track => track.stop());
                resolve({ success: true, message: 'Camera access granted' });
              })
              .catch((error) => {
                resolve({ success: false, message: `Camera access denied: ${error.message}` });
              });
          });
        }
      },
      {
        name: 'Microphone Access',
        test: () => {
          return new Promise((resolve) => {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
              resolve({ success: false, message: 'Microphone API not supported' });
              return;
            }
            
            navigator.mediaDevices.getUserMedia({ audio: true })
              .then((stream) => {
                stream.getTracks().forEach(track => track.stop());
                resolve({ success: true, message: 'Microphone access granted' });
              })
              .catch((error) => {
                resolve({ success: false, message: `Microphone access denied: ${error.message}` });
              });
          });
        }
      },
      {
        name: 'WebRTC Support',
        test: () => {
          return new Promise((resolve) => {
            try {
              const pc = new RTCPeerConnection();
              pc.close();
              resolve({ success: true, message: 'WebRTC supported' });
            } catch (error) {
              resolve({ success: false, message: `WebRTC not supported: ${error.message}` });
            }
          });
        }
      }
    ]
  },

  // Test UI/UX functionality
  uiFunctionality: {
    name: 'UI/UX Functionality',
    tests: [
      {
        name: 'CSS Grid Support',
        test: () => {
          return new Promise((resolve) => {
            try {
              const supported = CSS.supports('display', 'grid');
              resolve({ 
                success: supported, 
                message: supported ? 'CSS Grid supported' : 'CSS Grid not supported' 
              });
            } catch (error) {
              resolve({ success: false, message: 'CSS.supports not available' });
            }
          });
        }
      },
      {
        name: 'CSS Flexbox Support',
        test: () => {
          return new Promise((resolve) => {
            try {
              const supported = CSS.supports('display', 'flex');
              resolve({ 
                success: supported, 
                message: supported ? 'CSS Flexbox supported' : 'CSS Flexbox not supported' 
              });
            } catch (error) {
              resolve({ success: false, message: 'CSS.supports not available' });
            }
          });
        }
      },
      {
        name: 'Touch Events',
        test: () => {
          return new Promise((resolve) => {
            const supported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            resolve({ 
              success: supported, 
              message: supported ? 'Touch events supported' : 'Touch events not supported' 
            });
          });
        }
      },
      {
        name: 'Clipboard API',
        test: () => {
          return new Promise((resolve) => {
            if (!navigator.clipboard) {
              resolve({ success: false, message: 'Clipboard API not supported' });
              return;
            }
            
            navigator.clipboard.writeText('test')
              .then(() => resolve({ success: true, message: 'Clipboard API working' }))
              .catch((error) => resolve({ success: false, message: `Clipboard API error: ${error.message}` }));
          });
        }
      }
    ]
  }
};

/**
 * Cross-browser test runner
 */
export class CrossBrowserTestRunner {
  constructor() {
    this.results = {};
    this.isRunning = false;
  }

  // Run all test scenarios
  async runAllTests() {
    if (this.isRunning) {
      throw new Error('Tests are already running');
    }

    this.isRunning = true;
    this.results = {
      browser: BrowserDetection.getBrowser(),
      browserVersion: BrowserDetection.getBrowserVersion(),
      userAgent: navigator.userAgent,
      isMobile: BrowserDetection.isMobile(),
      isIOS: BrowserDetection.isIOS(),
      isAndroid: BrowserDetection.isAndroid(),
      timestamp: new Date().toISOString(),
      scenarios: {}
    };

    try {
      for (const [scenarioName, scenario] of Object.entries(BrowserTestScenarios)) {
        console.log(`Running ${scenario.name} tests...`);
        this.results.scenarios[scenarioName] = await this.runScenario(scenario);
      }

      // Run compatibility tests
      const compatibilityTester = new CompatibilityTester();
      this.results.compatibility = compatibilityTester.runAllTests();

      // Apply browser-specific workarounds
      this.results.workarounds = this.getApplicableWorkarounds();

    } finally {
      this.isRunning = false;
    }

    return this.results;
  }

  // Run a specific test scenario
  async runScenario(scenario) {
    const scenarioResults = {
      name: scenario.name,
      tests: [],
      passed: 0,
      failed: 0,
      duration: 0
    };

    const startTime = performance.now();

    for (const test of scenario.tests) {
      console.log(`  Running ${test.name}...`);
      
      try {
        const testResult = await test.test();
        scenarioResults.tests.push({
          name: test.name,
          ...testResult,
          duration: performance.now() - startTime
        });

        if (testResult.success) {
          scenarioResults.passed++;
        } else {
          scenarioResults.failed++;
        }
      } catch (error) {
        scenarioResults.tests.push({
          name: test.name,
          success: false,
          message: `Test error: ${error.message}`,
          duration: performance.now() - startTime
        });
        scenarioResults.failed++;
      }
    }

    scenarioResults.duration = performance.now() - startTime;
    return scenarioResults;
  }

  // Get applicable browser workarounds
  getApplicableWorkarounds() {
    const browser = BrowserDetection.getBrowser();
    const workarounds = {};

    switch (browser) {
      case 'Safari':
        workarounds.webRTC = BrowserWorkarounds.safari.fixWebRTC();
        workarounds.fileUpload = BrowserWorkarounds.safari.fixFileUpload();
        break;
      case 'Firefox':
        workarounds.webSocket = BrowserWorkarounds.firefox.fixWebSocket();
        break;
      case 'Edge':
        workarounds.legacyEdge = BrowserWorkarounds.edge.fixLegacyEdge();
        break;
    }

    return workarounds;
  }

  // Generate test report
  generateReport() {
    if (!this.results || Object.keys(this.results).length === 0) {
      throw new Error('No test results available. Run tests first.');
    }

    const report = {
      summary: {
        browser: `${this.results.browser} ${this.results.browserVersion}`,
        platform: this.results.isMobile ? 'Mobile' : 'Desktop',
        totalScenarios: Object.keys(this.results.scenarios).length,
        totalTests: Object.values(this.results.scenarios).reduce((sum, scenario) => sum + scenario.tests.length, 0),
        totalPassed: Object.values(this.results.scenarios).reduce((sum, scenario) => sum + scenario.passed, 0),
        totalFailed: Object.values(this.results.scenarios).reduce((sum, scenario) => sum + scenario.failed, 0),
        compatibilityIssues: this.results.compatibility?.issues?.length || 0,
        recommendations: this.results.compatibility?.recommendations?.length || 0
      },
      details: this.results
    };

    return report;
  }

  // Export results to JSON
  exportResults() {
    const report = this.generateReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `browser-compatibility-test-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Display results in console
  displayResults() {
    const report = this.generateReport();
    
    console.group('🔍 Cross-Browser Compatibility Test Results');
    console.log('📊 Summary:', report.summary);
    
    Object.entries(this.results.scenarios).forEach(([scenarioName, scenario]) => {
      console.group(`📋 ${scenario.name}`);
      console.log(`✅ Passed: ${scenario.passed}, ❌ Failed: ${scenario.failed}`);
      
      scenario.tests.forEach(test => {
        const icon = test.success ? '✅' : '❌';
        console.log(`${icon} ${test.name}: ${test.message}`);
      });
      
      console.groupEnd();
    });

    if (this.results.compatibility?.issues?.length > 0) {
      console.group('⚠️ Compatibility Issues');
      this.results.compatibility.issues.forEach(issue => {
        console.warn(issue);
      });
      console.groupEnd();
    }

    if (this.results.compatibility?.recommendations?.length > 0) {
      console.group('💡 Recommendations');
      this.results.compatibility.recommendations.forEach(recommendation => {
        console.info(recommendation);
      });
      console.groupEnd();
    }

    console.groupEnd();
  }
}

/**
 * Quick test function for development
 */
export const runQuickCompatibilityTest = async () => {
  const runner = new CrossBrowserTestRunner();
  
  try {
    console.log('🚀 Starting cross-browser compatibility tests...');
    await runner.runAllTests();
    runner.displayResults();
    
    return runner.generateReport();
  } catch (error) {
    console.error('❌ Test runner error:', error);
    throw error;
  }
};

/**
 * Test specific functionality
 */
export const testSpecificFeature = async (scenarioName) => {
  const scenario = BrowserTestScenarios[scenarioName];
  if (!scenario) {
    throw new Error(`Scenario '${scenarioName}' not found`);
  }

  const runner = new CrossBrowserTestRunner();
  const result = await runner.runScenario(scenario);
  
  console.group(`🔍 ${scenario.name} Test Results`);
  console.log(`✅ Passed: ${result.passed}, ❌ Failed: ${result.failed}`);
  
  result.tests.forEach(test => {
    const icon = test.success ? '✅' : '❌';
    console.log(`${icon} ${test.name}: ${test.message}`);
  });
  
  console.groupEnd();
  
  return result;
};

// Export default test runner instance
export default new CrossBrowserTestRunner();