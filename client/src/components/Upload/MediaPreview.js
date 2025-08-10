import icons from '../Common/Icons'
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardMedia,
  IconButton,
  Typography,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Grid
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Fullscreen as FullscreenIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  Image as ImageIcon,
  VideoFile as VideoIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';

const MediaPreview = ({ 
  media = [], 
  maxHeight = 200, 
  showDownload = true,
  showFullscreen = true,
  columns = { xs: 1, sm: 2, md: 3 }
}) => {
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  if (!media || media.length === 0) {
    return null;
  }

  const getFileIcon = (type) => {
    switch (type) {
      case 'image': return <icons.Image sx={{ fontSize: 40 }} />;
      case 'video': return <icons.VideoFile sx={{ fontSize: 40 }} />;
      default: return <icons.InsertDriveFile sx={{ fontSize: 40 }} />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = (mediaItem) => {
    const link = document.createElement('a');
    link.href = mediaItem.url;
    link.download = mediaItem.filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openFullscreen = (mediaItem) => {
    setSelectedMedia(mediaItem);
    setFullscreenOpen(true);
  };

  const closeFullscreen = () => {
    setSelectedMedia(null);
    setFullscreenOpen(false);
  };

  return (
    <Box>
      <Grid container spacing={2}>
        {media.map((mediaItem, index) => (
          <Grid item {...columns} key={index}>
            <Card sx={{ position: 'relative' }}>
              {mediaItem.type === 'image' ? (
                <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    height={maxHeight}
                    image={mediaItem.url}
                    alt={mediaItem.filename || `Image ${index + 1}`}
                    sx={{ 
                      objectFit: 'cover',
                      cursor: showFullscreen ? 'pointer' : 'default'
                    }}
                    onClick={() => showFullscreen && openFullscreen(mediaItem)}
                  />
                  {showFullscreen && (
                    <IconButton
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(0, 0, 0, 0.5)',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'rgba(0, 0, 0, 0.7)'
                        }
                      }}
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        openFullscreen(mediaItem);
                      }}
                    >
                      <FullscreenIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              ) : mediaItem.type === 'video' ? (
                <Box 
                  sx={{ 
                    position: 'relative',
                    height: maxHeight,
                    bgcolor: 'grey.900',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={() => openFullscreen(mediaItem)}
                >
                  <video
                    width="100%"
                    height="100%"
                    style={{ objectFit: 'cover' }}
                    poster={mediaItem.thumbnail}
                  >
                    <source src={mediaItem.url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  <IconButton
                    sx={{
                      position: 'absolute',
                      color: 'white',
                      bgcolor: 'rgba(0, 0, 0, 0.5)',
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.7)'
                      }
                    }}
                  >
                    <PlayIcon sx={{ fontSize: 40 }} />
                  </IconButton>
                </Box>
              ) : (
                <Box
                  sx={{
                    height: maxHeight,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.100',
                    cursor: showDownload ? 'pointer' : 'default'
                  }}
                  onClick={() => showDownload && handleDownload(mediaItem)}
                >
                  {getFileIcon(mediaItem.type)}
                  <Typography variant="body2" sx={{ mt: 1, textAlign: 'center', px: 1 }}>
                    {mediaItem.filename || 'Unknown file'}
                  </Typography>
                </Box>
              )}

              {/* File Info */}
              <Box sx={{ p: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ flex: 1 }}>
                    {mediaItem.filename || `File ${index + 1}`}
                  </Typography>
                  {showDownload && (
                    <IconButton
                      size="small"
                      onClick={() => handleDownload(mediaItem)}
                      title="Download"
                    >
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                {mediaItem.size && (
                  <Chip
                    label={formatFileSize(mediaItem.size)}
                    size="small"
                    variant="outlined"
                    sx={{ mt: 0.5 }}
                  />
                )}
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Fullscreen Dialog */}
      <Dialog
        open={fullscreenOpen}
        onClose={closeFullscreen}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'black',
            color: 'white'
          }
        }}
      >
        <DialogActions sx={{ position: 'absolute', top: 0, right: 0, zIndex: 1 }}>
          {showDownload && selectedMedia && (
            <IconButton
              onClick={() => handleDownload(selectedMedia)}
              sx={{ color: 'white' }}
            >
              <DownloadIcon />
            </IconButton>
          )}
          <IconButton onClick={closeFullscreen} sx={{ color: 'white' }}>
            <icons.Close />
          </IconButton>
        </DialogActions>
        
        <DialogContent sx={{ p: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {selectedMedia && (
            <>
              {selectedMedia.type === 'image' ? (
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.filename}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '90vh',
                    objectFit: 'contain'
                  }}
                />
              ) : selectedMedia.type === 'video' ? (
                <video
                  controls
                  autoPlay
                  style={{
                    maxWidth: '100%',
                    maxHeight: '90vh'
                  }}
                >
                  <source src={selectedMedia.url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <Box sx={{ textAlign: 'center', p: 4 }}>
                  {getFileIcon(selectedMedia.type)}
                  <Typography variant="h6" sx={{ mt: 2, color: 'white' }}>
                    {selectedMedia.filename}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, color: 'grey.400' }}>
                    {formatFileSize(selectedMedia.size)}
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownload(selectedMedia)}
                    sx={{ mt: 2 }}
                  >
                    Download
                  </Button>
                </Box>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default MediaPreview;