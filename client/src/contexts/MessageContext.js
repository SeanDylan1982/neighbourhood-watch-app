import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
// Removed circular dependency - selectedChatId and selectedChat will be passed via props or managed differently
import useApi from '../hooks/useApi';

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
  
  // These will be managed by the unified useChat hook instead
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const { get, post, patch, delete: deleteRequest } = useApi();
  
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
  
  // Error handling
  const [failedMessages, setFailedMessages] = useState([]);
  const [error, setError] = useState(null);
  
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

  // Load messages for a chat
  const loadMessages = useCallback(async (chatId, options = {}) => {
    if (!chatId) return;
    
    setIsLoadingMessages(true);
    setError(null);
    
    try {
      const endpoint = selectedChat?.type === 'group' 
        ? `/api/chat/groups/${chatId}/messages`
        : `/api/chat/private/${chatId}/messages`;
      
      const params = new URLSearchParams();
      if (options.before) params.append('before', options.before);
      if (options.after) params.append('after', options.after);
      if (options.limit) params.append('limit', options.limit.toString());
      
      const queryString = params.toString();
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;
      
      const data = await get(url);
      
      if (!data || !Array.isArray(data)) {
        console.log('No message data received, using mock messages for demo');
        // Generate mock messages for demonstration
        const mockMessages = [
          {
            _id: `${chatId}-msg-1`,
            content: selectedChat?.type === 'group' ? 'Welcome to the group chat!' : 'Hello! 👋',
            senderId: selectedChat?.type === 'group' ? 'system' : (selectedChat?.participantId || 'other-user'),
            senderName: selectedChat?.type === 'group' ? 'System' : (selectedChat?.participantName || 'Friend'),
            createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            type: 'text',
            status: 'read',
            reactions: [],
            attachments: []
          },
          {
            _id: `${chatId}-msg-2`,
            content: selectedChat?.type === 'group' ? 'Hello everyone! 👋' : 'How are you doing?',
            senderId: selectedChat?.type === 'group' ? `${chatId}-member-1` : (selectedChat?.participantId || 'other-user'),
            senderName: selectedChat?.type === 'group' ? 'John Doe' : (selectedChat?.participantName || 'Friend'),
            createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
            type: 'text',
            status: 'read',
            reactions: [],
            attachments: []
          }
        ];
        
        const formattedMockMessages = mockMessages.map(msg => ({
          id: msg._id,
          chatId: chatId,
          chatType: selectedChat?.type || 'group',
          senderId: msg.senderId,
          senderName: msg.senderName,
          content: msg.content,
          type: msg.type,
          timestamp: new Date(msg.createdAt),
          status: msg.status,
          deliveredTo: [],
          readBy: [],
          reactions: msg.reactions || [],
          replyTo: msg.replyTo || null,
          attachments: msg.attachments || [],
          isDeleted: false,
          deletedFor: [],
          isReported: false
        }));
        
        setMessages(formattedMockMessages);
        return;
      }
      
      // Format messages from API
      const formattedMessages = data.map(msg => ({
        id: msg.id || msg._id,
        chatId: chatId,
        chatType: selectedChat?.type || 'group',
        senderId: msg.senderId,
        senderName: msg.senderName,
        content: msg.content,
        type: msg.type || 'text',
        timestamp: new Date(msg.createdAt),
        editedAt: msg.editedAt ? new Date(msg.editedAt) : null,
        status: msg.status || 'sent',
        deliveredTo: msg.deliveredTo || [],
        readBy: msg.readBy || [],
        reactions: msg.reactions || [],
        replyTo: msg.replyTo || null,
        attachments: msg.attachments || [],
        isDeleted: msg.isDeleted || false,
        deletedFor: msg.deletedFor || [],
        isReported: msg.isReported || false,
        moderationStatus: msg.moderationStatus
      }));
      
      setMessages(formattedMessages);
      
    } catch (err) {
      console.error('Error loading messages:', err);
      setError(err.message || 'Failed to load messages');
      
      // Fallback to empty messages array
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [get, selectedChat]);

  // Send a message
  const sendMessage = useCallback(async (content, type = 'text', messageAttachments = []) => {
    if (!selectedChatId || !content.trim() || isSendingMessage) return;
    
    setIsSendingMessage(true);
    setError(null);
    
    const messageContent = content.trim();
    const tempId = `temp-${Date.now()}`;
    
    // Optimistic UI update
    const optimisticMessage = {
      id: tempId,
      chatId: selectedChatId,
      chatType: selectedChat?.type || 'group',
      senderId: user?.id || user?._id,
      senderName: 'You',
      content: messageContent,
      type: type,
      timestamp: new Date(),
      status: 'sending',
      deliveredTo: [],
      readBy: [],
      reactions: [],
      replyTo: replyingTo ? {
        messageId: replyingTo.id,
        content: replyingTo.content,
        senderName: replyingTo.senderName,
        type: replyingTo.type
      } : null,
      attachments: [...messageAttachments, ...attachments],
      isDeleted: false,
      deletedFor: [],
      isReported: false
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
    
    try {
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
      
      const newMessage = await post(endpoint, requestBody);
      
      const formattedMessage = {
        id: newMessage._id || newMessage.id,
        chatId: selectedChatId,
        chatType: selectedChat?.type || 'group',
        senderId: newMessage.senderId,
        senderName: newMessage.senderName,
        content: newMessage.content,
        type: newMessage.type,
        timestamp: new Date(newMessage.createdAt),
        status: newMessage.status || 'sent',
        deliveredTo: newMessage.deliveredTo || [],
        readBy: newMessage.readBy || [],
        reactions: newMessage.reactions || [],
        replyTo: newMessage.replyTo || null,
        attachments: newMessage.attachments || [],
        isDeleted: false,
        deletedFor: [],
        isReported: false
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
        attachments: optimisticMessage.attachments
      }]);
      
      setError(err.message || 'Failed to send message');
    } finally {
      setIsSendingMessage(false);
    }
  }, [selectedChatId, selectedChat, user, isSendingMessage, replyingTo, attachments, socket, post]);

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

  // Retry failed message
  const retryFailedMessage = useCallback(async (messageId) => {
    const failedMessage = failedMessages.find(msg => msg.id === messageId);
    if (!failedMessage) return;
    
    // Update message status to sending
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, status: 'sending' } : msg
      )
    );
    
    try {
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
      
      const newMessage = await post(endpoint, requestBody);
      
      const formattedMessage = {
        id: newMessage._id || newMessage.id,
        chatId: failedMessage.chatId,
        chatType: selectedChat?.type || 'group',
        senderId: newMessage.senderId,
        senderName: newMessage.senderName,
        content: newMessage.content,
        type: newMessage.type,
        timestamp: new Date(newMessage.createdAt),
        status: newMessage.status || 'sent',
        deliveredTo: newMessage.deliveredTo || [],
        readBy: newMessage.readBy || [],
        reactions: newMessage.reactions || [],
        replyTo: newMessage.replyTo || null,
        attachments: newMessage.attachments || [],
        isDeleted: false,
        deletedFor: [],
        isReported: false
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
      
    } catch (err) {
      console.error('Error retrying message:', err);
      
      // Update message to show error state again
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, status: 'failed' } : msg
        )
      );
      
      setError(err.message || 'Failed to retry message');
    }
  }, [failedMessages, selectedChat, post, socket]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Update selected chat (called from unified useChat hook)
  const updateSelectedChat = useCallback((chatId, chat) => {
    setSelectedChatId(chatId);
    setSelectedChat(chat);
  }, []);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !selectedChatId) return;

    // Message events
    const handleMessageReceived = (data) => {
      if (data.chatId === selectedChatId) {
        const formattedMessage = {
          id: data.message.id,
          chatId: data.chatId,
          chatType: selectedChat?.type || 'group',
          senderId: data.message.senderId,
          senderName: data.message.senderName,
          content: data.message.content,
          type: data.message.type,
          timestamp: new Date(data.message.timestamp),
          status: data.message.status,
          deliveredTo: data.message.deliveredTo || [],
          readBy: data.message.readBy || [],
          reactions: data.message.reactions || [],
          replyTo: data.message.replyTo || null,
          attachments: data.message.attachments || [],
          isDeleted: false,
          deletedFor: [],
          isReported: false
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
    failedMessages,
    error,
    
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