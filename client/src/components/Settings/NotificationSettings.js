import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Slider,
  Button,
  Card,
  CardContent,
  Divider,
  Alert,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  VolumeUp as VolumeIcon,
  VolumeOff as VolumeOffIcon,
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  TestTube as TestIcon
} from '@mui/icons-material';
import notificationSoundService from '../../services/NotificationSoundService';
import pushNotificationService from '../../services/PushNotificationService';

const NotificationSettings = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(0.7);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [pushPermission, setPushPermission] = useState('default');
  const [pushSupported, setPushSupported] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load current settings
    setSoundEnabled(notificationSoundService.isEnabled());
    setSoundVolume(notificationSoundService.getVolume());
    setPushEnabled(pushNotificationService.isEnabled());
    setPushPermission(pushNotificationService.permission);
    setPushSupported(pushNotificationService.isSupported);
  }, []);

  const handleSoundToggle = (enabled) => {
    setSoundEnabled(enabled);
    notificationSoundService.setEnabled(enabled);
    
    if (enabled) {
      // Test sound when enabling
      notificationSoundService.testSound();
    }
  };

  const handleVolumeChange = (event, newValue) => {
    setSoundVolume(newValue);
    notificationSoundService.setVolume(newValue);
  };

  const handleVolumeChangeCommitted = () => {
    // Test sound at new volume
    notificationSoundService.testSound();
  };

  const handlePushToggle = async (enabled) => {
    setLoading(true);
    
    try {
      if (enabled) {
        const granted = await pushNotificationService.requestPermission();
        if (granted) {
          setPushEnabled(true);
          setPushPermission('granted');
          pushNotificationService.setEnabled(true);
        } else {
          setPushEnabled(false);
          setPushPermission(pushNotificationService.permission);
        }
      } else {
        await pushNotificationService.unsubscribe();
        setPushEnabled(false);
        pushNotificationService.setEnabled(false);
      }
    } catch (error) {
      console.error('Error toggling push notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const testSound = (type = 'default') => {
    notificationSoundService.testSound(type);
  };

  const testPushNotification = async () => {
    if (pushPermission === 'granted') {
      await pushNotificationService.testNotification();
    }
  };

  const getPermissionStatus = () => {
    switch (pushPermission) {
      case 'granted':
        return { color: 'success', text: 'Granted' };
      case 'denied':
        return { color: 'error', text: 'Denied' };
      default:
        return { color: 'warning', text: 'Not requested' };
    }
  };

  const soundTypes = [
    { key: 'message', label: 'Message' },
    { key: 'friendRequest', label: 'Friend Request' },
    { key: 'like', label: 'Like' },
    { key: 'comment', label: 'Comment' },
    { key: 'system', label: 'System' }
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Notification Settings
      </Typography>

      {/* Sound Notifications */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            {soundEnabled ? <VolumeIcon color="primary" /> : <VolumeOffIcon color="disabled" />}
            <Typography variant="h6" sx={{ ml: 1, flexGrow: 1 }}>
              Sound Notifications
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={soundEnabled}
                  onChange={(e) => handleSoundToggle(e.target.checked)}
                />
              }
              label=""
            />
          </Box>

          {soundEnabled && (
            <>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Volume
              </Typography>
              <Box sx={{ px: 2, mb: 2 }}>
                <Slider
                  value={soundVolume}
                  onChange={handleVolumeChange}
                  onChangeCommitted={handleVolumeChangeCommitted}
                  min={0}
                  max={1}
                  step={0.1}
                  marks={[
                    { value: 0, label: '0%' },
                    { value: 0.5, label: '50%' },
                    { value: 1, label: '100%' }
                  ]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
                />
              </Box>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                Test Sounds
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {soundTypes.map((sound) => (
                  <Button
                    key={sound.key}
                    size="small"
                    variant="outlined"
                    onClick={() => testSound(sound.key)}
                    startIcon={<TestIcon />}
                  >
                    {sound.label}
                  </Button>
                ))}
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            {pushEnabled ? <NotificationsIcon color="primary" /> : <NotificationsOffIcon color="disabled" />}
            <Typography variant="h6" sx={{ ml: 1, flexGrow: 1 }}>
              Push Notifications
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={pushEnabled}
                  onChange={(e) => handlePushToggle(e.target.checked)}
                  disabled={loading || !pushSupported}
                />
              }
              label=""
            />
          </Box>

          {!pushSupported && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Push notifications are not supported in this browser.
            </Alert>
          )}

          {pushSupported && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Permission Status:
                </Typography>
                <Chip
                  label={getPermissionStatus().text}
                  color={getPermissionStatus().color}
                  size="small"
                />
              </Box>

              {pushPermission === 'denied' && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Push notifications are blocked. Please enable them in your browser settings.
                </Alert>
              )}

              {pushEnabled && pushPermission === 'granted' && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={testPushNotification}
                  startIcon={<TestIcon />}
                >
                  Test Push Notification
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Device-Specific Information */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Device Support
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Web Push:</Typography>
              <Chip
                label={pushSupported ? 'Supported' : 'Not Supported'}
                color={pushSupported ? 'success' : 'error'}
                size="small"
              />
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Sound Notifications:</Typography>
              <Chip
                label={notificationSoundService.audioContext ? 'Supported' : 'Not Supported'}
                color={notificationSoundService.audioContext ? 'success' : 'error'}
                size="small"
              />
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Service Worker:</Typography>
              <Chip
                label={'serviceWorker' in navigator ? 'Supported' : 'Not Supported'}
                color={'serviceWorker' in navigator ? 'success' : 'error'}
                size="small"
              />
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="body2" color="text.secondary">
            <strong>iOS:</strong> Push notifications work in Safari and when the app is added to the home screen.
            <br />
            <strong>Android:</strong> Full push notification support in Chrome and other modern browsers.
            <br />
            <strong>Huawei:</strong> Uses HMS Push Kit for devices without Google Play Services.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default NotificationSettings;