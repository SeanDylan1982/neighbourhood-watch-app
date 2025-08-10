import {
  compressImage,
  generateThumbnail,
  generateMultipleThumbnails,
  getOptimalImageFormat,
  calculateCompressionRatio,
  validateImageFile
} from '../mediaOptimization';

// Mock canvas and image APIs
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: jest.fn(() => ({
    drawImage: jest.fn()
  })),
  toBlob: jest.fn((callback, format, quality) => {
    const blob = new Blob(['mock-blob'], { type: format });
    callback(blob);
  }),
  toDataURL: jest.fn((format) => `data:${format};base64,mock-data`)
};

const mockImage = {
  width: 800,
  height: 600,
  onload: null,
  onerror: null,
  src: ''
};

// Mock DOM APIs
Object.defineProperty(document, 'createElement', {
  value: jest.fn((tagName) => {
    if (tagName === 'canvas') return mockCanvas;
    if (tagName === 'img') return mockImage;
    return {};
  })
});

Object.defineProperty(global, 'Image', {
  value: jest.fn(() => mockImage)
});

Object.defineProperty(URL, 'createObjectURL', {
  value: jest.fn(() => 'blob:mock-url')
});

describe('mediaOptimization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('compressImage', () => {
    it('should compress an image file', async () => {
      const mockFile = new File(['mock-image'], 'test.jpg', { type: 'image/jpeg' });
      
      // Simulate image load
      setTimeout(() => {
        mockImage.onload();
      }, 0);

      const result = await compressImage(mockFile);
      
      expect(result).toBeInstanceOf(File);
      expect(result.name).toBe('test.jpg');
      expect(document.createElement).toHaveBeenCalledWith('canvas');
      expect(document.createElement).toHaveBeenCalledWith('img');
    });

    it('should handle compression options', async () => {
      const mockFile = new File(['mock-image'], 'test.jpg', { type: 'image/jpeg' });
      const options = {
        maxWidth: 1000,
        maxHeight: 800,
        quality: 0.9,
        format: 'image/webp'
      };
      
      setTimeout(() => {
        mockImage.onload();
      }, 0);

      await compressImage(mockFile, options);
      
      expect(mockCanvas.toBlob).toHaveBeenCalledWith(
        expect.any(Function),
        'image/webp',
        0.9
      );
    });

    it('should handle image load errors', async () => {
      const mockFile = new File(['mock-image'], 'test.jpg', { type: 'image/jpeg' });
      
      setTimeout(() => {
        mockImage.onerror();
      }, 0);

      await expect(compressImage(mockFile)).rejects.toThrow('Failed to load image');
    });
  });

  describe('generateThumbnail', () => {
    it('should generate thumbnail from file', async () => {
      const mockFile = new File(['mock-image'], 'test.jpg', { type: 'image/jpeg' });
      
      setTimeout(() => {
        mockImage.onload();
      }, 0);

      const result = await generateThumbnail(mockFile);
      
      expect(result).toBe('data:image/jpeg;base64,mock-data');
      expect(mockCanvas.width).toBe(150);
      expect(mockCanvas.height).toBe(150);
    });

    it('should generate thumbnail from URL', async () => {
      const imageUrl = 'https://example.com/image.jpg';
      
      setTimeout(() => {
        mockImage.onload();
      }, 0);

      const result = await generateThumbnail(imageUrl);
      
      expect(result).toBe('data:image/jpeg;base64,mock-data');
      expect(mockImage.src).toBe(imageUrl);
    });

    it('should handle custom thumbnail options', async () => {
      const mockFile = new File(['mock-image'], 'test.jpg', { type: 'image/jpeg' });
      const options = {
        width: 200,
        height: 200,
        quality: 0.8,
        format: 'image/png'
      };
      
      setTimeout(() => {
        mockImage.onload();
      }, 0);

      await generateThumbnail(mockFile, options);
      
      expect(mockCanvas.width).toBe(200);
      expect(mockCanvas.height).toBe(200);
      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/png', 0.8);
    });
  });

  describe('generateMultipleThumbnails', () => {
    it('should generate multiple thumbnail sizes', async () => {
      const mockFile = new File(['mock-image'], 'test.jpg', { type: 'image/jpeg' });
      const sizes = [
        { width: 100, height: 100, name: 'small' },
        { width: 200, height: 200, name: 'medium' }
      ];
      
      // Mock multiple image loads
      let loadCount = 0;
      const originalOnload = mockImage.onload;
      Object.defineProperty(mockImage, 'onload', {
        set: function(callback) {
          setTimeout(() => {
            callback();
            loadCount++;
          }, 0);
        },
        get: function() {
          return originalOnload;
        }
      });

      const result = await generateMultipleThumbnails(mockFile, sizes);
      
      expect(result).toHaveProperty('small');
      expect(result).toHaveProperty('medium');
      expect(result.small).toBe('data:image/jpeg;base64,mock-data');
      expect(result.medium).toBe('data:image/jpeg;base64,mock-data');
    });

    it('should use default sizes when none provided', async () => {
      const mockFile = new File(['mock-image'], 'test.jpg', { type: 'image/jpeg' });
      
      let loadCount = 0;
      Object.defineProperty(mockImage, 'onload', {
        set: function(callback) {
          setTimeout(() => {
            callback();
            loadCount++;
          }, 0);
        }
      });

      const result = await generateMultipleThumbnails(mockFile);
      
      expect(result).toHaveProperty('small');
      expect(result).toHaveProperty('medium');
      expect(result).toHaveProperty('large');
    });
  });

  describe('getOptimalImageFormat', () => {
    it('should return webp when supported', () => {
      mockCanvas.toDataURL.mockReturnValue('data:image/webp;base64,mock');
      
      const format = getOptimalImageFormat();
      
      expect(format).toBe('image/webp');
    });

    it('should return jpeg as fallback', () => {
      mockCanvas.toDataURL.mockReturnValue('data:image/jpeg;base64,mock');
      
      const format = getOptimalImageFormat();
      
      expect(format).toBe('image/jpeg');
    });
  });

  describe('calculateCompressionRatio', () => {
    it('should calculate compression ratio correctly', () => {
      const originalSize = 1000000; // 1MB
      const compressedSize = 500000; // 0.5MB
      
      const ratio = calculateCompressionRatio(originalSize, compressedSize);
      
      expect(ratio).toBe(50);
    });

    it('should handle zero compression', () => {
      const originalSize = 1000000;
      const compressedSize = 1000000;
      
      const ratio = calculateCompressionRatio(originalSize, compressedSize);
      
      expect(ratio).toBe(0);
    });
  });

  describe('validateImageFile', () => {
    it('should validate valid image file', () => {
      const file = new File(['mock-image'], 'test.jpg', { 
        type: 'image/jpeg',
        size: 1024 * 1024 // 1MB
      });
      
      const result = validateImageFile(file);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid file type', () => {
      const file = new File(['mock-file'], 'test.txt', { 
        type: 'text/plain',
        size: 1024
      });
      
      const result = validateImageFile(file);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File type text/plain is not allowed');
    });

    it('should reject oversized file', () => {
      const file = new File(['mock-image'], 'test.jpg', { 
        type: 'image/jpeg',
        size: 20 * 1024 * 1024 // 20MB
      });
      
      const result = validateImageFile(file, { maxSize: 10 * 1024 * 1024 });
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('exceeds maximum');
    });

    it('should handle custom validation options', () => {
      const file = new File(['mock-image'], 'test.gif', { 
        type: 'image/gif',
        size: 1024
      });
      
      const result = validateImageFile(file, {
        allowedTypes: ['image/jpeg', 'image/png'],
        maxSize: 500
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });
});