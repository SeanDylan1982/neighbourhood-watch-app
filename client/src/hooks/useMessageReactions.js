import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * useMessageReactions Hook
 * 
 * Manages message reactions state and functionality.
 * Handles reaction addition/removal, optimistic updates, and real-time synchronization.
 * 
 * Features:
 * - Reaction state management
 * - Optimistic updates for immediate feedback
 * - Real-time reaction synchronization
 * - Reaction validation and error handling
 * - User reaction tracking
 * - Reaction analytics and metrics
 */
const useMessageReactions = (messageId, initialReactions = [], currentUserId) => {
  const [reactions, setReactions] = useState(initialReactions);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const optimisticUpdatesRef = useRef(new Map());
  const pendingRequestsRef = useRef(new Set());

  // Update reactions when initial reactions change
  useEffect(() => {
    setReactions(initialReactions);
  }, [initialReactions]);

  // Add or remove a reaction
  const toggleReaction = useCallback(async (reactionType, onReactionToggle) => {
    if (!messageId || !reactionType || !currentUserId) return;

    const requestId = `${messageId}-${reactionType}-${Date.now()}`;
    
    // Prevent duplicate requests
    if (pendingRequestsRef.current.has(`${messageId}-${reactionType}`)) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      pendingRequestsRef.current.add(`${messageId}-${reactionType}`);

      // Optimistic update
      const optimisticReactions = applyOptimisticUpdate(reactions, reactionType, currentUserId);
      setReactions(optimisticReactions);
      optimisticUpdatesRef.current.set(requestId, { reactionType, previousReactions: reactions });

      // Call the API
      const result = await onReactionToggle?.(messageId, reactionType);
      
      // Update with server response
      if (result && result.reactions) {
        setReactions(result.reactions);
      }

      // Clear optimistic update
      optimisticUpdatesRef.current.delete(requestId);

    } catch (err) {
      console.error('Failed to toggle reaction:', err);
      setError(err.message || 'Failed to update reaction');
      
      // Revert optimistic update on error
      const optimisticUpdate = optimisticUpdatesRef.current.get(requestId);
      if (optimisticUpdate) {
        setReactions(optimisticUpdate.previousReactions);
        optimisticUpdatesRef.current.delete(requestId);
      }
    } finally {
      setIsLoading(false);
      pendingRequestsRef.current.delete(`${messageId}-${reactionType}`);
    }
  }, [messageId, currentUserId, reactions]);

  // Apply optimistic update to reactions
  const applyOptimisticUpdate = useCallback((currentReactions, reactionType, userId) => {
    const updatedReactions = [...currentReactions];
    const existingReactionIndex = updatedReactions.findIndex(r => r.type === reactionType);

    if (existingReactionIndex >= 0) {
      const existingReaction = updatedReactions[existingReactionIndex];
      const userIndex = existingReaction.users.indexOf(userId);

      if (userIndex >= 0) {
        // Remove user's reaction
        const updatedUsers = existingReaction.users.filter(id => id !== userId);
        if (updatedUsers.length === 0) {
          // Remove reaction entirely if no users left
          updatedReactions.splice(existingReactionIndex, 1);
        } else {
          updatedReactions[existingReactionIndex] = {
            ...existingReaction,
            users: updatedUsers,
            count: updatedUsers.length
          };
        }
      } else {
        // Add user's reaction
        updatedReactions[existingReactionIndex] = {
          ...existingReaction,
          users: [...existingReaction.users, userId],
          count: existingReaction.count + 1
        };
      }
    } else {
      // Add new reaction
      updatedReactions.push({
        type: reactionType,
        users: [userId],
        count: 1,
        createdAt: new Date()
      });
    }

    return updatedReactions;
  }, []);

  // Check if current user has reacted with a specific type
  const hasUserReacted = useCallback((reactionType) => {
    if (!currentUserId) return false;
    
    const reaction = reactions.find(r => r.type === reactionType);
    return reaction?.users?.includes(currentUserId) || false;
  }, [reactions, currentUserId]);

  // Get reaction count for a specific type
  const getReactionCount = useCallback((reactionType) => {
    const reaction = reactions.find(r => r.type === reactionType);
    return reaction?.count || 0;
  }, [reactions]);

  // Get users who reacted with a specific type
  const getReactionUsers = useCallback((reactionType) => {
    const reaction = reactions.find(r => r.type === reactionType);
    return reaction?.users || [];
  }, [reactions]);

  // Get total reaction count across all types
  const getTotalReactionCount = useCallback(() => {
    return reactions.reduce((total, reaction) => total + reaction.count, 0);
  }, [reactions]);

  // Get most popular reaction type
  const getMostPopularReaction = useCallback(() => {
    if (reactions.length === 0) return null;
    
    return reactions.reduce((mostPopular, current) => 
      current.count > mostPopular.count ? current : mostPopular
    );
  }, [reactions]);

  // Get user's reactions
  const getUserReactions = useCallback(() => {
    if (!currentUserId) return [];
    
    return reactions.filter(reaction => 
      reaction.users?.includes(currentUserId)
    ).map(reaction => reaction.type);
  }, [reactions, currentUserId]);

  // Update reactions from external source (e.g., real-time updates)
  const updateReactions = useCallback((newReactions) => {
    // Only update if not currently loading to avoid conflicts with optimistic updates
    if (!isLoading) {
      setReactions(newReactions);
    }
  }, [isLoading]);

  // Clear all reactions (admin function)
  const clearAllReactions = useCallback(async (onClearReactions) => {
    if (!messageId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Optimistic update
      const previousReactions = reactions;
      setReactions([]);

      // Call the API
      await onClearReactions?.(messageId);

    } catch (err) {
      console.error('Failed to clear reactions:', err);
      setError(err.message || 'Failed to clear reactions');
      
      // Revert on error
      setReactions(previousReactions);
    } finally {
      setIsLoading(false);
    }
  }, [messageId, reactions]);

  // Get reaction statistics
  const getReactionStats = useCallback(() => {
    const totalCount = getTotalReactionCount();
    const uniqueUsers = new Set();
    
    reactions.forEach(reaction => {
      reaction.users?.forEach(userId => uniqueUsers.add(userId));
    });

    return {
      totalReactions: totalCount,
      uniqueUsers: uniqueUsers.size,
      reactionTypes: reactions.length,
      mostPopular: getMostPopularReaction(),
      userReactions: getUserReactions()
    };
  }, [reactions, getTotalReactionCount, getMostPopularReaction, getUserReactions]);

  // Validate reaction data
  const validateReactions = useCallback(() => {
    const issues = [];

    reactions.forEach((reaction, index) => {
      if (!reaction.type) {
        issues.push(`Reaction at index ${index} missing type`);
      }
      
      if (!Array.isArray(reaction.users)) {
        issues.push(`Reaction ${reaction.type} has invalid users array`);
      }
      
      if (typeof reaction.count !== 'number' || reaction.count < 0) {
        issues.push(`Reaction ${reaction.type} has invalid count`);
      }
      
      if (reaction.users && reaction.count !== reaction.users.length) {
        issues.push(`Reaction ${reaction.type} count mismatch with users array`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues
    };
  }, [reactions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      optimisticUpdatesRef.current.clear();
      pendingRequestsRef.current.clear();
    };
  }, []);

  return {
    // State
    reactions,
    isLoading,
    error,
    
    // Actions
    toggleReaction,
    updateReactions,
    clearAllReactions,
    
    // Queries
    hasUserReacted,
    getReactionCount,
    getReactionUsers,
    getTotalReactionCount,
    getMostPopularReaction,
    getUserReactions,
    getReactionStats,
    
    // Validation
    validateReactions
  };
};

export default useMessageReactions;