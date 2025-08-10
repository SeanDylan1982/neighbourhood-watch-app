import icons from '../Common/Icons'
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Campaign as CampaignIcon,
  Report as ReportIcon,
} from '@mui/icons-material';
import useApi from '../../hooks/useApi';
import { StatsSkeleton } from '../Common/LoadingSkeleton';

const AdminStats = () => {
  const { loading, error, clearError, getWithRetry } = useApi();
  const [systemStats, setSystemStats] = useState({
    users: {
      total: 0,
      active: 0,
      newThisWeek: 0,
      suspended: 0
    },
    content: {
      notices: 0,
      reports: 0,
      chatGroups: 0,
      messages: 0
    },
    engagement: {
      dailyActiveUsers: 0,
      weeklyActiveUsers: 0,
      monthlyActiveUsers: 0
    },
    performance: {
      serverUptime: '99.9%',
      responseTime: '120ms',
      errorRate: '0.1%'
    }
  });

  const fetchSystemStats = useCallback(async () => {
    try {
      clearError();
      const stats = await getWithRetry('/api/admin/system-stats');
      if (stats && stats.users && stats.content && stats.engagement && stats.performance) {
        setSystemStats({
          users: {
            total: stats.users.total || 0,
            active: stats.users.active || 0,
            newThisWeek: stats.users.newThisWeek || 0,
            suspended: stats.users.suspended || 0
          },
          content: {
            notices: stats.content.notices || 0,
            reports: stats.content.reports || 0,
            chatGroups: stats.content.chatGroups || 0,
            messages: stats.content.messages || 0
          },
          engagement: {
            dailyActiveUsers: stats.engagement.dailyActiveUsers || 0,
            weeklyActiveUsers: stats.engagement.weeklyActiveUsers || 0,
            monthlyActiveUsers: stats.engagement.monthlyActiveUsers || 0
          },
          performance: {
            serverUptime: stats.performance.serverUptime || '0%',
            responseTime: stats.performance.responseTime || '0ms',
            errorRate: stats.performance.errorRate || '0%'
          }
        });
      } else {
        // Use fallback data if API returns incomplete data
        setSystemStats({
          users: {
            total: 0,
            active: 0,
            newThisWeek: 0,
            suspended: 0
          },
          content: {
            notices: 0,
            reports: 0,
            chatGroups: 0,
            messages: 0
          },
          engagement: {
            dailyActiveUsers: 0,
            weeklyActiveUsers: 0,
            monthlyActiveUsers: 0
          },
          performance: {
            serverUptime: '0%',
            responseTime: '0ms',
            errorRate: '0%'
          }
        });
      }
    } catch (error) {
      console.error('Error fetching system stats:', error);
      // Set fallback data on error
      setSystemStats({
        users: {
          total: 0,
          active: 0,
          newThisWeek: 0,
          suspended: 0
        },
        content: {
          notices: 0,
          reports: 0,
          chatGroups: 0,
          messages: 0
        },
        engagement: {
          dailyActiveUsers: 0,
          weeklyActiveUsers: 0,
          monthlyActiveUsers: 0
        },
        performance: {
          serverUptime: '0%',
          responseTime: '0ms',
          errorRate: '0%'
        }
      });
    }
  }, [clearError, getWithRetry]);

  useEffect(() => {
    fetchSystemStats();
  }, [fetchSystemStats]);

  // Make sure systemStats.users exists and has the required properties
  const userActivityPercentage = (systemStats?.users?.total > 0 && systemStats?.users?.active !== undefined)
    ? (systemStats.users.active / systemStats.users.total) * 100 
    : 0;
  const suspensionRate = (systemStats?.users?.total > 0 && systemStats?.users?.suspended !== undefined)
    ? (systemStats.users.suspended / systemStats.users.total) * 100 
    : 0;

  if (loading && (!systemStats?.users || systemStats.users.total === 0)) {
    return <StatsSkeleton />;
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        System Statistics
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* User Statistics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <icons.People sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">User Statistics</Typography>
              </Box>
              
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Total Users" 
                    secondary={(systemStats?.users?.total || 0).toLocaleString()} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Active Users" 
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          {(systemStats?.users?.active || 0).toLocaleString()} ({userActivityPercentage.toFixed(1)}%)
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={userActivityPercentage} 
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    } 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="New This Week" 
                    secondary={(systemStats?.users?.newThisWeek || 0).toLocaleString()} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Suspended Users" 
                    secondary={
                      <Box>
                        <Typography variant="body2" color="error">
                          {(systemStats?.users?.suspended || 0).toLocaleString()} ({suspensionRate.toFixed(1)}%)
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={suspensionRate} 
                          color="error"
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    } 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Content Statistics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <icons.Campaign sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">Content Statistics</Typography>
              </Box>
              
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Total Notices" 
                    secondary={(systemStats?.content?.notices || 0).toLocaleString()} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Total Reports" 
                    secondary={(systemStats?.content?.reports || 0).toLocaleString()} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Chat Groups" 
                    secondary={(systemStats?.content?.chatGroups || 0).toLocaleString()} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Total Messages" 
                    secondary={(systemStats?.content?.messages || 0).toLocaleString()} 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Engagement Statistics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">User Engagement</Typography>
              </Box>
              
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Daily Active Users" 
                    secondary={(systemStats?.engagement?.dailyActiveUsers || 0).toLocaleString()} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Weekly Active Users" 
                    secondary={(systemStats?.engagement?.weeklyActiveUsers || 0).toLocaleString()} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Monthly Active Users" 
                    secondary={(systemStats?.engagement?.monthlyActiveUsers || 0).toLocaleString()} 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Statistics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <icons.Report sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">System Performance</Typography>
              </Box>
              
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Server Uptime" 
                    secondary={
                      <Typography variant="body2" color="success.main">
                        {systemStats?.performance?.serverUptime || '0%'}
                      </Typography>
                    } 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Average Response Time" 
                    secondary={systemStats?.performance?.responseTime || '0ms'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Error Rate" 
                    secondary={
                      <Typography variant="body2" color="success.main">
                        {systemStats?.performance?.errorRate || '0%'}
                      </Typography>
                    } 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminStats;