import icons from '../../components/Common/Icons'
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  TextField,
  Grid,
  Chip,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Badge
} from '@mui/material';
import {
  Edit as EditIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Shield as ShieldIcon,
  Verified as VerifiedIcon,
  Camera as CameraIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileImageUpload } from '../../components/Upload';
import { getFullImageUrl } from '../../utils/imageUtils';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    bio: user?.bio || ''
  });
  const [originalData, setOriginalData] = useState(profileData);
  const [stats, setStats] = useState({
    reportsFiled: 0,
    messagesSent: 0,
    noticesPosted: 0,
    memberSince: '0d'
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        bio: user.bio || ''
      });
      
      // Fetch user statistics
      const fetchStats = async () => {
        try {
          const baseURL = API_BASE_URL;
          const response = await axios.get(`${baseURL}/api/statistics/profile`);
          setStats(response.data);
        } catch (error) {
          console.error('Error fetching profile stats:', error);
        }
      };
      
      fetchStats();
    }
  }, [user]);

  const handleEdit = () => {
    setOriginalData(profileData);
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      const baseURL = API_BASE_URL;
      const response = await axios.put(`${baseURL}/api/users/profile`, profileData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        // Update the user context with new data
        const updatedUser = { ...user, ...profileData };
        updateUser(updatedUser);
        setEditing(false);
        console.log('Profile updated successfully');
      } else {
        console.error('Profile update failed:', response.data.message);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleCancel = () => {
    setProfileData(originalData);
    setEditing(false);
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: '#f44336',
      moderator: '#ff9800',
      user: '#4caf50'
    };
    return colors[role] || '#607d8b';
  };

  const getRoleIcon = (role) => {
    return <ShieldIcon sx={{ fontSize: 16 }} />;
  };

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        My Profile
      </Typography>

      {/* Profile Header Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={3}>
            <ProfileImageUpload
              currentImageUrl={user?.profileImageUrl}
              onImageUpdate={(newImageUrl) => {
                console.log('Profile image updated:', newImageUrl);
                // Update user context with new profile image
                const updatedUser = { ...user, profileImageUrl: newImageUrl };
                updateUser(updatedUser);
                console.log('User context updated:', updatedUser);
              }}
              size={80}
              editable={true}
            />
            
            <Box flex={1}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="h5" fontWeight="bold">
                  {profileData.firstName} {profileData.lastName}
                </Typography>
                <Badge
                  badgeContent={<VerifiedIcon sx={{ fontSize: 12 }} />}
                  color="primary"
                  sx={{ ml: 1 }}
                />
              </Box>
              
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Chip
                  icon={getRoleIcon(user?.role || 'user')}
                  label={user?.role || 'Community Member'}
                  size="small"
                  sx={{
                    backgroundColor: getRoleColor(user?.role || 'user'),
                    color: 'white',
                    textTransform: 'capitalize'
                  }}
                />
                <Chip
                  label="Verified"
                  size="small"
                  color="success"
                  variant="outlined"
                />
              </Box>

              <Typography variant="body2" color="text.secondary">
                {profileData.bio}
              </Typography>
            </Box>

            <Button
              variant={editing ? "outlined" : "contained"}
              startIcon={editing ? <CancelIcon /> : <icons.Edit />}
              onClick={editing ? handleCancel : handleEdit}
            >
              {editing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Profile Details Card */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" fontWeight="bold">
              Contact Information
            </Typography>
            {editing && (
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
              >
                Save Changes
              </Button>
            )}
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <icons.Email color="action" />
                {editing ? (
                  <TextField
                    fullWidth
                    label="Email"
                    value={profileData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    variant="outlined"
                    size="small"
                  />
                ) : (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1">
                      {profileData.email}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <icons.Phone color="action" />
                {editing ? (
                  <TextField
                    fullWidth
                    label="Phone"
                    value={profileData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    variant="outlined"
                    size="small"
                  />
                ) : (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Phone
                    </Typography>
                    <Typography variant="body1">
                      {profileData.phone}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" alignItems="flex-start" gap={2} mb={2}>
                <icons.LocationOn color="action" sx={{ mt: 0.5 }} />
                {editing ? (
                  <TextField
                    fullWidth
                    label="Address"
                    value={profileData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    variant="outlined"
                    size="small"
                    multiline
                    rows={2}
                  />
                ) : (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Address
                    </Typography>
                    <Typography variant="body1">
                      {profileData.address}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>

            {editing && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Bio"
                  value={profileData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  variant="outlined"
                  multiline
                  rows={3}
                  placeholder="Tell your neighbours about yourself..."
                />
              </Grid>
            )}
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Community Stats */}
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Community Activity
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {stats.reportsFiled}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Reports Filed
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {stats.messagesSent}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Messages Sent
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {stats.noticesPosted}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Notices Posted
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {stats.memberSince}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Member Since
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {editing && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Changes to your profile will be visible to other community members.
        </Alert>
      )}
    </Box>
  );
};

export default Profile;