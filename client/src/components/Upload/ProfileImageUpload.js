import icons from '../Common/Icons'
import React, { useState } from 'react';
import {
  Box,
  Avatar,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Camera as CameraIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { getFullImageUrl, getUserInitials } from '../../utils/imageUtils';

const ProfileImageUpload = ({ 
  currentImageUrl, 
  onImageUpdate,
  size = 80,
  editable = true 
}) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB.');
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setError('');
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('profileImage', selectedFile);

      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const uploadUrl = `${baseURL}/api/upload/profile-image`;
      const token = localStorage.getItem('token');
      
      console.log('Uploading profile image...');
      console.log('File:', selectedFile.name, selectedFile.size, selectedFile.type);
      console.log('Upload URL:', uploadUrl);
      console.log('Token exists:', !!token);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const result = await response.json();
      console.log('Upload result:', result);

      if (response.ok && result.success) {
        console.log('Upload successful, updating user profile image');
        console.log('New image URL:', result.file.url);
        
        // Update the user's profile image
        if (onImageUpdate) {
          onImageUpdate(result.file.url);
        }
        
        // Close dialog and reset state
        setOpen(false);
        setSelectedFile(null);
        setPreview(null);
        
        // Clean up preview URL
        if (preview) {
          URL.revokeObjectURL(preview);
        }
      } else {
        console.error('Upload failed:', result);
        setError(result.message || result.error || 'Upload failed. Please try again.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Upload failed. Please check your connection and try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!currentImageUrl) return;

    try {
      // Extract file path from URL
      const filePath = currentImageUrl.replace('/uploads/', '');
      
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await fetch(`${baseURL}/api/upload/file/${filePath}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        if (onImageUpdate) {
          onImageUpdate(null);
        }
      }
    } catch (error) {
      console.error('Remove image error:', error);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedFile(null);
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setError('');
  };



  return (
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
      <Avatar
        src={getFullImageUrl(currentImageUrl)}
        sx={{
          width: size,
          height: size,
          fontSize: size * 0.4,
          bgcolor: 'primary.main'
        }}
      >
        {!currentImageUrl && getUserInitials(user)}
      </Avatar>
      
      {editable && (
        <IconButton
          sx={{
            position: 'absolute',
            bottom: -5,
            right: -5,
            bgcolor: 'background.paper',
            boxShadow: 1,
            '&:hover': { bgcolor: 'background.paper' }
          }}
          size="small"
          onClick={() => setOpen(true)}
        >
          <CameraIcon fontSize="small" />
        </IconButton>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Update Profile Picture
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            {/* Current/Preview Image */}
            <Avatar
              src={preview || getFullImageUrl(currentImageUrl)}
              sx={{
                width: 120,
                height: 120,
                mx: 'auto',
                mb: 2,
                fontSize: '2rem',
                bgcolor: 'primary.main'
              }}
            >
              {!preview && !currentImageUrl && getUserInitials(user)}
            </Avatar>

            {/* File Input */}
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="profile-image-upload"
              type="file"
              onChange={handleFileSelect}
            />
            <label htmlFor="profile-image-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<icons.CloudUpload />}
                sx={{ mb: 2 }}
                disabled={uploading}
              >
                Choose Image
              </Button>
            </label>

            {/* Selected File Info */}
            {selectedFile && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
              </Typography>
            )}

            {/* Error Message */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Remove Current Image */}
            {currentImageUrl && !selectedFile && (
              <Button
                variant="text"
                color="error"
                startIcon={<icons.Delete />}
                onClick={handleRemoveImage}
                disabled={uploading}
              >
                Remove Current Image
              </Button>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFile || uploading}
            startIcon={uploading ? <CircularProgress size={16} /> : <icons.CloudUpload />}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfileImageUpload;