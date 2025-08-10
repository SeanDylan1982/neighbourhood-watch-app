import { renderHook, act } from '@testing-library/react';
import useMediaUpload from '../useMediaUpload';

// Mock XMLHttpRequest
const mockXHR = {
  open: jest.fn(),
  send: jest.fn(),
  setRequestHeader: jest.fn(),
  addEventListener: jest.fn(),
  upload: {
    addEventListener: jest.fn()
  },
  status: 200,
  responseText: JSON.stringify({
    id: 'test-id',
    url: 'test-url',
    thumbnailUrl: 'test-thumbnail-url'
  })
};

global.XMLHttpRequest = jest.fn(() => mockXHR);

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');

// Mock canvas and image for compression
const mockContext = {
  drawImage: jest.fn(),
};

const mockCanvas = {
  getContext: jest.fn(() => mockContext),
  toBlob: jest.fn((callback) => {
    callback(new Blob(['mock'], { type: 'image/jpeg' }));
  }),
  width: 0,
  height: 0
};

// Mock document.createElement for canvas
const originalCreateElement = document.createElement;
document.createElement = jest.fn((tagName) => {
  if (tagName === 'canvas') {
    return mockCanvas;
  }
  return originalCreateElement.call(document, tagName);
});

// Mock Image constructor
global.Image = class {
  constructor() {
    setTimeout(() => {
      this.onload && this.onload();
    }, 100);
  }
  set src(value) {
    this._src = value;
  }
  get src() {
    return this._src;
  }
  width = 1920;
  height = 1080;
};

describe('useMediaUpload Hook', () => {
  const mockOnUploadComplete = jest.fn();
  const mockOnUploadError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockXHR.addEventListener.mockClear();
    mockXHR.upload.addEventListener.mockClear();
  });

  describe('Basic functionality', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useMediaUpload());

      expect(result.current.files).toEqual([]);
      expect(result.current.uploading).toBe(false);
      expect(result.current.uploadProgress).toEqual({});
      expect(result.current.error).toBe('');
      expect(result.current.compressing).toEqual({});
    });

    it('should initialize with custom options', () => {
      const { result } = renderHook(() => useMediaUpload({
        maxFiles: 5,
        maxSize: 1024 * 1024,
        onUploadComplete: mockOnUploadComplete,
        onUploadError: mockOnUploadError
      }));

      expect(result.current.files).toEqual([]);
      expect(result.current.uploading).toBe(false);
    });
  });

  describe('File management', () => {
    it('should add files to the queue', () => {
      const { result } = renderHook(() => useMediaUpload());

      const mockFile = {
        id: 'test-1',
        file: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
        name: 'test.jpg',
        size: 1024,
        type: 'image'
      };

      act(() => {
        const success = result.current.addFiles([mockFile]);
        expect(success).toBe(true);
      });

      expect(result.current.files).toHaveLength(1);
      expect(result.current.files[0]).toEqual(mockFile);
    });

    it('should enforce maximum file limit', () => {
      const { result } = renderHook(() => useMediaUpload({ maxFiles: 2 }));

      const mockFiles = [
        { id: 'test-1', file: new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }), name: 'test1.jpg', size: 1024, type: 'image' },
        { id: 'test-2', file: new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }), name: 'test2.jpg', size: 1024, type: 'image' },
        { id: 'test-3', file: new File(['test3'], 'test3.jpg', { type: 'image/jpeg' }), name: 'test3.jpg', size: 1024, type: 'image' }
      ];

      act(() => {
        result.current.addFiles([mockFiles[0], mockFiles[1]]);
      });

      expect(result.current.files).toHaveLength(2);

      act(() => {
        const success = result.current.addFiles([mockFiles[2]]);
        expect(success).toBe(false);
      });

      expect(result.current.files).toHaveLength(2);
      expect(result.current.error).toContain('Maximum 2 files allowed');
    });

    it('should remove files from the queue', () => {
      const { result } = renderHook(() => useMediaUpload());

      const mockFile = {
        id: 'test-1',
        file: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
        name: 'test.jpg',
        size: 1024,
        type: 'image'
      };

      act(() => {
        result.current.addFiles([mockFile]);
      });

      expect(result.current.files).toHaveLength(1);

      act(() => {
        result.current.removeFile('test-1');
      });

      expect(result.current.files).toHaveLength(0);
    });

    it('should clear all files', () => {
      const { result } = renderHook(() => useMediaUpload());

      const mockFiles = [
        { id: 'test-1', file: new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }), name: 'test1.jpg', size: 1024, type: 'image' },
        { id: 'test-2', file: new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }), name: 'test2.jpg', size: 1024, type: 'image' }
      ];

      act(() => {
        result.current.addFiles(mockFiles);
      });

      expect(result.current.files).toHaveLength(2);

      act(() => {
        result.current.clearAllFiles();
      });

      expect(result.current.files).toHaveLength(0);
    });
  });

  describe('File validation', () => {
    it('should validate file size', () => {
      const { result } = renderHook(() => useMediaUpload({ maxSize: 1024 }));

      const smallFile = new File(['x'], 'small.jpg', { type: 'image/jpeg' });
      const largeFile = new File(['x'.repeat(2048)], 'large.jpg', { type: 'image/jpeg' });

      act(() => {
        const smallValidation = result.current.validateFile(smallFile);
        expect(smallValidation).toBe(null);

        const largeValidation = result.current.validateFile(largeFile);
        expect(largeValidation).toContain('too large');
      });
    });

    it('should validate file type', () => {
      const { result } = renderHook(() => useMediaUpload());

      const imageFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const videoFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });
      const textFile = new File(['test'], 'test.txt', { type: 'text/plain' });

      act(() => {
        const imageValidation = result.current.validateFile(imageFile);
        expect(imageValidation).toBe(null);

        const videoValidation = result.current.validateFile(videoFile);
        expect(videoValidation).toBe(null);

        const textValidation = result.current.validateFile(textFile);
        expect(textValidation).toContain('not a supported media type');
      });
    });
  });

  describe('Image compression', () => {
    it('should compress images', async () => {
      const { result } = renderHook(() => useMediaUpload());

      const imageFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await act(async () => {
        const compressedFile = await result.current.compressImage(imageFile);
        expect(compressedFile).toBeInstanceOf(File);
        expect(compressedFile.name).toBe('test.jpg');
        expect(compressedFile.type).toBe('image/jpeg');
      });
    });

    it('should not compress non-image files', async () => {
      const { result } = renderHook(() => useMediaUpload());

      const videoFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });

      await act(async () => {
        const result_file = await result.current.compressImage(videoFile);
        expect(result_file).toBe(videoFile); // Should return original file
      });
    });
  });

  describe('Upload functionality', () => {
    it('should upload files successfully', async () => {
      const { result } = renderHook(() => useMediaUpload({
        onUploadComplete: mockOnUploadComplete
      }));

      const mockFile = {
        id: 'test-1',
        file: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
        name: 'test.jpg',
        size: 1024,
        type: 'image',
        compressed: false
      };

      act(() => {
        result.current.addFiles([mockFile]);
      });

      // Mock successful upload
      mockXHR.addEventListener.mockImplementation((event, callback) => {
        if (event === 'load') {
          setTimeout(() => callback(), 100);
        }
      });

      await act(async () => {
        await result.current.uploadAllFiles();
      });

      expect(mockOnUploadComplete).toHaveBeenCalled();
    });

    it('should handle upload errors', async () => {
      const { result } = renderHook(() => useMediaUpload({
        onUploadError: mockOnUploadError
      }));

      const mockFile = {
        id: 'test-1',
        file: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
        name: 'test.jpg',
        size: 1024,
        type: 'image',
        compressed: false
      };

      act(() => {
        result.current.addFiles([mockFile]);
      });

      // Mock failed upload
      mockXHR.addEventListener.mockImplementation((event, callback) => {
        if (event === 'error') {
          setTimeout(() => callback(), 100);
        }
      });

      await act(async () => {
        await result.current.uploadAllFiles();
      });

      expect(result.current.error).toContain('Failed to upload');
    });

    it('should track upload progress', async () => {
      const { result } = renderHook(() => useMediaUpload());

      const mockFile = {
        id: 'test-1',
        file: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
        name: 'test.jpg',
        size: 1024,
        type: 'image',
        compressed: false
      };

      act(() => {
        result.current.addFiles([mockFile]);
      });

      // Mock progress event
      mockXHR.upload.addEventListener.mockImplementation((event, callback) => {
        if (event === 'progress') {
          setTimeout(() => {
            callback({
              lengthComputable: true,
              loaded: 512,
              total: 1024
            });
          }, 50);
        }
      });

      mockXHR.addEventListener.mockImplementation((event, callback) => {
        if (event === 'load') {
          setTimeout(() => callback(), 100);
        }
      });

      await act(async () => {
        await result.current.uploadAllFiles();
      });

      // Progress should have been tracked
      expect(mockXHR.upload.addEventListener).toHaveBeenCalledWith('progress', expect.any(Function));
    });

    it('should cancel uploads', () => {
      const { result } = renderHook(() => useMediaUpload());

      act(() => {
        result.current.cancelUploads();
      });

      expect(result.current.uploading).toBe(false);
      expect(result.current.uploadProgress).toEqual({});
      expect(result.current.error).toBe('');
    });
  });

  describe('Upload statistics', () => {
    it('should provide accurate upload statistics', () => {
      const { result } = renderHook(() => useMediaUpload());

      const mockFiles = [
        { id: 'test-1', file: new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }), name: 'test1.jpg', size: 1024, type: 'image' },
        { id: 'test-2', file: new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }), name: 'test2.jpg', size: 2048, type: 'image' }
      ];

      act(() => {
        result.current.addFiles(mockFiles);
      });

      const stats = result.current.getUploadStats();

      expect(stats.totalFiles).toBe(2);
      expect(stats.totalSize).toBe(3072); // 1024 + 2048
      expect(stats.hasFiles).toBe(true);
      expect(stats.isUploading).toBe(false);
      expect(stats.hasError).toBe(false);
    });

    it('should track uploading files', () => {
      const { result } = renderHook(() => useMediaUpload());

      const mockFile = {
        id: 'test-1',
        file: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
        name: 'test.jpg',
        size: 1024,
        type: 'image'
      };

      act(() => {
        result.current.addFiles([mockFile]);
        // Simulate upload progress
        result.current.uploadProgress['test-1'] = 50;
      });

      const stats = result.current.getUploadStats();

      expect(stats.uploadingFiles).toBe(1);
      expect(stats.completedFiles).toBe(0);
    });
  });

  describe('Error handling', () => {
    it('should set and clear errors', () => {
      const { result } = renderHook(() => useMediaUpload());

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.setError('');
      });

      expect(result.current.error).toBe('');
    });

    it('should handle compression state', () => {
      const { result } = renderHook(() => useMediaUpload());

      act(() => {
        result.current.setCompressing({ 'test-1': true });
      });

      expect(result.current.compressing).toEqual({ 'test-1': true });

      act(() => {
        result.current.setCompressing({});
      });

      expect(result.current.compressing).toEqual({});
    });
  });
});