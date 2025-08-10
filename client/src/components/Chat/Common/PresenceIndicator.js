import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { Circle, AccessTime } from '@mui/icons-material';

/**
 * PresenceIndicator component for showing user online/offline status
 * Displays online status with green dot and last seen information
 */
const PresenceIndicator = ({ 
  isOnline, 
  lastSeenText, 
  size = 'small',
  showText = false,
  showTooltip = true,
  position = 'bottom-right'
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'tiny':
        return { width: 6, height: 6 };
      case 'small':
        return { width: 8, height: 8 };
      case 'medium':
        return { width: 12, height: 12 };
      case 'large':
        return { width: 16, height: 16 };
      default:
        return { width: 8, height: 8 };
    }
  };

  const getPositionStyles = () => {
    const baseStyles = {
      position: 'absolute',
      zIndex: 1
    };

    switch (position) {
      case 'top-right':
        return { ...baseStyles, top: 0, right: 0 };
      case 'top-left':
        return { ...baseStyles, top: 0, left: 0 };
      case 'bottom-left':
        return { ...baseStyles, bottom: 0, left: 0 };
      case 'center':
        return { ...baseStyles, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
      default: // bottom-right
        return { ...baseStyles, bottom: 0, right: 0 };
    }
  };

  const getStatusColor = () => {
    return isOnline ? '#4caf50' : '#9e9e9e';
  };

  const getStatusIcon = () => {
    if (isOnline) {
      return (
        <Circle
          sx={{
            ...getSizeStyles(),
            color: getStatusColor(),
            filter: 'drop-shadow(0 0 2px rgba(76, 175, 80, 0.5))'
          }}
        />
      );
    } else {
      return (
        <AccessTime
          sx={{
            ...getSizeStyles(),
            color: getStatusColor(),
            fontSize: getSizeStyles().width + 2
          }}
        />
      );
    }
  };

  const content = (
    <Box
      data-testid="presence-indicator"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: showText ? 0.5 : 0,
        ...(!showText && getPositionStyles())
      }}
    >
      {getStatusIcon()}
      
      {showText && (
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontSize: '0.75rem',
            whiteSpace: 'nowrap'
          }}
        >
          {isOnline ? 'Online' : lastSeenText}
        </Typography>
      )}
    </Box>
  );

  if (showTooltip && !showText) {
    return (
      <Tooltip 
        title={isOnline ? 'Online' : lastSeenText} 
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

/**
 * OnlineUsersCount component for showing count of online users in group chats
 */
export const OnlineUsersCount = ({ 
  count, 
  totalUsers,
  showTooltip = true 
}) => {
  if (count === 0) return null;

  const content = (
    <Box
      data-testid="online-users-count"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        color: 'text.secondary'
      }}
    >
      <Circle
        sx={{
          width: 6,
          height: 6,
          color: '#4caf50'
        }}
      />
      <Typography
        variant="caption"
        sx={{
          fontSize: '0.75rem',
          fontWeight: 500
        }}
      >
        {count} online
        {totalUsers && ` of ${totalUsers}`}
      </Typography>
    </Box>
  );

  if (showTooltip) {
    return (
      <Tooltip 
        title={`${count} user${count > 1 ? 's' : ''} currently online`}
        placement="top"
        arrow
      >
        {content}
      </Tooltip>
    );
  }

  return content;
};

/**
 * LastSeenIndicator component for showing detailed last seen information
 */
export const LastSeenIndicator = ({ 
  lastSeenText,
  isOnline,
  compact = false 
}) => {
  if (isOnline) {
    return (
      <Box
        data-testid="last-seen-indicator"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          color: '#4caf50'
        }}
      >
        <Circle sx={{ width: 6, height: 6 }} />
        <Typography
          variant="caption"
          sx={{
            fontSize: compact ? '0.7rem' : '0.75rem',
            fontWeight: 500
          }}
        >
          Online
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      data-testid="last-seen-indicator"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        color: 'text.secondary'
      }}
    >
      <AccessTime sx={{ width: 12, height: 12 }} />
      <Typography
        variant="caption"
        sx={{
          fontSize: compact ? '0.7rem' : '0.75rem'
        }}
      >
        {lastSeenText}
      </Typography>
    </Box>
  );
};

export default PresenceIndicator;