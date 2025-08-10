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
  Typography,
  TextField,
  MenuItem,
  Alert,
  TablePagination,
  Avatar,
} from '@mui/material';
import {
  Person as PersonIcon,
  Security as SecurityIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Flag as FlagIcon,
} from '@mui/icons-material';
import useApi from '../../hooks/useApi';
import { StatsSkeleton } from '../Common/LoadingSkeleton';

const AuditLog = () => {
  const { loading, error, clearError, getWithRetry } = useApi();
  const [auditLogs, setAuditLogs] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterAction, setFilterAction] = useState('all');
  const [dateRange, setDateRange] = useState('7'); // days

  const fetchAuditLogs = useCallback(async () => {
    try {
      clearError();
      const params = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage,
        days: dateRange
      });
      
      if (filterAction !== 'all') {
        params.append('action', filterAction);
      }
      
      const logs = await getWithRetry(`/api/admin/audit-logs?${params}`);
      setAuditLogs(logs?.logs || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      // For now, use mock data since the endpoint might not exist yet
      setAuditLogs([
        {
          _id: '1',
          adminId: { firstName: 'Admin', lastName: 'User', email: 'admin@test.com' },
          action: 'user_role_change',
          targetType: 'user',
          targetId: 'user123',
          details: { oldRole: 'user', newRole: 'moderator' },
          timestamp: new Date().toISOString()
        },
        {
          _id: '2',
          adminId: { firstName: 'Admin', lastName: 'User', email: 'admin@test.com' },
          action: 'content_delete',
          targetType: 'notice',
          targetId: 'notice456',
          details: { reason: 'Inappropriate content' },
          timestamp: new Date(Date.now() - 86400000).toISOString()
        }
      ]);
    }
  }, [clearError, getWithRetry, page, rowsPerPage, filterAction, dateRange]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const getActionIcon = (action) => {
    switch (action) {
      case 'user_role_change':
      case 'user_suspend':
      case 'user_activate':
        return <icons.Person />;
      case 'content_delete':
        return <icons.Delete />;
      case 'content_edit':
        return <icons.Edit />;
      case 'content_moderate':
        return <FlagIcon />;
      default:
        return <icons.Security />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'user_role_change':
        return 'info';
      case 'user_suspend':
      case 'content_delete':
        return 'error';
      case 'user_activate':
        return 'success';
      case 'content_edit':
      case 'content_moderate':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatActionDetails = (action, details) => {
    switch (action) {
      case 'user_role_change':
        return `Role changed from ${details?.oldRole} to ${details?.newRole}`;
      case 'user_suspend':
        return `User suspended. Reason: ${details?.reason || 'No reason provided'}`;
      case 'user_activate':
        return 'User activated';
      case 'content_delete':
        return `Content deleted. Reason: ${details?.reason || 'No reason provided'}`;
      case 'content_moderate':
        return `Content moderated. Reason: ${details?.reason || 'No reason provided'}`;
      default:
        return JSON.stringify(details);
    }
  };

  if (loading && (!Array.isArray(auditLogs) || auditLogs.length === 0)) {
    return <StatsSkeleton />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Audit Log</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            select
            size="small"
            label="Action Type"
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="all">All Actions</MenuItem>
            <MenuItem value="user_role_change">Role Changes</MenuItem>
            <MenuItem value="user_suspend">User Suspensions</MenuItem>
            <MenuItem value="content_delete">Content Deletions</MenuItem>
            <MenuItem value="content_moderate">Content Moderation</MenuItem>
          </TextField>
          
          <TextField
            select
            size="small"
            label="Time Range"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="1">Last 24 hours</MenuItem>
            <MenuItem value="7">Last 7 days</MenuItem>
            <MenuItem value="30">Last 30 days</MenuItem>
            <MenuItem value="90">Last 90 days</MenuItem>
          </TextField>
        </Box>
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
              <TableCell>Action</TableCell>
              <TableCell>Admin</TableCell>
              <TableCell>Target</TableCell>
              <TableCell>Details</TableCell>
              <TableCell>Timestamp</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(auditLogs) && auditLogs.length > 0 ? auditLogs.map((log) => (
              <TableRow key={log._id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24 }}>
                      {getActionIcon(log.action)}
                    </Avatar>
                    <Chip 
                      label={log.action.replace('_', ' ')} 
                      color={getActionColor(log.action)}
                      size="small"
                    />
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2">
                      {log.adminId?.firstName} {log.adminId?.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {log.adminId?.email}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2">
                      {log.targetType}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {log.targetId?.slice(-8)}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatActionDetails(log.action, log.details)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {new Date(log.timestamp).toLocaleString()}
                  </Typography>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography>No audit logs found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={Array.isArray(auditLogs) ? auditLogs.length : 0}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
      />
    </Box>
  );
};

export default AuditLog;