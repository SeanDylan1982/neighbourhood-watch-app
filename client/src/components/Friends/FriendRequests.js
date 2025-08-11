import icons from '../Common/Icons'
import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/api';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Button,
  IconButton,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Chip,
  Card,
  CardContent
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

const FriendRequests = ({ onRequestUpdate }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingRequests, setProcessingRequests] = useState(new Set());

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const baseURL = API_BASE_URL;
      const [receivedRes, sentRes] = await Promise.all([
        fetch(`${baseURL}/api/friends/requests?type=received`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`${baseURL}/api/friends/requests?type=sent`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      if (receivedRes.ok && sentRes.ok) {
        const [receivedData, sentData] = await Promise.all([
          receivedRes.json(),
          sentRes.json()
        ]);
        
        setReceivedRequests(receivedData);
        setSentRequests(sentData);
      } else {
        setError('Failed to load friend requests');
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      setError('Failed to load friend requests');
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (requestId) => {
    setProcessingRequests(prev => new Set(prev).add(requestId));
    
    try {
      const response = await fetch(`/api/friends/request/${requestId}/accept`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        setReceivedRequests(prev => prev.filter(req => req._id !== requestId));
        if (onRequestUpdate) onRequestUpdate();
      } else {
        setError('Failed to accept friend request');
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      setError('Failed to accept friend request');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const declineRequest = async (requestId) => {
    setProcessingRequests(prev => new Set(prev).add(requestId));
    
    try {
      const response = await fetch(`/api/friends/request/${requestId}/decline`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        setReceivedRequests(prev => prev.filter(req => req._id !== requestId));
        if (onRequestUpdate) onRequestUpdate();
      } else {
        setError('Failed to decline friend request');
      }
    } catch (error) {
      console.error('Error declining friend request:', error);
      setError('Failed to decline friend request');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const cancelRequest = async (requestId) => {
    setProcessingRequests(prev => new Set(prev).add(requestId));
    
    try {
      const response = await fetch(`/api/friends/request/${requestId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        setSentRequests(prev => prev.filter(req => req._id !== requestId));
        if (onRequestUpdate) onRequestUpdate();
      } else {
        setError('Failed to cancel friend request');
      }
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      setError('Failed to cancel friend request');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
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

  const currentRequests = activeTab === 0 ? receivedRequests : sentRequests;
  const hasRequests = currentRequests.length > 0;

  return (
    <Box>
      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
      >
        <Tab 
          label={`Received (${receivedRequests.length})`} 
          disabled={loading}
        />
        <Tab 
          label={`Sent (${sentRequests.length})`} 
          disabled={loading}
        />
      </Tabs>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      {/* Requests List */}
      {!hasRequests ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" textAlign="center">
              {activeTab === 0 
                ? 'No friend requests received' 
                : 'No friend requests sent'
              }
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <List>
          {currentRequests.map((request) => {
            const user = activeTab === 0 ? request.from : request.to;
            const isProcessing = processingRequests.has(request._id);
            
            return (
              <ListItem key={request._id} divider>
                <ListItemAvatar>
                  <Avatar
                    src={user.profileImageUrl}
                    sx={{ bgcolor: 'primary.main' }}
                  >
                    {!user.profileImageUrl && getInitials(user.firstName, user.lastName)}
                  </Avatar>
                </ListItemAvatar>
                
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtitle1">
                        {user.firstName} {user.lastName}
                      </Typography>
                      <Chip
                        label={formatDate(request.createdAt)}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {user.email}
                      </Typography>
                      {request.message && (
                        <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                          "{request.message}"
                        </Typography>
                      )}
                    </Box>
                  }
                />
                
                <ListItemSecondaryAction>
                  {isProcessing ? (
                    <CircularProgress size={24} />
                  ) : activeTab === 0 ? (
                    // Received requests - Accept/Decline buttons
                    <Box display="flex" gap={1}>
                      <IconButton
                        color="success"
                        onClick={() => acceptRequest(request._id)}
                        size="small"
                      >
                        <icons.Check />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => declineRequest(request._id)}
                        size="small"
                      >
                        <icons.Close />
                      </IconButton>
                    </Box>
                  ) : (
                    // Sent requests - Cancel button
                    <IconButton
                      color="error"
                      onClick={() => cancelRequest(request._id)}
                      size="small"
                    >
                      <CancelIcon />
                    </IconButton>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            );
          })}
        </List>
      )}
    </Box>
  );
};

export default FriendRequests;