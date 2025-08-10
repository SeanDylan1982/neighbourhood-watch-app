import { useState, useCallback } from 'react';
import { useChat } from './useChat';

/**
 * Hook for managing content and user reporting functionality
 */
export const useReporting = (currentUserId) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { socket } = useChat();

  // Report a message
  const reportMessage = useCallback(async (messageId, chatId, reason, description = '') => {
    if (!currentUserId || !messageId || !chatId || !reason) {
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/reports/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          messageId,
          chatId,
          reason,
          description,
          reportedBy: currentUserId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to report message');
      }

      const data = await response.json();

      // Emit socket event for real-time moderation
      if (socket) {
        socket.emit('message_reported', {
          reportId: data.reportId,
          messageId,
          chatId,
          reason,
          reportedBy: currentUserId,
        });
      }

      return true;
    } catch (err) {
      console.error('Failed to report message:', err);
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, socket]);

  // Report a user
  const reportUser = useCallback(async (reportedUserId, reason, description = '', evidence = []) => {
    if (!currentUserId || !reportedUserId || !reason || reportedUserId === currentUserId) {
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/reports/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          reportedUserId,
          reason,
          description,
          evidence, // Array of message IDs or other evidence
          reportedBy: currentUserId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to report user');
      }

      const data = await response.json();

      // Emit socket event for real-time moderation
      if (socket) {
        socket.emit('user_reported', {
          reportId: data.reportId,
          reportedUserId,
          reason,
          reportedBy: currentUserId,
        });
      }

      return true;
    } catch (err) {
      console.error('Failed to report user:', err);
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, socket]);

  // Get user's report history
  const getUserReports = useCallback(async () => {
    if (!currentUserId) return [];

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/reports/user/${currentUserId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load reports');
      }

      const data = await response.json();
      return data.reports || [];
    } catch (err) {
      console.error('Failed to load user reports:', err);
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  // Check if user has already reported a message
  const hasReportedMessage = useCallback(async (messageId) => {
    if (!currentUserId || !messageId) return false;

    try {
      const response = await fetch(`/api/reports/message/${messageId}/check`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.hasReported || false;
    } catch (err) {
      console.error('Failed to check report status:', err);
      return false;
    }
  }, [currentUserId]);

  // Check if user has already reported another user
  const hasReportedUser = useCallback(async (reportedUserId) => {
    if (!currentUserId || !reportedUserId) return false;

    try {
      const response = await fetch(`/api/reports/user/${reportedUserId}/check`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.hasReported || false;
    } catch (err) {
      console.error('Failed to check user report status:', err);
      return false;
    }
  }, [currentUserId]);

  return {
    isLoading,
    error,
    reportMessage,
    reportUser,
    getUserReports,
    hasReportedMessage,
    hasReportedUser,
  };
};

export default useReporting;