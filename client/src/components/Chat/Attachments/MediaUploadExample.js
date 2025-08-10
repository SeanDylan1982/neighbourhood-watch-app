import React, { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import MediaUpload from './MediaUpload';
import AttachmentPicker from './AttachmentPicker';
import useAttachmentPicker from '../../../hooks/useAttachmentPicker';

/**
 * Example component showing how to integrate MediaUpload with AttachmentPicker
 * This demonstrates the complete flow from attachment selection to media processing
 */
const MediaUploadExample = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showMediaUpload, setShowMediaUpload] = useState(false);

  // Handle attachment selection from AttachmentPicker
  const handleAttachmentSelect = (attachment) => {
    console.log('Attachment selected:', attachment);
    
    // If it's a media file (camera or gallery), show MediaUpload
    if (attachment.type === 'camera' || attachment.type === 'gallery') {
      if (attachment.needsProcessing) {
        // Convert to MediaUpload format
        const mediaFiles = Array.isArray(attachment) ? attachment : [attachment];
        const processedFiles = mediaFiles.map(file => ({
          id: Date.now() + Math.random(),
          file: file.file,
          name: file.name,
          size: file.size,
          type: file.mimeType.startsWith('image/') ? 'image' : 'video',
          preview: file.preview,
          compressed: false
        }));
        
        setSelectedFiles(processedFiles);
        setShowMediaUpload(true);
      }
    } else {
      // Handle other attachment types (document, location, contact)
      console.log('Non-media attachment:', attachment);
    }
  };

  const {
    isOpen: isAttachmentPickerOpen,
    anchorEl: attachmentAnchorEl,
    openPicker: openAttachmentPicker,
    closePicker: closeAttachmentPicker,
    handleAttachmentSelect: handleAttachmentPickerSelect
  } = useAttachmentPicker({
    onAttachmentSelect: handleAttachmentSelect,
    availableTypes: ['camera', 'gallery', 'document', 'location', 'contact']
  });

  // Handle MediaUpload file changes
  const handleMediaFilesChange = (files) => {
    setSelectedFiles(files);
  };

  // Handle successful upload
  const handleUploadComplete = (uploadedFiles) => {
    console.log('Upload completed:', uploadedFiles);
    setUploadedFiles(prev => [...prev, ...uploadedFiles]);
    setSelectedFiles([]);
    setShowMediaUpload(false);
  };

  // Handle upload error
  const handleUploadError = (errors) => {
    console.error('Upload errors:', errors);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Media Upload Integration Example
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3 }}>
        This example shows how AttachmentPicker and MediaUpload work together
        to provide a complete media sharing experience.
      </Typography>

      {/* Attachment Picker Trigger */}
      <Button
        variant="contained"
        onClick={openAttachmentPicker}
        sx={{ mb: 3 }}
      >
        Select Attachment
      </Button>

      {/* AttachmentPicker */}
      <AttachmentPicker
        open={isAttachmentPickerOpen}
        onClose={closeAttachmentPicker}
        onAttachmentSelect={handleAttachmentPickerSelect}
        anchorEl={attachmentAnchorEl}
        availableTypes={['camera', 'gallery', 'document', 'location', 'contact']}
      />

      {/* MediaUpload (shown when media files are selected) */}
      {showMediaUpload && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Process Selected Media
          </Typography>
          <MediaUpload
            onFilesChange={handleMediaFilesChange}
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
            enableCompression={true}
            maxFiles={10}
            maxSize={50 * 1024 * 1024} // 50MB
            showPreview={true}
            dragAndDrop={false} // Disable since files are already selected
          />
          
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => {
                setShowMediaUpload(false);
                setSelectedFiles([]);
              }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      )}

      {/* Uploaded Files Display */}
      {uploadedFiles.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Uploaded Files ({uploadedFiles.length})
          </Typography>
          {uploadedFiles.map((file, index) => (
            <Box key={index} sx={{ mb: 1, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>{file.name}</strong> - {Math.round(file.size / 1024)}KB
              </Typography>
              {file.uploadedUrl && (
                <Typography variant="caption" color="text.secondary">
                  URL: {file.uploadedUrl}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default MediaUploadExample;