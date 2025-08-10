import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';

/**
 * Hook for managing message delivery and read status
 * Handles real-time status updates via socket events
 */
const useMessageStatus = (chatId, chatType = 'group') => {
  const [messageStatuses, setMessageStatuses] = useState({});
  const socketContext = useSocket();
  const socket = socketContext?.socket;

  // Update message status
  const updateMessageStatus = useCallback((messageId, status, readBy = []) => {
    setMessageStatuses(prev => ({
      ...prev,
      [messageId]: {
        status,
        readBy,
        updatedAt: new Date()
      }
    }));
  }, []);

  // Mark message as read
  const markMessageAsRead = useCallback((messageId) => {
    if (!socket || !chatId) return;

    // Emit read status to server
    socket.emit('update_message_status', {
      messageId,
      status: 'read'
    });

    // Update local status optimistically
    updateMessageStatus(messageId, 'read');
  }, [socket, chatId, updateMessageStatus]);

  // Mark multiple messages as read
  const markMessagesAsRead = useCallback((messageIds) => {
    if (!socket || !chatId || !messageIds.length) return;

    // For group chats, use different event
    if (chatType === 'group') {
      socket.emit('mark_messages_read', {
        chatId,
        messageIds
      });
    } else {
      // For private chats, mark each message individually
      messageIds.forEach(messageId => {
        socket.emit('update_message_status', {
          messageId,
          status: 'read'
        });
      });
    }

    // Update local statuses optimistically
    messageIds.forEach(messageId => {
      updateMessageStatus(messageId, 'read');
    });
  }, [socket, chatId, chatType, updateMessageStatus]);

  // Get message status
  const getMessageStatus = useCallback((messageId) => {
    return messageStatuses[messageId] || { status: 'sent', readBy: [] };
  }, [messageStatuses]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleMessageStatusUpdate = (data) => {
      const { messageId, status, readBy = [], chatId: messageChatId } = data;
      
      // Only update if it's for the current chat
      if (messageChatId === chatId) {
        updateMessageStatus(messageId, status, readBy);
      }
    };

    const handleMessageRead = (data) => {
      const { messageId, readBy = [], chatId: messageChatId } = data;
      
      // Only update if it's for the current chat
      if (messageChatId === chatId) {
        updateMessageStatus(messageId, 'read', readBy);
      }
    };

    const handleMessageDelivered = (data) => {
      const { messageId, chatId: messageChatId } = data;
      
      // Only update if it's for the current chat
      if (messageChatId === chatId) {
        updateMessageStatus(messageId, 'delivered');
      }
    };

    // Listen for status updates based on chat type
    if (chatType === 'private') {
      socket.on('message_status_updated', handleMessageStatusUpdate);
      socket.on('private_message_read', handleMessageRead);
      socket.on('private_message_delivered', handleMessageDelivered);
    } else {
      socket.on('message_status_updated', handleMessageStatusUpdate);
      socket.on('message_read', handleMessageRead);
      socket.on('message_delivered', handleMessageDelivered);
    }

    return () => {
      if (chatType === 'private') {
        socket.off('message_status_updated', handleMessageStatusUpdate);
        socket.off('private_message_read', handleMessageRead);
        socket.off('private_message_delivered', handleMessageDelivered);
      } else {
        socket.off('message_status_updated', handleMessageStatusUpdate);
        socket.off('message_read', handleMessageRead);
        socket.off('message_delivered', handleMessageDelivered);
      }
    };
  }, [socket, chatId, chatType, updateMessageStatus]);

  // Auto-mark messages as read when they come into view
  const markAsReadWhenVisible = useCallback((messageId, isVisible) => {
    if (isVisible && socket && chatId) {
      // Debounce the read marking to avoid too many calls
      const timeoutId = setTimeout(() => {
        markMessageAsRead(messageId);
      }, 1000); // Mark as read after 1 second of being visible

      return () => clearTimeout(timeoutId);
    }
  }, [socket, chatId, markMessageAsRead]);

  // Bulk update message statuses (useful for initial load)
  const updateMessageStatuses = useCallback((statuses) => {
    setMessageStatuses(prev => ({
      ...prev,
      ...statuses
    }));
  }, []);

  // Clear message statuses (useful when changing chats)
  const clearMessageStatuses = useCallback(() => {
    setMessageStatuses({});
  }, []);

  // Get read status summary for a message
  const getReadStatusSummary = useCallback((messageId) => {
    const status = getMessageStatus(messageId);
    const readCount = status.readBy?.length || 0;
    
    return {
      isRead: status.status === 'read',
      readCount,
      readBy: status.readBy || [],
      status: status.status
    };
  }, [getMessageStatus]);

  return {
    messageStatuses,
    updateMessageStatus,
    markMessageAsRead,
    markMessagesAsRead,
    getMessageStatus,
    markAsReadWhenVisible,
    updateMessageStatuses,
    clearMessageStatuses,
    getReadStatusSummary
  };
};

export default useMessageStatus;