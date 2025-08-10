/**
 * Media optimization utilities for image compression, thumbnail generation, and progressive loading
 */

/**
 * Compress an image file to reduce size while maintaining quality
 * @param {File} file - The image file to compress
 * @param {Object} options - Compression options
 * @returns {Promise<File>} - Compressed image file
 */
export const compressImage = async (file, options = {}) => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress the image
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: format,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        format,
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Generate thumbnail for an image
 * @param {File|string} source - Image file or URL
 * @param {Object} options - Thumbnail options
 * @returns {Promise<string>} - Thumbnail data URL
 */
export const generateThumbnail = async (source, options = {}) => {
  const {
    width = 150,
    height = 150,
    quality = 0.7,
    format = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = width;
      canvas.height = height;

      // Calculate crop dimensions to maintain aspect ratio
      const sourceRatio = img.width / img.height;
      const targetRatio = width / height;

      let sourceWidth = img.width;
      let sourceHeight = img.height;
      let sourceX = 0;
      let sourceY = 0;

      if (sourceRatio > targetRatio) {
        // Source is wider, crop width
        sourceWidth = img.height * targetRatio;
        sourceX = (img.width - sourceWidth) / 2;
      } else {
        // Source is taller, crop height
        sourceHeight = img.width / targetRatio;
        sourceY = (img.height - sourceHeight) / 2;
      }

      // Draw cropped and resized image
      ctx.drawImage(
        img,
        sourceX, sourceY, sourceWidth, sourceHeight,
        0, 0, width, height
      );

      const thumbnailDataUrl = canvas.toDataURL(format, quality);
      resolve(thumbnailDataUrl);
    };

    img.onerror = () => reject(new Error('Failed to load image for thumbnail'));
    
    if (typeof source === 'string') {
      img.src = source;
    } else {
      img.src = URL.createObjectURL(source);
    }
  });
};

/**
 * Create multiple thumbnail sizes for responsive images
 * @param {File|string} source - Image source
 * @param {Array} sizes - Array of size objects {width, height, name}
 * @returns {Promise<Object>} - Object with thumbnail URLs keyed by size name
 */
export const generateMultipleThumbnails = async (source, sizes = []) => {
  const defaultSizes = [
    { width: 150, height: 150, name: 'small' },
    { width: 300, height: 300, name: 'medium' },
    { width: 600, height: 600, name: 'large' }
  ];

  const thumbnailSizes = sizes.length > 0 ? sizes : defaultSizes;
  const thumbnails = {};

  try {
    const promises = thumbnailSizes.map(async (size) => {
      const thumbnail = await generateThumbnail(source, {
        width: size.width,
        height: size.height
      });
      return { name: size.name, url: thumbnail };
    });

    const results = await Promise.all(promises);
    results.forEach(({ name, url }) => {
      thumbnails[name] = url;
    });

    return thumbnails;
  } catch (error) {
    throw new Error(`Failed to generate thumbnails: ${error.message}`);
  }
};

/**
 * Get optimal image format based on browser support
 * @returns {string} - Optimal image format
 */
export const getOptimalImageFormat = () => {
  const canvas = document.createElement('canvas');
  
  // Check for WebP support
  if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
    return 'image/webp';
  }
  
  // Check for AVIF support (newer format)
  if (canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0) {
    return 'image/avif';
  }
  
  // Fallback to JPEG
  return 'image/jpeg';
};

/**
 * Calculate file size reduction percentage
 * @param {number} originalSize - Original file size in bytes
 * @param {number} compressedSize - Compressed file size in bytes
 * @returns {number} - Reduction percentage
 */
export const calculateCompressionRatio = (originalSize, compressedSize) => {
  return Math.round(((originalSize - compressedSize) / originalSize) * 100);
};

/**
 * Validate image file type and size
 * @param {File} file - Image file to validate
 * @param {Object} options - Validation options
 * @returns {Object} - Validation result
 */
export const validateImageFile = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  } = options;

  const errors = [];

  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`);
  }

  if (file.size > maxSize) {
    errors.push(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum ${(maxSize / 1024 / 1024).toFixed(2)}MB`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};