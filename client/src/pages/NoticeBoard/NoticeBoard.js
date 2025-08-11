import icons from '../../components/Common/Icons'
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ImageUpload, MediaPreview } from '../../components/Upload';
import { ImageThumbnailGrid } from '../../components/Common/ImageThumbnail';
import NoticeBoardWelcomeMessage from '../../components/Welcome/NoticeBoardWelcomeMessage';
import EmptyState from '../../components/Common/EmptyState';
import TermsModal from '../../components/Legal/TermsModal';
import useTermsAcceptance from '../../hooks/useTermsAcceptance';
import { useToast } from '../../components/Common/Toast';
import ViewToggle from '../../components/Common/ViewToggle/ViewToggle';
import useViewPreference from '../../hooks/useViewPreference';
import PinIcon from '../../components/Common/PinIcon';
import PinAction from '../../components/Common/PinAction';
import { API_BASE_URL } from '../../config/api';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Grid,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Event as EventIcon,
} from '@mui/icons-material';

const NoticeBoard = () => {
  const { id: noticeId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailView, setDetailView] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [pendingNoticeSubmission, setPendingNoticeSubmission] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportingNotice, setReportingNotice] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' // 'success', 'error', 'warning', 'info'
  });

  // View preference hook for layout toggle
  const [currentView, handleViewChange] = useViewPreference('noticeboard-view-preference', 'grid');

  // Helper function to show snackbar messages
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // Helper function to close snackbar
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Terms acceptance hook
  const { 
    canPostNotice, 
    acceptTerms, 
    loading: termsLoading,
    error: termsError 
  } = useTermsAcceptance();
  const [newNotice, setNewNotice] = useState({
    title: '',
    content: '',
    category: 'general',
    priority: 'normal',
  });
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Handle back navigation with proper browser history support
  const handleBackNavigation = useCallback(() => {
    // Try to go back in browser history
    // If the user came from within the app, this will work correctly
    // If they came from external link or direct URL, we'll provide fallback
    try {
      // Check if we have a referrer from the same origin
      const referrer = document.referrer;
      const currentOrigin = window.location.origin;
      
      if (referrer && referrer.startsWith(currentOrigin)) {
        // We came from within the app, safe to go back
        navigate(-1);
      } else {
        // External referrer or no referrer, go to notices list
        navigate('/notices');
      }
    } catch (error) {
      // Fallback to notices list if anything goes wrong
      console.warn('Navigation fallback triggered:', error);
      navigate('/notices');
    }
  }, [navigate]);

  const fetchNotices = useCallback(async () => {
    try {
      const baseURL = API_BASE_URL;
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        return;
      }
      
      const response = await fetch(`${baseURL}/api/notices`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const formattedNotices = data.map(notice => ({
            id: notice._id,
            title: notice.title,
            content: notice.content,
            category: notice.category,
            priority: notice.priority,
            author: notice.authorId ? 
              `${notice.authorId.firstName} ${notice.authorId.lastName}` : 
              'Unknown User',
            authorAvatar: notice.authorId?.profileImageUrl || null,
            createdAt: formatTimeAgo(notice.createdAt),
            isPinned: notice.isPinned,
            viewCount: notice.viewCount || 0,
            likes: notice.likes?.length || 0,
            comments: notice.comments?.length || 0,
            media: notice.media || []
          }));
          setNotices(formattedNotices);
          console.log(`✅ Loaded ${formattedNotices.length} notices`);
        } else {
          console.warn('No notices returned from API');
          // Don't clear existing notices if API returns empty array
          if (notices.length === 0) {
            setNotices([]);
          }
        }
      } else if (response.status === 401) {
        console.error('Authentication failed - redirecting to login');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        console.error('Failed to fetch notices:', response.status, response.statusText);
        // Don't clear existing notices on error
      }
    } catch (error) {
      console.error('Error fetching notices:', error);
      // Don't clear existing notices on network error
    } finally {
      setLoading(false);
    }
  }, [notices.length]);

  const fetchSingleNotice = useCallback(async (id) => {
    try {
      const baseURL = API_BASE_URL;
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${baseURL}/api/notices/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const notice = await response.json();
        const formattedNotice = {
          id: notice._id,
          title: notice.title,
          content: notice.content,
          category: notice.category,
          priority: notice.priority,
          author: notice.authorId ? 
            `${notice.authorId.firstName} ${notice.authorId.lastName}` : 
            'Unknown User',
          authorAvatar: notice.authorId?.profileImageUrl || null,
          createdAt: formatTimeAgo(notice.createdAt),
          isPinned: notice.isPinned,
          viewCount: notice.viewCount || 0,
          likes: notice.likes?.length || 0,
          comments: notice.comments || [],
          media: notice.media || []
        };
        setSelectedNotice(formattedNotice);
        setDetailView(true);
      } else {
        console.error('Failed to fetch notice');
        // Use proper back navigation instead of direct navigation
        handleBackNavigation();
      }
    } catch (error) {
      console.error('Error fetching notice:', error);
      // Use proper back navigation instead of direct navigation
      handleBackNavigation();
    } finally {
      setLoading(false);
    }
  }, [navigate, handleBackNavigation]);

  // Fetch notices from API
  useEffect(() => {
    if (noticeId) {
      // Fetch single notice for detail view
      fetchSingleNotice(noticeId);
    } else {
      // Fetch all notices for list view
      fetchNotices();
    }
  }, [fetchNotices, fetchSingleNotice, noticeId]);

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffTime = Math.abs(now - date);
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      return `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return '1 day ago';
    } else {
      return `${diffDays} days ago`;
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'event': return <icons.NoticeBoard />;
      case 'safety': return <icons.Warning />;
      default: return <icons.NoticeBoard />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'safety': return 'error';
      case 'event': return 'success';
      case 'lost_found': return 'warning';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'normal': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const handleMenuClick = (event, notice) => {
    setAnchorEl(event.currentTarget);
    setSelectedNotice(notice);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedNotice(null);
  };

  const handleCreateNotice = () => {
    // Directly open the notice dialog
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setNewNotice({
      title: '',
      content: '',
      category: 'general',
      priority: 'normal',
    });
    setSelectedFiles([]);
  };

  const handleSubmitNotice = async () => {

    try {
      const formData = new FormData();
      formData.append('title', newNotice.title);
      formData.append('content', newNotice.content);
      formData.append('category', newNotice.category);
      formData.append('priority', newNotice.priority);
      
      // Add media files
      selectedFiles.forEach(file => {
        formData.append('media', file);
      });

      const baseURL = API_BASE_URL;
      const response = await fetch(`${baseURL}/api/notices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData,
      });

      if (response.ok) {
        const createdNotice = await response.json();
        const formattedNotice = {
          id: createdNotice._id,
          title: createdNotice.title,
          content: createdNotice.content,
          category: createdNotice.category,
          priority: createdNotice.priority,
          author: 'You',
          authorAvatar: null,
          createdAt: 'Just now',
          isPinned: createdNotice.isPinned,
          viewCount: 0,
          likes: 0,
          comments: 0,
          media: createdNotice.media || []
        };
        
        setNotices([formattedNotice, ...notices]);
        handleDialogClose();
        showToast('Notice posted successfully!', 'success');
      } else {
        let errorMessage = 'Failed to create notice';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          // If we can't parse JSON, try to get text
          try {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          } catch (textError) {
            errorMessage = `Server error (${response.status})`;
          }
        }
        console.error('Failed to create notice:', response.status, errorMessage);
        showToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Error creating notice:', error);
      showToast(`Error creating notice: ${error.message}`, 'error');
    }
  };

  // Handle terms acceptance
  const handleAcceptTerms = async () => {
    try {
      await acceptTerms('noticeBoardTerms');
      setShowTermsModal(false);
      
      // If there was a pending submission, proceed with it
      if (pendingNoticeSubmission) {
        setPendingNoticeSubmission(false);
        setOpenDialog(true);
      } else {
        // Otherwise, just open the dialog
        setOpenDialog(true);
      }
    } catch (error) {
      console.error('Error accepting terms:', error);
      // Error is handled by the hook and displayed in the modal
    }
  };

  const handleDeclineTerms = () => {
    setShowTermsModal(false);
    setPendingNoticeSubmission(false);
    // Don't open the dialog if terms are declined
  };

  const handleCloseTermsModal = () => {
    setShowTermsModal(false);
    setPendingNoticeSubmission(false);
  };

  const handleReportNotice = (notice) => {
    setReportingNotice(notice);
    setReportDialogOpen(true);
  };

  const handleSubmitReport = async () => {
    if (!reportReason.trim()) {
      showSnackbar('Please provide a reason for reporting this notice.', 'warning');
      return;
    }

    try {
      const baseURL = API_BASE_URL;
      const response = await fetch(`${baseURL}/api/moderation/report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contentType: 'notice',
          contentId: reportingNotice.id,
          reason: reportReason
        }),
      });

      if (response.ok) {
        showSnackbar('Notice reported successfully. Thank you for helping keep our community safe.', 'success');
        setReportDialogOpen(false);
        setReportReason('');
        setReportingNotice(null);
      } else {
        let errorMessage = 'Failed to report this content.';
        
        try {
          const errorData = await response.json();
          
          // Handle specific error cases
          if (response.status === 409 && errorData.message === 'You have already reported this content') {
            errorMessage = 'You have already reported this content. Thank you for your previous report.';
            // Close the dialog since the user has already reported this content
            setReportDialogOpen(false);
            setReportReason('');
            setReportingNotice(null);
          } else if (response.status === 404) {
            errorMessage = 'The content you are trying to report could not be found.';
          } else if (response.status === 400) {
            errorMessage = 'Invalid report information. Please check your input and try again.';
          } else if (response.status >= 500) {
            errorMessage = 'Server error. Please try again later.';
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          // If we can't parse the error response, use the status code
          if (response.status === 409) {
            errorMessage = 'You have already reported this content. Thank you for your previous report.';
            // Close the dialog for duplicate reports
            setReportDialogOpen(false);
            setReportReason('');
            setReportingNotice(null);
          } else if (response.status >= 500) {
            errorMessage = 'Server error. Please try again later.';
          }
        }
        
        console.error('Failed to report notice:', response.status, errorMessage);
        showSnackbar(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Error reporting notice:', error);
      showSnackbar(`Error reporting notice: ${error.message}`, 'error');
    }
  };

  const handleCloseReportDialog = () => {
    setReportDialogOpen(false);
    setReportReason('');
    setReportingNotice(null);
  };

  const handlePinChange = (noticeId, newPinStatus) => {
    setNotices(prevNotices => 
      prevNotices.map(notice => 
        notice.id === noticeId 
          ? { ...notice, isPinned: newPinStatus }
          : notice
      )
    );
    
    // Also update selectedNotice if it's the same notice
    if (selectedNotice && selectedNotice.id === noticeId) {
      setSelectedNotice(prev => ({ ...prev, isPinned: newPinStatus }));
    }
  };

  // Render detail view if viewing single notice
  if (detailView && selectedNotice) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button 
            onClick={handleBackNavigation}
            sx={{ mr: 2 }}
          >
            ← Back
          </Button>
          <Typography variant="h4">
            Notice Details
          </Typography>
        </Box>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  icon={getCategoryIcon(selectedNotice.category)}
                  label={selectedNotice.category.replace('_', ' ')}
                  color={getCategoryColor(selectedNotice.category)}
                  size="small"
                />
                {selectedNotice.priority !== 'normal' && (
                  <Chip
                    label={selectedNotice.priority}
                    color={getPriorityColor(selectedNotice.priority)}
                    size="small"
                  />
                )}
              </Box>
            </Box>
            {selectedNotice.isPinned && (
              <PinIcon size={20} tooltip="This notice is pinned" />
            )}

            <Typography variant="h6" gutterBottom>
              {selectedNotice.title}
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>
              {selectedNotice.content}
            </Typography>

            {/* Media Display */}
            {selectedNotice.media && selectedNotice.media.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <MediaPreview 
                  media={selectedNotice.media} 
                  maxHeight={300}
                  columns={{ xs: 1, sm: 2, md: 3 }}
                />
              </Box>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{ width: 32, height: 32 }}>
                {selectedNotice.author[0]}
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight="bold">
                  {selectedNotice.author}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedNotice.createdAt} • {selectedNotice.viewCount} views
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                variant="outlined"
                startIcon={<icons.ThumbUp />}
                size="small"
              >
                Like ({selectedNotice.likes})
              </Button>
              <Button
                variant="outlined"
                startIcon={<icons.Comment />}
                size="small"
              >
                Comment ({selectedNotice.comments.length})
              </Button>
            </Box>

            {/* Comments Section */}
            <Divider sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Comments ({selectedNotice.comments.length})
            </Typography>
            
            {selectedNotice.comments.map((comment, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Avatar sx={{ width: 24, height: 24 }}>
                    {comment.author?.firstName?.[0] || 'U'}
                  </Avatar>
                  <Typography variant="body2" fontWeight="bold">
                    {comment.author ? `${comment.author.firstName} ${comment.author.lastName}` : 'Unknown User'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatTimeAgo(comment.createdAt)}
                  </Typography>
                </Box>
                <Typography variant="body2">
                  {comment.content}
                </Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Notice Board
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <ViewToggle
            currentView={currentView}
            onViewChange={handleViewChange}
            storageKey="noticeboard-view-preference"
          />
          <Button
            variant="contained"
            startIcon={<icons.Add />}
            onClick={handleCreateNotice}
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          >
            Post Notice
          </Button>
        </Box>
      </Box>

      {/* Welcome message for new users */}
      <NoticeBoardWelcomeMessage 
        onCreateNotice={handleCreateNotice}
      />

      <Grid container spacing={3}>
        {notices.length === 0 ? (
          <Grid item xs={12}>
            <EmptyState
              type="notices"
              onAction={handleCreateNotice}
            />
          </Grid>
        ) : (
          notices.map((notice) => (
          <Grid item xs={12} md={currentView === 'grid' ? 6 : 12} key={notice.id}>
            <Card sx={{ 
              height: currentView === 'grid' ? '100%' : 'auto', 
              display: 'flex', 
              flexDirection: currentView === 'grid' ? 'column' : 'row' 
            }}>
              <CardContent sx={{ 
                flex: 1,
                display: 'flex',
                flexDirection: currentView === 'grid' ? 'column' : 'row',
                gap: currentView === 'list' ? 2 : 0
              }}>
                {currentView === 'list' && (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    minWidth: 60,
                    justifyContent: 'center'
                  }}>
                    {getCategoryIcon(notice.category)}
                  </Box>
                )}
                
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: currentView === 'grid' ? 2 : 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {currentView === 'grid' && (
                        <Chip
                          icon={getCategoryIcon(notice.category)}
                          label={notice.category.replace('_', ' ')}
                          color={getCategoryColor(notice.category)}
                          size="small"
                        />
                      )}
                      {currentView === 'list' && (
                        <Typography variant="h6" fontWeight="bold">
                          {notice.title}
                        </Typography>
                      )}
                      {notice.priority !== 'normal' && (
                        <Chip
                          label={notice.priority}
                          color={getPriorityColor(notice.priority)}
                          size="small"
                        />
                      )}
                    </Box>
                    {notice.isPinned && (
                      <PinIcon size={20} tooltip="This notice is pinned" />
                    )}
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, notice)}
                      >
                      <icons.MoreVert />
                    </IconButton>
                  </Box>

                  {currentView === 'grid' && (
                    <Typography variant="h6" gutterBottom>
                      {notice.title}
                    </Typography>
                  )}
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      mb: currentView === 'grid' ? 2 : 1,
                      display: '-webkit-box',
                      WebkitLineClamp: currentView === 'list' ? 2 : 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {notice.content}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24 }}>
                      {notice.author[0]}
                    </Avatar>
                    <Typography variant="caption" color="text.secondary">
                      {notice.author} • {notice.createdAt}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
              
              {/* Image Thumbnails */}
              {notice.media && notice.media.length > 0 && (
                <Box sx={{ px: 2, pb: 2 }}>
                  <ImageThumbnailGrid 
                    images={notice.media.filter(item => item && item.type === 'image')} 
                    variant={currentView === 'grid' ? 'grid' : 'list'}
                    maxImages={currentView === 'grid' ? 3 : 1}
                  />
                </Box>
              )}
              
              <CardActions>
                <Typography variant="caption" color="text.secondary">
                  {notice.viewCount} views
                </Typography>
                <PinAction
                  contentType="notice"
                  contentId={notice.id}
                  isPinned={notice.isPinned}
                  onPinChange={handlePinChange}
                />
                <Button 
                  size="small" 
                  onClick={() => navigate(`/notices/${notice.id}`)}
                >
                  View Details
                </Button>
                <Button 
                  size="small" 
                  startIcon={<icons.Warning />}
                  onClick={() => handleReportNotice(notice)}
                  color="error"
                >
                  Report
                </Button>
              </CardActions>
            </Card>
          </Grid>
          ))
        )}
      </Grid>



      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>Edit</MenuItem>
        <MenuItem onClick={handleMenuClose}>Delete</MenuItem>
        <MenuItem onClick={handleMenuClose}>Report</MenuItem>
      </Menu>

      {/* Create Notice Dialog */}
      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Notice</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            variant="outlined"
            value={newNotice.title}
            onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Content"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={newNotice.content}
            onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
            sx={{ mb: 2 }}
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={newNotice.category}
                  label="Category"
                  onChange={(e) => setNewNotice({ ...newNotice, category: e.target.value })}
                >
                  <MenuItem value="general">General</MenuItem>
                  <MenuItem value="safety">Safety</MenuItem>
                  <MenuItem value="event">Event</MenuItem>
                  <MenuItem value="lost_found">Lost & Found</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={newNotice.priority}
                  label="Priority"
                  onChange={(e) => setNewNotice({ ...newNotice, priority: e.target.value })}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          {/* Media Upload */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Attach Media (Optional)
            </Typography>
            <ImageUpload
              onFilesChange={setSelectedFiles}
              maxFiles={3}
              acceptedTypes="image/*,video/*"
              multiple={true}
              showPreview={true}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleSubmitNotice} variant="contained">
            Post Notice
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report Notice Dialog */}
      <Dialog open={reportDialogOpen} onClose={handleCloseReportDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Report Notice</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            You are reporting: <strong>{reportingNotice?.title}</strong>
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for reporting"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Please explain why you are reporting this notice..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReportDialog}>Cancel</Button>
          <Button onClick={handleSubmitReport} variant="contained" color="error">
            Submit Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* Terms and Conditions Modal */}
      <TermsModal
        open={showTermsModal}
        onClose={handleCloseTermsModal}
        onAccept={handleAcceptTerms}
        onDecline={handleDeclineTerms}
        type="noticeBoard"
        loading={termsLoading}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NoticeBoard;