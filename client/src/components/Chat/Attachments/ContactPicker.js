import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Avatar,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  Chip,
  Card,
  CardContent,
  Divider,
  useTheme,
  useMediaQuery,
  Tooltip
} from '@mui/material';
import {
  ContactPhone as ContactIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Group as GroupIcon,
  PersonAdd as PersonAddIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import useContactPicker from '../../../hooks/useContactPicker';

/**
 * ContactPicker component for sharing contacts in chat
 * Features:
 * - Contact selection from neighbours and friends
 * - Search functionality with real-time filtering
 * - Contact preview with name and contact information
 * - Responsive design for mobile and desktop
 * - Online status indicators
 * 
 * Requirements addressed:
 * - 7.1: Display options for Camera, Photo & Video Library, Document, Location, and Contact
 * - 7.6: Show name and phone/email information for contacts
 */
const ContactPicker = ({
  onContactSelect,
  onClose,
  disabled = false,
  showPreview = true,
  maxHeight = 400,
  className = ''
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const {
    contacts,
    loading,
    error,
    searchQuery,
    selectedContact,
    hasContacts,
    filterContacts,
    selectContact,
    clearSelection,
    formatContactForSharing,
    fetchContacts,
    setSearchQuery
  } = useContactPicker();

  const [previewMode, setPreviewMode] = useState(false);

  // Handle contact selection
  const handleContactSelect = useCallback((contact) => {
    if (disabled) return;
    
    selectContact(contact);
    if (showPreview) {
      setPreviewMode(true);
    } else {
      handleShareContact(contact);
    }
  }, [disabled, selectContact, showPreview]);

  // Handle contact sharing
  const handleShareContact = useCallback((contact = selectedContact) => {
    if (!contact || disabled) return;

    const contactData = formatContactForSharing(contact);
    
    if (onContactSelect) {
      onContactSelect(contactData);
    }

    if (onClose) {
      onClose();
    }
  }, [selectedContact, disabled, formatContactForSharing, onContactSelect, onClose]);

  // Handle search input change
  const handleSearchChange = useCallback((event) => {
    const query = event.target.value;
    setSearchQuery(query);
    filterContacts(query);
  }, [setSearchQuery, filterContacts]);

  // Handle back to list
  const handleBackToList = useCallback(() => {
    setPreviewMode(false);
    clearSelection();
  }, [clearSelection]);

  // Handle refresh contacts
  const handleRefresh = useCallback(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Get contact type color
  const getContactTypeColor = useCallback((type) => {
    switch (type) {
      case 'friend':
        return theme.palette.success.main;
      case 'neighbour':
        return theme.palette.primary.main;
      default:
        return theme.palette.grey[500];
    }
  }, [theme]);

  // Get contact type icon
  const getContactTypeIcon = useCallback((type) => {
    switch (type) {
      case 'friend':
        return PersonIcon;
      case 'neighbour':
        return GroupIcon;
      default:
        return PersonIcon;
    }
  }, []);

  // Render contact avatar
  const renderContactAvatar = useCallback((contact) => {
    return (
      <Box position="relative">
        <Avatar
          src={contact.avatar}
          sx={{
            bgcolor: getContactTypeColor(contact.type),
            width: 40,
            height: 40
          }}
        >
          {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
        </Avatar>
        {contact.isOnline && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 12,
              height: 12,
              bgcolor: theme.palette.success.main,
              borderRadius: '50%',
              border: `2px solid ${theme.palette.background.paper}`
            }}
          />
        )}
      </Box>
    );
  }, [getContactTypeColor, theme]);

  // Render contact list item
  const renderContactItem = useCallback((contact) => {
    const TypeIcon = getContactTypeIcon(contact.type);
    
    return (
      <ListItem key={contact.id} disablePadding>
        <ListItemButton
          onClick={() => handleContactSelect(contact)}
          disabled={disabled}
          sx={{
            borderRadius: 1,
            mb: 0.5,
            '&:hover': {
              bgcolor: 'action.hover'
            }
          }}
        >
          <ListItemAvatar>
            {renderContactAvatar(contact)}
          </ListItemAvatar>
          
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                  {contact.name}
                </Typography>
                <Chip
                  icon={<TypeIcon sx={{ fontSize: 14 }} />}
                  label={contact.type}
                  size="small"
                  variant="outlined"
                  sx={{
                    height: 20,
                    fontSize: '0.75rem',
                    color: getContactTypeColor(contact.type),
                    borderColor: getContactTypeColor(contact.type)
                  }}
                />
              </Box>
            }
            secondary={
              <Box>
                {contact.email && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    {contact.email}
                  </Typography>
                )}
                {contact.phone && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    {contact.phone}
                  </Typography>
                )}
              </Box>
            }
          />
        </ListItemButton>
      </ListItem>
    );
  }, [handleContactSelect, disabled, renderContactAvatar, getContactTypeIcon, getContactTypeColor]);

  // Render contact preview
  const renderContactPreview = useCallback(() => {
    if (!selectedContact) return null;

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Box sx={{ flexShrink: 0 }}>
              {renderContactAvatar(selectedContact)}
            </Box>
            
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                  {selectedContact.name}
                </Typography>
                <Chip
                  icon={React.createElement(getContactTypeIcon(selectedContact.type), { sx: { fontSize: 14 } })}
                  label={selectedContact.type}
                  size="small"
                  sx={{
                    bgcolor: getContactTypeColor(selectedContact.type),
                    color: 'white',
                    textTransform: 'capitalize'
                  }}
                />
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {selectedContact.email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {selectedContact.email}
                    </Typography>
                  </Box>
                )}
                
                {selectedContact.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {selectedContact.phone}
                    </Typography>
                  </Box>
                )}
                
                {selectedContact.address && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {selectedContact.address}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={handleBackToList}
              size="small"
            >
              Back
            </Button>
            
            <Button
              variant="contained"
              onClick={() => handleShareContact()}
              disabled={disabled}
              size="small"
              startIcon={<ContactIcon />}
            >
              Share Contact
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }, [selectedContact, renderContactAvatar, getContactTypeIcon, getContactTypeColor, handleBackToList, handleShareContact, disabled]);

  return (
    <Box className={`contact-picker ${className}`}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ContactIcon color="primary" />
          <Typography variant="h6">
            {previewMode ? 'Contact Preview' : 'Share Contact'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {!previewMode && (
            <Tooltip title="Refresh contacts">
              <IconButton
                onClick={handleRefresh}
                size="small"
                disabled={loading}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          )}
          {onClose && (
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Preview Mode */}
      {previewMode && selectedContact ? (
        renderContactPreview()
      ) : (
        <>
          {/* Search Bar */}
          <TextField
            fullWidth
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={handleSearchChange}
            disabled={disabled || loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          {/* Loading State */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {/* No Contacts */}
          {!loading && !hasContacts && !error && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {searchQuery ? 'No contacts found matching your search.' : 'No contacts available. Add some neighbours or friends to share their contact information.'}
            </Alert>
          )}

          {/* Contacts List */}
          {!loading && hasContacts && (
            <Box
              sx={{
                maxHeight: maxHeight,
                overflowY: 'auto',
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.paper'
              }}
            >
              <List sx={{ p: 1 }}>
                {contacts.map(renderContactItem)}
              </List>
            </Box>
          )}

          {/* Help Text */}
          {!loading && hasContacts && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Select a contact to share their information in the chat.
                {isMobile && ' Tap on a contact to preview before sharing.'}
              </Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default ContactPicker;