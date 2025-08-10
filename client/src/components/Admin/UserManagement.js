import icons from '../Common/Icons'
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Avatar,
  Typography,
  IconButton,
  Tooltip,
  Alert,
  TablePagination,
} from '@mui/material';
import {
  Edit as EditIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import useApi from '../../hooks/useApi';
import { StatsSkeleton } from '../Common/LoadingSkeleton';

const UserManagement = () => {
  const { loading, error, clearError, getWithRetry, patchWithRetry } = useApi();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      console.log('=== FETCHING USERS ===');
      clearError();
      
      // Use the correct admin API endpoint
      const response = await getWithRetry('/api/admin/users');
      console.log('Users API response:', response);
      
      // Handle different response formats
      let usersData;
      if (response?.users) {
        usersData = response.users;
      } else if (Array.isArray(response)) {
        usersData = response;
      } else {
        usersData = [];
      }
      
      console.log('Processed users data:', usersData.length, 'users');
      setUsers(usersData);
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      setUsers([]);
    }
  }, [clearError, getWithRetry]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleEditUser = (user) => {
    setSelectedUser({ ...user });
    setEditDialogOpen(true);
  };

  const handleUserAction = (user, action) => {
    setSelectedUser(user);
    setActionType(action);
    setActionDialogOpen(true);
  };

  const handleSaveUser = async () => {
    try {
      console.log('=== SAVING USER ROLE ===');
      console.log('User ID:', selectedUser._id);
      console.log('New role:', selectedUser.role);
      
      clearError();
      
      // Use the correct admin API endpoint
      const response = await patchWithRetry(`/api/admin/users/${selectedUser._id}/role`, {
        role: selectedUser.role,
        reason: 'Role updated via admin dashboard'
      });
      
      console.log('Role update response:', response);
      
      // Update local state
      setUsers(users.map(user => 
        user._id === selectedUser._id 
          ? { ...user, role: selectedUser.role }
          : user
      ));
      
      console.log('✅ User role updated successfully');
      setEditDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('❌ Error updating user role:', error);
      console.error('Error details:', error.response?.data || error.message);
    }
  };

  const handleConfirmAction = async () => {
    try {
      clearError();
      let newStatus;
      
      switch (actionType) {
        case 'suspend':
          newStatus = 'suspended';
          break;
        case 'activate':
          newStatus = 'active';
          break;
        case 'ban':
          newStatus = 'banned';
          break;
        default:
          return;
      }

      await patchWithRetry(`/api/admin/users/${selectedUser._id}/status`, {
        status: newStatus,
        reason: `User ${actionType} via admin dashboard`
      });
      
      // Update local state
      setUsers(users.map(user => 
        user._id === selectedUser._id 
          ? { ...user, status: newStatus }
          : user
      ));
      
      setActionDialogOpen(false);
      setSelectedUser(null);
      setActionType('');
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'moderator': return 'warning';
      case 'user': return 'success';
      default: return 'default';
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

  const filteredUsers = Array.isArray(users) ? users.filter(user =>
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const paginatedUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading && users.length === 0) {
    return <StatsSkeleton />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">User Management</Typography>
        <TextField
          size="small"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: 300 }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedUsers.map((user) => (
              <TableRow key={user._id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar src={user.profileImageUrl}>
                      {user.profileImageUrl ? null : <icons.Person />}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">
                        {user.firstName} {user.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {user._id.slice(-8)}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip 
                    label={user.role} 
                    color={getRoleColor(user.role)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={user.status || 'active'} 
                    color={getStatusColor(user.status || 'active')}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Edit Role">
                      <IconButton 
                        size="small" 
                        onClick={() => handleEditUser(user)}
                      >
                        <icons.Edit />
                      </IconButton>
                    </Tooltip>
                    
                    {user.status !== 'suspended' && (
                      <Tooltip title="Suspend User">
                        <IconButton 
                          size="small" 
                          onClick={() => handleUserAction(user, 'suspend')}
                        >
                          <BlockIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    {user.status === 'suspended' && (
                      <Tooltip title="Activate User">
                        <IconButton 
                          size="small" 
                          onClick={() => handleUserAction(user, 'activate')}
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredUsers.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
      />

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit User Role</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              User: {selectedUser?.firstName} {selectedUser?.lastName}
            </Typography>
            <TextField
              select
              fullWidth
              label="Role"
              value={selectedUser?.role || ''}
              onChange={(e) => setSelectedUser({
                ...selectedUser,
                role: e.target.value
              })}
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="moderator">Moderator</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveUser} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)}>
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {actionType} user {selectedUser?.firstName} {selectedUser?.lastName}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleConfirmAction} 
            variant="contained" 
            color={actionType === 'ban' ? 'error' : 'primary'}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;