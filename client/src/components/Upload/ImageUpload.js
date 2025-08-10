import icons from '../Common/Icons'
import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  IconButton,
  Typography,
  LinearProgress,
  Alert,
  Card,
  CardMedia,
  CardActions,
  Grid,
  Chip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  VideoFile as VideoIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';

const ImageUpload = ({
  onFilesChange,
  maxFiles = 5,
  acceptedTypes = 'image/*,video/*',
  maxSize = 10 * 1024 * 1024, // 10MB
  showPreview = true,
  multiple = true,
  disabled = false,
  onUploadError // New prop to handle upload errors
}) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
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
  };

  const handleFileSelect = (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);
    
    // Check total file count
    if (files.length + fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed.`);
      return;
    }

    // Validate each file
    const validFiles = [];
    const errors = [];

    fileArray.forEach(file => {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(validationError);
      } else {
        validFiles.push({
          file,
          id: Date.now() + Math.random(),
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
          type: getFileType(file.type),
          name: file.name,
          size: file.size
        });
      }
    });

    if (errors.length > 0) {
      setError(errors.join(' '));
      return;
    }

    const newFiles = [...files, ...validFiles];
    setFiles(newFiles);
    setError('');
    
    if (onFilesChange) {
      onFilesChange(newFiles.map(f => f.file));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled) return;
    
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileInputChange = (e) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFileSelect(selectedFiles);
    }
    // Reset the input value to allow selecting the same file again
    e.target.value = '';
  };

  const removeFile = (fileId) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    setFiles(updatedFiles);
    
    if (onFilesChange) {
      onFilesChange(updatedFiles.map(f => f.file));
    }
  };

  const getFileType = (mimeType) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'file';
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'image': return <icons.Image />;
      case 'video': return <icons.VideoFile />;
      default: return <icons.InsertDriveFile />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box>
      {/* Upload Area */}
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
          transition: 'all 0.2s ease-in-out'
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <icons.CloudUpload sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {dragOver ? 'Drop files here' : 'Drag & drop files here'}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          or click to browse files
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {multiple ? `Up to ${maxFiles} files` : '1 file'} • Max {Math.round(maxSize / 1024 / 1024)}MB each
        </Typography>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedTypes}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          disabled={disabled}
        />
      </Box>

      {/* Upload Progress */}
      {uploading && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" gutterBottom>
            Uploading... {Math.round(uploadProgress)}%
          </Typography>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      )}

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* File Previews */}
      {showPreview && files.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Selected Files ({files.length})
          </Typography>
          <Grid container spacing={2}>
            {files.map((fileObj) => (
              <Grid item xs={12} sm={6} md={4} key={fileObj.id}>
                <Card>
                  {fileObj.type === 'image' && fileObj.preview ? (
                    <CardMedia
                      component="img"
                      height="140"
                      image={fileObj.preview}
                      alt={fileObj.name}
                      sx={{ objectFit: 'cover' }}
                    />
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
                  <Box sx={{ p: 1 }}>
                    <Typography variant="body2" noWrap title={fileObj.name}>
                      {fileObj.name}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                      <Chip
                        label={formatFileSize(fileObj.size)}
                        size="small"
                        variant="outlined"
                      />
                      <IconButton
                        size="small"
                        onClick={() => removeFile(fileObj.id)}
                        disabled={disabled}
                      >
                        <icons.Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Action Buttons */}
      {files.length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setFiles([]);
              if (onFilesChange) onFilesChange([]);
            }}
            disabled={disabled}
          >
            Clear All
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ImageUpload;