import { renderHook, act } from '@testing-library/react';
import { useMediaOptimization } from '../useMediaOptimization';

import {
  compressImage,
  generateThumbnail,
  generateMultipleThumbnails,
  validateImageFile,
  calculateCompressionRatio,
  getOptimalImageFormat
} from '../../utils/mediaOptimization';

import mediaCacheManager from '../../services/MediaCacheManager';

// Mock the media optimization utilities
jest.mock('../../utils/mediaOptimization', () => ({
  compressImage: jest.fn(),
  generateThumbnail: jest.fn(),
  generateMultipleThumbnails: jest.fn(),
  validateImageFile: jest.fn(),
  calculateCompressionRatio: jest.fn(),
  getOptimalImageFormat: jest.fn()
}));

// Mock the media cache manager
jest.mock('../../services/MediaCacheManager', () => ({
  __esModule: true,
  default: {
    getThumbnail: jest.fn(),
    storeThumbnail: jest.fn(),
    preloadThumbnails: jest.fn(),
    getCacheStats: jest.fn(),
    clearCache: jest.fn()
  }
}));

describe('useMediaOptimization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useMediaOptimization());
    
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.error).toBe(null);
  });

  describe('optimizeImage', () => {
    it('should optimize a single image successfully', async () => {
      const mockFile = new File(['mock'], 'test.jpg', { type: 'image/jpeg', size: 1000000 });
      const mockCompressedFile = new File(['compressed'], 'test.jpg', { type: 'image/jpeg', size: 500000 });
      const mockThumbnails = {
        small: 'data:image/jpeg;base64,small',
        medium: 'data:image/jpeg;base64,medium'
      };

      validateImageFile.mockReturnValue({ isValid: true, errors: [] });
      getOptimalImageFormat.mockReturnValue('image/jpeg');
      compressImage.mockResolvedValue(mockCompressedFile);
      generateMultipleThumbnails.mockResolvedValue(mockThumbnails);
      calculateCompressionRatio.mockReturnValue(50);
      mediaCacheManager.storeThumbnail.mockResolvedValue();

      // Mock URL.createObjectURL
      global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');

      const { result } = renderHook(() => useMediaOptimization());
      
      let optimizationResult;
      await act(async () => {
        optimizationResult = await result.current.optimizeImage(mockFile);
      });

      expect(result.current.isProcessing).toBe(false);
      expect(result.current.error).toBe(null);
      expect(optimizationResult).toEqual({
        originalFile: mockFile,
        optimizedFile: mockCompressedFile,
        thumbnails: mockThumbnails,
        compressionRatio: 50,
        originalSize: 1000000,
        optimizedSize: 500000,
        url: 'blob:mock-url'
      });
    });

    it('should handle validation errors', async () => {
      const mockFile = new File(['mock'], 'test.txt', { type: 'text/plain' });
      
      validateImageFile.mockReturnValue({ 
        isValid: false, 
        errors: ['File type text/plain is not allowed'] 
      });

      const { result } = renderHook(() => useMediaOptimization());
      
      await act(async () => {
        await expect(result.current.optimizeImage(mockFile)).rejects.toThrow(
          'File type text/plain is not allowed'
        );
      });

      expect(result.current.error).toBe('File type text/plain is not allowed');
    });

    it('should update progress during optimization', async () => {
      const mockFile = new File(['mock'], 'test.jpg', { type: 'image/jpeg' });
      
      validateImageFile.mockReturnValue({ isValid: true, errors: [] });
      compressImage.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockFile), 100))
      );
      generateMultipleThumbnails.mockResolvedValue({});
      
      const { result } = renderHook(() => useMediaOptimization());
      
      act(() => {
        result.current.optimizeImage(mockFile);
      });

      // Check that processing state is set
      expect(result.current.isProcessing).toBe(true);
    });
  });

  describe('getThumbnail', () => {
    it('should get cached thumbnail', async () => {
      const imageUrl = 'https://example.com/image.jpg';
      const cachedThumbnail = 'data:image/jpeg;base64,cached';
      
      mediaCacheManager.getThumbnail.mockResolvedValue(cachedThumbnail);

      const { result } = renderHook(() => useMediaOptimization());
      
      let thumbnail;
      await act(async () => {
        thumbnail = await result.current.getThumbnail(imageUrl);
      });

      expect(thumbnail).toBe(cachedThumbnail);
      expect(generateThumbnail).not.toHaveBeenCalled();
    });

    it('should generate and cache new thumbnail', async () => {
      const imageUrl = 'https://example.com/image.jpg';
      const newThumbnail = 'data:image/jpeg;base64,new';
      
      mediaCacheManager.getThumbnail.mockResolvedValue(null);
      generateThumbnail.mockResolvedValue(newThumbnail);
      mediaCacheManager.storeThumbnail.mockResolvedValue();

      const { result } = renderHook(() => useMediaOptimization());
      
      let thumbnail;
      await act(async () => {
        thumbnail = await result.current.getThumbnail(imageUrl);
      });

      expect(thumbnail).toBe(newThumbnail);
      expect(generateThumbnail).toHaveBeenCalledWith(imageUrl, {});
      expect(mediaCacheManager.storeThumbnail).toHaveBeenCalledWith(
        imageUrl, 
        newThumbnail, 
        {}
      );
    });
  });

  describe('optimizeMultipleImages', () => {
    it('should optimize multiple images', async () => {
      const mockFiles = [
        new File(['mock1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['mock2'], 'test2.jpg', { type: 'image/jpeg' })
      ];

      validateImageFile.mockReturnValue({ isValid: true, errors: [] });
      compressImage.mockResolvedValue(mockFiles[0]);
      generateMultipleThumbnails.mockResolvedValue({});
      calculateCompressionRatio.mockReturnValue(30);

      const { result } = renderHook(() => useMediaOptimization());
      
      let results;
      await act(async () => {
        results = await result.current.optimizeMultipleImages(mockFiles);
      });

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });

    it('should handle individual file failures', async () => {
      const mockFiles = [
        new File(['mock1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['mock2'], 'test2.txt', { type: 'text/plain' })
      ];

      validateImageFile
        .mockReturnValueOnce({ isValid: true, errors: [] })
        .mockReturnValueOnce({ isValid: false, errors: ['Invalid type'] });

      const { result } = renderHook(() => useMediaOptimization());
      
      let results;
      await act(async () => {
        results = await result.current.optimizeMultipleImages(mockFiles);
      });

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBe('Invalid type');
    });
  });

  describe('preloadThumbnails', () => {
    it('should preload thumbnails for multiple URLs', async () => {
      const imageUrls = ['url1.jpg', 'url2.jpg'];
      const preloadResults = [
        { url: 'url1.jpg', success: true },
        { url: 'url2.jpg', success: true }
      ];

      mediaCacheManager.preloadThumbnails.mockResolvedValue(preloadResults);

      const { result } = renderHook(() => useMediaOptimization());
      
      let results;
      await act(async () => {
        results = await result.current.preloadThumbnails(imageUrls);
      });

      expect(results).toEqual(preloadResults);
      expect(mediaCacheManager.preloadThumbnails).toHaveBeenCalledWith(imageUrls, {});
    });
  });

  describe('cache management', () => {
    it('should get cache stats', async () => {
      const mockStats = {
        memoryEntries: 10,
        dbEntries: 50,
        totalSizeBytes: 1024000,
        totalSizeMB: 1.0
      };

      mediaCacheManager.getCacheStats.mockResolvedValue(mockStats);

      const { result } = renderHook(() => useMediaOptimization());
      
      let stats;
      await act(async () => {
        stats = await result.current.getCacheStats();
      });

      expect(stats).toEqual(mockStats);
    });

    it('should clear cache', async () => {
      mediaCacheManager.clearCache.mockResolvedValue();

      const { result } = renderHook(() => useMediaOptimization());
      
      await act(async () => {
        await result.current.clearCache();
      });

      expect(mediaCacheManager.clearCache).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should set error state on failures', async () => {
      const mockFile = new File(['mock'], 'test.jpg', { type: 'image/jpeg' });
      const errorMessage = 'Compression failed';
      
      validateImageFile.mockReturnValue({ isValid: true, errors: [] });
      compressImage.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useMediaOptimization());
      
      await act(async () => {
        await expect(result.current.optimizeImage(mockFile)).rejects.toThrow(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('cancelProcessing', () => {
    it('should cancel processing and reset state', () => {
      const { result } = renderHook(() => useMediaOptimization());
      
      // Set processing state
      act(() => {
        result.current.optimizeImage(new File(['mock'], 'test.jpg', { type: 'image/jpeg' }));
      });

      expect(result.current.isProcessing).toBe(true);

      // Cancel processing
      act(() => {
        result.current.cancelProcessing();
      });

      expect(result.current.isProcessing).toBe(false);
      expect(result.current.progress).toBe(0);
    });
  });
});