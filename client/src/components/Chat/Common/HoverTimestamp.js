import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tooltip,
  Fade,
  Chip
} from '@mui/material';
import {
  Done as SentIcon,
  DoneAll as DeliveredIcon,
  Schedule as PendingIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useDesktopFeatures } from '../../../hooks/useResponsive';
import { formatTime, formatRelativeTime } from '../../../utils/chatUtils';

/**
 * Desktop hover-based timestamp and status indicators
 * Shows detailed timestamp and delivery status on hover
 */
const HoverTimestamp = ({
  timestamp,
  status = 'sent',
  showStatus = true,
  showDetailedTime = true,
  isOwnMessage = false,
  readBy = [],
  deliveredTo = [],
  children,
  className = '',
  ...props
}) => {
  const { features, isHovering, hoverHandlers } = useDesktopFeatures();
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Get status icon and color
  const getStatusDisplay = () => {
    if (!showStatus || !isOwnMessage) return null;
    
    const statusConfig = {
      sending: { icon: <PendingIcon />, color: 'text.secondary', label: 'Sending...' },
      sent: { icon: <SentIcon />, color: 'text.secondary', label: 'Sent' },
      delivered: { icon: <DeliveredIcon />, color: 'text.secondary', label: 'Delivered' },
      read: { icon: <DeliveredIcon />, color: 'primary.main', label: 'Read' },
      failed: { icon: <ErrorIcon />, color: 'error.main', label: 'Failed to send' }
    };
    
    const config = statusConfig[status] || statusConfig.sent;
    
    return {
      ...config,
      icon: React.cloneElement(config.icon, {
        fontSize: 'small',
        sx: { color: config.color }
      })
    };
  };
  
  // Get detailed tooltip content
  const getTooltipContent = () => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const detailedTime = date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    let content = detailedTime;
    
    if (showStatus && isOwnMessage) {
      const statusDisplay = getStatusDisplay();
      if (statusDisplay) {
        content += `\nStatus: ${statusDisplay.label}`;
        
        if (readBy.length > 0) {
          content += `\nRead by ${readBy.length} recipient${readBy.length !== 1 ? 's' : ''}`;
        } else if (deliveredTo.length > 0) {
          content += `\nDelivered to ${deliveredTo.length} recipient${deliveredTo.length !== 1 ? 's' : ''}`;
        }
      }
    }
    
    return content;
  };
  
  const statusDisplay = getStatusDisplay();
  
  // For mobile/non-desktop, show simple timestamp
  if (!features.hoverEffects) {
    return (
      <Box className={className} {...props}>
        {children}
        <Typography variant="caption" color="text.secondary">
          {timestamp ? formatTime(timestamp) : ''}
        </Typography>
        {statusDisplay && (
          <Box sx={{ ml: 0.5, display: 'inline-flex', alignItems: 'center' }}>
            {statusDisplay.icon}
          </Box>
        )}
      </Box>
    );
  }
  
  return (
    <Tooltip
      title={getTooltipContent()}
      placement="top"
      arrow
      open={showTooltip && features.tooltips}
      onOpen={() => setShowTooltip(true)}
      onClose={() => setShowTooltip(false)}
      TransitionComponent={Fade}
      componentsProps={{
        tooltip: {
          sx: {
            maxWidth: 300,
            whiteSpace: 'pre-line',
            fontSize: '0.75rem',
            backgroundColor: 'grey.800',
            color: 'common.white'
          }
        }
      }}
    >
      <Box
        className={className}
        {...hoverHandlers}
        onMouseEnter={(e) => {
          hoverHandlers.onMouseEnter?.(e);
          setShowTooltip(true);
        }}
        onMouseLeave={(e) => {
          hoverHandlers.onMouseLeave?.(e);
          setShowTooltip(false);
        }}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          transition: 'all 0.2s ease-in-out',
          cursor: 'default',
          ...props.sx
        }}
        {...props}
      >
        {children}
        
        {/* Timestamp */}
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{
            opacity: isHovering ? 1 : 0.7,
            transition: 'opacity 0.2s ease-in-out',
            fontSize: '0.75rem'
          }}
        >
          {timestamp ? formatTime(timestamp) : ''}
        </Typography>
        
        {/* Status Indicator */}
        {statusDisplay && (
          <Fade in={isHovering || status === 'failed'} timeout={200}>
            <Box 
              sx={{ 
                display: 'inline-flex', 
                alignItems: 'center',
                ml: 0.25
              }}
            >
              {statusDisplay.icon}
            </Box>
          </Fade>
        )}
        
        {/* Read Receipt Count (for group chats) */}
        {isHovering && readBy.length > 0 && (
          <Fade in={true} timeout={200}>
            <Chip
              size="small"
              label={`${readBy.length} read`}
              sx={{
                height: 16,
                fontSize: '0.65rem',
                backgroundColor: 'primary.light',
                color: 'primary.contrastText',
                ml: 0.5
              }}
            />
          </Fade>
        )}
      </Box>
    </Tooltip>
  );
};

export default HoverTimestamp;