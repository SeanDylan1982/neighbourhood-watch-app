import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';

/**
 * Hook for managing real-time reaction updates
 * Handles socket-based reaction synchronization with optimistic updates
 */
const useRealtimeReactions = (chatId, chatType = 'group') => {
  const [reactions, setReactions] = useState({});
  const [pendingReactions, setPendingReactions] = useState({});
  const socketContext = useSocket();
  const socket = socketContext?.socket;
  const animationTimeouts = useRef({});

  // Add reaction with optimistic update
  const addReaction = useCallback((messageId, reactionType, userId, userName) => {
    if (!socket || !chatId) return;

    // Optimistic update
    const optimisticUpdate = {
      messageId,
      reactionType,
      userId,
      userName,
      timestamp: new Date(),
      isOptimistic: true
    };

    // Add to pending reactions for tracking
    setPendingReactions(prev => ({
      ...prev,
      [`${messageId}-${reactionType}-${userId}`]: optimisticUpdate
    }));

    // Update reactions immediately for UI feedback
    setReactions(prev => {
      const messageReactions = prev[messageId] || {};
      const existingReaction = messageReactions[reactionType] || { users: [], count: 0 };
      
      // Check if user already reacted with this type
      const userIndex = existingReaction.users.findIndex(u => u.id === userId);
      
      if (userIndex > -1) {
        // Remove reaction
        const updatedUsers = existingReaction.users.filter(u => u.id !== userId);
        const updatedReaction = {
          ...existingReaction,
          users: updatedUsers,
          count: Math.max(0, existingReaction.count - 1)
        };

        const updatedMessageReactions = { ...messageReactions };
        if (updatedReaction.count === 0) {
          delete updatedMessageReactions[reactionType];
        } else {
          updatedMessageReactions[reactionType] = updatedReaction;
        }

        return {
          ...prev,
          [messageId]: updatedMessageReactions
        };
      } else {
        // Add reaction
        const updatedReaction = {
          ...existingReaction,
          users: [...existingReaction.users, { id: userId, name: userName }],
          count: existingReaction.count + 1,
          lastUpdated: new Date()
        };

        return {
          ...prev,
          [messageId]: {
            ...messageReactions,
            [reactionType]: updatedReaction
          }
        };
      }
    });

    // Emit to server
    socket.emit('react_to_message', {
      messageId,
      reactionType
    });

    // Trigger animation
    triggerReactionAnimation(messageId, reactionType);
  }, [socket, chatId]);

  // Remove reaction
  const removeReaction = useCallback((messageId, reactionType, userId) => {
    if (!socket || !chatId) return;

    // Optimistic update
    setReactions(prev => {
      const messageReactions = prev[messageId] || {};
      const existingReaction = messageReactions[reactionType];
      
      if (!existingReaction) return prev;

      const updatedUsers = existingReaction.users.filter(u => u.id !== userId);
      const updatedReaction = {
        ...existingReaction,
        users: updatedUsers,
        count: Math.max(0, existingReaction.count - 1)
      };

      const updatedMessageReactions = { ...messageReactions };
      if (updatedReaction.count === 0) {
        delete updatedMessageReactions[reactionType];
      } else {
        updatedMessageReactions[reactionType] = updatedReaction;
      }

      return {
        ...prev,
        [messageId]: updatedMessageReactions
      };
    });

    // Emit to server
    socket.emit('react_to_message', {
      messageId,
      reactionType
    });
  }, [socket, chatId]);

  // Trigger reaction animation
  const triggerReactionAnimation = useCallback((messageId, reactionType) => {
    const animationKey = `${messageId}-${reactionType}`;
    
    // Clear existing timeout
    if (animationTimeouts.current[animationKey]) {
      clearTimeout(animationTimeouts.current[animationKey]);
    }

    // Set animation state
    setReactions(prev => ({
      ...prev,
      [`${messageId}_animation`]: {
        ...prev[`${messageId}_animation`],
        [reactionType]: true
      }
    }));

    // Clear animation after delay
    animationTimeouts.current[animationKey] = setTimeout(() => {
      setReactions(prev => ({
        ...prev,
        [`${messageId}_animation`]: {
          ...prev[`${messageId}_animation`],
          [reactionType]: false
        }
      }));
      delete animationTimeouts.current[animationKey];
    }, 1000);
  }, []);

  // Get reactions for a message
  const getMessageReactions = useCallback((messageId) => {
    return reactions[messageId] || {};
  }, [reactions]);

  // Get animation state for a reaction
  const getReactionAnimation = useCallback((messageId, reactionType) => {
    const animationState = reactions[`${messageId}_animation`];
    return animationState?.[reactionType] || false;
  }, [reactions]);

  // Check if user has reacted with specific type
  const hasUserReacted = useCallback((messageId, reactionType, userId) => {
    const messageReactions = reactions[messageId] || {};
    const reaction = messageReactions[reactionType];
    return reaction?.users.some(u => u.id === userId) || false;
  }, [reactions]);

  // Get total reaction count for a message
  const getTotalReactionCount = useCallback((messageId) => {
    const messageReactions = reactions[messageId] || {};
    return Object.values(messageReactions).reduce((total, reaction) => total + reaction.count, 0);
  }, [reactions]);

  // Update reactions from server response
  const updateReactionsFromServer = useCallback((messageId, serverReactions) => {
    // Remove pending reactions for this message
    setPendingReactions(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        if (key.startsWith(`${messageId}-`)) {
          delete updated[key];
        }
      });
      return updated;
    });

    // Update with server data
    setReactions(prev => ({
      ...prev,
      [messageId]: serverReactions.reduce((acc, reaction) => ({
        ...acc,
        [reaction.type]: {
          users: reaction.users.map(userId => ({ id: userId, name: '' })), // Names will be populated by server
          count: reaction.count,
          lastUpdated: new Date()
        }
      }), {})
    }));
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleReactionUpdate = (data) => {
      const { messageId, reactions: serverReactions, chatId: messageChatId } = data;
      
      // Only update if it's for the current chat
      if (messageChatId === chatId) {
        updateReactionsFromServer(messageId, serverReactions);
        
        // Trigger animation for new reactions
        serverReactions.forEach(reaction => {
          triggerReactionAnimation(messageId, reaction.type);
        });
      }
    };

    const handleNewReaction = (data) => {
      const { messageId, reactionType, userId, userName, chatId: messageChatId } = data;
      
      // Only update if it's for the current chat and not from current user
      if (messageChatId === chatId) {
        // Update reactions
        setReactions(prev => {
          const messageReactions = prev[messageId] || {};
          const existingReaction = messageReactions[reactionType] || { users: [], count: 0 };
          
          // Check if user already in the list
          const userExists = existingReaction.users.some(u => u.id === userId);
          if (userExists) return prev;

          const updatedReaction = {
            ...existingReaction,
            users: [...existingReaction.users, { id: userId, name: userName }],
            count: existingReaction.count + 1,
            lastUpdated: new Date()
          };

          return {
            ...prev,
            [messageId]: {
              ...messageReactions,
              [reactionType]: updatedReaction
            }
          };
        });

        // Trigger animation
        triggerReactionAnimation(messageId, reactionType);
      }
    };

    const handleReactionRemoved = (data) => {
      const { messageId, reactionType, userId, chatId: messageChatId } = data;
      
      // Only update if it's for the current chat
      if (messageChatId === chatId) {
        setReactions(prev => {
          const messageReactions = prev[messageId] || {};
          const existingReaction = messageReactions[reactionType];
          
          if (!existingReaction) return prev;

          const updatedUsers = existingReaction.users.filter(u => u.id !== userId);
          const updatedReaction = {
            ...existingReaction,
            users: updatedUsers,
            count: Math.max(0, existingReaction.count - 1)
          };

          const updatedMessageReactions = { ...messageReactions };
          if (updatedReaction.count === 0) {
            delete updatedMessageReactions[reactionType];
          } else {
            updatedMessageReactions[reactionType] = updatedReaction;
          }

          return {
            ...prev,
            [messageId]: updatedMessageReactions
          };
        });
      }
    };

    // Listen for reaction events
    socket.on('message_reaction_updated', handleReactionUpdate);
    socket.on('reaction_added', handleNewReaction);
    socket.on('reaction_removed', handleReactionRemoved);

    return () => {
      socket.off('message_reaction_updated', handleReactionUpdate);
      socket.off('reaction_added', handleNewReaction);
      socket.off('reaction_removed', handleReactionRemoved);
    };
  }, [socket, chatId, updateReactionsFromServer, triggerReactionAnimation]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(animationTimeouts.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, []);

  // Clear reactions when chat changes
  useEffect(() => {
    setReactions({});
    setPendingReactions({});
  }, [chatId]);

  return {
    reactions,
    pendingReactions,
    addReaction,
    removeReaction,
    getMessageReactions,
    getReactionAnimation,
    hasUserReacted,
    getTotalReactionCount,
    updateReactionsFromServer,
    triggerReactionAnimation
  };
};

export default useRealtimeReactions;