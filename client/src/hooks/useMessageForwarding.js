import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import useApi from './useApi';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants/chat';

/**
 * useMessageForwarding Hook
 * 
 * Manages message forwarding functionality including:
 * - Forwarding messages to multiple chats
 * - Handling forwarded message metadata
 * - Real-time updates via socket
 * - Error handling and loading states
 */
const useMessageForwarding = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { post } = useApi();
  
  const [isForwarding, setIsForwarding] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Forward a message to multiple chats
   * @param {Object} message - The message to forward
   * @param {Array} targetChats - Array of chat objects to forward to
   * @returns {Promise} - Resolves when forwarding is complete
   */
  const forwardMessage = useCallback(async (message, targetChats) => {
    if (!message || !targetChats || targetChats.length === 0) {
      throw new Error('Message and target chats are required');
    }

    if (!user) {
      throw new Error('User must be authenticated to forward messages');
    }

    setIsForwarding(true);
    setError(null);

    try {
      const forwardingPromises = targetChats.map(async (chat) => {
        // Prepare forwarded message data
        const forwardedMessageData = {
          content: message.content,
          type: message.type,
          attachments: message.attachments || [],
          
          // Forwarding metadata
          isForwarded: true,
          forwardedFrom: {
            messageId: message.id,
            originalSenderId: message.senderId,
            originalSenderName: message.senderName,
            originalChatId: message.chatId,
            originalChatName: message.chatName || 'Unknown Chat',
            forwardedBy: user.id,
            forwardedByName: user.name || `${user.firstName} ${user.lastName}`,
            forwardedAt: new Date().toISOString()
          }
        };

        // Send to appropriate endpoint based on chat type
        const endpoint = chat.type === 'group' 
          ? `/api/chat/groups/${chat.id}/messages`
          : `/api/chat/private/${chat.id}/messages`;

        const response = await post(endpoint, forwardedMessageData);

        // Emit socket event for real-time updates
        if (socket) {
          socket.emit('send_message', {
            chatId: chat.id,
            chatType: chat.type,
            message: response
          });
        }

        return {
          chatId: chat.id,
          chatName: chat.name,
          messageId: response.id,
          success: true
        };
      });

      // Wait for all forwarding operations to complete
      const results = await Promise.allSettled(forwardingPromises);
      
      // Check for any failures
      const failures = results.filter(result => result.status === 'rejected');
      const successes = results.filter(result => result.status === 'fulfilled');

      if (failures.length > 0) {
        console.error('Some forwarding operations failed:', failures);
        
        if (successes.length === 0) {
          throw new Error('Failed to forward message to any chats');
        } else {
          // Partial success
          const failedCount = failures.length;
          const successCount = successes.length;
          throw new Error(`Message forwarded to ${successCount} chat${successCount > 1 ? 's' : ''}, but failed for ${failedCount} chat${failedCount > 1 ? 's' : ''}`);
        }
      }

      // All successful
      const successCount = successes.length;
      return {
        success: true,
        message: successCount === 1 
          ? SUCCESS_MESSAGES.MESSAGE_FORWARDED
          : `Message forwarded to ${successCount} chats`,
        results: successes.map(result => result.value)
      };

    } catch (err) {
      console.error('Error forwarding message:', err);
      const errorMessage = err.message || ERROR_MESSAGES.SEND_MESSAGE_FAILED;
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsForwarding(false);
    }
  }, [user, socket, post]);

  /**
   * Forward multiple messages to a single chat
   * @param {Array} messages - Array of messages to forward
   * @param {Object} targetChat - Chat object to forward to
   * @returns {Promise} - Resolves when forwarding is complete
   */
  const forwardMultipleMessages = useCallback(async (messages, targetChat) => {
    if (!messages || messages.length === 0 || !targetChat) {
      throw new Error('Messages and target chat are required');
    }

    setIsForwarding(true);
    setError(null);

    try {
      const forwardingPromises = messages.map(message => 
        forwardMessage(message, [targetChat])
      );

      await Promise.all(forwardingPromises);

      return {
        success: true,
        message: `${messages.length} message${messages.length > 1 ? 's' : ''} forwarded successfully`
      };

    } catch (err) {
      console.error('Error forwarding multiple messages:', err);
      const errorMessage = err.message || 'Failed to forward messages';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsForwarding(false);
    }
  }, [forwardMessage]);

  /**
   * Check if a message can be forwarded
   * @param {Object} message - Message to check
   * @returns {boolean} - Whether the message can be forwarded
   */
  const canForwardMessage = useCallback((message) => {
    if (!message) return false;

    // Check if message type is forwardable
    const forwardableTypes = ['text', 'image', 'audio', 'document', 'location', 'contact'];
    if (!forwardableTypes.includes(message.type)) {
      return false;
    }

    // Check if message is not deleted
    if (message.isDeleted) {
      return false;
    }

    // Check if user has permission (for now, all users can forward)
    return true;
  }, []);

  /**
   * Get forwarding metadata for a message
   * @param {Object} message - Message to get metadata for
   * @returns {Object|null} - Forwarding metadata or null if not forwarded
   */
  const getForwardingMetadata = useCallback((message) => {
    if (!message || !message.isForwarded || !message.forwardedFrom) {
      return null;
    }

    return {
      isForwarded: true,
      originalSender: message.forwardedFrom.originalSenderName,
      originalChatName: message.forwardedFrom.originalChatName,
      forwardedBy: message.forwardedFrom.forwardedByName,
      forwardedAt: message.forwardedFrom.forwardedAt,
      originalMessageId: message.forwardedFrom.messageId
    };
  }, []);

  /**
   * Clear any forwarding errors
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isForwarding,
    error,
    
    // Actions
    forwardMessage,
    forwardMultipleMessages,
    canForwardMessage,
    getForwardingMetadata,
    clearError
  };
};

export default useMessageForwarding;