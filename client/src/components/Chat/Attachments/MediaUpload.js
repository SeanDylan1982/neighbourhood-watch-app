import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Alert,
  Card,
  CardMedia,
  IconButton,
  Chip,
  Grid,
  Button,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  VideoFile as VideoIcon,
  Compress as CompressIcon,
  Close as CloseIcon,
  PlayArrow as PlayIcon
} from '@mui/icons-material';
import { useMediaOptimization } from '../../../hooks/useMediaOptimization';
import ProgressiveImage from '../Common/ProgressiveImage';

/**
 * MediaUpload component for handling image and video uploads in chat
 * Features:
 * - Drag and drop support
 * - Image compression and thumbnail generation
 * - Upload progress indicators
 * - Preview functionality
 * - File validation and error handling
 * 
 * Requirements addressed:
 * - 7.1: Display options for Camera, Photo & Video Library, Document, Location, and Contact
 * - 7.2: Show upload progress and inline preview
 * - 7.3: Display properly sized thumbnails in the chat
 * - 7.4: Show filename, type, and size information for documents
 * - 7.5: Request geolocation permissions and display location preview
 * - 7.6: Show name and phone/email information for contacts
 */
const MediaUpload = ({
  onFilesChange,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024, // 50MB for videos, will compress images
  acceptedTypes = 'image/*,video/*',
  enableCompression = true,
  compressionQuality = 0.8,
  maxImageDimension = 1920,
  thumbnailSize = 150,
  disabled = false,
  multiple = true,
  showPreview = true,
  dragAndDrop = true,
  className = ''
}) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  
  const fileInputRef = useRef(null);
  
  // Use the new media optimization hook
  const {
    optimizeImage,
    optimizeMultipleImages,
    isProcessing,
    progress,
    error: optimizationError
  } = useMediaOptimization();

  // File validation
  const validateFile = useCallback((file) => {
    // Check file size
    if (file.size > maxSize) {
      return `File "${file.name}" is too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`;
    }

    // Check file type
    const acceptedTypesArray = acceptedTypes.split(',').map(type => type.trim());
    const isValidType = acceptedTypesArray.some(type => {
      if (type === 'image/*') return file.type.startsWith('image/');
      if (type === 'video/*') return file.type.startsWith('video/');
      return file.type === type;
    });

    if (!isValidType) {
      return `File "${file.name}" is not a supported file type.`;
    }

    return null;
  }, [maxSize, acceptedTypes]);

  // Generate video thumbnail
  const generateVideoThumbnail = useCallback((file) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.onloadeddata = () => {
        const size = thumbnailSize;
        canvas.width = size;
        canvas.height = size;
        
        video.currentTime = 1; // Seek to 1 second
      };
      
      video.onseeked = () => {
        const minDim = Math.min(video.videoWidth, video.videoHeight);
        const sx = (video.videoWidth - minDim) / 2;
        const sy = (video.videoHeight - minDim) / 2;
        
        ctx.drawImage(video, sx, sy, minDim, minDim, 0, 0, size, size);
        
        canvas.toBlob((blob) => {
          resolve(URL.createObjectURL(blob));
        }, 'image/jpeg', 0.7);
      };
      
      video.src = URL.createObjectURL(file);
    });
  }, [thumbnailSize]);

  // Process files using the new optimization system
  const processFiles = useCallback(async (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);
    
    // Check total file count
    if (files.length + fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed.`);
      return;
    }

    // Validate files
    const validFiles = [];
    const errors = [];

    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(validationError);
      } else {
        validFiles.push(file);
      }
    }

    if (errors.length > 0) {
      setError(errors.join(' '));
      return;
    }

    try {
      // Separate images and videos
      const imageFiles = validFiles.filter(f => f.type.startsWith('image/'));
      const videoFiles = validFiles.filter(f => f.type.startsWith('video/'));
      
      const processedFiles = [];
      
      // Process images with optimization
      if (imageFiles.length > 0 && enableCompression) {
        const optimizationOptions = {
          compression: {
            maxWidth: maxImageDimension,
            maxHeight: maxImageDimension,
            quality: compressionQuality
          },
          thumbnailSizes: [
            { width: thumbnailSize, height: thumbnailSize, name: 'thumbnail' },
            { width: 300, height: 300, name: 'medium' }
          ]
        };

        let optimizedResults;
        if (imageFiles.length === 1) {
          const result = await optimizeImage(imageFiles[0], optimizationOptions);
          optimizedResults = [result];
        } else {
          optimizedResults = await optimizeMultipleImages(imageFiles, optimizationOptions);
        }

        // Convert optimization results to file objects
        optimizedResults.forEach((result, index) => {
          if (result.success !== false) {
            const fileObj = {
              id: Date.now() + Math.random() + index,
              file: result.optimizedFile,
              originalFile: result.originalFile,
              name: result.originalFile.name,
              size: result.optimizedSize,
              originalSize: result.originalSize,
              type: 'image',
              thumbnail: result.thumbnails?.thumbnail,
              preview: result.url,
              compressed: result.compressionRatio > 0,
              compressionRatio: result.compressionRatio,
              thumbnails: result.thumbnails,
              duration: null
            };
            processedFiles.push(fileObj);
          }
        });
      } else {
        // Process images without optimization
        for (const file of imageFiles) {
          const fileObj = {
            id: Date.now() + Math.random(),
            file,
            originalFile: file,
            name: file.name,
            size: file.size,
            originalSize: file.size,
            type: 'image',
            thumbnail: null,
            preview: URL.createObjectURL(file),
            compressed: false,
            duration: null
          };
          processedFiles.push(fileObj);
        }
      }
      
      // Process videos (generate thumbnails only)
      for (const file of videoFiles) {
        const thumbnail = await generateVideoThumbnail(file);
        const fileObj = {
          id: Date.now() + Math.random(),
          file,
          originalFile: file,
          name: file.name,
          size: file.size,
          originalSize: file.size,
          type: 'video',
          thumbnail,
          preview: thumbnail,
          compressed: false,
          duration: null // Could be extracted if needed
        };
        processedFiles.push(fileObj);
      }

      if (processedFiles.length > 0) {
        const newFiles = [...files, ...processedFiles];
        setFiles(newFiles);
        setError('');
        
        if (onFilesChange) {
          onFilesChange(newFiles);
        }
      }
    } catch (error) {
      console.error('Error processing files:', error);
      setError(`Error processing files: ${error.message}`);
    }
  }, [files, maxFiles, validateFile, enableCompression, optimizeImage, optimizeMultipleImages, generateVideoThumbnail, maxImageDimension, compressionQuality, thumbnailSize, onFilesChange]);

  // Handle file selection
  const handleFileSelect = useCallback((selectedFiles) => {
    if (disabled) return;
    processFiles(selectedFiles);
  }, [disabled, processFiles]);

  // Drag and drop handlers
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled || !dragAndDrop) return;
    
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  }, [disabled, dragAndDrop, handleFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    if (!disabled && dragAndDrop) {
      setDragOver(true);
    }
  }, [disabled, dragAndDrop]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  // File input change handler
  const handleFileInputChange = useCallback((e) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFileSelect(selectedFiles);
    }
    // Reset input value
    e.target.value = '';
  }, [handleFileSelect]);

  // Remove file
  const removeFile = useCallback((fileId) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    setFiles(updatedFiles);
    
    if (onFilesChange) {
      onFilesChange(updatedFiles);
    }
  }, [files, onFilesChange]);

  // Clear all files
  const clearAllFiles = useCallback(() => {
    setFiles([]);
    setError('');
    setUploadProgress({});
    
    if (onFilesChange) {
      onFilesChange([]);
    }
  }, [onFilesChange]);

  // Format file size
  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Get file type icon
  const getFileIcon = useCallback((type) => {
    switch (type) {
      case 'image':
        return <ImageIcon />;
      case 'video':
        return <VideoIcon />;
      default:
        return <ImageIcon />;
    }
  }, []);

  return (
    <Box className={`media-upload ${className}`}>

      
      {/* Upload Area */}
      {dragAndDrop && (
        <Box
          sx={{
            border: 2,
            borderStyle: 'dashed',
            borderColor: dragOver ? 'primary.main' : 'grey.300',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            bgcolor: dragOver ? 'primary.light' : 'background.paper',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
            transition: 'all 0.2s ease-in-out',
            mb: 2
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <UploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {dragOver ? 'Drop media files here' : 'Drag & drop media files'}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            or click to browse files
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {multiple ? `Up to ${maxFiles} files` : '1 file'} • Images will be compressed • Max {Math.round(maxSize / 1024 / 1024)}MB each
          </Typography>
        </Box>
      )}

      {/* Browse Button (alternative to drag and drop) */}
      {!dragAndDrop && (
        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          onClick={() => !disabled && fileInputRef.current?.click()}
          disabled={disabled}
          sx={{ mb: 2 }}
        >
          Select Media Files
        </Button>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={acceptedTypes}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {/* Error Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {optimizationError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Optimization Error: {optimizationError}
        </Alert>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography variant="body2">
              Optimizing images... {progress}%
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={progress} />
        </Box>
      )}

      {/* File Previews */}
      {showPreview && files.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2">
              Selected Files ({files.length})
            </Typography>
            <Button
              size="small"
              onClick={clearAllFiles}
              disabled={disabled || uploading}
              startIcon={<DeleteIcon />}
            >
              Clear All
            </Button>
          </Box>
          
          <Grid container spacing={2}>
            {files.map((fileObj) => (
              <Grid item xs={12} sm={6} md={4} key={fileObj.id}>
                <Card sx={{ position: 'relative' }}>


                  {/* Upload progress */}
                  {uploadProgress[fileObj.id] !== undefined && (
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        bgcolor: 'rgba(0, 0, 0, 0.7)',
                        p: 1,
                        zIndex: 2
                      }}
                    >
                      <LinearProgress
                        variant="determinate"
                        value={uploadProgress[fileObj.id]}
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="caption" sx={{ color: 'white' }}>
                        Uploading... {Math.round(uploadProgress[fileObj.id])}%
                      </Typography>
                    </Box>
                  )}

                  {/* Remove button */}
                  <IconButton
                    size="small"
                    onClick={() => removeFile(fileObj.id)}
                    disabled={disabled || uploading}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(0, 0, 0, 0.5)',
                      color: 'white',
                      zIndex: 3,
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.7)'
                      }
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>

                  {/* Media preview with progressive loading */}
                  {fileObj.preview ? (
                    <Box sx={{ position: 'relative', height: 140 }}>
                      {fileObj.type === 'image' ? (
                        <ProgressiveImage
                          src={fileObj.preview}
                          thumbnail={fileObj.thumbnail}
                          alt={fileObj.name}
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover' 
                          }}
                        />
                      ) : (
                        <>
                          <CardMedia
                            component="img"
                            height="140"
                            image={fileObj.preview}
                            alt={fileObj.name}
                            sx={{ objectFit: 'cover' }}
                          />
                          <Box
                            sx={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              bgcolor: 'rgba(0, 0, 0, 0.6)',
                              borderRadius: '50%',
                              p: 1
                            }}
                          >
                            <PlayIcon sx={{ color: 'white', fontSize: 32 }} />
                          </Box>
                        </>
                      )}
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        height: 140,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'grey.100'
                      }}
                    >
                      {getFileIcon(fileObj.type)}
                    </Box>
                  )}

                  {/* File info */}
                  <Box sx={{ p: 1 }}>
                    <Typography variant="body2" noWrap title={fileObj.name}>
                      {fileObj.name}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
                      <Chip
                        label={formatFileSize(fileObj.size)}
                        size="small"
                        variant="outlined"
                      />
                      {fileObj.compressed && (
                        <Tooltip title={`Compressed from ${formatFileSize(fileObj.originalSize)} (${fileObj.compressionRatio}% reduction)`}>
                          <Chip
                            icon={<CompressIcon />}
                            label={`-${fileObj.compressionRatio}%`}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default MediaUpload;