import { useState, useCallback, useRef } from 'react';
import { 
  compressImage, 
  generateThumbnail, 
  generateMultipleThumbnails,
  validateImageFile,
  calculateCompressionRatio,
  getOptimalImageFormat
} from '../utils/mediaOptimization';
import mediaCacheManager from '../services/MediaCacheManager';

/**
 * Hook for media optimization including compression, thumbnails, and caching
 */
export const useMediaOptimization = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  /**
   * Process and optimize an image file
   */
  const optimizeImage = useCallback(async (file, options = {}) => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      // Validate file
      const validation = validateImageFile(file, options.validation);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      setProgress(20);

      // Compress image
      const compressionOptions = {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.8,
        format: getOptimalImageFormat(),
        ...options.compression
      };

      const compressedFile = await compressImage(file, compressionOptions);
      setProgress(60);

      // Generate thumbnails
      const thumbnailSizes = options.thumbnailSizes || [
        { width: 150, height: 150, name: 'small' },
        { width: 300, height: 300, name: 'medium' }
      ];

      const thumbnails = await generateMultipleThumbnails(compressedFile, thumbnailSizes);
      setProgress(80);

      // Cache thumbnails
      const fileUrl = URL.createObjectURL(compressedFile);
      for (const [sizeName, thumbnailUrl] of Object.entries(thumbnails)) {
        const size = thumbnailSizes.find(s => s.name === sizeName);
        await mediaCacheManager.storeThumbnail(fileUrl, thumbnailUrl, {
          width: size.width,
          height: size.height
        });
      }

      setProgress(100);

      const result = {
        originalFile: file,
        optimizedFile: compressedFile,
        thumbnails,
        compressionRatio: calculateCompressionRatio(file.size, compressedFile.size),
        originalSize: file.size,
        optimizedSize: compressedFile.size,
        url: fileUrl
      };

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, []);

  /**
   * Get or generate thumbnail for an image URL
   */
  const getThumbnail = useCallback(async (imageUrl, options = {}) => {
    setError(null);

    try {
      // Check cache first
      const cached = await mediaCacheManager.getThumbnail(imageUrl, options);
      if (cached) {
        return cached;
      }

      // Generate new thumbnail
      const thumbnail = await generateThumbnail(imageUrl, options);
      
      // Store in cache
      await mediaCacheManager.storeThumbnail(imageUrl, thumbnail, options);
      
      return thumbnail;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Batch process multiple images
   */
  const optimizeMultipleImages = useCallback(async (files, options = {}) => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const results = [];
      const total = files.length;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const result = await optimizeImage(file, options);
          results.push({ ...result, success: true });
        } catch (err) {
          results.push({ 
            originalFile: file, 
            success: false, 
            error: err.message 
          });
        }
        
        setProgress(Math.round(((i + 1) / total) * 100));
      }

      return results;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [optimizeImage]);

  /**
   * Preload thumbnails for a list of image URLs
   */
  const preloadThumbnails = useCallback(async (imageUrls, options = {}) => {
    setIsProcessing(true);
    setError(null);

    try {
      const results = await mediaCacheManager.preloadThumbnails(imageUrls, options);
      return results;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback(async () => {
    try {
      return await mediaCacheManager.getCacheStats();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Clear media cache
   */
  const clearCache = useCallback(async () => {
    try {
      await mediaCacheManager.clearCache();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Cancel current processing
   */
  const cancelProcessing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsProcessing(false);
    setProgress(0);
  }, []);

  return {
    // State
    isProcessing,
    progress,
    error,

    // Methods
    optimizeImage,
    getThumbnail,
    optimizeMultipleImages,
    preloadThumbnails,
    getCacheStats,
    clearCache,
    cancelProcessing,

    // Utilities
    validateImageFile,
    calculateCompressionRatio,
    getOptimalImageFormat
  };
};