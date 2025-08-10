import React, { useState } from 'react';
import { Box, Typography, Paper, Divider } from '@mui/material';
import DocumentUpload from './DocumentUpload';

/**
 * Example usage of DocumentUpload component
 * Demonstrates various configurations and use cases
 */
const DocumentUploadExample = () => {
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});

  const handleFilesChange = (newFiles) => {
    console.log('Files changed:', newFiles);
    setFiles(newFiles);
  };

  const handleUploadProgress = (fileId, progress) => {
    console.log(`Upload progress for ${fileId}:`, progress);
    setUploadProgress(prev => ({
      ...prev,
      [fileId]: progress
    }));
  };

  const handleUploadComplete = (completedFiles) => {
    console.log('Upload completed:', completedFiles);
  };

  const handleUploadError = (error) => {
    console.error('Upload error:', error);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        DocumentUpload Component Examples
      </Typography>

      {/* Basic Example */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Basic Document Upload
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Standard document upload with drag and drop support
        </Typography>
        <DocumentUpload
          onFilesChange={handleFilesChange}
          onUploadProgress={handleUploadProgress}
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
        />
      </Paper>

      {/* Custom Configuration */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Custom Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Limited to PDF files only, max 3 files, 50MB each
        </Typography>
        <DocumentUpload
          onFilesChange={handleFilesChange}
          maxFiles={3}
          maxSize={50 * 1024 * 1024} // 50MB
          acceptedTypes=".pdf"
          onUploadProgress={handleUploadProgress}
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
        />
      </Paper>

      {/* Single File Mode */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Single File Upload
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Single file selection with browse button only
        </Typography>
        <DocumentUpload
          onFilesChange={handleFilesChange}
          multiple={false}
          dragAndDrop={false}
          onUploadProgress={handleUploadProgress}
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
        />
      </Paper>

      {/* No Preview Mode */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          No Preview Mode
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Upload without file preview
        </Typography>
        <DocumentUpload
          onFilesChange={handleFilesChange}
          showPreview={false}
          onUploadProgress={handleUploadProgress}
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
        />
      </Paper>

      {/* Disabled State */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Disabled State
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Upload component in disabled state
        </Typography>
        <DocumentUpload
          onFilesChange={handleFilesChange}
          disabled={true}
          onUploadProgress={handleUploadProgress}
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
        />
      </Paper>

      {/* Current State Display */}
      {files.length > 0 && (
        <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
          <Typography variant="h6" gutterBottom>
            Current State
          </Typography>
          <Typography variant="body2" gutterBottom>
            Selected Files: {files.length}
          </Typography>
          <Box sx={{ mt: 2 }}>
            {files.map((file, index) => (
              <Box key={file.id} sx={{ mb: 1 }}>
                <Typography variant="body2">
                  {index + 1}. {file.name} ({file.typeInfo.label}) - {file.size} bytes
                </Typography>
                {uploadProgress[file.id] && (
                  <Typography variant="caption" color="text.secondary">
                    Progress: {uploadProgress[file.id]}%
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default DocumentUploadExample;