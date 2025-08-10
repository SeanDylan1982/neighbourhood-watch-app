import icons from '../Common/Icons'
import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import {
  Done as DoneIcon,
  DoneAll as DoneAllIcon,
  AccessTime as AccessTimeIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

const MessageStatus = ({ status, timestamp }) => {
  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid timestamp:', dateString);
        return '';
      }
      
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return '';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return (
          <Tooltip title="Sending">
            <icons.AccessTime fontSize="small" sx={{ color: 'text.secondary', opacity: 0.7 }} />
          </Tooltip>
        );
      case 'sent':
        return (
          <Tooltip title="Sent">
            <DoneIcon fontSize="small" sx={{ color: 'text.secondary', opacity: 0.7 }} />
          </Tooltip>
        );
      case 'delivered':
        return (
          <Tooltip title="Delivered">
            <DoneAllIcon fontSize="small" sx={{ color: 'text.secondary', opacity: 0.7 }} />
          </Tooltip>
        );
      case 'read':
        return (
          <Tooltip title="Read">
            <DoneAllIcon fontSize="small" sx={{ color: 'primary.main', opacity: 0.9 }} />
          </Tooltip>
        );
      case 'error':
        return (
          <Tooltip title="Failed to send">
            <icons.Error fontSize="small" sx={{ color: 'error.main', opacity: 0.9 }} />
          </Tooltip>
        );
      default:
        // Default to sent status if unknown
        return (
          <Tooltip title="Sent">
            <DoneIcon fontSize="small" sx={{ color: 'text.secondary', opacity: 0.7 }} />
          </Tooltip>
        );
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
      <Typography variant="caption" sx={{ opacity: 0.7 }}>
        {formatTime(timestamp)}
      </Typography>
      {getStatusIcon()}
    </Box>
  );
};

export default MessageStatus;