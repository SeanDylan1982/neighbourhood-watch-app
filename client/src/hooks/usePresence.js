import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';

/**
 * Hook for managing user presence (online/offline status)
 * Handles real-time presence updates and last seen timestamps
 */
const usePresence = (chatId, chatType = 'group') => {
  const [userPresence, setUserPresence] = useState({});
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const socketContext = useSocket();
  const socket = socketContext?.socket;
  const heartbeatInterval = useRef(null);
  const lastActivityTime = useRef(Date.now());

  // Heartbeat interval (30 seconds)
  const HEARTBEAT_INTERVAL = 30000;
  
  // Offline threshold (2 minutes)
  const OFFLINE_THRESHOLD = 120000;

  // Update user's own online status
  const updateOnlineStatus = useCallback((online) => {
    setIsOnline(online);
    
    if (socket) {
      socket.emit('presence_update', {
        isOnline: online,
        lastSeen: online ? null : new Date(),
        chatId
      });
    }
  }, [socket, chatId]);

  // Update last activity time
  const updateActivity = useCallback(() => {
    lastActivityTime.current = Date.now();
    
    if (socket && isOnline) {
      socket.emit('activity_update', {
        chatId,
        lastActivity: new Date()
      });
    }
  }, [socket, isOnline, chatId]);

  // Get user presence status
  const getUserPresence = useCallback((userId) => {
    const presence = userPresence[userId];
    if (!presence) {
      return { isOnline: false, lastSeen: null };
    }

    // Check if user should be considered offline based on last activity
    const now = Date.now();
    const lastActivity = presence.lastActivity ? new Date(presence.lastActivity).getTime() : 0;
    const isRecentlyActive = (now - lastActivity) < OFFLINE_THRESHOLD;

    return {
      isOnline: presence.isOnline && isRecentlyActive,
      lastSeen: presence.lastSeen,
      lastActivity: presence.lastActivity
    };
  }, [userPresence]);

  // Get formatted last seen text
  const getLastSeenText = useCallback((userId) => {
    const presence = getUserPresence(userId);
    
    if (presence.isOnline) {
      return 'Online';
    }

    if (!presence.lastSeen) {
      return 'Last seen a long time ago';
    }

    const lastSeen = new Date(presence.lastSeen);
    const now = new Date();
    const diffMs = now - lastSeen;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return 'Last seen just now';
    } else if (diffMinutes < 60) {
      return `Last seen ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `Last seen ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `Last seen ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return `Last seen ${lastSeen.toLocaleDateString()}`;
    }
  }, [getUserPresence]);

  // Get online users count for group chats
  const getOnlineUsersCount = useCallback(() => {
    if (chatType !== 'group') return 0;
    
    return Object.values(userPresence).filter(presence => {
      const now = Date.now();
      const lastActivity = presence.lastActivity ? new Date(presence.lastActivity).getTime() : 0;
      const isRecentlyActive = (now - lastActivity) < OFFLINE_THRESHOLD;
      return presence.isOnline && isRecentlyActive;
    }).length;
  }, [userPresence, chatType]);

  // Get list of online users
  const getOnlineUsers = useCallback(() => {
    return Object.entries(userPresence)
      .filter(([userId, presence]) => {
        const now = Date.now();
        const lastActivity = presence.lastActivity ? new Date(presence.lastActivity).getTime() : 0;
        const isRecentlyActive = (now - lastActivity) < OFFLINE_THRESHOLD;
        return presence.isOnline && isRecentlyActive;
      })
      .map(([userId, presence]) => ({
        userId,
        name: presence.name,
        lastActivity: presence.lastActivity
      }));
  }, [userPresence]);

  // Update presence for a user
  const updateUserPresence = useCallback((userId, presenceData) => {
    setUserPresence(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        ...presenceData,
        updatedAt: new Date()
      }
    }));
  }, []);

  // Bulk update presence data
  const updatePresenceData = useCallback((presenceData) => {
    setUserPresence(prev => ({
      ...prev,
      ...presenceData
    }));
  }, []);

  // Clear presence data (useful when changing chats)
  const clearPresenceData = useCallback(() => {
    setUserPresence({});
  }, []);

  // Start heartbeat to maintain presence
  const startHeartbeat = useCallback(() => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
    }

    heartbeatInterval.current = setInterval(() => {
      if (socket && isOnline) {
        socket.emit('presence_heartbeat', {
          chatId,
          lastActivity: new Date(lastActivityTime.current)
        });
      }
    }, HEARTBEAT_INTERVAL);
  }, [socket, isOnline, chatId]);

  // Stop heartbeat
  const stopHeartbeat = useCallback(() => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
  }, []);

  // Handle browser online/offline events
  useEffect(() => {
    const handleOnline = () => updateOnlineStatus(true);
    const handleOffline = () => updateOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [updateOnlineStatus]);

  // Handle activity tracking
  useEffect(() => {
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      updateActivity();
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [updateActivity]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handlePresenceUpdate = (data) => {
      const { userId, isOnline, lastSeen, lastActivity, name, chatId: presenceChatId } = data;
      
      // Only update if it's for the current chat or global presence
      if (!presenceChatId || presenceChatId === chatId) {
        updateUserPresence(userId, {
          isOnline,
          lastSeen,
          lastActivity,
          name
        });
      }
    };

    const handleUserJoined = (data) => {
      const { userId, name, chatId: joinChatId } = data;
      
      if (joinChatId === chatId) {
        updateUserPresence(userId, {
          isOnline: true,
          lastActivity: new Date(),
          name
        });
      }
    };

    const handleUserLeft = (data) => {
      const { userId, chatId: leftChatId } = data;
      
      if (leftChatId === chatId) {
        updateUserPresence(userId, {
          isOnline: false,
          lastSeen: new Date()
        });
      }
    };

    const handleBulkPresenceUpdate = (data) => {
      const { presenceData, chatId: presenceChatId } = data;
      
      if (!presenceChatId || presenceChatId === chatId) {
        updatePresenceData(presenceData);
      }
    };

    // Listen for presence events
    socket.on('presence_updated', handlePresenceUpdate);
    socket.on('user_joined_chat', handleUserJoined);
    socket.on('user_left_chat', handleUserLeft);
    socket.on('bulk_presence_update', handleBulkPresenceUpdate);

    // Request initial presence data
    socket.emit('get_presence_data', { chatId });

    return () => {
      socket.off('presence_updated', handlePresenceUpdate);
      socket.off('user_joined_chat', handleUserJoined);
      socket.off('user_left_chat', handleUserLeft);
      socket.off('bulk_presence_update', handleBulkPresenceUpdate);
    };
  }, [socket, chatId, updateUserPresence, updatePresenceData]);

  // Start/stop heartbeat based on online status and socket connection
  useEffect(() => {
    if (socket && isOnline) {
      startHeartbeat();
    } else {
      stopHeartbeat();
    }

    return () => {
      stopHeartbeat();
    };
  }, [socket, isOnline, startHeartbeat, stopHeartbeat]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopHeartbeat();
      if (socket) {
        socket.emit('presence_update', {
          isOnline: false,
          lastSeen: new Date(),
          chatId
        });
      }
    };
  }, [socket, chatId, stopHeartbeat]);

  // Clear presence data when chat changes
  useEffect(() => {
    clearPresenceData();
  }, [chatId, clearPresenceData]);

  return {
    userPresence,
    isOnline,
    getUserPresence,
    getLastSeenText,
    getOnlineUsersCount,
    getOnlineUsers,
    updateUserPresence,
    updatePresenceData,
    clearPresenceData,
    updateActivity,
    updateOnlineStatus
  };
};

export default usePresence;