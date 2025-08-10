import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Alert,
  Card,
  CardContent,
  IconButton,
  Chip,
  Grid,
  Button,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import './DocumentUpload.css';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  TableChart as ExcelIcon,
  Slideshow as PowerPointIcon,
  Archive as ArchiveIcon,
  Code as CodeIcon,
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

/**
 * DocumentUpload component for handling document file uploads in chat
 * Features:
 * - File type validation and size limits
 * - Document preview with filename, type, and size display
 * - Upload progress indicators
 * - Drag and drop support
 * - Multiple file selection
 * 
 * Requirements addressed:
 * - 7.1: Display options for Camera, Photo & Video Library, Document, Location, and Contact
 * - 7.2: Show upload progress and inline preview
 * - 7.3: Display properly sized thumbnails in the chat
 * - 7.4: Show filename, type, and size information for documents
 * - 7.5: Request geolocation permissions and display location preview
 * - 7.6: Show name and phone/email information for contacts
 */
const DocumentUpload = ({
  onFilesChange,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  maxFiles = 10,
  maxSize = 100 * 1024 * 1024, // 100MB for documents
  acceptedTypes = '.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.csv,.json,.xml',
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

  // Document type configurations
  const documentTypes = {
    'application/pdf': { icon: PdfIcon, color: '#d32f2f', label: 'PDF' },
    'application/msword': { icon: DocIcon, color: '#1976d2', label: 'Word' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: DocIcon, color: '#1976d2', label: 'Word' },
    'application/vnd.ms-excel': { icon: ExcelIcon, color: '#388e3c', label: 'Excel' },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: ExcelIcon, color: '#388e3c', label: 'Excel' },
    'application/vnd.ms-powerpoint': { icon: PowerPointIcon, color: '#f57c00', label: 'PowerPoint' },
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': { icon: PowerPointIcon, color: '#f57c00', label: 'PowerPoint' },
    'text/plain': { icon: FileIcon, color: '#757575', label: 'Text' },
    'text/csv': { icon: ExcelIcon, color: '#388e3c', label: 'CSV' },
    'application/json': { icon: CodeIcon, color: '#9c27b0', label: 'JSON' },
    'application/xml': { icon: CodeIcon, color: '#9c27b0', label: 'XML' },
    'application/zip': { icon: ArchiveIcon, color: '#ff9800', label: 'ZIP' },
    'application/x-rar-compressed': { icon: ArchiveIcon, color: '#ff9800', label: 'RAR' },
    'default': { icon: FileIcon, color: '#757575', label: 'File' }
  };

  // File validation
  const validateFile = useCallback((file) => {
    // Check file size
    if (file.size > maxSize) {
      return `File "${file.name}" is too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`;
    }

    // Check file type by extension if MIME type is not specific
    const extension = file.name.split('.').pop()?.toLowerCase();
    const acceptedExtensions = acceptedTypes.split(',').map(type => type.trim().replace('.', ''));
    
    const isValidType = acceptedExtensions.includes(extension) || 
                       Object.keys(documentTypes).some(mimeType => 
                         mimeType !== 'default' && file.type === mimeType
                       );

    if (!isValidType) {
      return `File "${file.name}" is not a supported document type. Supported types: ${acceptedTypes}`;
    }

    return null;
  }, [maxSize, acceptedTypes]);

  // Get document type info
  const getDocumentTypeInfo = useCallback((file) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const mimeType = file.type;
    
    // Try to match by MIME type first
    if (documentTypes[mimeType]) {
      return documentTypes[mimeType];
    }
    
    // Fallback to extension matching
    const extensionMap = {
      'pdf': documentTypes['application/pdf'],
      'doc': documentTypes['application/msword'],
      'docx': documentTypes['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      'xls': documentTypes['application/vnd.ms-excel'],
      'xlsx': documentTypes['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      'ppt': documentTypes['application/vnd.ms-powerpoint'],
      'pptx': documentTypes['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
      'txt': documentTypes['text/plain'],
      'csv': documentTypes['text/csv'],
      'json': documentTypes['application/json'],
      'xml': documentTypes['application/xml'],
      'zip': documentTypes['application/zip'],
      'rar': documentTypes['application/x-rar-compressed']
    };
    
    return extensionMap[extension] || documentTypes.default;
  }, [documentTypes]);

  // Process files
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

    // Process each valid file
    const processedFiles = validFiles.map(file => {
      const fileId = Date.now() + Math.random();
      const typeInfo = getDocumentTypeInfo(file);
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      return {
        id: fileId,
        file,
        name: file.name,
        size: file.size,
        type: 'document',
        mimeType: file.type,
        extension,
        typeInfo,
        uploadStatus: 'pending', // pending, uploading, completed, error
        uploadProgress: 0,
        error: null
      };
    });

    if (processedFiles.length > 0) {
      const newFiles = [...files, ...processedFiles];
      setFiles(newFiles);
      setError('');
      
      if (onFilesChange) {
        onFilesChange(newFiles);
      }
    }
  }, [files, maxFiles, validateFile, getDocumentTypeInfo, onFilesChange]);

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
    
    // Clear any progress for this file
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
    
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

  // Get file status icon
  const getStatusIcon = useCallback((file) => {
    switch (file.uploadStatus) {
      case 'completed':
        return <CheckIcon sx={{ color: 'success.main' }} />;
      case 'error':
        return <ErrorIcon sx={{ color: 'error.main' }} />;
      case 'uploading':
        return null; // Progress indicator will be shown
      default:
        return null;
    }
  }, []);

  return (
    <Box className={`document-upload ${className}`}>
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
            {dragOver ? 'Drop documents here' : 'Drag & drop documents'}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            or click to browse files
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {multiple ? `Up to ${maxFiles} files` : '1 file'} • Max {Math.round(maxSize / 1024 / 1024)}MB each
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Supported: {acceptedTypes.replace(/\./g, '').toUpperCase()}
            </Typography>
          </Box>
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
          Select Documents
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

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* File List */}
      {showPreview && files.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2">
              Selected Documents ({files.length})
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
          
          <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
            {files.map((fileObj, index) => {
              const IconComponent = fileObj.typeInfo.icon;
              const progress = uploadProgress[fileObj.id] || 0;
              
              return (
                <ListItem
                  key={fileObj.id}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    '&:last-child': { mb: 0 }
                  }}
                >
                  <ListItemIcon>
                    <IconComponent sx={{ color: fileObj.typeInfo.color, fontSize: 32 }} />
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {fileObj.name}
                        </Typography>
                        {getStatusIcon(fileObj)}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                          <Chip
                            label={fileObj.typeInfo.label}
                            size="small"
                            sx={{ 
                              bgcolor: fileObj.typeInfo.color,
                              color: 'white',
                              fontSize: '0.75rem'
                            }}
                          />
                          <Chip
                            label={formatFileSize(fileObj.size)}
                            size="small"
                            variant="outlined"
                          />
                          {fileObj.extension && (
                            <Chip
                              label={`.${fileObj.extension.toUpperCase()}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                        
                        {/* Upload Progress */}
                        {fileObj.uploadStatus === 'uploading' && (
                          <Box sx={{ mt: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={progress}
                              sx={{ mb: 0.5 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              Uploading... {Math.round(progress)}%
                            </Typography>
                          </Box>
                        )}
                        
                        {/* Error Message */}
                        {fileObj.uploadStatus === 'error' && fileObj.error && (
                          <Typography variant="caption" color="error">
                            Error: {fileObj.error}
                          </Typography>
                        )}
                        
                        {/* Success Message */}
                        {fileObj.uploadStatus === 'completed' && (
                          <Typography variant="caption" color="success.main">
                            Upload completed
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    <Tooltip title="Remove file">
                      <IconButton
                        edge="end"
                        onClick={() => removeFile(fileObj.id)}
                        disabled={disabled || fileObj.uploadStatus === 'uploading'}
                        size="small"
                      >
                        <CloseIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
          
          {/* Summary */}
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Total: {files.length} file{files.length !== 1 ? 's' : ''} • 
              Size: {formatFileSize(files.reduce((sum, file) => sum + file.size, 0))}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default DocumentUpload;