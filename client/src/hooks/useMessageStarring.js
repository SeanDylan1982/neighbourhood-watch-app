import { useState, useCallback, useContext } from 'react';
import { ChatContext } from '../contexts/ChatContext';
import { MessageContext } from '../contexts/MessageContext';
import { 
  MESSAGE_ACTIONS, 
  SOCKET_EVENTS, 
  API_ENDPOINTS, 
  SUCCESS_MESSAGES,
  ERROR_MESSAGES 
} from '../constants/chat';

/**
 * Custom hook for managing message starring and pinning functionality
 * 
 * Features:
 * - Star/unstar messages for personal reference
 * - Pin/unpin messages in group chats
 * - Real-time synchronization via socket events
 * - Optimistic updates for immediate feedback
 * - Error handling and rollback on failure
 * 
 * @param {string} chatId - The ID of the current chat
 * @param {string} chatType - The type of chat ('group' or 'private')
 * @returns {Object} Hook interface with starring/pinning functions and state
 */
export const useMessageStarring = (chatId, chatType) => {
  const { socket, showToast } = useContext(ChatContext);
  const { updateMessage, getMessageById } = useContext(MessageContext);
  
  const [starredMessages, setStarredMessages] = useState(new Set());
  const [pinnedMessages, setPinnedMessages] = useState(new Set());
  const [loading, setLoading] = useState(false);

  /**
   * Toggle star status of a message
   * @param {string} messageId - ID of the message to star/unstar
   * @param {boolean} isStarred - Current star status
   */
  const toggleStar = useCallback(async (messageId, isStarred = false) => {
    if (!messageId || loading) return;

    const action = isStarred ? MESSAGE_ACTIONS.UNSTAR : MESSAGE_ACTIONS.STAR;
    const previousState = new Set(starredMessages);

    try {
      setLoading(true);

      // Optimistic update
      if (isStarred) {
        setStarredMessages(prev => {
          const newSet = new Set(prev);
          newSet.delete(messageId);
          return newSet;
        });
      } else {
        setStarredMessages(prev => new Set(prev).add(messageId));
      }

      // Update message in context
      updateMessage(messageId, {
        isStarred: !isStarred,
        starredAt: !isStarred ? new Date() : null
      });

      // Send API request
      const response = await fetch(API_ENDPOINTS.MESSAGE_STAR(messageId), {
        method: isStarred ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} message`);
      }

      // Emit socket event for real-time sync
      const socketEvent = isStarred ? SOCKET_EVENTS.UNSTAR_MESSAGE : SOCKET_EVENTS.STAR_MESSAGE;
      socket?.emit(socketEvent, {
        messageId,
        chatId,
        chatType
      });

      // Show success message
      const successMessage = isStarred ? SUCCESS_MESSAGES.MESSAGE_UNSTARRED : SUCCESS_MESSAGES.MESSAGE_STARRED;
      showToast?.(successMessage, 'success');

    } catch (error) {
      console.error(`Error ${action}ing message:`, error);
      
      // Rollback optimistic update
      setStarredMessages(previousState);
      updateMessage(messageId, {
        isStarred: isStarred,
        starredAt: isStarred ? new Date() : null
      });

      showToast?.(ERROR_MESSAGES.SEND_MESSAGE_FAILED, 'error');
    } finally {
      setLoading(false);
    }
  }, [messageId, chatId, chatType, socket, updateMessage, showToast, starredMessages, loading]);

  /**
   * Toggle pin status of a message (group chats only)
   * @param {string} messageId - ID of the message to pin/unpin
   * @param {boolean} isPinned - Current pin status
   */
  const togglePin = useCallback(async (messageId, isPinned = false) => {
    if (!messageId || loading || chatType !== 'group') return;

    const action = isPinned ? MESSAGE_ACTIONS.UNPIN : MESSAGE_ACTIONS.PIN;
    const previousState = new Set(pinnedMessages);

    try {
      setLoading(true);

      // Optimistic update
      if (isPinned) {
        setPinnedMessages(prev => {
          const newSet = new Set(prev);
          newSet.delete(messageId);
          return newSet;
        });
      } else {
        setPinnedMessages(prev => new Set(prev).add(messageId));
      }

      // Update message in context
      updateMessage(messageId, {
        isPinned: !isPinned,
        pinnedAt: !isPinned ? new Date() : null
      });

      // Send API request
      const response = await fetch(API_ENDPOINTS.MESSAGE_PIN(messageId), {
        method: isPinned ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} message`);
      }

      // Emit socket event for real-time sync
      const socketEvent = isPinned ? SOCKET_EVENTS.UNPIN_MESSAGE : SOCKET_EVENTS.PIN_MESSAGE;
      socket?.emit(socketEvent, {
        messageId,
        chatId,
        chatType
      });

      // Show success message
      const successMessage = isPinned ? SUCCESS_MESSAGES.MESSAGE_UNPINNED : SUCCESS_MESSAGES.MESSAGE_PINNED;
      showToast?.(successMessage, 'success');

    } catch (error) {
      console.error(`Error ${action}ing message:`, error);
      
      // Rollback optimistic update
      setPinnedMessages(previousState);
      updateMessage(messageId, {
        isPinned: isPinned,
        pinnedAt: isPinned ? new Date() : null
      });

      showToast?.(ERROR_MESSAGES.SEND_MESSAGE_FAILED, 'error');
    } finally {
      setLoading(false);
    }
  }, [messageId, chatId, chatType, socket, updateMessage, showToast, pinnedMessages, loading]);

  /**
   * Get all starred messages for the current chat
   * @returns {Promise<Array>} Array of starred messages
   */
  const getStarredMessages = useCallback(async () => {
    if (!chatId) return [];

    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.STARRED_MESSAGES(chatId), {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch starred messages');
      }

      const data = await response.json();
      const messageIds = new Set(data.messages?.map(msg => msg.id) || []);
      setStarredMessages(messageIds);
      
      return data.messages || [];
    } catch (error) {
      console.error('Error fetching starred messages:', error);
      showToast?.(ERROR_MESSAGES.LOAD_MESSAGES_FAILED, 'error');
      return [];
    } finally {
      setLoading(false);
    }
  }, [chatId, showToast]);

  /**
   * Get all pinned messages for the current group chat
   * @returns {Promise<Array>} Array of pinned messages
   */
  const getPinnedMessages = useCallback(async () => {
    if (!chatId || chatType !== 'group') return [];

    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.PINNED_MESSAGES(chatId), {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pinned messages');
      }

      const data = await response.json();
      const messageIds = new Set(data.messages?.map(msg => msg.id) || []);
      setPinnedMessages(messageIds);
      
      return data.messages || [];
    } catch (error) {
      console.error('Error fetching pinned messages:', error);
      showToast?.(ERROR_MESSAGES.LOAD_MESSAGES_FAILED, 'error');
      return [];
    } finally {
      setLoading(false);
    }
  }, [chatId, chatType, showToast]);

  /**
   * Check if a message is starred
   * @param {string} messageId - ID of the message to check
   * @returns {boolean} Whether the message is starred
   */
  const isMessageStarred = useCallback((messageId) => {
    return starredMessages.has(messageId);
  }, [starredMessages]);

  /**
   * Check if a message is pinned
   * @param {string} messageId - ID of the message to check
   * @returns {boolean} Whether the message is pinned
   */
  const isMessagePinned = useCallback((messageId) => {
    return pinnedMessages.has(messageId);
  }, [pinnedMessages]);

  /**
   * Clear all starred messages for the current user
   */
  const clearStarredMessages = useCallback(async () => {
    if (!chatId) return;

    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.STARRED_MESSAGES(chatId), {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to clear starred messages');
      }

      setStarredMessages(new Set());
      showToast?.('All starred messages cleared', 'success');
    } catch (error) {
      console.error('Error clearing starred messages:', error);
      showToast?.(ERROR_MESSAGES.SEND_MESSAGE_FAILED, 'error');
    } finally {
      setLoading(false);
    }
  }, [chatId, showToast]);

  return {
    // State
    starredMessages: Array.from(starredMessages),
    pinnedMessages: Array.from(pinnedMessages),
    loading,
    
    // Actions
    toggleStar,
    togglePin,
    getStarredMessages,
    getPinnedMessages,
    clearStarredMessages,
    
    // Utilities
    isMessageStarred,
    isMessagePinned
  };
};

export default useMessageStarring;