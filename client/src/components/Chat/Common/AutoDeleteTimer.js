import React, { useState, useEffect } from 'react';
import useAutoDelete from '../../../hooks/useAutoDelete';
import './AutoDeleteTimer.css';

/**
 * Component to display auto-delete countdown timer on messages
 */
const AutoDeleteTimer = ({ 
  messageTimestamp, 
  chatId, 
  currentUserId,
  size = 'small',
  showIcon = true,
  showText = true 
}) => {
  const {
    autoDeleteSettings,
    getTimeUntilDeletion,
    formatTimeRemaining,
    shouldMessageBeDeleted,
  } = useAutoDelete(chatId, currentUserId);

  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  // Update timer every second
  useEffect(() => {
    if (!autoDeleteSettings.enabled || !messageTimestamp) {
      return;
    }

    const updateTimer = () => {
      const remaining = getTimeUntilDeletion(messageTimestamp);
      const expired = shouldMessageBeDeleted({ timestamp: messageTimestamp });
      
      setTimeRemaining(remaining);
      setIsExpired(expired);
    };

    // Initial update
    updateTimer();

    // Set up interval to update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [autoDeleteSettings, messageTimestamp, getTimeUntilDeletion, shouldMessageBeDeleted]);

  // Don't render if auto-delete is not enabled
  if (!autoDeleteSettings.enabled) {
    return null;
  }

  // Don't render if message is expired
  if (isExpired) {
    return null;
  }

  // Don't render if no time remaining
  if (!timeRemaining) {
    return null;
  }

  const formattedTime = formatTimeRemaining(timeRemaining);
  const urgencyLevel = getUrgencyLevel(timeRemaining);

  const getTimerClass = () => {
    return `auto-delete-timer auto-delete-timer--${size} auto-delete-timer--${urgencyLevel}`;
  };

  const getTimerIcon = () => {
    switch (urgencyLevel) {
      case 'critical':
        return '🔥';
      case 'warning':
        return '⚠️';
      case 'normal':
      default:
        return '🕒';
    }
  };

  return (
    <div className={getTimerClass()} title={`Message will be deleted in ${formattedTime}`}>
      {showIcon && (
        <span className="auto-delete-timer__icon">
          {getTimerIcon()}
        </span>
      )}
      
      {showText && formattedTime && (
        <span className="auto-delete-timer__text">
          {formattedTime}
        </span>
      )}
    </div>
  );
};

/**
 * Get urgency level based on time remaining
 */
function getUrgencyLevel(timeRemaining) {
  const minutes = timeRemaining / (1000 * 60);
  
  if (minutes <= 5) {
    return 'critical';
  } else if (minutes <= 60) {
    return 'warning';
  } else {
    return 'normal';
  }
}

export default AutoDeleteTimer;