import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../config/api';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [syncEnabled, setSyncEnabled] = useState(true);
  const { user, token } = useAuth();

  // Event listeners for real-time updates
  const [messageListeners, setMessageListeners] = useState([]);
  const [reportListeners, setReportListeners] = useState([]);
  const [noticeListeners, setNoticeListeners] = useState([]);
  const [chatGroupListeners, setChatGroupListeners] = useState([]);
  const [privateChatListeners, setPrivateChatListeners] = useState([]);

  useEffect(() => {
    if (user && token) {
      const newSocket = io(API_BASE_URL, {
        auth: {
          token: token
        },
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        timeout: 20000
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setConnectionStatus('connected');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        setConnectionStatus('error');
      });

      newSocket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`Reconnection attempt ${attemptNumber}`);
        setConnectionStatus('reconnecting');
      });

      newSocket.on('reconnect', () => {
        console.log('Reconnected to server');
        setConnectionStatus('connected');
      });

      newSocket.on('userOnline', (users) => {
        setOnlineUsers(users);
      });

      newSocket.on('userOffline', (users) => {
        setOnlineUsers(users);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setConnectionStatus('disconnected');
      });

      // Set up real-time sync event listeners
      setupSyncEventListeners(newSocket);

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user, token]);

  // Set up event listeners for real-time data synchronization
  const setupSyncEventListeners = (socket) => {
    // Group message sync events
    socket.on('new_message_sync', (data) => {
      if (!syncEnabled) return;
      console.log('Received new message sync:', data);
      messageListeners.forEach(listener => listener(data));
    });

    socket.on('message_updated_sync', (data) => {
      if (!syncEnabled) return;
      console.log('Received message update sync:', data);
      messageListeners.forEach(listener => listener(data));
    });

    // Private message sync events
    socket.on('new_private_message_sync', (data) => {
      if (!syncEnabled) return;
      console.log('Received new private message sync:', data);
      messageListeners.forEach(listener => listener(data));
    });

    socket.on('private_message_updated_sync', (data) => {
      if (!syncEnabled) return;
      console.log('Received private message update sync:', data);
      messageListeners.forEach(listener => listener(data));
    });

    // Report sync events
    socket.on('report_sync', (data) => {
      if (!syncEnabled) return;
      console.log('Received report sync:', data);
      reportListeners.forEach(listener => listener(data));
    });

    // Notice sync events
    socket.on('notice_sync', (data) => {
      if (!syncEnabled) return;
      console.log('Received notice sync:', data);
      noticeListeners.forEach(listener => listener(data));
    });

    // Chat group sync events
    socket.on('chat_group_sync', (data) => {
      if (!syncEnabled) return;
      console.log('Received chat group sync:', data);
      chatGroupListeners.forEach(listener => listener(data));
    });

    socket.on('chat_group_members_sync', (data) => {
      if (!syncEnabled) return;
      console.log('Received chat group members sync:', data);
      chatGroupListeners.forEach(listener => listener(data));
    });

    // Private chat sync events
    socket.on('private_chat_sync', (data) => {
      if (!syncEnabled) return;
      console.log('Received private chat sync:', data);
      privateChatListeners.forEach(listener => listener(data));
    });
  };

  const joinRoom = useCallback((roomId) => {
    if (socket) {
      socket.emit('joinRoom', roomId);
    }
  }, [socket]);

  const leaveRoom = useCallback((roomId) => {
    if (socket) {
      socket.emit('leaveRoom', roomId);
    }
  }, [socket]);

  const sendMessage = useCallback((roomId, message) => {
    if (socket) {
      socket.emit('sendMessage', { roomId, message });
    }
  }, [socket]);

  const joinGroup = useCallback((groupId) => {
    if (socket) {
      socket.emit('join_group', groupId);
    }
  }, [socket]);

  const leaveGroup = useCallback((groupId) => {
    if (socket) {
      socket.emit('leave_group', groupId);
    }
  }, [socket]);

  // Add and remove event listeners
  const addMessageListener = useCallback((listener) => {
    setMessageListeners(prev => [...prev, listener]);
    return () => {
      setMessageListeners(prev => prev.filter(l => l !== listener));
    };
  }, []);

  const addReportListener = useCallback((listener) => {
    setReportListeners(prev => [...prev, listener]);
    return () => {
      setReportListeners(prev => prev.filter(l => l !== listener));
    };
  }, []);

  const addNoticeListener = useCallback((listener) => {
    setNoticeListeners(prev => [...prev, listener]);
    return () => {
      setNoticeListeners(prev => prev.filter(l => l !== listener));
    };
  }, []);

  const addChatGroupListener = useCallback((listener) => {
    setChatGroupListeners(prev => [...prev, listener]);
    return () => {
      setChatGroupListeners(prev => prev.filter(l => l !== listener));
    };
  }, []);

  const addPrivateChatListener = useCallback((listener) => {
    setPrivateChatListeners(prev => [...prev, listener]);
    return () => {
      setPrivateChatListeners(prev => prev.filter(l => l !== listener));
    };
  }, []);

  // Toggle real-time sync
  const toggleSync = useCallback(() => {
    setSyncEnabled(prev => !prev);
    return syncEnabled;
  }, [syncEnabled]);

  const value = {
    socket,
    onlineUsers,
    connectionStatus,
    syncEnabled,
    joinRoom,
    leaveRoom,
    sendMessage,
    joinGroup,
    leaveGroup,
    addMessageListener,
    addReportListener,
    addNoticeListener,
    addChatGroupListener,
    addPrivateChatListener,
    toggleSync
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};