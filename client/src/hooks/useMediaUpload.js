import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for managing media upload functionality
 * Provides state management and utility functions for media uploads
 * 
 * Requirements addressed:
 * - 7.1: Display options for Camera, Photo & Video Library, Document, Location, and Contact
 * - 7.2: Show upload progress and inline preview
 * - 7.3: Display properly sized thumbnails in the chat
 * - 7.4: Show filename, type, and size information for documents
 * - 7.5: Request geolocation permissions and display location preview
 * - 7.6: Show name and phone/email information for contacts
 */
const useMediaUpload = ({
  onUploadComplete,
  onUploadError,
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024, // 50MB
  enableCompression = true,
  compressionQuality = 0.8,
  maxImageDimension = 1920,
  apiEndpoint = '/api/attachments'
} = {}) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState('');
  const [compressing, setCompressing] = useState({});
  
  const abortControllerRef = useRef(null);

  // Upload a single file to the server
  const uploadFile = useCallback(async (fileObj) => {
    const formData = new FormData();
    formData.append('file', fileObj.file);
    formData.append('originalName', fileObj.name);
    formData.append('type', fileObj.type);
    formData.append('compressed', fileObj.compressed);
    
    if (fileObj.thumbnail) {
      // Convert thumbnail blob URL to blob and append
      try {
        const response = await fetch(fileObj.thumbnail);
        const thumbnailBlob = await response.blob();
        formData.append('thumbnail', thumbnailBlob, `thumb_${fileObj.name}`);
      } catch (error) {
        console.warn('Failed to upload thumbnail:', error);
      }
    }

    // Create abort controller for this upload
    const controller = new AbortController();
    abortControllerRef.current = controller;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(prev => ({
            ...prev,
            [fileObj.id]: progress
          }));
        }
      });
      
      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve({
              ...fileObj,
              uploadedUrl: response.url,
              uploadedId: response.id,
              thumbnailUrl: response.thumbnailUrl
            });
          } catch (error) {
            reject(new Error('Invalid server response'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });
      
      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });
      
      // Handle abort
      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });
      
      // Set up abort signal
      controller.signal.addEventListener('abort', () => {
        xhr.abort();
      });
      
      // Start upload
      xhr.open('POST', apiEndpoint);
      xhr.send(formData);
    });
  }, [apiEndpoint]);

  // Upload all files
  const uploadAllFiles = useCallback(async () => {
    if (files.length === 0 || uploading) return;

    setUploading(true);
    setError('');
    
    const uploadedFiles = [];
    const failedFiles = [];

    try {
      // Upload files sequentially to avoid overwhelming the server
      for (const fileObj of files) {
        try {
          const uploadedFile = await uploadFile(fileObj);
          uploadedFiles.push(uploadedFile);
          
          // Clear progress for completed file
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[fileObj.id];
            return newProgress;
          });
          
        } catch (error) {
          console.error(`Failed to upload ${fileObj.name}:`, error);
          failedFiles.push({
            file: fileObj,
            error: error.message
          });
        }
      }

      // Handle results
      if (uploadedFiles.length > 0) {
        if (onUploadComplete) {
          onUploadComplete(uploadedFiles);
        }
      }

      if (failedFiles.length > 0) {
        const errorMessage = `Failed to upload ${failedFiles.length} file(s): ${failedFiles.map(f => f.file.name).join(', ')}`;
        setError(errorMessage);
        
        if (onUploadError) {
          onUploadError(failedFiles);
        }
      }

      // Clear uploaded files from the list
      if (uploadedFiles.length > 0) {
        const uploadedIds = uploadedFiles.map(f => f.id);
        setFiles(prev => prev.filter(f => !uploadedIds.includes(f.id)));
      }

    } catch (error) {
      console.error('Upload process failed:', error);
      setError('Upload process failed. Please try again.');
      
      if (onUploadError) {
        onUploadError([{ error: error.message }]);
      }
    } finally {
      setUploading(false);
      setUploadProgress({});
      abortControllerRef.current = null;
    }
  }, [files, uploading, uploadFile, onUploadComplete, onUploadError]);

  // Cancel all uploads
  const cancelUploads = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setUploading(false);
    setUploadProgress({});
    setError('');
  }, []);

  // Add files to the upload queue
  const addFiles = useCallback((newFiles) => {
    if (!Array.isArray(newFiles)) {
      newFiles = [newFiles];
    }
    
    // Check file limits
    if (files.length + newFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed.`);
      return false;
    }
    
    setFiles(prev => [...prev, ...newFiles]);
    setError('');
    return true;
  }, [files.length, maxFiles]);

  // Remove a file from the upload queue
  const removeFile = useCallback((fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    
    // Clear any progress for this file
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
    
    // Clear compression state
    setCompressing(prev => {
      const newState = { ...prev };
      delete newState[fileId];
      return newState;
    });
  }, []);

  // Clear all files
  const clearAllFiles = useCallback(() => {
    // Cancel any ongoing uploads
    if (uploading) {
      cancelUploads();
    }
    
    setFiles([]);
    setError('');
    setUploadProgress({});
    setCompressing({});
  }, [uploading, cancelUploads]);

  // Get upload statistics
  const getUploadStats = useCallback(() => {
    const totalFiles = files.length;
    const uploadingFiles = Object.keys(uploadProgress).length;
    const completedFiles = totalFiles - uploadingFiles;
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    
    return {
      totalFiles,
      uploadingFiles,
      completedFiles,
      totalSize,
      hasFiles: totalFiles > 0,
      isUploading: uploading,
      hasError: !!error
    };
  }, [files, uploadProgress, uploading, error]);

  // Validate file before adding
  const validateFile = useCallback((file) => {
    // Check file size
    if (file.size > maxSize) {
      return `File "${file.name}" is too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`;
    }

    // Check file type (images and videos only)
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      return `File "${file.name}" is not a supported media type.`;
    }

    return null;
  }, [maxSize]);

  // Compress image utility
  const compressImage = useCallback((file, quality = compressionQuality, maxDimension = maxImageDimension) => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        resolve(file);
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          file.type,
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image for compression'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  }, [compressionQuality, maxImageDimension]);

  return {
    // State
    files,
    uploading,
    uploadProgress,
    error,
    compressing,
    
    // Actions
    addFiles,
    removeFile,
    clearAllFiles,
    uploadAllFiles,
    cancelUploads,
    
    // Utilities
    validateFile,
    compressImage,
    getUploadStats,
    
    // Setters (for external control)
    setError,
    setCompressing
  };
};

export default useMediaUpload;