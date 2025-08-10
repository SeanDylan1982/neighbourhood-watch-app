import { useState, useEffect, useCallback } from 'react';
import { useChat } from './useChat';

/**
 * Hook for managing user blocking functionality
 */
export const useUserBlocking = (currentUserId) => {
  const [blockedUsers, setBlockedUsers] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { socket } = useChat();

  // Load blocked users on mount
  useEffect(() => {
    loadBlockedUsers();
  }, [currentUserId]);

  // Load blocked users from server
  const loadBlockedUsers = useCallback(async () => {
    if (!currentUserId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/users/${currentUserId}/blocked`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load blocked users');
      }

      const data = await response.json();
      setBlockedUsers(new Set(data.blockedUserIds || []));
    } catch (err) {
      console.error('Failed to load blocked users:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  // Block a user
  const blockUser = useCallback(async (userId, reason = '') => {
    if (!currentUserId || !userId || userId === currentUserId) {
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/users/${currentUserId}/block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          blockedUserId: userId,
          reason,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to block user');
      }

      // Update local state
      setBlockedUsers(prev => new Set([...prev, userId]));

      // Emit socket event to update real-time status
      if (socket) {
        socket.emit('user_blocked', {
          blockedUserId: userId,
          blockedBy: currentUserId,
        });
      }

      return true;
    } catch (err) {
      console.error('Failed to block user:', err);
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, socket]);

  // Unblock a user
  const unblockUser = useCallback(async (userId) => {
    if (!currentUserId || !userId) {
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/users/${currentUserId}/unblock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          blockedUserId: userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to unblock user');
      }

      // Update local state
      setBlockedUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });

      // Emit socket event to update real-time status
      if (socket) {
        socket.emit('user_unblocked', {
          unblockedUserId: userId,
          unblockedBy: currentUserId,
        });
      }

      return true;
    } catch (err) {
      console.error('Failed to unblock user:', err);
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, socket]);

  // Check if a user is blocked
  const isUserBlocked = useCallback((userId) => {
    return blockedUsers.has(userId);
  }, [blockedUsers]);

  // Get list of blocked users
  const getBlockedUsers = useCallback(() => {
    return Array.from(blockedUsers);
  }, [blockedUsers]);

  // Filter messages from blocked users
  const filterBlockedMessages = useCallback((messages) => {
    return messages.filter(message => !isUserBlocked(message.senderId));
  }, [isUserBlocked]);

  // Filter chats with blocked users
  const filterBlockedChats = useCallback((chats) => {
    return chats.filter(chat => {
      if (chat.type === 'private') {
        // For private chats, check if the other participant is blocked
        const otherUserId = chat.participantIds?.find(id => id !== currentUserId);
        return !isUserBlocked(otherUserId);
      }
      // Group chats are not filtered by blocking
      return true;
    });
  }, [isUserBlocked, currentUserId]);

  // Check if current user can send message to a chat
  const canSendMessage = useCallback((chat) => {
    if (chat.type === 'private') {
      const otherUserId = chat.participantIds?.find(id => id !== currentUserId);
      return !isUserBlocked(otherUserId);
    }
    // Can always send to group chats (individual messages from blocked users are filtered)
    return true;
  }, [isUserBlocked, currentUserId]);

  return {
    blockedUsers: getBlockedUsers(),
    isLoading,
    error,
    blockUser,
    unblockUser,
    isUserBlocked,
    filterBlockedMessages,
    filterBlockedChats,
    canSendMessage,
    refreshBlockedUsers: loadBlockedUsers,
  };
};

export default useUserBlocking;