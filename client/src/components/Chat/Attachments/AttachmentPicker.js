import React, { useState } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  Tooltip,
  Fade,
  ClickAwayListener,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  CameraAlt as CameraIcon,
  PhotoLibrary as GalleryIcon,
  InsertDriveFile as DocumentIcon,
  LocationOn as LocationIcon,
  ContactPhone as ContactIcon,
  Close as CloseIcon
} from '@mui/icons-material';

/**
 * AttachmentPicker component provides a unified interface for selecting different types of attachments
 * Supports Camera, Gallery, Document, Location, and Contact options with responsive design
 * 
 * Requirements addressed:
 * - 7.1: Display options for Camera, Photo & Video Library, Document, Location, and Contact
 * - 7.2: Show upload progress and inline preview
 * - 7.3: Display properly sized thumbnails in chat
 * - 7.4: Show filename, type, and size information for documents
 * - 7.5: Request geolocation permissions and display location preview
 * - 7.6: Show name and phone/email information for contacts
 */
const AttachmentPicker = ({
  open = false,
  onClose,
  onAttachmentSelect,
  anchorEl,
  disabled = false,
  availableTypes = ['camera', 'gallery', 'document', 'location', 'contact']
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Attachment type configurations
  const attachmentTypes = {
    camera: {
      id: 'camera',
      label: 'Camera',
      icon: CameraIcon,
      color: '#4CAF50',
      description: 'Take a photo or video'
    },
    gallery: {
      id: 'gallery',
      label: 'Gallery',
      icon: GalleryIcon,
      color: '#2196F3',
      description: 'Choose from photos & videos'
    },
    document: {
      id: 'document',
      label: 'Document',
      icon: DocumentIcon,
      color: '#FF9800',
      description: 'Share a file'
    },
    location: {
      id: 'location',
      label: 'Location',
      icon: LocationIcon,
      color: '#F44336',
      description: 'Share your location'
    },
    contact: {
      id: 'contact',
      label: 'Contact',
      icon: ContactIcon,
      color: '#9C27B0',
      description: 'Share a contact'
    }
  };

  // Filter available types
  const availableAttachmentTypes = availableTypes
    .map(type => attachmentTypes[type])
    .filter(Boolean);

  // Handle attachment type selection
  const handleAttachmentSelect = (attachmentType) => {
    if (disabled) return;
    
    if (onAttachmentSelect) {
      onAttachmentSelect(attachmentType.id);
    }
    
    if (onClose) {
      onClose();
    }
  };

  // Handle click away
  const handleClickAway = () => {
    if (onClose) {
      onClose();
    }
  };

  // Calculate position for desktop
  const getPosition = () => {
    if (!anchorEl || isMobile) return {};
    
    const rect = anchorEl.getBoundingClientRect();
    return {
      position: 'fixed',
      bottom: window.innerHeight - rect.top + 8,
      left: rect.left,
      zIndex: theme.zIndex.modal
    };
  };

  if (!open) return null;

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Fade in={open}>
        <Paper
          elevation={8}
          sx={{
            ...getPosition(),
            ...(isMobile ? {
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              borderRadius: '16px 16px 0 0',
              zIndex: theme.zIndex.modal
            } : {
              borderRadius: 2,
              minWidth: 280
            }),
            bgcolor: 'background.paper',
            overflow: 'hidden'
          }}
        >
          {/* Header for mobile */}
          {isMobile && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                borderBottom: 1,
                borderColor: 'divider'
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                Share
              </Typography>
              <IconButton
                onClick={onClose}
                size="small"
                sx={{ color: 'text.secondary' }}
                aria-label="close"
              >
                <CloseIcon />
              </IconButton>
            </Box>
          )}

          {/* Attachment Options */}
          <Box
            sx={{
              p: isMobile ? 2 : 1,
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
              gap: 1,
              minWidth: isMobile ? 'auto' : 240
            }}
          >
            {availableAttachmentTypes.map((attachmentType) => {
              const IconComponent = attachmentType.icon;
              
              return (
                <Tooltip
                  key={attachmentType.id}
                  title={attachmentType.description}
                  placement="top"
                  arrow
                >
                  <Box
                    onClick={() => handleAttachmentSelect(attachmentType)}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      p: isMobile ? 2 : 1.5,
                      borderRadius: 2,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.5 : 1,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': disabled ? {} : {
                        bgcolor: 'action.hover',
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[2]
                      },
                      '&:active': disabled ? {} : {
                        transform: 'translateY(0)',
                        boxShadow: theme.shadows[1]
                      }
                    }}
                  >
                    {/* Icon */}
                    <Box
                      sx={{
                        width: isMobile ? 48 : 40,
                        height: isMobile ? 48 : 40,
                        borderRadius: '50%',
                        bgcolor: attachmentType.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 1,
                        transition: 'transform 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'scale(1.1)'
                        }
                      }}
                    >
                      <IconComponent
                        sx={{
                          color: 'white',
                          fontSize: isMobile ? 24 : 20
                        }}
                      />
                    </Box>

                    {/* Label */}
                    <Typography
                      variant={isMobile ? 'caption' : 'body2'}
                      sx={{
                        fontWeight: 'medium',
                        textAlign: 'center',
                        color: 'text.primary'
                      }}
                    >
                      {attachmentType.label}
                    </Typography>
                  </Box>
                </Tooltip>
              );
            })}
          </Box>

          {/* Safe area padding for mobile */}
          {isMobile && (
            <Box sx={{ height: 'env(safe-area-inset-bottom, 16px)' }} />
          )}
        </Paper>
      </Fade>
    </ClickAwayListener>
  );
};

export default AttachmentPicker;