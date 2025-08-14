import { useState, useCallback, useRef } from 'react';
import { useApi } from './useApi';

/**
 * Custom hook for managing group members data with caching and error handling
 */
export const useGroupMembers = () => {
  const [groupMembers, setGroupMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberError, setMemberError] = useState(null);
  const [memberCache, setMemberCache] = useState({});
  const { get } = useApi();
  const loadingTimeoutRef = useRef(null);

  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;

  /**
   * Fetch group members with caching and error handling
   */
  const fetchGroupMembers = useCallback(
    async (groupId) => {
      if (!groupId) {
        console.log('useGroupMembers: No groupId provided');
        setGroupMembers([]);
        return;
      }

      // Check cache first
      const cachedData = memberCache[groupId];
      if (cachedData && cachedData.timestamp > Date.now() - CACHE_DURATION) {
        console.log('useGroupMembers: Using cached data for group:', groupId);
        setGroupMembers(cachedData.members);
        setMemberError(null);
        return cachedData.members;
      }

      setLoadingMembers(true);
      setMemberError(null);
      console.log('useGroupMembers: Fetching members for group:', groupId);

      // Clear any existing timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      // Set timeout to prevent stuck loading state
      loadingTimeoutRef.current = setTimeout(() => {
        console.warn('useGroupMembers: Loading timeout for group:', groupId);
        setLoadingMembers(false);
        setMemberError('Loading timeout - please try again');
      }, 10000);

      try {
        const response = await get(`/api/chat/groups/${groupId}/members`);
        
        // Validate response
        if (!Array.isArray(response)) {
          throw new Error('Invalid response format - expected array');
        }

        // Validate each member has required fields
        const validMembers = response.filter(member => {
          const isValid = member && 
                         member._id && 
                         (member.firstName || member.lastName);
          
          if (!isValid) {
            console.warn('useGroupMembers: Invalid member data:', member);
          }
          
          return isValid;
        });

        // Enhance member data for frontend use
        const enhancedMembers = validMembers.map(member => ({
          ...member,
          id: member._id, // Ensure both _id and id are available
          fullName: `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown User',
          displayName: `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown User',
          initials: getInitials(member.firstName, member.lastName),
          hasProfileImage: !!member.profileImageUrl
        }));

        console.log('useGroupMembers: Successfully fetched members:', enhancedMembers.length);

        // Cache the result
        setMemberCache(prev => ({
          ...prev,
          [groupId]: {
            members: enhancedMembers,
            timestamp: Date.now()
          }
        }));

        setGroupMembers(enhancedMembers);
        setMemberError(null);
        
        return enhancedMembers;
      } catch (error) {
        console.error('useGroupMembers: Error fetching members:', error);
        
        // Set appropriate error message based on error type
        let errorMessage = 'Failed to load group members';
        if (error.response?.status === 403) {
          errorMessage = 'Access denied - not a member of this group';
        } else if (error.response?.status === 404) {
          errorMessage = 'Group not found';
        } else if (error.response?.status >= 500) {
          errorMessage = 'Server error - please try again later';
        } else if (error.message?.includes('Network Error')) {
          errorMessage = 'Network error - please check your connection';
        }
        
        setMemberError(errorMessage);
        setGroupMembers([]);
        
        // Don't clear cache on error - keep last known good data
        const cachedData = memberCache[groupId];
        if (cachedData) {
          console.log('useGroupMembers: Using stale cached data due to error');
          setGroupMembers(cachedData.members);
        }
        
        return [];
      } finally {
        setLoadingMembers(false);
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
      }
    },
    [get, memberCache]
  );

  /**
   * Clear cache for a specific group
   */
  const clearGroupMemberCache = useCallback((groupId) => {
    if (groupId) {
      setMemberCache(prev => {
        const newCache = { ...prev };
        delete newCache[groupId];
        return newCache;
      });
    }
  }, []);

  /**
   * Clear all member cache
   */
  const clearAllMemberCache = useCallback(() => {
    setMemberCache({});
  }, []);

  /**
   * Refresh members for a specific group (bypass cache)
   */
  const refreshGroupMembers = useCallback(
    async (groupId) => {
      if (groupId) {
        clearGroupMemberCache(groupId);
        return await fetchGroupMembers(groupId);
      }
    },
    [fetchGroupMembers, clearGroupMemberCache]
  );

  /**
   * Get member by ID from current group members
   */
  const getMemberById = useCallback(
    (memberId) => {
      return groupMembers.find(member => 
        member._id === memberId || member.id === memberId
      );
    },
    [groupMembers]
  );

  /**
   * Check if a user is a member of the current group
   */
  const isMember = useCallback(
    (userId) => {
      return groupMembers.some(member => 
        member._id === userId || member.id === userId
      );
    },
    [groupMembers]
  );

  return {
    // State
    groupMembers,
    loadingMembers,
    memberError,
    
    // Actions
    fetchGroupMembers,
    refreshGroupMembers,
    clearGroupMemberCache,
    clearAllMemberCache,
    
    // Utilities
    getMemberById,
    isMember,
    
    // Computed values
    memberCount: groupMembers.length,
    hasMembers: groupMembers.length > 0
  };
};

/**
 * Helper function to get user initials
 */
function getInitials(firstName, lastName) {
  const first = (firstName || '').trim();
  const last = (lastName || '').trim();
  
  if (first && last) {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  } else if (first) {
    return first.charAt(0).toUpperCase();
  } else if (last) {
    return last.charAt(0).toUpperCase();
  }
  
  return '?';
}

export default useGroupMembers;