import React, { useState, useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import './RealTimeSyncIndicator.css';

/**
 * Component that displays real-time synchronization status
 */
const RealTimeSyncIndicator = () => {
  const { connectionStatus, syncEnabled, toggleSync } = useSocket();
  const [isActive, setIsActive] = useState(false);
  const [lastActivity, setLastActivity] = useState(null);

  // Flash the indicator when there's activity
  const showActivity = () => {
    setIsActive(true);
    setLastActivity(new Date());
    
    setTimeout(() => {
      setIsActive(false);
    }, 500);
  };

  // Set up global event listeners for sync events
  useEffect(() => {
    const handleSyncEvent = () => {
      showActivity();
    };
    
    // Add event listeners to window for sync events
    window.addEventListener('message_sync', handleSyncEvent);
    window.addEventListener('report_sync', handleSyncEvent);
    window.addEventListener('notice_sync', handleSyncEvent);
    window.addEventListener('chat_group_sync', handleSyncEvent);
    window.addEventListener('private_chat_sync', handleSyncEvent);
    
    return () => {
      // Remove event listeners
      window.removeEventListener('message_sync', handleSyncEvent);
      window.removeEventListener('report_sync', handleSyncEvent);
      window.removeEventListener('notice_sync', handleSyncEvent);
      window.removeEventListener('chat_group_sync', handleSyncEvent);
      window.removeEventListener('private_chat_sync', handleSyncEvent);
    };
  }, []);

  // Get status class based on connection status
  const getStatusClass = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'status-connected';
      case 'disconnected':
        return 'status-disconnected';
      case 'reconnecting':
        return 'status-reconnecting';
      case 'error':
        return 'status-error';
      default:
        return '';
    }
  };

  // Get status text based on connection status
  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return syncEnabled ? 'Real-time sync active' : 'Real-time sync paused';
      case 'disconnected':
        return 'Disconnected';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'error':
        return 'Connection error';
      default:
        return 'Unknown status';
    }
  };

  // Format time since last activity
  const getLastActivityText = () => {
    if (!lastActivity) return 'No recent activity';
    
    const seconds = Math.floor((new Date() - lastActivity) / 1000);
    
    if (seconds < 60) {
      return `Last update ${seconds}s ago`;
    } else if (seconds < 3600) {
      return `Last update ${Math.floor(seconds / 60)}m ago`;
    } else {
      return `Last update ${Math.floor(seconds / 3600)}h ago`;
    }
  };

  return (
    <div className={`real-time-sync-indicator ${getStatusClass()} ${isActive ? 'active' : ''}`}>
      <div className="sync-status">
        <div className="sync-icon"></div>
        <span className="sync-text">{getStatusText()}</span>
      </div>
      
      <div className="sync-details">
        <span className="last-activity">{getLastActivityText()}</span>
        <button 
          className={`sync-toggle ${syncEnabled ? 'enabled' : 'disabled'}`}
          onClick={toggleSync}
        >
          {syncEnabled ? 'Pause Sync' : 'Resume Sync'}
        </button>
      </div>
    </div>
  );
};

export default RealTimeSyncIndicator;