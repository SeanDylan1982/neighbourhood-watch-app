import React, { useState, useEffect } from 'react';
import { Box, Tooltip, Badge, CircularProgress } from '@mui/material';
import icons from './Icons';
import axios from 'axios';
import useApi from '../../hooks/useApi';

/**
 * A component that displays the current database health status
 * Can be used in headers, navigation bars, or status panels
 */
const DatabaseHealthIndicator = ({ showLabel = false, size = 'medium' }) => {
  const [status, setStatus] = useState('unknown');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const { getWithRetry } = useApi();

  // Fetch database health status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const response = await getWithRetry('/api/health/database');
        
        if (response && response.status) {
          setStatus(response.status);
          setMetrics(response.dbStats);
        } else {
          setStatus('unknown');
        }
      } catch (error) {
        console.error('Error fetching database health:', error);
        setStatus('error');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    
    // Set up polling interval
    const interval = setInterval(fetchStatus, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [getWithRetry]);

  // Get color based on status
  const getStatusColor = () => {
    switch (status) {
      case 'healthy':
        return 'success.main';
      case 'warning':
        return 'warning.main';
      case 'unhealthy':
      case 'error':
        return 'error.main';
      default:
        return 'grey.500';
    }
  };

  // Get tooltip text based on status and metrics
  const getTooltipText = () => {
    if (loading) return 'Checking database status...';
    
    switch (status) {
      case 'healthy':
        return `Database is healthy. Latency: ${metrics?.avgQueryLatency || 'N/A'}ms`;
      case 'warning':
        return `Database performance degraded. Latency: ${metrics?.avgQueryLatency || 'N/A'}ms`;
      case 'unhealthy':
        return 'Database connection issues detected';
      case 'error':
        return 'Unable to connect to database';
      default:
        return 'Database status unknown';
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <CircularProgress size={size === 'small' ? 16 : 20} />
        {showLabel && <Box sx={{ ml: 1 }}>Checking...</Box>}
      </Box>
    );
  }

  return (
    <Tooltip title={getTooltipText()}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Badge
          variant="dot"
          color={status === 'healthy' ? 'success' : status === 'warning' ? 'warning' : 'error'}
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <icons.Storage 
            sx={{ 
              color: getStatusColor()
            }}
            size={size === 'small' ? 20 : 24}
          />
        </Badge>
        {showLabel && (
          <Box sx={{ ml: 1, textTransform: 'capitalize', color: getStatusColor() }}>
            {status}
          </Box>
        )}
      </Box>
    </Tooltip>
  );
};

export default DatabaseHealthIndicator;