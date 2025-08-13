import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  Pagination,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import {
  Flag as FlagIcon,
  Campaign as NoticeIcon,
  Report as ReportIcon,
  Chat as ChatIcon,
  CheckCircle as ApproveIcon,
  Archive as ArchiveIcon,
  Delete as RemoveIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import useApi from '../../hooks/useApi';
import { useToast } from '../Common/Toast';

const ContentModeration = () => {
  const { loading, error, clearError, getWithRetry, postWithRetry } = useApi();
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [flaggedContent, setFlaggedContent] = useState([]);
  const [selectedContent, setSelectedContent] = useState(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [moderationReason, setModerationReason] = useState('');

  const fetchFlaggedContent = useCallback(async () => {
    try {
      clearError();
      
      const params = {
        page,
        limit
      };
      
      const response = await getWithRetry('/api/admin/content/flagged', {
        params
      });
      
      if (response) {
        setFlaggedContent(response.content || []);
        setTotalPages(response.totalPages || 1);
      } else {
        setFlaggedContent([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching flagged content:', error);
      setFlaggedContent([]);
      setTotalPages(1);
      
      let errorMessage = 'Failed to load flagged content';
      
      if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to access content moderation. Admin privileges required.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showToast(errorMessage, 'error');
    }
  }, [clearError, page, limit, getWithRetry, showToast]);

  useEffect(() => {
    fetchFlaggedContent();
  }, [fetchFlaggedContent]);
  
  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleContentAction = (content, action) => {
    setSelectedContent(content);
    setActionType(action);
    setModerationReason('');
    setActionDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedContent || !actionType) {
      showToast('Invalid action or content selection', 'error');
      return;
    }

    try {
      clearError();
      const { contentType, id } = selectedContent;
      
      if (!contentType || !id) {
        showToast('Invalid content data', 'error');
        return;
      }
      
      switch (actionType) {
        case 'approve':
          await postWithRetry(`/api/admin/content/${contentType}/${id}/approve`, {
            moderationReason: moderationReason || 'Content approved by administrator'
          });
          break;
          
        case 'archive':
          if (!moderationReason.trim()) {
            showToast('Moderation reason is required for archiving', 'error');
            return;
          }
          await postWithRetry(`/api/admin/content/${contentType}/${id}/archive`, {
            moderationReason
          });
          break;
          
        case 'remove':
          if (!moderationReason.trim()) {
            showToast('Moderation reason is required for removal', 'error');
            return;
          }
          await postWithRetry(`/api/admin/content/${contentType}/${id}/remove`, {
            moderationReason
          });
          break;
          
        default:
          console.error('Unknown action type:', actionType);
          showToast('Unknown action type', 'error');
          return;
      }
      
      // Show success message
      const actionMessages = {
        approve: 'Content approved successfully',
        archive: 'Content archived successfully',
        remove: 'Content removed successfully'
      };
      showToast(actionMessages[actionType] || 'Action completed successfully', 'success');
      
      // Refresh content after action
      await fetchFlaggedContent();
      
      setActionDialogOpen(false);
      setSelectedContent(null);
      setActionType('');
      setModerationReason('');
    } catch (error) {
      console.error('Error performing content action:', error);
      const errorMessage = error.response?.data?.message || error.message || `Failed to ${actionType} content`;
      showToast(errorMessage, 'error');
    }
  };

  const getContentIcon = (contentType) => {
    switch (contentType) {
      case 'notice': return <NoticeIcon />;
      case 'report': return <ReportIcon />;
      case 'message': return <ChatIcon />;
      default: return <NoticeIcon />;
    }
  };

  const getAuthorInfo = (item) => {
    const author = item.author;
    if (author) {
      const firstName = author.firstName || 'Unknown';
      const lastName = author.lastName || '';
      const initial = firstName.charAt(0).toUpperCase() || 'U';
      return { firstName, lastName, initial };
    }
    return { firstName: 'Unknown', lastName: '', initial: 'U' };
  };
  
  const renderFlaggedContentList = () => {
    if (loading && flaggedContent.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <Box sx={{ width: '100%' }}>
            <Skeleton variant="rectangular" height={120} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={120} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={120} sx={{ mb: 2 }} />
          </Box>
        </Box>
      );
    }

    if (flaggedContent.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <FlagIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            No flagged content found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            No content has been reported or flagged at this time.
          </Typography>
          <Button 
            variant="outlined" 
            onClick={fetchFlaggedContent}
            startIcon={<RefreshIcon />}
          >
            Refresh
          </Button>
        </Box>
      );
    }

    return (
      <List>
        {flaggedContent.map((item) => (
          <ListItem key={item.id} sx={{ mb: 2, p: 0 }}>
            <Card sx={{ width: '100%', border: '2px solid #f44336' }}>
              <CardContent>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getContentIcon(item.contentType)}
                    <Typography variant="h6">
                      {item.title}
                    </Typography>
                    <Chip 
                      label={item.contentType} 
                      size="small" 
                      color="primary"
                    />
                    <Chip 
                      label={`${item.reportCount} Report${item.reportCount > 1 ? 's' : ''}`} 
                      size="small" 
                      color="error"
                      icon={<FlagIcon />}
                    />
                  </Box>
                </Box>

                {/* Content Preview */}
                <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {item.content}
                  </Typography>
                </Box>

                {/* Author Information */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <ListItemAvatar>
                    <Avatar>
                      {getAuthorInfo(item).initial}
                    </Avatar>
                  </ListItemAvatar>
                  <Box>
                    <Typography variant="body2">
                      By: {getAuthorInfo(item).firstName} {getAuthorInfo(item).lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Posted: {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString()}
                    </Typography>
                  </Box>
                </Box>

                {/* Reports Section */}
                <Box sx={{ mt: 2, p: 2, bgcolor: '#ffebee', borderRadius: 1, border: '1px solid #ffcdd2' }}>
                  <Typography variant="subtitle2" color="error" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FlagIcon fontSize="small" />
                    Reports ({item.reportCount}):
                  </Typography>
                  {item.reports.map((report, index) => (
                    <Box key={index} sx={{ mb: index < item.reports.length - 1 ? 1 : 0, pl: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        Reason: {report.reason || 'No reason provided'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Reported by: {report.reportedBy?.firstName || 'Anonymous'} {report.reportedBy?.lastName || ''} • 
                        {new Date(report.reportedAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<ApproveIcon />}
                    onClick={() => handleContentAction(item, 'approve')}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<ArchiveIcon />}
                    onClick={() => handleContentAction(item, 'archive')}
                  >
                    Archive
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<RemoveIcon />}
                    onClick={() => handleContentAction(item, 'remove')}
                  >
                    Remove
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </ListItem>
        ))}
      </List>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Content Moderation - Flagged Content
        </Typography>
        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
          onClick={fetchFlaggedContent}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }} 
          onClose={clearError}
          action={
            <Button color="inherit" size="small" onClick={fetchFlaggedContent}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Summary Statistics */}
      <Card sx={{ mb: 3, bgcolor: '#fff3e0' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FlagIcon color="warning" />
            Flagged Content Summary
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="h4" color="error">
                {flaggedContent.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Flagged Items
              </Typography>
            </Box>
            <Box>
              <Typography variant="h4" color="warning.main">
                {flaggedContent.reduce((total, item) => total + item.reportCount, 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Reports
              </Typography>
            </Box>
            <Box>
              <Typography variant="h4" color="info.main">
                {flaggedContent.filter(item => !item.moderatedBy).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Review
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Content List */}
      <Card>
        <CardContent>
          {renderFlaggedContentList()}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'approve' && 'Approve Content'}
          {actionType === 'archive' && 'Archive Content'}
          {actionType === 'remove' && 'Remove Content'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {actionType === 'approve' && 'This will clear all reports and mark the content as reviewed.'}
            {actionType === 'archive' && 'This will archive the content and hide it from public view.'}
            {actionType === 'remove' && 'This will remove the content permanently.'}
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label={actionType === 'approve' ? 'Approval Reason (Optional)' : 'Moderation Reason (Required)'}
            value={moderationReason}
            onChange={(e) => setModerationReason(e.target.value)}
            required={actionType !== 'approve'}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmAction} 
            variant="contained"
            color={actionType === 'approve' ? 'success' : actionType === 'archive' ? 'warning' : 'error'}
            disabled={loading || (actionType !== 'approve' && !moderationReason.trim())}
          >
            {loading ? <CircularProgress size={20} /> : 
             actionType === 'approve' ? 'Approve' : 
             actionType === 'archive' ? 'Archive' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContentModeration;