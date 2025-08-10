import icons from '../Common/Icons'
import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Message as MessageIcon,
  PersonRemove as PersonRemoveIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';

const FriendsList = ({ onStartChat }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(false);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await fetch(`${baseURL}/api/friends`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFriends(data);
      } else {
        setError('Failed to load friends');
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
      setError('Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (event, friend) => {
    setAnchorEl(event.currentTarget);
    setSelectedFriend(friend);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedFriend(null);
  };

  const handleStartChat = async () => {
    if (selectedFriend && onStartChat) {
      try {
        await onStartChat(selectedFriend._id);
        handleMenuClose();
      } catch (error) {
        console.error('Error starting chat:', error);
      }
    }
  };

  const handleRemoveFriend = () => {
    setConfirmDialog(true);
    handleMenuClose();
  };

  const confirmRemoveFriend = async () => {
    if (!selectedFriend) return;

    try {
      const response = await fetch(`/api/friends/${selectedFriend._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setFriends(friends.filter(f => f._id !== selectedFriend._id));
        setConfirmDialog(false);
        setSelectedFriend(null);
      } else {
        setError('Failed to remove friend');
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      setError('Failed to remove friend');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'suspended': return 'warning';
      case 'banned': return 'error';
      default: return 'default';
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (friends.length === 0) {
    return (
      <Box textAlign="center" p={3}>
        <Typography variant="body1" color="text.secondary">
          No friends yet. Start connecting with your neighbors!
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <List>
        {friends.map((friend) => (
          <ListItem key={friend._id} divider>
            <ListItemAvatar>
              <Avatar
                src={friend.profileImageUrl}
                sx={{ bgcolor: 'primary.main' }}
              >
                {!friend.profileImageUrl && getInitials(friend.firstName, friend.lastName)}
              </Avatar>
            </ListItemAvatar>
            
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="subtitle1">
                    {friend.firstName} {friend.lastName}
                  </Typography>
                  <Chip
                    label={friend.status}
                    size="small"
                    color={getStatusColor(friend.status)}
                    variant="outlined"
                  />
                </Box>
              }
              secondary={friend.email}
            />
            
            <ListItemSecondaryAction>
              <Box display="flex" gap={1}>
                <IconButton
                  onClick={() => onStartChat(friend._id)}
                  size="small"
                  color="primary"
                >
                  <icons.Message />
                </IconButton>
                <IconButton
                  onClick={(e) => handleMenuClick(e, friend)}
                  size="small"
                >
                  <icons.MoreVert />
                </IconButton>
              </Box>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleStartChat}>
          <icons.Message sx={{ mr: 1 }} />
          Send Message
        </MenuItem>
        <MenuItem onClick={() => console.log('Call feature not implemented')}>
          <icons.Phone sx={{ mr: 1 }} />
          Call
        </MenuItem>
        <MenuItem onClick={handleRemoveFriend} sx={{ color: 'error.main' }}>
          <icons.PersonRemove sx={{ mr: 1 }} />
          Remove Friend
        </MenuItem>
      </Menu>

      {/* Confirm Remove Dialog */}
      <Dialog
        open={confirmDialog}
        onClose={() => setConfirmDialog(false)}
      >
        <DialogTitle>Remove Friend</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove {selectedFriend?.firstName} {selectedFriend?.lastName} from your friends list?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={confirmRemoveFriend} 
            color="error"
            variant="contained"
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FriendsList;