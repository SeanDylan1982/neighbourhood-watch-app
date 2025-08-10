import icons from '../../components/Common/Icons'
import React, { useState, useEffect, useCallback } from 'react';

import LoadingState from '../../components/Common/LoadingState';
import useDataFetching from '../../hooks/useDataFetching';
import { TermsModal, CookiesModal } from '../../components/Legal';
import useCookieConsent from '../../hooks/useCookieConsent';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Palette as ThemeIcon,
  Language as LanguageIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VolumeOff as MuteIcon,
  Check as CheckIcon
} from '@mui/icons-material';

const Settings = () => {
  const [settings, setSettings] = useState({
    notifications: {
      push: true,
      email: true,
      friendRequests: true,
      messages: true,
      chatNotifications: true,
      reportNotifications: true
    },
    privacy: {
      profileVisibility: 'neighbours',
      messagePermissions: 'friends'
    },
    locationSharing: false
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { fetchData, loading, error, clearError } = useDataFetching({
    timeout: 8000,
    retryAttempts: 2,
    onError: (error) => {
      console.error('Settings fetch error:', error);
    }
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Legal document modal state
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState('');
  const [selectedDocument, setSelectedDocument] = useState({ title: '', content: '' });
  
  // Cookie consent management
  const { 
    cookieConsent, 
    showCookieModal, 
    acceptAllCookies, 
    acceptEssentialOnly, 
    dismissModal,
    resetConsent,
    closeCookieModal 
  } = useCookieConsent();

  const fetchSettings = useCallback(async () => {
    try {
      const settingsData = await fetchData('/api/settings');
      
      if (settingsData) {
        setSettings({
          notifications: settingsData.notifications || {
            push: true,
            email: true,
            friendRequests: true,
            messages: true,
            chatNotifications: true,
            reportNotifications: true
          },
          privacy: settingsData.privacy || {
            profileVisibility: 'neighbours',
            messagePermissions: 'friends'
          },
          locationSharing: settingsData.locationSharing || false
        });
      } else {
        // Set default settings if none exist
        setSettings({
          notifications: {
            push: true,
            email: true,
            friendRequests: true,
            messages: true,
            chatNotifications: true,
            reportNotifications: true
          },
          privacy: {
            profileVisibility: 'neighbours',
            messagePermissions: 'friends'
          },
          locationSharing: false
        });
      }
    } catch (error) {
      // Error is already handled by the hook
      console.error('Failed to fetch settings:', error.message);
    }
  }, [fetchData]);

  // Load settings on component mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]); // Now safe to include fetchSettings since it's memoized

  const handleSettingChange = (category, setting, value) => {
    // Update local state immediately for responsive UI
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
    
    // Mark as having unsaved changes
    setHasUnsavedChanges(true);
    setSaveSuccess(false);
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setSaveError('');
      setSaveSuccess(false);
      
      // Save all settings to backend
      await fetchData('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({
          notifications: settings.notifications,
          privacy: settings.privacy,
          preferences: {
            locationSharing: settings.locationSharing
          }
        })
      });

      // Success feedback
      setHasUnsavedChanges(false);
      setSaveSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
      
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveError(error.message || 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = () => {
    // Reload settings from server to discard unsaved changes
    fetchSettings();
    setHasUnsavedChanges(false);
    setSaveError('');
    setSaveSuccess(false);
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSaveError('New passwords do not match');
      return;
    }

    try {
      setSaving(true);
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await fetch(`${baseURL}/api/settings/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(passwordData)
      });

      if (response.ok) {
        setPasswordDialogOpen(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setSaveError('');
        // Show success message
      } else {
        const errorData = await response.json();
        setSaveError(errorData.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setSaveError('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  // Handle opening legal documents
  const handleOpenLegalDocument = (documentType, title) => {
    setLegalModalType(documentType);
    setLegalModalOpen(true);
  };

  const handleCloseLegalDocument = () => {
    setLegalModalOpen(false);
    setLegalModalType('');
  };



  const handleDeleteAccount = async () => {
    try {
      setSaving(true);
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await fetch(`${baseURL}/api/settings/account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ password: passwordData.currentPassword })
      });

      if (response.ok) {
        // Account deleted, redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        const errorData = await response.json();
        setSaveError(errorData.message || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      setSaveError('Failed to delete account');
    } finally {
      setSaving(false);
      setDeleteDialogOpen(false);
    }
  };

  const privacyOptions = [
    { value: 'public', label: 'Everyone' },
    { value: 'neighbours', label: 'Neighbours Only' },
    { value: 'contacts', label: 'My Contacts' },
    { value: 'private', label: 'Private' }
  ];

  const themeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'auto', label: 'Auto' }
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' }
  ];

  if (loading) {
    return (
      <Box sx={{ p: 2, pb: 10 }}>
        <Typography variant="h4" fontWeight="bold" mb={3}>
          Settings
        </Typography>
        <LoadingState 
          variant="cards" 
          count={4} 
          message="Loading your settings..."
        />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {saveError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSaveError('')}>
          {saveError}
        </Alert>
      )}

      {saving && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Saving settings...
        </Alert>
      )}

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully!
        </Alert>
      )}

      {hasUnsavedChanges && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You have unsaved changes. Click "Save Settings" to apply them.
        </Alert>
      )}

      {/* Notifications Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <icons.Notifications color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Notifications
            </Typography>
          </Box>
          
          <List>
            <ListItem>
              <ListItemText 
                primary="Push Notifications" 
                secondary="Receive notifications on your device"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.notifications.push}
                  onChange={(e) => handleSettingChange('notifications', 'push', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
            
            <ListItem>
              <ListItemText 
                primary="Email Notifications" 
                secondary="Receive notifications via email"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.notifications.email}
                  onChange={(e) => handleSettingChange('notifications', 'email', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
            
            <ListItem>
              <ListItemText 
                primary="Friend Requests" 
                secondary="Notifications for new friend requests"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.notifications.friendRequests}
                  onChange={(e) => handleSettingChange('notifications', 'friendRequests', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
            
            <ListItem>
              <ListItemText 
                primary="Messages" 
                secondary="Notifications for new messages"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.notifications.messages}
                  onChange={(e) => handleSettingChange('notifications', 'messages', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
            
            <ListItem>
              <ListItemText 
                primary="Chat Notifications" 
                secondary="Notifications for chat messages"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.notifications.chatNotifications}
                  onChange={(e) => handleSettingChange('notifications', 'chatNotifications', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
            
            <ListItem>
              <ListItemText 
                primary="Report Notifications" 
                secondary="Notifications for new reports"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.notifications.reportNotifications}
                  onChange={(e) => handleSettingChange('notifications', 'reportNotifications', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <icons.Security color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Privacy & Security
            </Typography>
          </Box>
          
          <Box mb={3}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Profile Visibility</InputLabel>
              <Select
                value={settings.privacy.profileVisibility}
                onChange={(e) => handleSettingChange('privacy', 'profileVisibility', e.target.value)}
                label="Profile Visibility"
              >
                {privacyOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Message Permissions</InputLabel>
              <Select
                value={settings.privacy.messagePermissions}
                onChange={(e) => handleSettingChange('privacy', 'messagePermissions', e.target.value)}
                label="Message Permissions"
              >
                <MenuItem value="everyone">Everyone</MenuItem>
                <MenuItem value="neighbours">Neighbours</MenuItem>
                <MenuItem value="friends">Friends Only</MenuItem>
                <MenuItem value="none">No One</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <List>
            <ListItem>
              <ListItemText 
                primary="Location Sharing" 
                secondary="Share your location with neighbours"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.locationSharing}
                  onChange={(e) => handleSettingChange('settings', 'locationSharing', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>

          <Divider sx={{ my: 2 }} />
          
          <Button
            variant="outlined"
            startIcon={<icons.Lock />}
            onClick={() => setPasswordDialogOpen(true)}
            fullWidth
            sx={{ mb: 1 }}
          >
            Change Password
          </Button>
        </CardContent>
      </Card>

      {/* Legal Documents */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <icons.Article />
            <Typography variant="h6" fontWeight="bold">
              Legal Documents
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            View our legal documents and policies
          </Typography>

          <List>
            <ListItem 
              button 
              onClick={() => handleOpenLegalDocument('terms', 'Terms and Conditions')}
              sx={{ borderRadius: 1, mb: 1 }}
            >
              <ListItemText
                primary="Terms and Conditions"
                secondary="Our terms and conditions for using the platform"
              />
              <icons.ChevronRight />
            </ListItem>
            
            <ListItem 
              button 
              onClick={() => handleOpenLegalDocument('privacy', 'Privacy Policy')}
              sx={{ borderRadius: 1, mb: 1 }}
            >
              <ListItemText
                primary="Privacy Policy"
                secondary="How we collect, use, and protect your personal data"
              />
              <icons.ChevronRight />
            </ListItem>
            
            <ListItem 
              button 
              onClick={() => resetConsent()}
              sx={{ borderRadius: 1, mb: 1 }}
            >
              <ListItemText
                primary="Cookie Preferences"
                secondary={`Current setting: ${cookieConsent === 'all' ? 'All cookies accepted' : cookieConsent === 'essential' ? 'Essential cookies only' : 'Not set'}`}
              />
              <icons.ChevronRight />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card sx={{ mb: 3, borderColor: 'error.main', borderWidth: 1, borderStyle: 'solid' }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <icons.Warning color="error" />
            <Typography variant="h6" fontWeight="bold" color="error">
              Danger Zone
            </Typography>
          </Box>
          
          <Alert severity="warning" sx={{ mb: 2 }}>
            These actions cannot be undone. Please proceed with caution.
          </Alert>
          
          <Button
            variant="outlined"
            color="error"
            startIcon={<icons.Delete />}
            onClick={() => setDeleteDialogOpen(true)}
            fullWidth
          >
            Delete Account
          </Button>
        </CardContent>
      </Card>

      {/* Save Settings Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
        <Button
          variant="outlined"
          size="large"
          onClick={handleResetSettings}
          disabled={!hasUnsavedChanges || saving}
          startIcon={<icons.Close />}
          sx={{ minWidth: 150 }}
        >
          Reset
        </Button>
        <Button
          variant="contained"
          size="large"
          onClick={handleSaveSettings}
          disabled={!hasUnsavedChanges || saving}
          startIcon={saving ? <CircularProgress size={20} /> : <CheckIcon />}
          sx={{ minWidth: 200 }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="password"
            label="Current Password"
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
            margin="normal"
          />
          <TextField
            fullWidth
            type="password"
            label="New Password"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
            margin="normal"
          />
          <TextField
            fullWidth
            type="password"
            label="Confirm New Password"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button 
            onClick={handlePasswordChange} 
            variant="contained"
            disabled={saving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
          >
            {saving ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle color="error">Delete Account</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            This action cannot be undone. All your data will be permanently deleted.
          </Alert>
          <Typography>
            Are you sure you want to delete your account? This will remove all your:
          </Typography>
          <ul>
            <li>Profile information</li>
            <li>Chat messages</li>
            <li>Reports and notices</li>
            <li>Community connections</li>
          </ul>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteAccount} color="error" variant="contained">
            Delete Account
          </Button>
        </DialogActions>
      </Dialog>

      {/* Legal Document Modal */}
      <TermsModal
        open={legalModalOpen}
        onClose={handleCloseLegalDocument}
        onAccept={handleCloseLegalDocument}
        onDecline={handleCloseLegalDocument}
        type={legalModalType}
        alreadyAccepted={false}
      />

      {/* Cookie Consent Modal */}
      <CookiesModal
        open={showCookieModal}
        onClose={closeCookieModal}
        onAccept={acceptAllCookies}
        onDecline={acceptEssentialOnly}
        onDismiss={dismissModal}
        alreadyAccepted={false}
      />
    </Box>
  );
};

export default Settings;