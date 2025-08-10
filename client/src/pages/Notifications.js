import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Avatar,
  Button,
  Chip,
  Tabs,
  Tab,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Pagination,
  Divider
} from '@mui/material';
import {
  PersonAdd as FriendRequestIcon,
  Message as MessageIcon,
  Favorite as LikeIcon,
  Comment as CommentIcon,
  Info as SystemIcon,
  Report as ReportIcon,
  Campaign as NoticeIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  MarkEmailRead as MarkReadIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const navigate = useNavigate();

  const tabs = [
    { label: 'All', value: null },
    { label: 'Unread', value: 'unread' },
    { label: 'Friends', value: 'friendRequest' },
    { label: 'Messages', value: 'message' },
    { label: 'System', value: 'system' }
  ];

  const fetchNotifications = async (tabIndex = currentTab, pageNum = page) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20'
      });

      const tab = tabs[tabIndex];
      if (tab.value === 'unread') {
        params.append('unreadOnly', 'true');
      } else if (tab.value) {
        params.append('type', tab.value);
      }

      const response = await axios.get(`/api/notifications?${params}`);
      
      if (response.data.success) {
        setNotifications(response.data.data.notifications);
        setTotalPages(response.data.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [currentTab, fetchNotifications, page]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    setPage(1);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read if not already read
      if (!notification.read) {
        await axios.put(`/api/notifications/${notification._id}/read`);
        
        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            n._id === notification._id ? { ...n, read: true } : n
          )
        );
      }

      // Navigate based on notification type and reference
      navigateToContent(notification);
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const navigateToContent = (notification) => {
    const { reference, type } = notification;
    
    switch (reference.type) {
      case 'friendRequest':
        navigate('/contacts?tab=friends');
        break;
      case 'message':
        if (type === 'privateMessage') {
          navigate('/chat?tab=private');
        } else {
          navigate('/chat');
        }
        break;
      case 'notice':
        navigate(`/notices/${reference.id}`);
        break;
      case 'report':
        navigate(`/reports/${reference.id}`);
        break;
      case 'user':
        navigate(`/profile/${reference.id}`);
        break;
      default:
        navigate('/dashboard');
    }
  };

  const handleMenuOpen = (event, notification) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedNotification(notification);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedNotification(null);
  };

  const handleMarkAsRead = async () => {
    if (!selectedNotification) return;

    try {
      await axios.put(`/api/notifications/${selectedNotification._id}/read`);
      
      setNotifications(prev => 
        prev.map(n => 
          n._id === selectedNotification._id ? { ...n, read: true } : n
        )
      );
      
      handleMenuClose();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedNotification) return;

    try {
      await axios.delete(`/api/notifications/${selectedNotification._id}`);
      
      setNotifications(prev => 
        prev.filter(n => n._id !== selectedNotification._id)
      );
      
      handleMenuClose();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'friendRequest':
        return <FriendRequestIcon color="primary" />;
      case 'message':
      case 'privateMessage':
        return <MessageIcon color="info" />;
      case 'like':
        return <LikeIcon color="error" />;
      case 'comment':
        return <CommentIcon color="success" />;
      case 'report':
        return <ReportIcon color="warning" />;
      case 'notice':
        return <NoticeIcon color="info" />;
      case 'system':
        return <SystemIcon color="action" />;
      default:
        return <SystemIcon color="action" />;
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffTime = Math.abs(now - notificationDate);
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Notifications
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          {tabs.map((tab, index) => (
            <Tab key={index} label={tab.label} />
          ))}
        </Tabs>
      </Box>

      {notifications.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No notifications found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {tabs[currentTab].value === 'unread' 
                ? "You're all caught up! No unread notifications."
                : "You don't have any notifications yet."
              }
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          <Box sx={{ space: 2 }}>
            {notifications.map((notification, index) => (
              <Card
                key={notification._id}
                sx={{
                  mb: 2,
                  cursor: 'pointer',
                  borderLeft: notification.read ? 'none' : '4px solid',
                  borderLeftColor: 'primary.main',
                  backgroundColor: notification.read ? 'transparent' : 'action.hover',
                  '&:hover': {
                    backgroundColor: 'action.selected',
                  },
                }}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent sx={{ py: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    {notification.sender ? (
                      <Avatar
                        src={notification.sender.profileImageUrl}
                        sx={{ width: 40, height: 40 }}
                      >
                        {notification.sender.firstName?.[0]?.toUpperCase()}
                      </Avatar>
                    ) : (
                      <Box sx={{ p: 1 }}>
                        {getNotificationIcon(notification.type)}
                      </Box>
                    )}

                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            fontWeight: notification.read ? 'normal' : 'bold',
                            flexGrow: 1
                          }}
                        >
                          {notification.title}
                        </Typography>
                        {!notification.read && (
                          <Chip 
                            label="New" 
                            size="small" 
                            color="primary" 
                            sx={{ height: 20, fontSize: '0.75rem' }}
                          />
                        )}
                      </Box>

                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ mb: 1 }}
                      >
                        {notification.content}
                      </Typography>

                      <Typography variant="caption" color="text.secondary">
                        {formatTimeAgo(notification.createdAt)}
                      </Typography>
                    </Box>

                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, notification)}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        {selectedNotification && !selectedNotification.read && (
          <MenuItem onClick={handleMarkAsRead}>
            <MarkReadIcon sx={{ mr: 1 }} />
            Mark as read
          </MenuItem>
        )}
        <MenuItem onClick={handleDelete}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Container>
  );
};

export default Notifications;