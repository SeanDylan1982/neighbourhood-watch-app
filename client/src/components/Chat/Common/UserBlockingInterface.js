import React, { useState } from 'react';
import useUserBlocking from '../../../hooks/useUserBlocking';
import './UserBlockingInterface.css';

/**
 * Component for managing blocked users
 */
const UserBlockingInterface = ({ currentUserId, onClose }) => {
  const {
    blockedUsers,
    isLoading,
    error,
    unblockUser,
    refreshBlockedUsers,
  } = useUserBlocking(currentUserId);

  const [unblockingUserId, setUnblockingUserId] = useState(null);

  const handleUnblockUser = async (userId) => {
    setUnblockingUserId(userId);
    
    try {
      const success = await unblockUser(userId);
      if (success) {
        // Refresh the list to ensure consistency
        await refreshBlockedUsers();
      }
    } catch (err) {
      console.error('Failed to unblock user:', err);
    } finally {
      setUnblockingUserId(null);
    }
  };

  return (
    <div className="user-blocking-interface">
      <div className="user-blocking-interface__header">
        <h3>Blocked Users</h3>
        <button 
          className="user-blocking-interface__close"
          onClick={onClose}
          aria-label="Close blocked users interface"
        >
          ✕
        </button>
      </div>

      <div className="user-blocking-interface__content">
        {error && (
          <div className="user-blocking-interface__error">
            <span className="user-blocking-interface__error-icon">⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {isLoading && blockedUsers.length === 0 ? (
          <div className="user-blocking-interface__loading">
            <div className="user-blocking-interface__spinner"></div>
            <p>Loading blocked users...</p>
          </div>
        ) : blockedUsers.length === 0 ? (
          <div className="user-blocking-interface__empty">
            <div className="user-blocking-interface__empty-icon">👥</div>
            <h4>No blocked users</h4>
            <p>You haven't blocked any users yet. Blocked users won't be able to send you messages.</p>
          </div>
        ) : (
          <div className="user-blocking-interface__list">
            <div className="user-blocking-interface__list-header">
              <p>You have blocked {blockedUsers.length} user{blockedUsers.length !== 1 ? 's' : ''}:</p>
            </div>
            
            {blockedUsers.map(userId => (
              <BlockedUserItem
                key={userId}
                userId={userId}
                onUnblock={handleUnblockUser}
                isUnblocking={unblockingUserId === userId}
              />
            ))}
          </div>
        )}

        <div className="user-blocking-interface__info">
          <h4>About blocking:</h4>
          <ul>
            <li>Blocked users cannot send you private messages</li>
            <li>You won't see messages from blocked users in group chats</li>
            <li>Blocked users won't know they've been blocked</li>
            <li>You can unblock users at any time</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

/**
 * Individual blocked user item component
 */
const BlockedUserItem = ({ userId, onUnblock, isUnblocking }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);

  // Load user info
  React.useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUserInfo(data.user);
        }
      } catch (err) {
        console.error('Failed to load user info:', err);
      } finally {
        setIsLoadingInfo(false);
      }
    };

    loadUserInfo();
  }, [userId]);

  const handleUnblock = () => {
    if (window.confirm(`Are you sure you want to unblock ${userInfo?.name || 'this user'}?`)) {
      onUnblock(userId);
    }
  };

  return (
    <div className="blocked-user-item">
      <div className="blocked-user-item__info">
        <div className="blocked-user-item__avatar">
          {isLoadingInfo ? (
            <div className="blocked-user-item__avatar-loading"></div>
          ) : userInfo?.avatar ? (
            <img 
              src={userInfo.avatar} 
              alt={userInfo.name}
              className="blocked-user-item__avatar-image"
            />
          ) : (
            <div className="blocked-user-item__avatar-placeholder">
              {userInfo?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
        </div>
        
        <div className="blocked-user-item__details">
          <div className="blocked-user-item__name">
            {isLoadingInfo ? 'Loading...' : userInfo?.name || 'Unknown User'}
          </div>
          <div className="blocked-user-item__id">
            ID: {userId}
          </div>
        </div>
      </div>

      <button
        className="blocked-user-item__unblock"
        onClick={handleUnblock}
        disabled={isUnblocking}
      >
        {isUnblocking ? 'Unblocking...' : 'Unblock'}
      </button>
    </div>
  );
};

export default UserBlockingInterface;