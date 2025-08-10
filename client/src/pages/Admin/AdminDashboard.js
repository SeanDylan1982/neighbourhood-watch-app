import icons from '../../components/Common/Icons'
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import {
  People as PeopleIcon,
  Security as SecurityIcon,
  Assessment as AssessmentIcon,
  History as HistoryIcon,
  Storage as StorageIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import UserManagement from '../../components/Admin/UserManagement';
import ContentModeration from '../../components/Admin/ContentModeration';
import AuditLog from '../../components/Admin/AuditLog';
import AdminStats from '../../components/Admin/AdminStats';
import DatabaseHealth from '../../components/Admin/DatabaseHealth';
import DatabaseAlerts from '../../components/Admin/DatabaseAlerts';
import DatabaseHealthIndicator from '../../components/Common/DatabaseHealthIndicator';
import useApi from '../../hooks/useApi';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { error, clearError, getWithRetry } = useApi();
  const [activeTab, setActiveTab] = useState(0);
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    totalContent: 0,
    flaggedContent: 0,
    recentActions: 0
  });

  const fetchAdminStats = useCallback(async () => {
    try {
      clearError();
      const stats = await getWithRetry('/api/admin/stats');
      if (stats) {
        setAdminStats({
          totalUsers: stats.totalUsers || 0,
          activeUsers: stats.activeUsers || 0,
          suspendedUsers: stats.suspendedUsers || 0,
          totalContent: stats.totalContent || 0,
          flaggedContent: stats.flaggedContent || 0,
          recentActions: stats.recentActions || 0
        });
      } else {
        // Use fallback data if API returns undefined
        setAdminStats({
          totalUsers: 0,
          activeUsers: 0,
          suspendedUsers: 0,
          totalContent: 0,
          flaggedContent: 0,
          recentActions: 0
        });
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      // Set fallback data on error
      setAdminStats({
        totalUsers: 0,
        activeUsers: 0,
        suspendedUsers: 0,
        totalContent: 0,
        flaggedContent: 0,
        recentActions: 0
      });
    }
  }, [clearError, getWithRetry]);

  useEffect(() => {
    fetchAdminStats();
  }, [fetchAdminStats]);

  // Check if user has admin permissions
  if (!user || user.role !== 'admin') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Access denied. Admin privileges required.
        </Alert>
      </Box>
    );
  }

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };

  const statsCards = [
    {
      title: 'Total Users',
      value: adminStats.totalUsers,
      icon: <icons.People />,
      color: 'primary'
    },
    {
      title: 'Active Users',
      value: adminStats.activeUsers,
      icon: <icons.Security />,
      color: 'success'
    },
    {
      title: 'Suspended Users',
      value: adminStats.suspendedUsers,
      icon: <icons.Security />,
      color: 'warning'
    },
    {
      title: 'Flagged Content',
      value: adminStats.flaggedContent,
      icon: <AssessmentIcon />,
      color: 'error'
    }
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage users, content, and system settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" component="div">
                      {stat.value}
                    </Typography>
                  </Box>
                  <Box sx={{ color: `${stat.color}.main` }}>
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
        
        {/* Database Health Status Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Database Status
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <DatabaseHealthIndicator showLabel={true} />
                  </Box>
                </Box>
                <Box sx={{ color: 'primary.main' }}>
                  <icons.Storage />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Admin Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab 
              label="User Management" 
              icon={<icons.People />} 
              iconPosition="start"
            />
            <Tab 
              label="Content Moderation" 
              icon={<icons.Security />} 
              iconPosition="start"
            />
            <Tab 
              label="System Stats" 
              icon={<AssessmentIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Database Health" 
              icon={<icons.Storage />} 
              iconPosition="start"
            />
            <Tab 
              label="Audit Log" 
              icon={<HistoryIcon />} 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && <UserManagement />}
          {activeTab === 1 && <ContentModeration />}
          {activeTab === 2 && <AdminStats />}
          {activeTab === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <DatabaseHealth />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatabaseAlerts />
              </Grid>
            </Grid>
          )}
          {activeTab === 4 && <AuditLog />}
        </Box>
      </Card>
    </Box>
  );
};

export default AdminDashboard;