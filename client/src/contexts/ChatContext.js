import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import useApi from '../hooks/useApi';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { get, post, patch, delete: deleteRequest } = useApi();
  
  // Core state
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  
  // Error handling
  const [error, setError] = useState(null);
  
  // Real-time features
  const [typingIndicators, setTypingIndicators] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);
  
  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredChats, setFilteredChats] = useState([]);
  
  // Refs for cleanup
  const typingTimeoutsRef = useRef({});

  // Helper function to format time
  const formatTime = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }, []);

  // Load chats from API
  const loadChats = useCallback(async () => {
    if (!user) return;
    
    setIsLoadingChats(true);
    setError(null);
    
    try {
      // Load both group and private chats
      const [groupChatsData, privateChatsData] = await Promise.allSettled([
        get('/api/chat/groups'),
        get('/api/chat/private').catch(() => []) // Private chats might not be implemented yet
      ]);
      
      const groupChats = groupChatsData.status === 'fulfilled' ? groupChatsData.value : [];
      const privateChats = privateChatsData.status === 'fulfilled' ? privateChatsData.value : [];
      
      // Format group chats
      const formattedGroupChats = (Array.isArray(groupChats) ? groupChats : []).map(group => ({
        id: group.id || group._id,
        type: 'group',
        name: group.name,
        description: group.description,
        avatar: group.avatar,
        createdAt: new Date(group.createdAt),
        updatedAt: new Date(group.updatedAt || group.createdAt),
        memberCount: group.memberCount || group.members?.length || 0,
        members: group.members || [],
        isPublic: group.isPublic !== false,
        lastMessage: group.lastMessage ? {
          id: group.lastMessage.id || group.lastMessage._id,
          content: group.lastMessage.content,
          type: group.lastMessage.type || 'text',
          senderId: group.lastMessage.senderId,
          senderName: group.lastMessage.senderName,
          timestamp: new Date(group.lastMessage.timestamp || group.lastMessage.createdAt)
        } : null,
        unreadCount: group.unreadCount || 0,
        isMuted: group.isMuted || false,
        isArchived: group.isArchived || false,
        isPinned: group.isPinned || false
      }));
      
      // Format private chats
      const formattedPrivateChats = (Array.isArray(privateChats) ? privateChats : []).map(chat => ({
        id: chat.id || chat._id,
        type: 'private',
        name: chat.participantName || 'Private Chat',
        createdAt: new Date(chat.createdAt),
        updatedAt: new Date(chat.updatedAt || chat.createdAt),
        participantId: chat.participantId,
        participantName: chat.participantName,
        participantAvatar: chat.participantAvatar,
        isOnline: chat.isOnline || false,
        lastSeen: chat.lastSeen ? new Date(chat.lastSeen) : null,
        lastMessage: chat.lastMessage ? {
          id: chat.lastMessage.id || chat.lastMessage._id,
          content: chat.lastMessage.content,
          type: chat.lastMessage.type || 'text',
          senderId: chat.lastMessage.senderId,
          senderName: chat.lastMessage.senderName,
          timestamp: new Date(chat.lastMessage.timestamp || chat.lastMessage.createdAt)
        } : null,
        unreadCount: chat.unreadCount || 0,
        isMuted: chat.isMuted || false,
        isArchived: chat.isArchived || false,
        isPinned: chat.isPinned || false
      }));
      
      // Combine and sort chats by last activity
      const allChats = [...formattedGroupChats, ...formattedPrivateChats].sort((a, b) => {
        const aTime = a.lastMessage?.timestamp || a.updatedAt;
        const bTime = b.lastMessage?.timestamp || b.updatedAt;
        return new Date(bTime) - new Date(aTime);
      });
      
      setChats(allChats);
      
    } catch (err) {
      console.error('Error loading chats:', err);
      setError(err.message || 'Failed to load chats');
    } finally {
      setIsLoadingChats(false);
    }
  }, [user, get]);

  // Select a chat
  const selectChat = useCallback((chatId) => {
    const chat = chats.find(c => c.id === chatId);
    setSelectedChatId(chatId);
    setSelectedChat(chat || null);
    
    // Join the chat room via socket
    if (socket && chatId) {
      if (chat?.type === 'group') {
        socket.emit('join_group', chatId);
      } else {
        socket.emit('join_chat', { chatId, chatType: 'private' });
      }
    }
  }, [chats, socket]);

  // Create group chat
  const createGroupChat = useCallback(async (name, description = '', memberIds = []) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newGroup = await post('/api/chat/groups', {
        name: name.trim(),
        description: description.trim(),
        type: 'public'
      });

      // Add selected users to the group
      for (const userId of memberIds) {
        try {
          await post(`/api/chat/groups/${newGroup.id}/join`, { userId });
        } catch (error) {
          console.error('Error adding user to group:', error);
        }
      }

      // Format the new group
      const formattedGroup = {
        id: newGroup.id || newGroup._id,
        type: 'group',
        name: newGroup.name,
        description: newGroup.description,
        createdAt: new Date(newGroup.createdAt),
        updatedAt: new Date(newGroup.updatedAt || newGroup.createdAt),
        memberCount: memberIds.length + 1, // +1 for creator
        members: [],
        isPublic: true,
        lastMessage: null,
        unreadCount: 0,
        isMuted: false,
        isArchived: false,
        isPinned: false
      };

      // Add to chats list
      setChats(prev => [formattedGroup, ...prev]);
      
      return formattedGroup;
    } catch (err) {
      console.error('Error creating group chat:', err);
      setError(err.message || 'Failed to create group chat');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [post]);

  // Create private chat
  const createPrivateChat = useCallback(async (participantId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newChat = await post('/api/chat/private', { participantId });

      // Format the new chat
      const formattedChat = {
        id: newChat.id || newChat._id,
        type: 'private',
        name: newChat.participantName || 'Private Chat',
        createdAt: new Date(newChat.createdAt),
        updatedAt: new Date(newChat.updatedAt || newChat.createdAt),
        participantId: newChat.participantId,
        participantName: newChat.participantName,
        participantAvatar: newChat.participantAvatar,
        isOnline: false,
        lastSeen: null,
        lastMessage: null,
        unreadCount: 0,
        isMuted: false,
        isArchived: false,
        isPinned: false
      };

      // Add to chats list
      setChats(prev => [formattedChat, ...prev]);
      
      return formattedChat;
    } catch (err) {
      console.error('Error creating private chat:', err);
      setError(err.message || 'Failed to create private chat');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [post]);

  // Update chat settings
  const updateChatSettings = useCallback(async (chatId, settings) => {
    try {
      await patch(`/api/chats/${chatId}`, settings);
      
      // Update local state
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, ...settings } : chat
      ));
      
      // Update selected chat if it's the current one
      if (selectedChatId === chatId) {
        setSelectedChat(prev => prev ? { ...prev, ...settings } : null);
      }
    } catch (err) {
      console.error('Error updating chat settings:', err);
      setError(err.message || 'Failed to update chat settings');
      throw err;
    }
  }, [patch, selectedChatId]);

  // Delete chat
  const deleteChat = useCallback(async (chatId) => {
    try {
      await deleteRequest(`/api/chats/${chatId}`);
      
      // Remove from local state
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      
      // Clear selection if it was the selected chat
      if (selectedChatId === chatId) {
        setSelectedChatId(null);
        setSelectedChat(null);
      }
    } catch (err) {
      console.error('Error deleting chat:', err);
      setError(err.message || 'Failed to delete chat');
      throw err;
    }
  }, [deleteRequest, selectedChatId]);

  // Search chats
  const searchChats = useCallback((query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredChats(chats);
      return;
    }
    
    const filtered = chats.filter(chat => 
      chat.name.toLowerCase().includes(query.toLowerCase()) ||
      chat.description?.toLowerCase().includes(query.toLowerCase()) ||
      chat.lastMessage?.content.toLowerCase().includes(query.toLowerCase())
    );
    
    setFilteredChats(filtered);
  }, [chats]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setFilteredChats(chats);
  }, [chats]);

  // Join chat room
  const joinChat = useCallback((chatId) => {
    if (socket) {
      const chat = chats.find(c => c.id === chatId);
      if (chat?.type === 'group') {
        socket.emit('join_group', chatId);
      } else {
        socket.emit('join_chat', { chatId, chatType: 'private' });
      }
    }
  }, [socket, chats]);

  // Leave chat room
  const leaveChat = useCallback((chatId) => {
    if (socket) {
      const chat = chats.find(c => c.id === chatId);
      if (chat?.type === 'group') {
        socket.emit('leave_group', chatId);
      } else {
        socket.emit('leave_chat', { chatId, chatType: 'private' });
      }
    }
  }, [socket, chats]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    // Chat update events
    const handleChatUpdated = (data) => {
      setChats(prev => prev.map(chat => 
        chat.id === data.chatId ? { ...chat, ...data.updates } : chat
      ));
      
      if (selectedChatId === data.chatId) {
        setSelectedChat(prev => prev ? { ...prev, ...data.updates } : null);
      }
    };

    // User joined/left events
    const handleUserJoined = (data) => {
      setChats(prev => prev.map(chat => {
        if (chat.id === data.chatId) {
          return {
            ...chat,
            memberCount: (chat.memberCount || 0) + 1,
            members: [...(chat.members || []), data.user]
          };
        }
        return chat;
      }));
    };

    const handleUserLeft = (data) => {
      setChats(prev => prev.map(chat => {
        if (chat.id === data.chatId) {
          return {
            ...chat,
            memberCount: Math.max(0, (chat.memberCount || 0) - 1),
            members: (chat.members || []).filter(member => member._id !== data.userId)
          };
        }
        return chat;
      }));
    };

    // Typing indicators
    const handleUserTyping = (data) => {
      setTypingIndicators(prev => ({
        ...prev,
        [data.chatId]: [
          ...(prev[data.chatId] || []).filter(t => t.userId !== data.userId),
          {
            userId: data.userId,
            userName: data.userName,
            chatId: data.chatId,
            timestamp: Date.now()
          }
        ]
      }));

      // Clear typing indicator after 3 seconds
      if (typingTimeoutsRef.current[`${data.chatId}-${data.userId}`]) {
        clearTimeout(typingTimeoutsRef.current[`${data.chatId}-${data.userId}`]);
      }

      typingTimeoutsRef.current[`${data.chatId}-${data.userId}`] = setTimeout(() => {
        setTypingIndicators(prev => ({
          ...prev,
          [data.chatId]: (prev[data.chatId] || []).filter(t => t.userId !== data.userId)
        }));
      }, 3000);
    };

    const handleUserStoppedTyping = (data) => {
      setTypingIndicators(prev => ({
        ...prev,
        [data.chatId]: (prev[data.chatId] || []).filter(t => t.userId !== data.userId)
      }));

      if (typingTimeoutsRef.current[`${data.chatId}-${data.userId}`]) {
        clearTimeout(typingTimeoutsRef.current[`${data.chatId}-${data.userId}`]);
      }
    };

    // Online/offline status
    const handleUserOnline = (data) => {
      setOnlineUsers(prev => [...new Set([...prev, data.userId])]);
      
      // Update private chats
      setChats(prev => prev.map(chat => 
        chat.type === 'private' && chat.participantId === data.userId
          ? { ...chat, isOnline: true, lastSeen: null }
          : chat
      ));
    };

    const handleUserOffline = (data) => {
      setOnlineUsers(prev => prev.filter(id => id !== data.userId));
      
      // Update private chats
      setChats(prev => prev.map(chat => 
        chat.type === 'private' && chat.participantId === data.userId
          ? { ...chat, isOnline: false, lastSeen: new Date() }
          : chat
      ));
    };

    // Message received - update last message in chat list
    const handleMessageReceived = (data) => {
      setChats(prev => prev.map(chat => {
        if (chat.id === data.chatId) {
          return {
            ...chat,
            lastMessage: {
              id: data.message.id,
              content: data.message.content,
              type: data.message.type,
              senderId: data.message.senderId,
              senderName: data.message.senderName,
              timestamp: new Date(data.message.timestamp)
            },
            unreadCount: data.message.senderId !== user?.id ? (chat.unreadCount || 0) + 1 : chat.unreadCount,
            updatedAt: new Date(data.message.timestamp)
          };
        }
        return chat;
      }));
    };

    // Register event listeners
    socket.on('chat_updated', handleChatUpdated);
    socket.on('user_joined', handleUserJoined);
    socket.on('user_left', handleUserLeft);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);
    socket.on('message_received', handleMessageReceived);

    return () => {
      socket.off('chat_updated', handleChatUpdated);
      socket.off('user_joined', handleUserJoined);
      socket.off('user_left', handleUserLeft);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
      socket.off('message_received', handleMessageReceived);
      
      // Clear all typing timeouts
      Object.values(typingTimeoutsRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, [socket, selectedChatId, user]);

  // Update filtered chats when chats change
  useEffect(() => {
    if (searchQuery) {
      searchChats(searchQuery);
    } else {
      setFilteredChats(chats);
    }
  }, [chats, searchQuery, searchChats]);

  // Load chats on mount
  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user, loadChats]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    // State
    chats,
    selectedChatId,
    selectedChat,
    isLoading,
    isLoadingChats,
    error,
    typingIndicators,
    onlineUsers,
    searchQuery,
    filteredChats,
    
    // Actions
    loadChats,
    selectChat,
    createGroupChat,
    createPrivateChat,
    updateChatSettings,
    deleteChat,
    searchChats,
    clearSearch,
    joinChat,
    leaveChat,
    clearError
  }), [
    chats,
    selectedChatId,
    selectedChat,
    isLoading,
    isLoadingChats,
    error,
    typingIndicators,
    onlineUsers,
    searchQuery,
    filteredChats,
    loadChats,
    selectChat,
    createGroupChat,
    createPrivateChat,
    updateChatSettings,
    deleteChat,
    searchChats,
    clearSearch,
    joinChat,
    leaveChat,
    clearError
  ]);

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};