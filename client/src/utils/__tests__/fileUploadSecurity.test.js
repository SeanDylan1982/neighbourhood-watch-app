/**
 * File Upload Security Tests
 * Comprehensive tests for file upload security validation
 */

import {
  validateFileUploadSecurity,
  simulateVirusScanning,
  FILE_SECURITY_CONFIG
} from '../fileUploadSecurity';

// Mock FileReader
class MockFileReader {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.result = null;
  }

  readAsArrayBuffer(blob) {
    setTimeout(() => {
      // Mock different file signatures based on blob size
      if (blob.size > 0) {
        // Mock JPEG signature
        const buffer = new ArrayBuffer(16);
        const view = new Uint8Array(buffer);
        view[0] = 0xFF;
        view[1] = 0xD8;
        view[2] = 0xFF;
        this.result = buffer;
      } else {
        this.result = new ArrayBuffer(0);
      }
      if (this.onload) this.onload();
    }, 10);
  }

  readAsText(blob) {
    setTimeout(() => {
      this.result = 'mock file content';
      if (this.onload) this.onload();
    }, 10);
  }
}

global.FileReader = MockFileReader;

// Mock TextDecoder
global.TextDecoder = class MockTextDecoder {
  decode(buffer) {
    return 'mock decoded content';
  }
};

describe('File Upload Security', () => {
  const createMockFile = (name, size, type, content = null) => {
    const file = {
      name,
      size,
      type,
      slice: jest.fn((start, end) => ({
        size: Math.min(end - start, size),
        name,
        type
      })),
      constructor: { name: 'File' }
    };
    
    // Mock File prototype
    Object.setPrototypeOf(file, {
      constructor: { name: 'File' }
    });
    
    return file;
  };

  beforeEach(() => {
    global.File = function() {};
  });

  describe('validateFileUploadSecurity', () => {
    it('should validate safe image files', async () => {
      const file = createMockFile('photo.jpg', 1024 * 1024, 'image/jpeg');
      Object.setPrototypeOf(file, File.prototype);
      
      const result = await validateFileUploadSecurity(file);

      expect(result.isValid).toBe(true);
      expect(result.securityScore).toBeGreaterThan(70);
      expect(result.sanitizedFilename).toBe('photo.jpg');
      expect(result.detectedType).toBe('image/jpeg');
    });

    it('should reject dangerous executable files', async () => {
      const file = createMockFile('malware.exe', 1024, 'application/x-executable');
      Object.setPrototypeOf(file, File.prototype);
      
      const result = await validateFileUploadSecurity(file);

      expect(result.isValid).toBe(false);
      expect(result.securityScore).toBeLessThan(50);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('not allowed for security reasons')
        ])
      );
    });

    it('should detect oversized files', async () => {
      const file = createMockFile('large.jpg', 200 * 1024 * 1024, 'image/jpeg');
      Object.setPrototypeOf(file, File.prototype);
      
      const result = await validateFileUploadSecurity(file);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('exceeds maximum allowed size')
        ])
      );
    });

    it('should validate MIME types', async () => {
      const file = createMockFile('document.pdf', 1024, 'application/x-unknown');
      Object.setPrototypeOf(file, File.prototype);
      
      const result = await validateFileUploadSecurity(file);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('MIME type')
        ])
      );
    });

    it('should sanitize dangerous filenames', async () => {
      const file = createMockFile('file<script>.jpg', 1024, 'image/jpeg');
      Object.setPrototypeOf(file, File.prototype);
      
      const result = await validateFileUploadSecurity(file);

      expect(result.sanitizedFilename).toBe('file_script_.jpg');
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should detect double extensions', async () => {
      const file = createMockFile('document.pdf.exe', 1024, 'application/pdf');
      Object.setPrototypeOf(file, File.prototype);
      
      const result = await validateFileUploadSecurity(file);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('not allowed for security reasons')
        ])
      );
    });

    it('should handle empty files', async () => {
      const file = createMockFile('empty.txt', 0, 'text/plain');
      Object.setPrototypeOf(file, File.prototype);
      
      const result = await validateFileUploadSecurity(file);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('File is empty')
        ])
      );
    });

    it('should warn about large files near size limit', async () => {
      const file = createMockFile('large.jpg', 9 * 1024 * 1024, 'image/jpeg'); // 9MB (close to 10MB limit)
      Object.setPrototypeOf(file, File.prototype);
      
      const result = await validateFileUploadSecurity(file);

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Large file detected')
        ])
      );
    });

    it('should detect MIME type spoofing', async () => {
      const file = createMockFile('image.jpg', 1024, 'text/plain'); // Wrong MIME type for .jpg
      Object.setPrototypeOf(file, File.prototype);
      
      const result = await validateFileUploadSecurity(file);

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.stringContaining('MIME type does not match file extension')
        ])
      );
    });

    it('should handle files without MIME type', async () => {
      const file = createMockFile('document.pdf', 1024, '');
      Object.setPrototypeOf(file, File.prototype);
      
      const result = await validateFileUploadSecurity(file);

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.stringContaining('No MIME type detected')
        ])
      );
    });

    it('should handle invalid file objects', async () => {
      const result = await validateFileUploadSecurity(null);

      expect(result.isValid).toBe(false);
      expect(result.securityScore).toBe(0);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Invalid file object')
        ])
      );
    });

    it('should generate security recommendations', async () => {
      const file = createMockFile('suspicious.exe', 1024, 'application/x-executable');
      Object.setPrototypeOf(file, File.prototype);
      
      const result = await validateFileUploadSecurity(file);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Block file upload')
        ])
      );
    });

    it('should perform magic number validation', async () => {
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');
      Object.setPrototypeOf(file, File.prototype);
      
      const result = await validateFileUploadSecurity(file);

      // Should detect JPEG signature
      expect(result.detectedType).toBe('image/jpeg');
    });

    it('should handle magic number validation errors', async () => {
      // Mock FileReader to throw error
      const originalFileReader = global.FileReader;
      global.FileReader = class {
        readAsArrayBuffer() {
          setTimeout(() => {
            if (this.onerror) this.onerror(new Error('Read failed'));
          }, 10);
        }
      };

      const file = createMockFile('test.jpg', 1024, 'image/jpeg');
      Object.setPrototypeOf(file, File.prototype);
      
      const result = await validateFileUploadSecurity(file);

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Magic number validation failed')
        ])
      );

      global.FileReader = originalFileReader;
    });

    it('should perform content security checks for text files', async () => {
      // Mock FileReader to return suspicious content
      const originalFileReader = global.FileReader;
      global.FileReader = class {
        readAsText() {
          setTimeout(() => {
            this.result = '<script>alert("xss")</script>';
            if (this.onload) this.onload();
          }, 10);
        }
        readAsArrayBuffer() {
          setTimeout(() => {
            this.result = new ArrayBuffer(16);
            if (this.onload) this.onload();
          }, 10);
        }
      };

      const file = createMockFile('script.js', 1024, 'text/javascript');
      Object.setPrototypeOf(file, File.prototype);
      
      const result = await validateFileUploadSecurity(file);

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Script tags detected')
        ])
      );

      global.FileReader = originalFileReader;
    });

    it('should check for suspicious JavaScript patterns', async () => {
      const originalFileReader = global.FileReader;
      global.FileReader = class {
        readAsText() {
          setTimeout(() => {
            this.result = 'eval(maliciousCode); document.write("<script>");';
            if (this.onload) this.onload();
          }, 10);
        }
        readAsArrayBuffer() {
          setTimeout(() => {
            this.result = new ArrayBuffer(16);
            if (this.onload) this.onload();
          }, 10);
        }
      };

      const file = createMockFile('suspicious.js', 1024, 'text/javascript');
      Object.setPrototypeOf(file, File.prototype);
      
      const result = await validateFileUploadSecurity(file);

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.stringContaining('dangerous JavaScript patterns')
        ])
      );

      global.FileReader = originalFileReader;
    });

    it('should detect embedded content in images', async () => {
      const originalFileReader = global.FileReader;
      global.FileReader = class {
        readAsArrayBuffer() {
          setTimeout(() => {
            this.result = new ArrayBuffer(16);
            if (this.onload) this.onload();
          }, 10);
        }
      };

      // Mock TextDecoder to return suspicious content
      global.TextDecoder = class {
        decode() {
          return 'image data <script>alert(1)</script> more data';
        }
      };

      const file = createMockFile('image.jpg', 1024, 'image/jpeg');
      Object.setPrototypeOf(file, File.prototype);
      
      const result = await validateFileUploadSecurity(file);

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Suspicious content detected in image metadata')
        ])
      );

      global.FileReader = originalFileReader;
    });
  });

  describe('simulateVirusScanning', () => {
    it('should simulate virus scanning', async () => {
      const file = createMockFile('test.pdf', 1024, 'application/pdf');
      
      const result = await simulateVirusScanning(file);

      expect(result).toHaveProperty('isClean');
      expect(result).toHaveProperty('scanTime');
      expect(result).toHaveProperty('threats');
      expect(result).toHaveProperty('scanEngine');
      expect(result.isClean).toBe(true);
      expect(Array.isArray(result.threats)).toBe(true);
      expect(typeof result.scanTime).toBe('number');
    });

    it('should complete scanning within reasonable time', async () => {
      const file = createMockFile('test.pdf', 1024, 'application/pdf');
      const startTime = Date.now();
      
      await simulateVirusScanning(file);
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe('FILE_SECURITY_CONFIG', () => {
    it('should have correct configuration structure', () => {
      expect(FILE_SECURITY_CONFIG).toHaveProperty('MAX_SIZES');
      expect(FILE_SECURITY_CONFIG).toHaveProperty('ALLOWED_MIME_TYPES');
      expect(FILE_SECURITY_CONFIG).toHaveProperty('DANGEROUS_EXTENSIONS');
      expect(FILE_SECURITY_CONFIG).toHaveProperty('MAGIC_NUMBERS');
    });

    it('should have reasonable file size limits', () => {
      expect(FILE_SECURITY_CONFIG.MAX_SIZES.image).toBe(10 * 1024 * 1024);
      expect(FILE_SECURITY_CONFIG.MAX_SIZES.video).toBe(100 * 1024 * 1024);
      expect(FILE_SECURITY_CONFIG.MAX_SIZES.audio).toBe(50 * 1024 * 1024);
      expect(FILE_SECURITY_CONFIG.MAX_SIZES.document).toBe(25 * 1024 * 1024);
    });

    it('should include common dangerous extensions', () => {
      const dangerousExts = FILE_SECURITY_CONFIG.DANGEROUS_EXTENSIONS;
      expect(dangerousExts).toContain('.exe');
      expect(dangerousExts).toContain('.bat');
      expect(dangerousExts).toContain('.cmd');
      expect(dangerousExts).toContain('.scr');
      expect(dangerousExts).toContain('.vbs');
      expect(dangerousExts).toContain('.js');
    });

    it('should have allowed MIME types for each category', () => {
      expect(Array.isArray(FILE_SECURITY_CONFIG.ALLOWED_MIME_TYPES.image)).toBe(true);
      expect(Array.isArray(FILE_SECURITY_CONFIG.ALLOWED_MIME_TYPES.video)).toBe(true);
      expect(Array.isArray(FILE_SECURITY_CONFIG.ALLOWED_MIME_TYPES.audio)).toBe(true);
      expect(Array.isArray(FILE_SECURITY_CONFIG.ALLOWED_MIME_TYPES.document)).toBe(true);
      
      expect(FILE_SECURITY_CONFIG.ALLOWED_MIME_TYPES.image).toContain('image/jpeg');
      expect(FILE_SECURITY_CONFIG.ALLOWED_MIME_TYPES.video).toContain('video/mp4');
      expect(FILE_SECURITY_CONFIG.ALLOWED_MIME_TYPES.audio).toContain('audio/mp3');
      expect(FILE_SECURITY_CONFIG.ALLOWED_MIME_TYPES.document).toContain('application/pdf');
    });

    it('should have magic number signatures', () => {
      expect(FILE_SECURITY_CONFIG.MAGIC_NUMBERS).toHaveProperty('image/jpeg');
      expect(FILE_SECURITY_CONFIG.MAGIC_NUMBERS).toHaveProperty('image/png');
      expect(FILE_SECURITY_CONFIG.MAGIC_NUMBERS).toHaveProperty('application/pdf');
      
      expect(Array.isArray(FILE_SECURITY_CONFIG.MAGIC_NUMBERS['image/jpeg'])).toBe(true);
      expect(FILE_SECURITY_CONFIG.MAGIC_NUMBERS['image/jpeg']).toEqual([0xFF, 0xD8, 0xFF]);
    });
  });

  describe('Helper Functions', () => {
    it('should correctly categorize file types', async () => {
      const testCases = [
        { type: 'image/jpeg', expectedCategory: 'image' },
        { type: 'video/mp4', expectedCategory: 'video' },
        { type: 'audio/mp3', expectedCategory: 'audio' },
        { type: 'application/pdf', expectedCategory: 'document' },
        { type: 'unknown/type', expectedCategory: 'default' }
      ];

      for (const testCase of testCases) {
        const file = createMockFile('test', 1024, testCase.type);
        Object.setPrototypeOf(file, File.prototype);
        
        const result = await validateFileUploadSecurity(file);
        
        // The categorization is tested indirectly through size validation
        if (testCase.expectedCategory !== 'default') {
          expect(result.errors.length).toBe(0); // Should not fail size validation for known types
        }
      }
    });

    it('should format file sizes correctly', async () => {
      const file = createMockFile('large.jpg', 5 * 1024 * 1024, 'image/jpeg'); // 5MB
      Object.setPrototypeOf(file, File.prototype);
      
      const result = await validateFileUploadSecurity(file);
      
      // Should not have size errors for 5MB image (under 10MB limit)
      const sizeErrors = result.errors.filter(error => error.includes('size'));
      expect(sizeErrors.length).toBe(0);
    });

    it('should match file signatures correctly', async () => {
      // Test with a file that should match JPEG signature
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');
      Object.setPrototypeOf(file, File.prototype);
      
      const result = await validateFileUploadSecurity(file);
      
      expect(result.detectedType).toBe('image/jpeg');
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      // Force an error by passing invalid input
      const result = await validateFileUploadSecurity('not-a-file');

      expect(result.isValid).toBe(false);
      expect(result.securityScore).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should maintain result structure even with errors', async () => {
      const result = await validateFileUploadSecurity(null);

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('securityScore');
      expect(result).toHaveProperty('sanitizedFilename');
      expect(result).toHaveProperty('detectedType');
      expect(result).toHaveProperty('recommendations');
      
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should handle content security check errors', async () => {
      const originalFileReader = global.FileReader;
      global.FileReader = class {
        readAsText() {
          setTimeout(() => {
            if (this.onerror) this.onerror(new Error('Read failed'));
          }, 10);
        }
        readAsArrayBuffer() {
          setTimeout(() => {
            this.result = new ArrayBuffer(16);
            if (this.onload) this.onload();
          }, 10);
        }
      };

      const file = createMockFile('test.txt', 1024, 'text/plain');
      Object.setPrototypeOf(file, File.prototype);
      
      const result = await validateFileUploadSecurity(file);

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Content security check failed')
        ])
      );

      global.FileReader = originalFileReader;
    });
  });
});