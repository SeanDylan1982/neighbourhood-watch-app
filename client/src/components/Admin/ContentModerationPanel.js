import icons from '../Common/Icons'
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogContentText, 
  DialogTitle,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Tooltip,
  Pagination
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  Edit as EditIcon, 
  Visibility as VisibilityIcon,
  RestoreFromTrash as RestoreIcon,
  Archive as ArchiveIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from '../../contexts/SnackbarContext';

const ContentModerationPanel = () => {
  const { token } = useAuth();
  const { showSnackbar } = useSnackbar();
  
  const [tabValue, setTabValue] = useState(0);
  const [contentType, setContentType] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [content, setContent] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Dialog states
  const [openRemoveDialog, setOpenRemoveDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openRestoreDialog, setOpenRestoreDialog] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [moderationReason, setModerationReason] = useState('');
  const [editFormData, setEditFormData] = useState({});
  
  // Fetch content on component mount and when filters change
  useEffect(() => {
    fetchContent();
  }, [tabValue, contentType, status, page, limit]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    
    // Map tab index to content type
    const contentTypes = ['all', 'notice', 'report', 'message'];
    setContentType(contentTypes[newValue]);
    setPage(1); // Reset to first page when changing tabs
  };
  
  const fetchContent = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get('/api/moderation/content', {
        params: {
          contentType,
          status,
          page,
          limit
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setContent(response.data.content);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching moderated content:', error);
      showSnackbar('Failed to fetch moderated content', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePageChange = (event, value) => {
    setPage(value);
  };
  
  const handleStatusChange = (event) => {
    setStatus(event.target.value);
    setPage(1); // Reset to first page when changing status filter
  };
  
  const handleRemoveClick = (content) => {
    setSelectedContent(content);
    setModerationReason('');
    setOpenRemoveDialog(true);
  };
  
  const handleEditClick = (content) => {
    setSelectedContent(content);
    
    // Initialize edit form data based on content type
    let formData = {};
    
    if (content.contentType === 'notice') {
      formData = {
        title: content.title,
        content: content.content
      };
    } else if (content.contentType === 'report') {
      formData = {
        title: content.title,
        description: content.description
      };
    } else if (content.contentType === 'message') {
      formData = {
        content: content.content
      };
    }
    
    setEditFormData(formData);
    setModerationReason('');
    setOpenEditDialog(true);
  };
  
  const handleRestoreClick = (content) => {
    setSelectedContent(content);
    setModerationReason('');
    setOpenRestoreDialog(true);
  };
  
  const handleRemoveConfirm = async () => {
    try {
      await axios.patch(
        `/api/moderation/content/${selectedContent.contentType}/${selectedContent._id}/status`,
        {
          status: 'removed',
          moderationReason
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      showSnackbar('Content removed successfully', 'success');
      fetchContent();
    } catch (error) {
      console.error('Error removing content:', error);
      showSnackbar('Failed to remove content', 'error');
    } finally {
      setOpenRemoveDialog(false);
    }
  };
  
  const handleEditConfirm = async () => {
    try {
      await axios.patch(
        `/api/moderation/content/${selectedContent.contentType}/${selectedContent._id}/edit`,
        {
          updates: editFormData,
          moderationReason
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      showSnackbar('Content edited successfully', 'success');
      fetchContent();
    } catch (error) {
      console.error('Error editing content:', error);
      showSnackbar('Failed to edit content', 'error');
    } finally {
      setOpenEditDialog(false);
    }
  };
  
  const handleRestoreConfirm = async () => {
    try {
      await axios.post(
        `/api/moderation/content/${selectedContent.contentType}/${selectedContent._id}/restore`,
        {
          moderationReason
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      showSnackbar('Content restored successfully', 'success');
      fetchContent();
    } catch (error) {
      console.error('Error restoring content:', error);
      showSnackbar('Failed to restore content', 'error');
    } finally {
      setOpenRestoreDialog(false);
    }
  };
  
  const handleArchiveContent = async (content) => {
    try {
      await axios.patch(
        `/api/moderation/content/${content.contentType}/${content._id}/status`,
        {
          status: 'archived',
          moderationReason: 'Content archived by moderator'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      showSnackbar('Content archived successfully', 'success');
      fetchContent();
    } catch (error) {
      console.error('Error archiving content:', error);
      showSnackbar('Failed to archive content', 'error');
    }
  };
  
  const handleEditFormChange = (field, value) => {
    setEditFormData({
      ...editFormData,
      [field]: value
    });
  };
  
  const getStatusChip = (status) => {
    switch (status) {
      case 'active':
        return <Chip label="Active" color="success" size="small" />;
      case 'archived':
        return <Chip label="Archived" color="warning" size="small" />;
      case 'removed':
        return <Chip label="Removed" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };
  
  const getContentTypeChip = (type) => {
    switch (type) {
      case 'notice':
        return <Chip label="Notice" color="primary" size="small" />;
      case 'report':
        return <Chip label="Report" color="secondary" size="small" />;
      case 'message':
        return <Chip label="Message" color="info" size="small" />;
      default:
        return <Chip label={type} size="small" />;
    }
  };
  
  const renderContentTable = () => {
    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Title/Content</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Moderated By</TableCell>
              <TableCell>Moderated At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : content.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No moderated content found
                </TableCell>
              </TableRow>
            ) : (
              content.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>{getContentTypeChip(item.contentType)}</TableCell>
                  <TableCell>
                    {item.title ? (
                      <Typography variant="subtitle2">{item.title}</Typography>
                    ) : null}
                    <Typography variant="body2" color="textSecondary">
                      {item.content || item.description || 'No content'}
                    </Typography>
                  </TableCell>
                  <TableCell>{getStatusChip(item.status || item.reportStatus || item.moderationStatus)}</TableCell>
                  <TableCell>
                    {item.moderatedBy ? (
                      <Typography variant="body2">
                        {item.moderatedBy.firstName} {item.moderatedBy.lastName}
                      </Typography>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>
                    {item.moderatedAt ? (
                      <Tooltip title={new Date(item.moderatedAt).toLocaleString()}>
                        <Typography variant="body2">
                          {formatDistanceToNow(new Date(item.moderatedAt), { addSuffix: true })}
                        </Typography>
                      </Tooltip>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton size="small" color="primary">
                          <icons.Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Edit">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleEditClick(item)}
                        >
                          <icons.Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {(item.status === 'active' || item.reportStatus === 'active' || item.moderationStatus === 'active') && (
                        <Tooltip title="Archive">
                          <IconButton 
                            size="small" 
                            color="warning"
                            onClick={() => handleArchiveContent(item)}
                          >
                            <ArchiveIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {(item.status === 'active' || item.reportStatus === 'active' || item.moderationStatus === 'active') && (
                        <Tooltip title="Remove">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleRemoveClick(item)}
                          >
                            <icons.Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {(item.status === 'archived' || item.status === 'removed' || 
                        item.reportStatus === 'archived' || item.reportStatus === 'removed' ||
                        item.moderationStatus === 'archived' || item.moderationStatus === 'removed') && (
                        <Tooltip title="Restore">
                          <IconButton 
                            size="small" 
                            color="success"
                            onClick={() => handleRestoreClick(item)}
                          >
                            <RestoreIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };
  
  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h5" gutterBottom>
        Content Moderation
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="All Content" />
          <Tab label="Notices" />
          <Tab label="Reports" />
          <Tab label="Messages" />
        </Tabs>
        
        <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={status}
            onChange={handleStatusChange}
            label="Status"
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="archived">Archived</MenuItem>
            <MenuItem value="removed">Removed</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {renderContentTable()}
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Pagination 
          count={totalPages} 
          page={page} 
          onChange={handlePageChange} 
          color="primary" 
        />
      </Box>
      
      {/* Remove Content Dialog */}
      <Dialog open={openRemoveDialog} onClose={() => setOpenRemoveDialog(false)}>
        <DialogTitle>Remove Content</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove this content? This action will hide the content from users.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for removal"
            fullWidth
            variant="outlined"
            value={moderationReason}
            onChange={(e) => setModerationReason(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRemoveDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleRemoveConfirm} 
            color="error"
            disabled={!moderationReason.trim()}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Content Dialog */}
      <Dialog 
        open={openEditDialog} 
        onClose={() => setOpenEditDialog(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Edit Content</DialogTitle>
        <DialogContent>
          {selectedContent && selectedContent.contentType === 'notice' && (
            <>
              <TextField
                margin="dense"
                label="Title"
                fullWidth
                variant="outlined"
                value={editFormData.title || ''}
                onChange={(e) => handleEditFormChange('title', e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Content"
                fullWidth
                variant="outlined"
                value={editFormData.content || ''}
                onChange={(e) => handleEditFormChange('content', e.target.value)}
                multiline
                rows={4}
                sx={{ mb: 2 }}
              />
            </>
          )}
          
          {selectedContent && selectedContent.contentType === 'report' && (
            <>
              <TextField
                margin="dense"
                label="Title"
                fullWidth
                variant="outlined"
                value={editFormData.title || ''}
                onChange={(e) => handleEditFormChange('title', e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Description"
                fullWidth
                variant="outlined"
                value={editFormData.description || ''}
                onChange={(e) => handleEditFormChange('description', e.target.value)}
                multiline
                rows={4}
                sx={{ mb: 2 }}
              />
            </>
          )}
          
          {selectedContent && selectedContent.contentType === 'message' && (
            <TextField
              label="Message Content"
              fullWidth
              variant="outlined"
              value={editFormData.content || ''}
              onChange={(e) => handleEditFormChange('content', e.target.value)}
              multiline
              rows={4}
              sx={{ mb: 2 }}
            />
          )}
          
          <TextField
            margin="dense"
            label="Reason for edit"
            fullWidth
            variant="outlined"
            value={moderationReason}
            onChange={(e) => setModerationReason(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleEditConfirm} 
            color="primary"
            disabled={!moderationReason.trim()}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Restore Content Dialog */}
      <Dialog open={openRestoreDialog} onClose={() => setOpenRestoreDialog(false)}>
        <DialogTitle>Restore Content</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to restore this content? This action will make the content visible to users again.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for restoration"
            fullWidth
            variant="outlined"
            value={moderationReason}
            onChange={(e) => setModerationReason(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRestoreDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleRestoreConfirm} 
            color="success"
            disabled={!moderationReason.trim()}
          >
            Restore
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContentModerationPanel;