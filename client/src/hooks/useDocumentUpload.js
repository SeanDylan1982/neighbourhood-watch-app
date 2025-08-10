import { useState, useCallback } from 'react';

/**
 * Custom hook for handling document upload functionality
 * Provides file validation, processing, and state management for document uploads
 * 
 * Requirements addressed:
 * - 7.1: Display options for Camera, Photo & Video Library, Document, Location, and Contact
 * - 7.2: Show upload progress and inline preview
 * - 7.4: Show filename, type, and size information for documents
 */
const useDocumentUpload = ({
  maxFiles = 10,
  maxSize = 100 * 1024 * 1024, // 100MB
  acceptedTypes = '.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.csv,.json,.xml',
  onFilesChange,
  onUploadProgress,
  onUploadComplete,
  onUploadError
} = {}) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState('');

  // Document type configurations
  const documentTypes = {
    'application/pdf': { icon: 'PdfIcon', color: '#d32f2f', label: 'PDF' },
    'application/msword': { icon: 'DocIcon', color: '#1976d2', label: 'Word' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: 'DocIcon', color: '#1976d2', label: 'Word' },
    'application/vnd.ms-excel': { icon: 'ExcelIcon', color: '#388e3c', label: 'Excel' },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: 'ExcelIcon', color: '#388e3c', label: 'Excel' },
    'application/vnd.ms-powerpoint': { icon: 'PowerPointIcon', color: '#f57c00', label: 'PowerPoint' },
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': { icon: 'PowerPointIcon', color: '#f57c00', label: 'PowerPoint' },
    'text/plain': { icon: 'FileIcon', color: '#757575', label: 'Text' },
    'text/csv': { icon: 'ExcelIcon', color: '#388e3c', label: 'CSV' },
    'application/json': { icon: 'CodeIcon', color: '#9c27b0', label: 'JSON' },
    'application/xml': { icon: 'CodeIcon', color: '#9c27b0', label: 'XML' },
    'application/zip': { icon: 'ArchiveIcon', color: '#ff9800', label: 'ZIP' },
    'application/x-rar-compressed': { icon: 'ArchiveIcon', color: '#ff9800', label: 'RAR' },
    'default': { icon: 'FileIcon', color: '#757575', label: 'File' }
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
  }, [maxSize, acceptedTypes, documentTypes]);

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
      const errorMsg = `Maximum ${maxFiles} files allowed.`;
      setError(errorMsg);
      if (onUploadError) {
        onUploadError(new Error(errorMsg));
      }
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
      const errorMsg = errors.join(' ');
      setError(errorMsg);
      if (onUploadError) {
        onUploadError(new Error(errorMsg));
      }
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
  }, [files, maxFiles, validateFile, getDocumentTypeInfo, onFilesChange, onUploadError]);

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

  // Update upload progress for a specific file
  const updateFileProgress = useCallback((fileId, progress) => {
    setUploadProgress(prev => ({
      ...prev,
      [fileId]: progress
    }));
    
    if (onUploadProgress) {
      onUploadProgress(fileId, progress);
    }
  }, [onUploadProgress]);

  // Update file status
  const updateFileStatus = useCallback((fileId, status, errorMsg = null) => {
    setFiles(prevFiles => 
      prevFiles.map(file => 
        file.id === fileId 
          ? { ...file, uploadStatus: status, error: errorMsg }
          : file
      )
    );
  }, []);

  // Start upload process
  const startUpload = useCallback(async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    
    try {
      for (const file of files) {
        if (file.uploadStatus === 'pending') {
          updateFileStatus(file.id, 'uploading');
          
          // Simulate upload progress (replace with actual upload logic)
          for (let progress = 0; progress <= 100; progress += 10) {
            updateFileProgress(file.id, progress);
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          updateFileStatus(file.id, 'completed');
        }
      }
      
      if (onUploadComplete) {
        onUploadComplete(files);
      }
    } catch (error) {
      if (onUploadError) {
        onUploadError(error);
      }
    } finally {
      setUploading(false);
    }
  }, [files, updateFileStatus, updateFileProgress, onUploadComplete, onUploadError]);

  // Format file size
  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError('');
  }, []);

  return {
    // State
    files,
    uploading,
    uploadProgress,
    error,
    
    // Actions
    processFiles,
    removeFile,
    clearAllFiles,
    startUpload,
    updateFileProgress,
    updateFileStatus,
    clearError,
    
    // Utilities
    validateFile,
    getDocumentTypeInfo,
    formatFileSize,
    documentTypes
  };
};

export default useDocumentUpload;