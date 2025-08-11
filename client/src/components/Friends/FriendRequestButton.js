import icons from '../Common/Icons'
import React, { useState, useEffect } from 'react';
import {
  Button,
  IconButton,
  CircularProgress,
  Chip,
  Tooltip
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Pending as PendingIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { API_BASE_URL } from '../../config/api';

const FriendRequestButton = ({ 
  userId, 
  size = 'medium',
  variant = 'contained',
  showLabel = true,
  onStatusChange
}) => {
  const [status, setStatus] = useState('none'); // none, friends, request_sent, request_received
  const [requestId, setRequestId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Fetch initial friend status
  useEffect(() => {
    const fetchFriendStatus = async () => {
      try {
        const response = await fetch(`/api/friends/status/${userId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setStatus(data.status);
          setRequestId(data.requestId || null);
        }
      } catch (error) {
        console.error('Error fetching friend status:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    if (userId) {
      fetchFriendStatus();
    }
  }, [userId]);

  const sendFriendRequest = async () => {
    setLoading(true);
    try {
      const baseURL = API_BASE_URL;
      const response = await fetch(`${baseURL}/api/friends/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        const data = await response.json();
        setStatus('request_sent');
        setRequestId(data.request._id);
        if (onStatusChange) onStatusChange('request_sent');
      } else {
        const error = await response.json();
        console.error('Failed to send friend request:', error.message);
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
    } finally {
      setLoading(false);
    }
  };

  const acceptFriendRequest = async () => {
    if (!requestId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/friends/request/${requestId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setStatus('friends');
        setRequestId(null);
        if (onStatusChange) onStatusChange('friends');
      } else {
        console.error('Failed to accept friend request');
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
    } finally {
      setLoading(false);
    }
  };

  const declineFriendRequest = async () => {
    if (!requestId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/friends/request/${requestId}/decline`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setStatus('none');
        setRequestId(null);
        if (onStatusChange) onStatusChange('none');
      } else {
        console.error('Failed to decline friend request');
      }
    } catch (error) {
      console.error('Error declining friend request:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelFriendRequest = async () => {
    if (!requestId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/friends/request/${requestId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setStatus('none');
        setRequestId(null);
        if (onStatusChange) onStatusChange('none');
      } else {
        console.error('Failed to cancel friend request');
      }
    } catch (error) {
      console.error('Error cancelling friend request:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFriend = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/friends/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setStatus('none');
        if (onStatusChange) onStatusChange('none');
      } else {
        console.error('Failed to remove friend');
      }
    } catch (error) {
      console.error('Error removing friend:', error);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <CircularProgress size={size === 'small' ? 16 : 24} />;
  }

  if (status === 'self') {
    return null; // Don't show button for self
  }

  if (loading) {
    return <CircularProgress size={size === 'small' ? 16 : 24} />;
  }

  // Render based on status
  switch (status) {
    case 'friends':
      return (
        <Tooltip title="Remove friend">
          <Chip
            icon={<icons.People />}
            label={showLabel ? 'Friends' : ''}
            color="success"
            variant="outlined"
            onClick={removeFriend}
            size={size}
          />
        </Tooltip>
      );

    case 'request_sent':
      return (
        <Tooltip title="Cancel friend request">
          <Chip
            icon={<PendingIcon />}
            label={showLabel ? 'Request Sent' : ''}
            color="warning"
            variant="outlined"
            onClick={cancelFriendRequest}
            size={size}
          />
        </Tooltip>
      );

    case 'request_received':
      return (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Tooltip title="Accept friend request">
            <IconButton
              color="success"
              onClick={acceptFriendRequest}
              size={size}
            >
              <icons.Check />
            </IconButton>
          </Tooltip>
          <Tooltip title="Decline friend request">
            <IconButton
              color="error"
              onClick={declineFriendRequest}
              size={size}
            >
              <icons.Close />
            </IconButton>
          </Tooltip>
        </div>
      );

    case 'none':
    default:
      return (
        <Button
          variant={variant}
          color="primary"
          startIcon={<icons.PersonAdd />}
          onClick={sendFriendRequest}
          size={size}
        >
          {showLabel ? 'Add Friend' : ''}
        </Button>
      );
  }
};

export default FriendRequestButton;