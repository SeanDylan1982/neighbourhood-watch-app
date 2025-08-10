import { useState, useEffect, useCallback } from 'react';
import { useChat } from './useChat';

/**
 * Hook for managing auto-delete functionality for messages
 */
export const useAutoDelete = (chatId, currentUserId) => {
  const [autoDeleteSettings, setAutoDeleteSettings] = useState({
    enabled: false,
    period: 24, // hours
    applyToExisting: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { socket } = useChat();

  // Auto-delete period options (in hours)
  const AUTO_DELETE_PERIODS = [
    { value: 1, label: '1 hour' },
    { value: 24, label: '24 hours' },
    { value: 168, label: '7 days' },
    { value: 720, label: '30 days' },
    { value: 8760, label: '1 year' },
  ];

  // Load auto-delete settings on mount
  useEffect(() => {
    if (chatId) {
      loadAutoDeleteSettings();
    }
  }, [chatId]);

  // Load auto-delete settings from server
  const loadAutoDeleteSettings = useCallback(async () => {
    if (!chatId || !currentUserId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/chats/${chatId}/auto-delete`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load auto-delete settings');
      }

      const data = await response.json();
      setAutoDeleteSettings(data.settings || {
        enabled: false,
        period: 24,
        applyToExisting: false,
      });
    } catch (err) {
      console.error('Failed to load auto-delete settings:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [chatId, currentUserId]);

  // Update auto-delete settings
  const updateAutoDeleteSettings = useCallback(async (newSettings) => {
    if (!chatId || !currentUserId) return false;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/chats/${chatId}/auto-delete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          settings: newSettings,
          updatedBy: currentUserId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update auto-delete settings');
      }

      const data = await response.json();
      setAutoDeleteSettings(data.settings);

      // Emit socket event to notify other participants
      if (socket) {
        socket.emit('auto_delete_settings_updated', {
          chatId,
          settings: data.settings,
          updatedBy: currentUserId,
        });
      }

      return true;
    } catch (err) {
      console.error('Failed to update auto-delete settings:', err);
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [chatId, currentUserId, socket]);

  // Enable auto-delete
  const enableAutoDelete = useCallback(async (period, applyToExisting = false) => {
    const newSettings = {
      enabled: true,
      period,
      applyToExisting,
      enabledAt: new Date().toISOString(),
      enabledBy: currentUserId,
    };

    return await updateAutoDeleteSettings(newSettings);
  }, [updateAutoDeleteSettings, currentUserId]);

  // Disable auto-delete
  const disableAutoDelete = useCallback(async () => {
    const newSettings = {
      ...autoDeleteSettings,
      enabled: false,
      disabledAt: new Date().toISOString(),
      disabledBy: currentUserId,
    };

    return await updateAutoDeleteSettings(newSettings);
  }, [updateAutoDeleteSettings, autoDeleteSettings, currentUserId]);

  // Calculate expiration time for a message
  const calculateExpirationTime = useCallback((messageTimestamp) => {
    if (!autoDeleteSettings.enabled) return null;

    const messageTime = new Date(messageTimestamp);
    const expirationTime = new Date(messageTime.getTime() + (autoDeleteSettings.period * 60 * 60 * 1000));
    
    return expirationTime;
  }, [autoDeleteSettings]);

  // Check if a message should be auto-deleted
  const shouldMessageBeDeleted = useCallback((message) => {
    if (!autoDeleteSettings.enabled) return false;

    const expirationTime = calculateExpirationTime(message.timestamp);
    if (!expirationTime) return false;

    return new Date() > expirationTime;
  }, [autoDeleteSettings, calculateExpirationTime]);

  // Get time remaining until message deletion
  const getTimeUntilDeletion = useCallback((messageTimestamp) => {
    if (!autoDeleteSettings.enabled) return null;

    const expirationTime = calculateExpirationTime(messageTimestamp);
    if (!expirationTime) return null;

    const now = new Date();
    const timeRemaining = expirationTime.getTime() - now.getTime();

    if (timeRemaining <= 0) return null;

    return timeRemaining;
  }, [autoDeleteSettings, calculateExpirationTime]);

  // Format time remaining for display
  const formatTimeRemaining = useCallback((timeRemaining) => {
    if (!timeRemaining) return null;

    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }, []);

  // Filter messages that should be auto-deleted (client-side cleanup)
  const filterExpiredMessages = useCallback((messages) => {
    if (!autoDeleteSettings.enabled) return messages;

    return messages.filter(message => !shouldMessageBeDeleted(message));
  }, [autoDeleteSettings, shouldMessageBeDeleted]);

  // Manually trigger cleanup for expired messages
  const cleanupExpiredMessages = useCallback(async () => {
    if (!chatId || !autoDeleteSettings.enabled) return false;

    try {
      const response = await fetch(`/api/chats/${chatId}/cleanup-expired`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to cleanup expired messages');
      }

      const data = await response.json();
      
      // Emit socket event if messages were deleted
      if (data.deletedCount > 0 && socket) {
        socket.emit('messages_auto_deleted', {
          chatId,
          deletedCount: data.deletedCount,
        });
      }

      return data.deletedCount > 0;
    } catch (err) {
      console.error('Failed to cleanup expired messages:', err);
      return false;
    }
  }, [chatId, autoDeleteSettings, socket]);

  // Get auto-delete status text
  const getStatusText = useCallback(() => {
    if (!autoDeleteSettings.enabled) {
      return 'Auto-delete is disabled';
    }

    const periodLabel = AUTO_DELETE_PERIODS.find(p => p.value === autoDeleteSettings.period)?.label || `${autoDeleteSettings.period} hours`;
    return `Messages auto-delete after ${periodLabel}`;
  }, [autoDeleteSettings]);

  return {
    autoDeleteSettings,
    isLoading,
    error,
    AUTO_DELETE_PERIODS,
    enableAutoDelete,
    disableAutoDelete,
    updateAutoDeleteSettings,
    calculateExpirationTime,
    shouldMessageBeDeleted,
    getTimeUntilDeletion,
    formatTimeRemaining,
    filterExpiredMessages,
    cleanupExpiredMessages,
    getStatusText,
    refreshSettings: loadAutoDeleteSettings,
  };
};

export default useAutoDelete;