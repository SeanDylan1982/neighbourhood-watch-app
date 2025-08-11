/**
 * Unit tests for port configuration utility
 * Tests port validation, configuration logic, and logging functionality
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { getPortConfig, validatePort, logPortConfig, logPortError } from '../port.js';

// Mock console methods to capture output
const mockConsoleLog = vi.fn();
const mockConsoleError = vi.fn();

describe('Port Configuration Utility', () => {
  let originalEnv;
  let originalConsole;

  beforeEach(() => {
    // Store original environment and console
    originalEnv = process.env.PORT;
    originalConsole = {
      log: console.log,
      error: console.error
    };

    // Mock console methods
    console.log = mockConsoleLog;
    console.error = mockConsoleError;

    // Clear mocks
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
    
    // Clean environment for each test
    delete process.env.PORT;
  });

  afterEach(() => {
    // Restore original environment and console
    if (originalEnv !== undefined) {
      process.env.PORT = originalEnv;
    } else {
      delete process.env.PORT;
    }
    
    console.log = originalConsole.log;
    console.error = originalConsole.error;
  });

  describe('validatePort()', () => {
    test('should return true for valid port numbers', () => {
      expect(validatePort(80)).toBe(true);
      expect(validatePort(443)).toBe(true);
      expect(validatePort(3000)).toBe(true);
      expect(validatePort(5001)).toBe(true);
      expect(validatePort(8080)).toBe(true);
      expect(validatePort(65535)).toBe(true);
      expect(validatePort('3000')).toBe(true);
      expect(validatePort('5001')).toBe(true);
    });

    test('should return false for invalid port numbers', () => {
      expect(validatePort(0)).toBe(false);
      expect(validatePort(-1)).toBe(false);
      expect(validatePort(65536)).toBe(false);
      expect(validatePort(100000)).toBe(false);
    });

    test('should return false for non-numeric values', () => {
      expect(validatePort('abc')).toBe(false);
      expect(validatePort('3000abc')).toBe(false);
      expect(validatePort('port')).toBe(false);
      expect(validatePort('3000.5')).toBe(false);
    });

    test('should return false for null, undefined, and empty values', () => {
      expect(validatePort(null)).toBe(false);
      expect(validatePort(undefined)).toBe(false);
      expect(validatePort('')).toBe(false);
    });

    test('should handle edge cases', () => {
      expect(validatePort(1)).toBe(true);
      expect(validatePort('1')).toBe(true);
      expect(validatePort(NaN)).toBe(false);
      expect(validatePort(Infinity)).toBe(false);
      expect(validatePort(-Infinity)).toBe(false);
    });
  });

  describe('getPortConfig()', () => {
    test('should use PORT environment variable when valid', () => {
      process.env.PORT = '8080';
      
      const config = getPortConfig();
      
      expect(config.port).toBe(8080);
      expect(config.source).toBe('environment');
      expect(config.isRailwayManaged).toBe(true);
    });

    test('should use default port when PORT environment variable is undefined', () => {
      delete process.env.PORT;
      
      const config = getPortConfig();
      
      expect(config.port).toBe(5001);
      expect(config.source).toBe('default');
      expect(config.isRailwayManaged).toBe(false);
    });

    test('should use default port when PORT environment variable is invalid', () => {
      process.env.PORT = 'invalid';
      
      const config = getPortConfig();
      
      expect(config.port).toBe(5001);
      expect(config.source).toBe('default');
      expect(config.isRailwayManaged).toBe(false);
    });

    test('should use default port when PORT environment variable is empty', () => {
      process.env.PORT = '';
      
      const config = getPortConfig();
      
      expect(config.port).toBe(5001);
      expect(config.source).toBe('default');
      expect(config.isRailwayManaged).toBe(false);
    });

    test('should use default port when PORT environment variable is out of range', () => {
      process.env.PORT = '70000';
      
      const config = getPortConfig();
      
      expect(config.port).toBe(5001);
      expect(config.source).toBe('default');
      expect(config.isRailwayManaged).toBe(false);
    });

    test('should handle Railway typical port values', () => {
      const railwayPorts = ['3000', '8080', '5000', '4000'];
      
      railwayPorts.forEach(port => {
        process.env.PORT = port;
        
        const config = getPortConfig();
        
        expect(config.port).toBe(parseInt(port, 10));
        expect(config.source).toBe('environment');
        expect(config.isRailwayManaged).toBe(true);
      });
    });

    test('should return consistent object structure', () => {
      const config = getPortConfig();
      
      expect(config).toHaveProperty('port');
      expect(config).toHaveProperty('source');
      expect(config).toHaveProperty('isRailwayManaged');
      expect(typeof config.port).toBe('number');
      expect(typeof config.source).toBe('string');
      expect(typeof config.isRailwayManaged).toBe('boolean');
    });
  });

  describe('logPortConfig()', () => {
    test('should log correct format for Railway managed port', () => {
      const config = {
        port: 8080,
        source: 'environment',
        isRailwayManaged: true
      };
      
      logPortConfig(config);
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(3);
      expect(mockConsoleLog).toHaveBeenNthCalledWith(1, '🚀 Server starting on port 8080');
      expect(mockConsoleLog).toHaveBeenNthCalledWith(2, '📍 Port source: environment');
      expect(mockConsoleLog).toHaveBeenNthCalledWith(3, '🚂 Railway managed port detected');
    });

    test('should log correct format for default port', () => {
      const config = {
        port: 5001,
        source: 'default',
        isRailwayManaged: false
      };
      
      logPortConfig(config);
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(3);
      expect(mockConsoleLog).toHaveBeenNthCalledWith(1, '🚀 Server starting on port 5001');
      expect(mockConsoleLog).toHaveBeenNthCalledWith(2, '📍 Port source: default');
      expect(mockConsoleLog).toHaveBeenNthCalledWith(3, '🏠 Using default port for local development');
    });

    test('should handle different port numbers correctly', () => {
      const testCases = [
        { port: 3000, source: 'environment', isRailwayManaged: true },
        { port: 4000, source: 'environment', isRailwayManaged: true },
        { port: 5001, source: 'default', isRailwayManaged: false }
      ];

      testCases.forEach((config, index) => {
        mockConsoleLog.mockClear();
        logPortConfig(config);
        
        expect(mockConsoleLog).toHaveBeenNthCalledWith(1, `🚀 Server starting on port ${config.port}`);
        expect(mockConsoleLog).toHaveBeenNthCalledWith(2, `📍 Port source: ${config.source}`);
      });
    });
  });

  describe('logPortError()', () => {
    test('should log EADDRINUSE error with suggestion', () => {
      const error = new Error('listen EADDRINUSE: address already in use :::8080');
      error.code = 'EADDRINUSE';
      const port = 8080;
      
      logPortError(error, port);
      
      expect(mockConsoleError).toHaveBeenCalledTimes(3);
      expect(mockConsoleError).toHaveBeenNthCalledWith(1, '❌ Failed to bind to port 8080: listen EADDRINUSE: address already in use :::8080');
      expect(mockConsoleError).toHaveBeenNthCalledWith(2, '💡 Suggestion: Port 8080 is already in use. Check for other running processes.');
      expect(mockConsoleError).toHaveBeenNthCalledWith(3, '🔍 Environment PORT: undefined');
    });

    test('should log EACCES error with suggestion', () => {
      const error = new Error('listen EACCES: permission denied');
      error.code = 'EACCES';
      const port = 80;
      
      logPortError(error, port);
      
      expect(mockConsoleError).toHaveBeenCalledTimes(3);
      expect(mockConsoleError).toHaveBeenNthCalledWith(1, '❌ Failed to bind to port 80: listen EACCES: permission denied');
      expect(mockConsoleError).toHaveBeenNthCalledWith(2, '💡 Suggestion: Permission denied for port 80. Try running with appropriate permissions.');
      expect(mockConsoleError).toHaveBeenNthCalledWith(3, '🔍 Environment PORT: undefined');
    });

    test('should log generic error without specific suggestion', () => {
      const error = new Error('Some other error');
      const port = 3000;
      
      logPortError(error, port);
      
      expect(mockConsoleError).toHaveBeenCalledTimes(2);
      expect(mockConsoleError).toHaveBeenNthCalledWith(1, '❌ Failed to bind to port 3000: Some other error');
      expect(mockConsoleError).toHaveBeenNthCalledWith(2, '🔍 Environment PORT: undefined');
    });

    test('should show environment PORT value when set', () => {
      process.env.PORT = '8080';
      const error = new Error('Test error');
      const port = 8080;
      
      logPortError(error, port);
      
      expect(mockConsoleError).toHaveBeenCalledWith('🔍 Environment PORT: 8080');
    });

    test('should show undefined when PORT environment variable is not set', () => {
      delete process.env.PORT;
      const error = new Error('Test error');
      const port = 5001;
      
      logPortError(error, port);
      
      expect(mockConsoleError).toHaveBeenCalledWith('🔍 Environment PORT: undefined');
    });
  });

  describe('Integration scenarios', () => {
    test('should handle complete Railway deployment scenario', () => {
      process.env.PORT = '8080';
      
      const config = getPortConfig();
      logPortConfig(config);
      
      // Verify configuration
      expect(config.port).toBe(8080);
      expect(config.source).toBe('environment');
      expect(config.isRailwayManaged).toBe(true);
      
      // Verify logging
      expect(mockConsoleLog).toHaveBeenCalledWith('🚀 Server starting on port 8080');
      expect(mockConsoleLog).toHaveBeenCalledWith('📍 Port source: environment');
      expect(mockConsoleLog).toHaveBeenCalledWith('🚂 Railway managed port detected');
    });

    test('should handle complete local development scenario', () => {
      delete process.env.PORT;
      
      const config = getPortConfig();
      logPortConfig(config);
      
      // Verify configuration
      expect(config.port).toBe(5001);
      expect(config.source).toBe('default');
      expect(config.isRailwayManaged).toBe(false);
      
      // Verify logging
      expect(mockConsoleLog).toHaveBeenCalledWith('🚀 Server starting on port 5001');
      expect(mockConsoleLog).toHaveBeenCalledWith('📍 Port source: default');
      expect(mockConsoleLog).toHaveBeenCalledWith('🏠 Using default port for local development');
    });

    test('should handle invalid environment variable gracefully', () => {
      process.env.PORT = 'invalid-port';
      
      const config = getPortConfig();
      logPortConfig(config);
      
      // Should fall back to default
      expect(config.port).toBe(5001);
      expect(config.source).toBe('default');
      expect(config.isRailwayManaged).toBe(false);
      
      // Should log as local development
      expect(mockConsoleLog).toHaveBeenCalledWith('🏠 Using default port for local development');
    });
  });
});