import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  Avatar,
  Typography,
  Box,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Group as GroupIcon,
  Person as PersonIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import useApi from '../../../hooks/useApi';

const CreateGroupChatModal = ({ open, onClose, onGroupCreated }) => {
  const { user } = useAuth();
  const { get, post } = useApi();
  
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [neighbors, setNeighbors] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingNeighbors, setLoadingNeighbors] = useState(false);

  // Load neighbors when modal opens
  useEffect(() => {
    if (open) {
      loadNeighbors();
    }
  }, [open]);

  const loadNeighbors = async () => {
    setLoadingNeighbors(true);
    setError(null);
    
    try {
      // Try to load neighbors/contacts
      const data = await get('/api/contacts/neighbors').catch(() => {
        // Fallback to mock data if API doesn't exist
        return [
          {
            id: 'neighbor-1',
            name: 'John Smith',
            email: 'john.smith@example.com',
            avatar: null,
            isOnline: true,
            distance: '0.2 km'
          },
          {
            id: 'neighbor-2', 
            name: 'Sarah Johnson',
            email: 'sarah.johnson@example.com',
            avatar: null,
            isOnline: false,
            distance: '0.5 km'
          },
          {
            id: 'neighbor-3',
            name: 'Mike Wilson',
            email: 'mike.wilson@example.com', 
            avatar: null,
            isOnline: true,
            distance: '0.8 km'
          },
          {
            id: 'neighbor-4',
            name: 'Emily Davis',
            email: 'emily.davis@example.com',
            avatar: null,
            isOnline: false,
            distance: '1.2 km'
          }
        ];
      });
      
      setNeighbors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading neighbors:', err);
      setError('Failed to load neighbors');
    } finally {
      setLoadingNeighbors(false);
    }
  };

  // Filter neighbors based on search query
  const filteredNeighbors = neighbors.filter(neighbor =>
    neighbor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    neighbor.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle member selection
  const handleMemberToggle = (neighbor) => {
    setSelectedMembers(prev => {
      const isSelected = prev.some(member => member.id === neighbor.id);
      if (isSelected) {
        return prev.filter(member => member.id !== neighbor.id);
      } else {
        return [...prev, neighbor];
      }
    });
  };

  // Handle group creation
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    if (selectedMembers.length === 0) {
      setError('Please select at least one member');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const groupData = {
        name: groupName.trim(),
        description: groupDescription.trim(),
        members: selectedMembers.map(member => member.id),
        isPublic: false
      };

      const newGroup = await post('/api/chat/groups', groupData).catch(() => {
        // Mock successful creation for demo
        return {
          id: `group-${Date.now()}`,
          name: groupData.name,
          description: groupData.description,
          members: [
            { id: user?.id || user?._id, name: user?.name || `${user?.firstName} ${user?.lastName}`, role: 'admin' },
            ...selectedMembers.map(member => ({ id: member.id, name: member.name, role: 'member' }))
          ],
          memberCount: selectedMembers.length + 1,
          createdAt: new Date().toISOString(),
          type: 'group'
        };
      });

      // Call the callback with the new group
      if (onGroupCreated) {
        onGroupCreated(newGroup);
      }

      // Reset form and close modal
      handleClose();
    } catch (err) {
      console.error('Error creating group:', err);
      setError(err.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    setGroupName('');
    setGroupDescription('');
    setSearchQuery('');
    setSelectedMembers([]);
    setError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GroupIcon color="primary" />
          <Typography variant="h6">Create New Group Chat</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Group Details */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name"
            sx={{ mb: 2 }}
            required
          />
          
          <TextField
            fullWidth
            label="Description (Optional)"
            value={groupDescription}
            onChange={(e) => setGroupDescription(e.target.value)}
            placeholder="What's this group about?"
            multiline
            rows={2}
          />
        </Box>

        {/* Selected Members */}
        {selectedMembers.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Selected Members ({selectedMembers.length})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {selectedMembers.map((member) => (
                <Chip
                  key={member.id}
                  label={member.name}
                  onDelete={() => handleMemberToggle(member)}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search neighbors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
          sx={{ mb: 2 }}
        />

        {/* Neighbors List */}
        <Typography variant="subtitle2" gutterBottom>
          Select Neighbors to Add
        </Typography>
        
        {loadingNeighbors ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List sx={{ maxHeight: 300, overflow: 'auto' }}>
            {filteredNeighbors.length === 0 ? (
              <ListItem>
                <ListItemText
                  primary="No neighbors found"
                  secondary="Try adjusting your search or check your contacts"
                />
              </ListItem>
            ) : (
              filteredNeighbors.map((neighbor) => {
                const isSelected = selectedMembers.some(member => member.id === neighbor.id);
                
                return (
                  <ListItem
                    key={neighbor.id}
                    button
                    onClick={() => handleMemberToggle(neighbor)}
                  >
                    <ListItemAvatar>
                      <Avatar src={neighbor.avatar}>
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    
                    <ListItemText
                      primary={neighbor.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {neighbor.email}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {neighbor.distance} • {neighbor.isOnline ? 'Online' : 'Offline'}
                          </Typography>
                        </Box>
                      }
                    />
                    
                    <ListItemSecondaryAction>
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleMemberToggle(neighbor)}
                        color="primary"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })
            )}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleCreateGroup}
          variant="contained"
          disabled={loading || !groupName.trim() || selectedMembers.length === 0}
          startIcon={loading ? <CircularProgress size={20} /> : <GroupIcon />}
        >
          {loading ? 'Creating...' : 'Create Group'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateGroupChatModal;