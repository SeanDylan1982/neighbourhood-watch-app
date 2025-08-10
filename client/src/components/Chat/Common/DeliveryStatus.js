import React from 'react';
import { Box, Tooltip } from '@mui/material';
import { Check, CheckCircle, Schedule, Error } from '@mui/icons-material';

/**
 * DeliveryStatus component with WhatsApp-style checkmark indicators
 * Shows message delivery and read status with appropriate icons
 */
const DeliveryStatus = ({ 
  status = 'sent', 
  readBy = [], 
  chatType = 'group',
  size = 'small',
  showTooltip = true,
  timestamp 
}) => {
  // Don't show status for received messages (only for sent messages)
  if (!status || status === 'received') return null;

  const getStatusIcon = () => {
    const iconProps = {
      sx: {
        fontSize: size === 'small' ? '14px' : '16px',
        color: getStatusColor()
      }
    };

    switch (status) {
      case 'sending':
        return <Schedule {...iconProps} />;
      case 'sent':
        return <Check {...iconProps} />;
      case 'delivered':
        return (
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <Check {...iconProps} />
            <Check 
              {...iconProps} 
              sx={{ 
                ...iconProps.sx,
                position: 'absolute',
                left: '6px'
              }} 
            />
          </Box>
        );
      case 'read':
        return (
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <Check 
              {...iconProps} 
              sx={{ 
                ...iconProps.sx,
                color: '#4fc3f7' // Blue color for read status
              }} 
            />
            <Check 
              {...iconProps} 
              sx={{ 
                ...iconProps.sx,
                position: 'absolute',
                left: '6px',
                color: '#4fc3f7' // Blue color for read status
              }} 
            />
          </Box>
        );
      case 'failed':
        return <Error {...iconProps} sx={{ ...iconProps.sx, color: '#f44336' }} />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'sending':
        return '#9e9e9e';
      case 'sent':
        return '#9e9e9e';
      case 'delivered':
        return '#9e9e9e';
      case 'read':
        return '#4fc3f7';
      case 'failed':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  const getTooltipText = () => {
    const formatTime = (date) => {
      if (!date) return '';
      const time = new Date(date);
      return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    switch (status) {
      case 'sending':
        return 'Sending...';
      case 'sent':
        return `Sent${timestamp ? ` at ${formatTime(timestamp)}` : ''}`;
      case 'delivered':
        return `Delivered${timestamp ? ` at ${formatTime(timestamp)}` : ''}`;
      case 'read':
        if (chatType === 'private') {
          return `Read${timestamp ? ` at ${formatTime(timestamp)}` : ''}`;
        } else {
          const readCount = readBy.length;
          if (readCount === 0) {
            return 'Delivered';
          } else if (readCount === 1) {
            return `Read by 1 person`;
          } else {
            return `Read by ${readCount} people`;
          }
        }
      case 'failed':
        return 'Failed to send. Tap to retry.';
      default:
        return '';
    }
  };

  const statusIcon = getStatusIcon();
  
  if (!statusIcon) return null;

  const content = (
    <Box
      data-testid="delivery-status"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        ml: 0.5,
        cursor: status === 'failed' ? 'pointer' : 'default'
      }}
    >
      {statusIcon}
    </Box>
  );

  if (showTooltip) {
    return (
      <Tooltip 
        title={getTooltipText()} 
        placement="top"
        arrow
        enterDelay={500}
      >
        {content}
      </Tooltip>
    );
  }

  return content;
};

export default DeliveryStatus;