import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';

/**
 * Hook for managing typing indicators in chat
 * Handles both sending typing status and receiving typing status from others
 */
const useTypingIndicator = (chatId, chatType = 'group') => {
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const socketContext = useSocket();
  const socket = socketContext?.socket;
  const typingTimeoutRef = useRef(null);
  const typingUsersTimeoutRef = useRef({});

  // Timeout duration for typing indicators (3 seconds)
  const TYPING_TIMEOUT = 3000;

  // Stop typing indicator
  const stopTyping = useCallback(() => {
    if (!socket || !chatId) return;

    setIsTyping(prev => {
      if (prev) {
        // Emit typing stop event based on chat type
        if (chatType === 'private') {
          socket.emit('private_typing_stop', chatId);
        } else {
          socket.emit('typing_stop', chatId);
        }
      }
      return false;
    });

    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [socket, chatId, chatType]);

  // Start typing indicator
  const startTyping = useCallback(() => {
    if (!socket || !chatId) return;

    setIsTyping(prev => {
      if (!prev) {
        // Emit typing start event based on chat type
        if (chatType === 'private') {
          socket.emit('private_typing_start', chatId);
        } else {
          socket.emit('typing_start', chatId);
        }
      }
      return true;
    });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to automatically stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (socket && chatId) {
        // Emit typing stop event based on chat type
        if (chatType === 'private') {
          socket.emit('private_typing_stop', chatId);
        } else {
          socket.emit('typing_stop', chatId);
        }
      }
    }, TYPING_TIMEOUT);
  }, [socket, chatId, chatType]);

  // Handle typing input with debouncing
  const handleTyping = useCallback(() => {
    startTyping();
  }, [startTyping]);

  // Add user to typing list with timeout
  const addTypingUser = useCallback((user) => {
    setTypingUsers(prev => {
      // Check if user is already in the list
      const existingUser = prev.find(u => u.id === user.id);
      if (existingUser) {
        return prev; // User already typing
      }
      
      return [...prev, user];
    });

    // Clear existing timeout for this user
    if (typingUsersTimeoutRef.current[user.id]) {
      clearTimeout(typingUsersTimeoutRef.current[user.id]);
    }

    // Set timeout to remove user from typing list
    typingUsersTimeoutRef.current[user.id] = setTimeout(() => {
      removeTypingUser(user.id);
    }, TYPING_TIMEOUT + 1000); // Slightly longer than sender timeout
  }, []);

  // Remove user from typing list
  const removeTypingUser = useCallback((userId) => {
    setTypingUsers(prev => prev.filter(u => u.id !== userId));
    
    // Clear timeout for this user
    if (typingUsersTimeoutRef.current[userId]) {
      clearTimeout(typingUsersTimeoutRef.current[userId]);
      delete typingUsersTimeoutRef.current[userId];
    }
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleUserTyping = (data) => {
      // Only show typing indicator for the current chat
      if (data.chatId === chatId || data.groupId === chatId) {
        addTypingUser({
          id: data.userId,
          name: data.userName
        });
      }
    };

    const handleUserStoppedTyping = (data) => {
      // Remove user from typing list for the current chat
      if (data.chatId === chatId || data.groupId === chatId) {
        removeTypingUser(data.userId);
      }
    };

    // Listen for typing events based on chat type
    if (chatType === 'private') {
      socket.on('private_user_typing', handleUserTyping);
      socket.on('private_user_stopped_typing', handleUserStoppedTyping);
    } else {
      socket.on('user_typing', handleUserTyping);
      socket.on('user_stopped_typing', handleUserStoppedTyping);
    }

    return () => {
      if (chatType === 'private') {
        socket.off('private_user_typing', handleUserTyping);
        socket.off('private_user_stopped_typing', handleUserStoppedTyping);
      } else {
        socket.off('user_typing', handleUserTyping);
        socket.off('user_stopped_typing', handleUserStoppedTyping);
      }
    };
  }, [socket, chatId, chatType, addTypingUser, removeTypingUser]);

  // Cleanup on unmount or chat change
  useEffect(() => {
    return () => {
      // Clear all timeouts
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      Object.values(typingUsersTimeoutRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
      
      // Stop typing if currently typing
      if (isTyping) {
        stopTyping();
      }
      
      // Clear typing users
      setTypingUsers([]);
    };
  }, [chatId, stopTyping, isTyping]);

  // Auto-stop typing when chat changes
  useEffect(() => {
    if (isTyping) {
      stopTyping();
    }
    setTypingUsers([]);
  }, [chatId, stopTyping]);

  return {
    typingUsers,
    isTyping,
    startTyping,
    stopTyping,
    handleTyping
  };
};

export default useTypingIndicator;