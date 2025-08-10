import icons from '../Common/Icons'
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import useApi from '../../hooks/useApi';

/**
 * Component for displaying database alerts and notifications
 */
const DatabaseAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getWithRetry } = useApi();

  // Fetch alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const response = await getWithRetry('/api/health/alerts');
        
        if (response && response.alerts) {
          setAlerts(response.alerts);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching database alerts:', err);
        setError('Failed to load database alerts');
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    
    // Set up polling interval
    const interval = setInterval(fetchAlerts, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [getWithRetry]);

  // Get icon based on alert level
  const getAlertIcon = (level) => {
    switch (level.toLowerCase()) {
      case 'critical':
        return <icons.Error color="error" />;
      case 'warning':
        return <icons.Warning color="warning" />;
      case 'info':
        return <CheckCircleIcon color="info" />;
      default:
        return <icons.Notifications color="action" />;
    }
  };

  // Get color based on alert level
  const getAlertColor = (level) => {
    switch (level.toLowerCase()) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'default';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Render loading state
  if (loading && alerts.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  // Render error state
  if (error && alerts.length === 0) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Database Alerts</Typography>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </Box>

        {alerts.length === 0 ? (
          <Alert severity="success">
            No database alerts at this time. All systems operational.
          </Alert>
        ) : (
          <List>
            {alerts.map((alert, index) => (
              <React.Fragment key={index}>
                {index > 0 && <Divider />}
                <ListItem alignItems="flex-start">
                  <ListItemIcon>
                    {getAlertIcon(alert.level)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center">
                        <Typography variant="subtitle1" component="span">
                          {alert.message}
                        </Typography>
                        <Chip 
                          label={alert.level} 
                          color={getAlertColor(alert.level)} 
                          size="small" 
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {formatDate(alert.timestamp)}
                        </Typography>
                        {alert.data && (
                          <Typography component="div" variant="body2" sx={{ mt: 1 }}>
                            {typeof alert.data === 'object' 
                              ? JSON.stringify(alert.data, null, 2) 
                              : alert.data}
                          </Typography>
                        )}
                      </>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default DatabaseAlerts;