import React, { useState, useCallback, useRef } from 'react';
import { useMediaOptimization } from '../../../hooks/useMediaOptimization';
import ProgressiveImage from '../Common/ProgressiveImage';
import './OptimizedMediaUpload.css';

/**
 * Optimized media upload component with compression, thumbnails, and progressive loading
 */
const OptimizedMediaUpload = ({
  onUpload,
  onError,
  multiple = false,
  accept = 'image/*',
  maxFiles = 5,
  className = '',
  children
}) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  
  const {
    optimizeImage,
    optimizeMultipleImages,
    isProcessing,
    progress,
    error,
    cancelProcessing
  } = useMediaOptimization();

  /**
   * Handle file selection
   */
  const handleFiles = useCallback(async (files) => {
    const fileArray = Array.from(files);
    
    if (!multiple && fileArray.length > 1) {
      onError?.('Only one file is allowed');
      return;
    }

    if (fileArray.length > maxFiles) {
      onError?.(`Maximum ${maxFiles} files allowed`);
      return;
    }

    try {
      let results;
      
      if (fileArray.length === 1) {
        // Single file optimization
        const result = await optimizeImage(fileArray[0], {
          compression: {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.8
          },
          thumbnailSizes: [
            { width: 150, height: 150, name: 'small' },
            { width: 300, height: 300, name: 'medium' },
            { width: 600, height: 600, name: 'large' }
          ]
        });
        results = [result];
      } else {
        // Multiple files optimization
        results = await optimizeMultipleImages(fileArray, {
          compression: {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.8
          },
          thumbnailSizes: [
            { width: 150, height: 150, name: 'small' },
            { width: 300, height: 300, name: 'medium' }
          ]
        });
      }

      // Update state with optimized files
      const optimizedFiles = results.map((result, index) => ({
        id: `${Date.now()}_${index}`,
        ...result,
        uploadStatus: 'ready'
      }));

      setUploadedFiles(prev => [...prev, ...optimizedFiles]);
      
      // Notify parent component
      onUpload?.(optimizedFiles);
      
    } catch (err) {
      onError?.(err.message);
    }
  }, [optimizeImage, optimizeMultipleImages, multiple, maxFiles, onUpload, onError]);

  /**
   * Handle file input change
   */
  const handleFileInputChange = useCallback((event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  }, [handleFiles]);

  /**
   * Handle drag and drop
   */
  const handleDrag = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (event.type === 'dragenter' || event.type === 'dragover') {
      setDragActive(true);
    } else if (event.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  /**
   * Remove uploaded file
   */
  const removeFile = useCallback((fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  }, []);

  /**
   * Trigger file input click
   */
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={`optimized-media-upload ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      {/* Drop zone */}
      <div
        className={`optimized-media-upload__dropzone ${dragActive ? 'optimized-media-upload__dropzone--active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        {children || (
          <div className="optimized-media-upload__content">
            <div className="optimized-media-upload__icon">📁</div>
            <div className="optimized-media-upload__text">
              <p>Click to select files or drag and drop</p>
              <p className="optimized-media-upload__subtext">
                {multiple ? `Up to ${maxFiles} files` : 'Single file only'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Processing indicator */}
      {isProcessing && (
        <div className="optimized-media-upload__processing">
          <div className="optimized-media-upload__progress">
            <div 
              className="optimized-media-upload__progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="optimized-media-upload__processing-text">
            Optimizing images... {progress}%
          </div>
          <button 
            className="optimized-media-upload__cancel"
            onClick={cancelProcessing}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="optimized-media-upload__error">
          <span className="optimized-media-upload__error-icon">⚠️</span>
          <span className="optimized-media-upload__error-text">{error}</span>
        </div>
      )}

      {/* Uploaded files preview */}
      {uploadedFiles.length > 0 && (
        <div className="optimized-media-upload__preview">
          <h4 className="optimized-media-upload__preview-title">
            Optimized Images ({uploadedFiles.length})
          </h4>
          <div className="optimized-media-upload__preview-grid">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="optimized-media-upload__preview-item">
                <div className="optimized-media-upload__preview-image">
                  <ProgressiveImage
                    src={file.url}
                    thumbnail={file.thumbnails?.small}
                    alt={file.originalFile.name}
                    className="progressive-image--small"
                  />
                  <button
                    className="optimized-media-upload__remove"
                    onClick={() => removeFile(file.id)}
                    title="Remove image"
                  >
                    ×
                  </button>
                </div>
                <div className="optimized-media-upload__preview-info">
                  <div className="optimized-media-upload__filename">
                    {file.originalFile.name}
                  </div>
                  <div className="optimized-media-upload__size-info">
                    <span className="optimized-media-upload__original-size">
                      {(file.originalSize / 1024 / 1024).toFixed(2)}MB
                    </span>
                    <span className="optimized-media-upload__arrow">→</span>
                    <span className="optimized-media-upload__optimized-size">
                      {(file.optimizedSize / 1024 / 1024).toFixed(2)}MB
                    </span>
                    <span className="optimized-media-upload__compression">
                      ({file.compressionRatio}% smaller)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedMediaUpload;