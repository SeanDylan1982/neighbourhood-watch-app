import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { useToast } from './ToastContext';
// Removed circular dependency - selectedChatId and selectedChat will be passed via props or managed differently
import useApi from '../hooks/useApi';
import useChatErrorHandler from '../hooks/useChatErrorHandler';

const MessageContext = createContext();

export const useMessage = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
};

export const MessageProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  
  const { showToast } = useToast();
  
  // These will be managed by the unified useChat hook instead
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const { get, post, patch, delete: deleteRequest, getWithRetry, postWithRetry } = useApi();
  const { handleChatError, retryChatOperation, handleChatLoad, clearError: clearChatError } = useChatErrorHandler();
  
  // Core message state
  const [messages, setMessages] = useState([]);
  
  // Message composition
  const [currentMessage, setCurrentMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [attachments, setAttachments] = useState([]);
  
  // Message interactions
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Loading states
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isRetryingMessages, setIsRetryingMessages] = useState(false);
  
  // Error handling
  const [failedMessages, setFailedMessages] = useState([]);
  const [error, setError] = useState(null);
  const [lastFailedOperation, setLastFailedOperation] = useState(null);
  
  // Refs for cleanup
  const typingTimeoutRef = useRef(null);

  // Helper function to format time
  const formatTime = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }, []);

  // Load messages for a chat with enhanced error handling and retry logic
  const loadMessages = useCallback(async (chatId, options = {}) => {
    if (!chatId) return;
    
    setIsLoadingMessages(true);
    setError(null);
    clearChatError();
    
    // Store operation for potential retry
    const operation = async () => {
      const endpoint = selectedChat?.type === 'group' 
        ? `/api/chat/groups/${chatId}/messages`
        : `/api/chat/private/${chatId}/messages`;
      
      const params = new URLSearchParams();
      if (options.before) params.append('before', options.before);
      if (options.after) params.append('after', options.after);
      if (options.limit) params.append('limit', options.limit.toString());
      
      const queryString = params.toString();
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;
      
      return await getWithRetry(url, {}, 3); // Retry up to 3 times
    };
    
    setLastFailedOperation(() => () => loadMessages(chatId, options));
    
    try {
      const data = await handleChatLoad(operation, `loading messages for chat ${chatId}`);
      
      // Handle corrected API response format
      if (!data || !Array.isArray(data)) {
        console.log('No message data received or invalid format, using empty array');
        setMessages([]);
        return;
      }
      
      // Format messages from API with enhanced field mapping
      const formattedMessages = data.map(msg => {
        // Handle both legacy and new field formats
        const messageId = msg.id || msg._id;
        const createdAt = msg.createdAt || msg.timestamp;
        const attachments = msg.attachments || msg.media || [];
        
        return {
          id: messageId,
          chatId: chatId,
          chatType: selectedChat?.type || 'group',
          senderId: msg.senderId,
          senderName: msg.senderName || 'Unknown User',
          senderAvatar: msg.senderAvatar,
          content: msg.content,
          type: msg.type || msg.messageType || 'text',
          timestamp: new Date(createdAt),
          editedAt: msg.editedAt ? new Date(msg.editedAt) : null,
          status: msg.status || 'sent',
          deliveredTo: msg.deliveredTo || [],
          readBy: msg.readBy || [],
          reactions: msg.reactions || [],
          replyTo: msg.replyTo ? {
            id: msg.replyTo.id || msg.replyTo.messageId,
            content: msg.replyTo.content,
            senderId: msg.replyTo.senderId,
            senderName: msg.replyTo.senderName
          } : null,
          attachments: attachments,
          isDeleted: msg.isDeleted || false,
          deletedFor: msg.deletedFor || [],
          isReported: msg.isReported || false,
          isEdited: msg.isEdited || false,
          isForwarded: msg.isForwarded || false,
          forwardedFrom: msg.forwardedFrom,
          moderationStatus: msg.moderationStatus
        };
      });
      
      setMessages(formattedMessages);
      setLastFailedOperation(null); // Clear failed operation on success
      
    } catch (err) {
      console.error('Error loading messages:', err);
      setError({
        message: err.message || 'Failed to load messages',
        type: 'load_messages',
        chatId: chatId,
        canRetry: true,
        timestamp: new Date()
      });
      
      // Show user-friendly error message
      showToast({
        message: 'Failed to load messages. You can try refreshing.',
        type: 'error',
        duration: 5000,
        action: {
          label: 'Retry',
          onClick: () => loadMessages(chatId, options)
        }
      });
      
      // Fallback to empty messages array
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [getWithRetry, selectedChat, handleChatLoad, clearChatError, showToast]);

  // Send a message with enhanced error handling and retry logic
  const sendMessage = useCallback(async (content, type = 'text', messageAttachments = []) => {
    if (!selectedChatId || !content.trim() || isSendingMessage) return;
    
    setIsSendingMessage(true);
    setError(null);
    clearChatError();
    
    const messageContent = content.trim();
    const tempId = `temp-${Date.now()}`;
    
    // Optimistic UI update
    const optimisticMessage = {
      id: tempId,
      chatId: selectedChatId,
      chatType: selectedChat?.type || 'group',
      senderId: user?.id || user?._id,
      senderName: 'You',
      senderAvatar: user?.avatar,
      content: messageContent,
      type: type,
      timestamp: new Date(),
      status: 'sending',
      deliveredTo: [],
      readBy: [],
      reactions: [],
      replyTo: replyingTo ? {
        id: replyingTo.id,
        messageId: replyingTo.id, // Support both formats
        content: replyingTo.content,
        senderName: replyingTo.senderName,
        senderId: replyingTo.senderId,
        type: replyingTo.type
      } : null,
      attachments: [...messageAttachments, ...attachments],
      isDeleted: false,
      deletedFor: [],
      isReported: false,
      isEdited: false,
      isForwarded: false
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    
    // Clear composition state
    setCurrentMessage('');
    const replyToId = replyingTo?.id;
    setReplyingTo(null);
    setAttachments([]);
    
    // Stop typing indicator
    if (socket) {
      socket.emit('typing_stop', selectedChatId);
    }
    
    // Create retry operation
    const sendOperation = async () => {
      const endpoint = selectedChat?.type === 'group' 
        ? `/api/chat/groups/${selectedChatId}/messages`
        : `/api/chat/private/${selectedChatId}/messages`;
      
      const requestBody = {
        content: messageContent,
        type: type
      };
      
      if (replyToId) {
        requestBody.replyToId = replyToId;
      }
      
      if (optimisticMessage.attachments.length > 0) {
        requestBody.attachments = optimisticMessage.attachments.map(att => att.id);
      }
      
      return await postWithRetry(endpoint, requestBody, {}, 2); // Retry up to 2 times for message sending
    };
    
    try {
      const newMessage = await retryChatOperation(
        sendOperation,
        `sending message to chat ${selectedChatId}`,
        2
      );
      
      // Handle corrected API response format
      const formattedMessage = {
        id: newMessage._id || newMessage.id,
        chatId: selectedChatId,
        chatType: selectedChat?.type || 'group',
        senderId: newMessage.senderId,
        senderName: newMessage.senderName || 'You',
        senderAvatar: newMessage.senderAvatar || user?.avatar,
        content: newMessage.content,
        type: newMessage.type || newMessage.messageType,
        timestamp: new Date(newMessage.createdAt || newMessage.timestamp),
        status: newMessage.status || 'sent',
        deliveredTo: newMessage.deliveredTo || [],
        readBy: newMessage.readBy || [],
        reactions: newMessage.reactions || [],
        replyTo: newMessage.replyTo ? {
          id: newMessage.replyTo.id || newMessage.replyTo.messageId,
          messageId: newMessage.replyTo.id || newMessage.replyTo.messageId,
          content: newMessage.replyTo.content,
          senderId: newMessage.replyTo.senderId,
          senderName: newMessage.replyTo.senderName
        } : null,
        attachments: newMessage.attachments || newMessage.media || [],
        isDeleted: false,
        deletedFor: [],
        isReported: false,
        isEdited: newMessage.isEdited || false,
        isForwarded: newMessage.isForwarded || false,
        forwardedFrom: newMessage.forwardedFrom
      };
      
      // Replace optimistic message with real message
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId ? formattedMessage : msg
        )
      );
      
      // Emit message via socket for real-time updates
      if (socket) {
        socket.emit('send_message', {
          chatId: selectedChatId,
          groupId: selectedChat?.type === 'group' ? selectedChatId : null,
          content: messageContent,
          messageType: type,
          replyToId: replyToId
        });
      }
      
    } catch (err) {
      console.error('Error sending message:', err);
      
      // Update optimistic message to show error state
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId ? { ...msg, status: 'failed' } : msg
        )
      );
      
      // Add to failed messages for retry
      setFailedMessages(prev => [...prev, {
        id: tempId,
        content: messageContent,
        chatId: selectedChatId,
        type: type,
        replyToId: replyToId,
        attachments: optimisticMessage.attachments,
        originalMessage: optimisticMessage
      }]);
      
      setError({
        message: err.message || 'Failed to send message',
        type: 'send_message',
        messageId: tempId,
        canRetry: true,
        timestamp: new Date()
      });
      
      // Show user-friendly error notification
      showToast({
        message: 'Message failed to send. Check failed messages to retry.',
        type: 'error',
        duration: 8000
      });
      
    } finally {
      setIsSendingMessage(false);
    }
  }, [selectedChatId, isSendingMessage, clearChatError, selectedChat?.type, user?.id, user?._id, user?.avatar, replyingTo, attachments, socket, postWithRetry, retryChatOperation, showToast]);

  // Edit a message
  const editMessage = useCallback(async (messageId, content) => {
    try {
      await patch(`/api/messages/${messageId}`, { content });
      
      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content, editedAt: new Date() }
          : msg
      ));
      
    } catch (err) {
      console.error('Error editing message:', err);
      setError(err.message || 'Failed to edit message');
      throw err;
    }
  }, [patch]);

  // Delete a message
  const deleteMessage = useCallback(async (messageId, deleteForEveryone = false) => {
    try {
      await patch(`/api/messages/${messageId}`, {
        isDeleted: true,
        deletedFor: deleteForEveryone ? [] : [user?.id || user?._id]
      });
      
      if (deleteForEveryone) {
        // Remove message completely
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      } else {
        // Mark as deleted for current user
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, isDeleted: true, deletedFor: [...msg.deletedFor, user?.id || user?._id] }
            : msg
        ));
      }
      
    } catch (err) {
      console.error('Error deleting message:', err);
      setError(err.message || 'Failed to delete message');
      throw err;
    }
  }, [patch, user]);

  // React to a message
  const reactToMessage = useCallback(async (messageId, reactionType) => {
    try {
      const userId = user?.id || user?._id;
      
      // Optimistic update
      setMessages(prev => 
        prev.map(msg => {
          if (msg.id === messageId) {
            const updatedReactions = [...msg.reactions];
            const existingReactionIndex = updatedReactions.findIndex(r => r.type === reactionType);
            
            if (existingReactionIndex > -1) {
              const reaction = updatedReactions[existingReactionIndex];
              const userIndex = reaction.users.indexOf(userId);
              
              if (userIndex > -1) {
                // Remove user's reaction
                reaction.users.splice(userIndex, 1);
                reaction.count = Math.max(0, reaction.count - 1);
                
                // Remove reaction if no users left
                if (reaction.count === 0) {
                  updatedReactions.splice(existingReactionIndex, 1);
                }
              } else {
                // Add user's reaction
                reaction.users.push(userId);
                reaction.count += 1;
              }
            } else {
              // Create new reaction
              updatedReactions.push({
                type: reactionType,
                count: 1,
                users: [userId],
                createdAt: new Date()
              });
            }
            
            return { ...msg, reactions: updatedReactions };
          }
          return msg;
        })
      );

      // Make API call
      await post(`/api/messages/${messageId}/react`, {
        reactionType
      });

      // Emit socket event for real-time updates
      if (socket) {
        socket.emit('react_to_message', {
          messageId,
          reactionType
        });
      }
      
    } catch (err) {
      console.error('Error reacting to message:', err);
      setError(err.message || 'Failed to react to message');
      
      // Revert optimistic update on error
      if (selectedChatId) {
        loadMessages(selectedChatId);
      }
    }
  }, [user, post, socket, selectedChatId, loadMessages]);

  // Reply to a message
  const replyToMessage = useCallback((message) => {
    setReplyingTo({
      id: message.id,
      content: message.content,
      senderName: message.senderName,
      type: message.type
    });
  }, []);

  // Cancel reply
  const cancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  // Forward message
  const forwardMessage = useCallback(async (messageId, chatIds) => {
    try {
      const message = messages.find(msg => msg.id === messageId);
      if (!message) return;
      
      // Forward to each selected chat
      for (const chatId of chatIds) {
        await post(`/api/chats/${chatId}/messages`, {
          content: message.content,
          type: message.type,
          forwardedFrom: messageId
        });
      }
      
    } catch (err) {
      console.error('Error forwarding message:', err);
      setError(err.message || 'Failed to forward message');
      throw err;
    }
  }, [messages, post]);

  // Update current message
  const updateCurrentMessage = useCallback((content) => {
    setCurrentMessage(content);
  }, []);

  // Add attachment
  const addAttachment = useCallback((attachment) => {
    setAttachments(prev => [...prev, attachment]);
  }, []);

  // Remove attachment
  const removeAttachment = useCallback((attachmentId) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  }, []);

  // Clear attachments
  const clearAttachments = useCallback(() => {
    setAttachments([]);
  }, []);

  // Message selection
  const selectMessage = useCallback((messageId) => {
    setSelectedMessages(prev => [...prev, messageId]);
  }, []);

  const deselectMessage = useCallback((messageId) => {
    setSelectedMessages(prev => prev.filter(id => id !== messageId));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedMessages([]);
  }, []);

  // Typing indicators
  const startTyping = useCallback(() => {
    if (socket && selectedChatId) {
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Emit typing start
      socket.emit('typing_start', selectedChatId);
      
      // Set timeout to emit typing stop after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing_stop', selectedChatId);
      }, 2000);
    }
  }, [socket, selectedChatId]);

  const stopTyping = useCallback(() => {
    if (socket && selectedChatId) {
      socket.emit('typing_stop', selectedChatId);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  }, [socket, selectedChatId]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (messageIds) => {
    if (!selectedChatId || messageIds.length === 0) return;
    
    try {
      await post(`/api/chats/${selectedChatId}/read`, {
        messageIds,
        readAt: new Date()
      });
      
      // Update local state
      const userId = user?.id || user?._id;
      setMessages(prev => prev.map(msg => {
        if (messageIds.includes(msg.id) && !msg.readBy.some(r => r.userId === userId)) {
          return {
            ...msg,
            readBy: [...msg.readBy, { userId, readAt: new Date() }]
          };
        }
        return msg;
      }));
      
    } catch (err) {
      console.error('Error marking messages as read:', err);
      // Don't show error to user for read receipts
    }
  }, [selectedChatId, user, post]);

  // Internal retry function to avoid circular dependencies
  const retryFailedMessageInternal = useCallback(async (messageId) => {
    const failedMessage = failedMessages.find(msg => msg.id === messageId);
    if (!failedMessage) return;
    
    // Update message status to sending
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, status: 'sending' } : msg
      )
    );
    
    // Create retry operation
    const retryOperation = async () => {
      const endpoint = selectedChat?.type === 'group' 
        ? `/api/chat/groups/${failedMessage.chatId}/messages`
        : `/api/chat/private/${failedMessage.chatId}/messages`;
      
      const requestBody = {
        content: failedMessage.content,
        type: failedMessage.type
      };
      
      if (failedMessage.replyToId) {
        requestBody.replyToId = failedMessage.replyToId;
      }
      
      if (failedMessage.attachments?.length > 0) {
        requestBody.attachments = failedMessage.attachments.map(att => att.id);
      }
      
      return await postWithRetry(endpoint, requestBody, {}, 2);
    };
    
    try {
      const newMessage = await retryChatOperation(
        retryOperation,
        `retrying message ${messageId}`,
        2
      );
      
      // Handle corrected API response format
      const formattedMessage = {
        id: newMessage._id || newMessage.id,
        chatId: failedMessage.chatId,
        chatType: selectedChat?.type || 'group',
        senderId: newMessage.senderId,
        senderName: newMessage.senderName || 'You',
        senderAvatar: newMessage.senderAvatar || user?.avatar,
        content: newMessage.content,
        type: newMessage.type || newMessage.messageType,
        timestamp: new Date(newMessage.createdAt || newMessage.timestamp),
        status: newMessage.status || 'sent',
        deliveredTo: newMessage.deliveredTo || [],
        readBy: newMessage.readBy || [],
        reactions: newMessage.reactions || [],
        replyTo: newMessage.replyTo ? {
          id: newMessage.replyTo.id || newMessage.replyTo.messageId,
          messageId: newMessage.replyTo.id || newMessage.replyTo.messageId,
          content: newMessage.replyTo.content,
          senderId: newMessage.replyTo.senderId,
          senderName: newMessage.replyTo.senderName
        } : null,
        attachments: newMessage.attachments || newMessage.media || [],
        isDeleted: false,
        deletedFor: [],
        isReported: false,
        isEdited: newMessage.isEdited || false,
        isForwarded: newMessage.isForwarded || false,
        forwardedFrom: newMessage.forwardedFrom
      };
      
      // Replace failed message with successful message
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? formattedMessage : msg
        )
      );
      
      // Remove from failed messages
      setFailedMessages(prev => 
        prev.filter(msg => msg.id !== messageId)
      );
      
      // Clear any related errors
      setError(prev => prev?.messageId === messageId ? null : prev);
      
      // Emit message via socket for real-time updates
      if (socket) {
        socket.emit('send_message', {
          chatId: failedMessage.chatId,
          groupId: selectedChat?.type === 'group' ? failedMessage.chatId : null,
          content: failedMessage.content,
          messageType: failedMessage.type,
          replyToId: failedMessage.replyToId
        });
      }
      
      // Show success notification
      showToast({
        message: 'Message sent successfully!',
        type: 'success',
        duration: 3000
      });
      
    } catch (err) {
      console.error('Error retrying message:', err);
      
      // Update message to show error state again
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, status: 'failed' } : msg
        )
      );
      
      setError({
        message: err.message || 'Failed to retry message',
        type: 'retry_message',
        messageId: messageId,
        canRetry: true,
        timestamp: new Date()
      });
      
      // Show error notification with retry option
      showToast({
        message: 'Retry failed. Message still not sent.',
        type: 'error',
        duration: 5000,
        action: {
          label: 'Try Again',
          onClick: () => retryFailedMessageInternal(messageId)
        }
      });
    }
  }, [failedMessages, selectedChat, postWithRetry, retryChatOperation, socket, user, showToast]);

  // Public retry function that calls the internal one
  const retryFailedMessage = useCallback(async (messageId) => {
    return retryFailedMessageInternal(messageId);
  }, [retryFailedMessageInternal]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
    clearChatError();
  }, [clearChatError]);

  // Manual refresh for failed message loads
  const refreshMessages = useCallback(async () => {
    if (!selectedChatId) return;
    
    setIsRetryingMessages(true);
    setError(null);
    clearChatError();
    
    try {
      await loadMessages(selectedChatId);
      showToast({
        message: 'Messages refreshed successfully!',
        type: 'success',
        duration: 3000
      });
    } catch (err) {
      console.error('Error refreshing messages:', err);
      showToast({
        message: 'Failed to refresh messages. Please try again.',
        type: 'error',
        duration: 5000
      });
    } finally {
      setIsRetryingMessages(false);
    }
  }, [selectedChatId, loadMessages, clearChatError, showToast]);

  // Retry last failed operation
  const retryLastOperation = useCallback(async () => {
    if (lastFailedOperation) {
      try {
        await lastFailedOperation();
      } catch (err) {
        console.error('Error retrying last operation:', err);
      }
    }
  }, [lastFailedOperation]);

  // Update selected chat (called from unified useChat hook)
  const updateSelectedChat = useCallback((chatId, chat) => {
    setSelectedChatId(chatId);
    setSelectedChat(chat);
  }, []);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !selectedChatId) return;

    // Message events with corrected API response format handling
    const handleMessageReceived = (data) => {
      if (data.chatId === selectedChatId) {
        const msg = data.message;
        const formattedMessage = {
          id: msg.id || msg._id,
          chatId: data.chatId,
          chatType: selectedChat?.type || 'group',
          senderId: msg.senderId,
          senderName: msg.senderName || 'Unknown User',
          senderAvatar: msg.senderAvatar,
          content: msg.content,
          type: msg.type || msg.messageType || 'text',
          timestamp: new Date(msg.timestamp || msg.createdAt),
          status: msg.status || 'sent',
          deliveredTo: msg.deliveredTo || [],
          readBy: msg.readBy || [],
          reactions: msg.reactions || [],
          replyTo: msg.replyTo ? {
            id: msg.replyTo.id || msg.replyTo.messageId,
            messageId: msg.replyTo.id || msg.replyTo.messageId,
            content: msg.replyTo.content,
            senderId: msg.replyTo.senderId,
            senderName: msg.replyTo.senderName
          } : null,
          attachments: msg.attachments || msg.media || [],
          isDeleted: msg.isDeleted || false,
          deletedFor: msg.deletedFor || [],
          isReported: msg.isReported || false,
          isEdited: msg.isEdited || false,
          isForwarded: msg.isForwarded || false,
          forwardedFrom: msg.forwardedFrom,
          moderationStatus: msg.moderationStatus
        };
        
        setMessages(prev => [...prev, formattedMessage]);
      }
    };

    const handleMessageUpdated = (data) => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === data.messageId 
            ? { ...msg, ...data.updates }
            : msg
        )
      );
    };

    const handleMessageDeleted = (data) => {
      const userId = user?.id || user?._id;
      
      if (data.deletedFor.length === 0) {
        // Deleted for everyone
        setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
      } else if (data.deletedFor.includes(userId)) {
        // Deleted for current user
        setMessages(prev => prev.map(msg => 
          msg.id === data.messageId 
            ? { ...msg, isDeleted: true, deletedFor: data.deletedFor }
            : msg
        ));
      }
    };

    const handleMessageRead = (data) => {
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId 
          ? { 
              ...msg, 
              readBy: [...msg.readBy.filter(r => r.userId !== data.readBy.userId), data.readBy]
            }
          : msg
      ));
    };

    const handleReactionUpdated = (data) => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === data.messageId 
            ? { ...msg, reactions: data.reactions }
            : msg
        )
      );
    };

    // Register event listeners
    socket.on('message_received', handleMessageReceived);
    socket.on('message_updated', handleMessageUpdated);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('message_read', handleMessageRead);
    socket.on('reaction_updated', handleReactionUpdated);

    return () => {
      socket.off('message_received', handleMessageReceived);
      socket.off('message_updated', handleMessageUpdated);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('message_read', handleMessageRead);
      socket.off('reaction_updated', handleReactionUpdated);
      
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [socket, selectedChatId, selectedChat, user]);

  // Load messages when selected chat changes
  useEffect(() => {
    if (selectedChatId) {
      // Clear current messages
      setMessages([]);
      setError(null);
      
      // Load messages for new chat
      loadMessages(selectedChatId);
    }
  }, [selectedChatId, loadMessages]);

  const value = {
    // State
    messages,
    currentMessage,
    replyingTo,
    attachments,
    selectedMessages,
    showEmojiPicker,
    isSendingMessage,
    isLoadingMessages,
    isRetryingMessages,
    failedMessages,
    error,
    lastFailedOperation,
    
    // Actions
    loadMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    reactToMessage,
    replyToMessage,
    cancelReply,
    forwardMessage,
    updateCurrentMessage,
    addAttachment,
    removeAttachment,
    clearAttachments,
    selectMessage,
    deselectMessage,
    clearSelection,
    startTyping,
    stopTyping,
    markMessagesAsRead,
    retryFailedMessage,
    clearError,
    updateSelectedChat,
    refreshMessages,
    retryLastOperation,
    
    // UI state setters
    setShowEmojiPicker,
    
    // Selected chat state (for internal use)
    selectedChatId,
    selectedChat
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};