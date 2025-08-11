import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

/**
 * Custom hook for managing terms and conditions acceptance
 * Provides functionality to check, accept, and track terms acceptance status
 */
const useTermsAcceptance = () => {
  const [termsStatus, setTermsStatus] = useState({
    noticeBoardTerms: { accepted: false, timestamp: null },
    reportTerms: { accepted: false, timestamp: null }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Get authorization headers for API requests
   */
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  }, []);

  /**
   * Fetch current terms acceptance status
   */
  const fetchTermsStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `${API_BASE_URL}/api/terms/status`,
        getAuthHeaders()
      );

      if (response.data.success) {
        setTermsStatus(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch terms status');
      }
    } catch (error) {
      console.error('Error fetching terms status:', error);
      setError(error.response?.data?.message || error.message || 'Failed to fetch terms status');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  /**
   * Check if user has accepted specific terms
   */
  const hasAcceptedTerms = useCallback(async (termsType) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/terms/check/${termsType}`,
        getAuthHeaders()
      );

      if (response.data.success) {
        return response.data.data.accepted;
      } else {
        throw new Error(response.data.message || 'Failed to check terms acceptance');
      }
    } catch (error) {
      console.error(`Error checking ${termsType} acceptance:`, error);
      throw error;
    }
  }, [getAuthHeaders]);

  /**
   * Accept terms and conditions
   */
  const acceptTerms = useCallback(async (termsType) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(
        `${API_BASE_URL}/api/terms/accept`,
        { termsType },
        getAuthHeaders()
      );

      if (response.data.success) {
        // Update local state
        setTermsStatus(prev => ({
          ...prev,
          [termsType]: {
            accepted: true,
            timestamp: response.data.data.timestamp
          }
        }));

        return {
          success: true,
          alreadyAccepted: response.data.data.alreadyAccepted,
          timestamp: response.data.data.timestamp
        };
      } else {
        throw new Error(response.data.message || 'Failed to accept terms');
      }
    } catch (error) {
      console.error(`Error accepting ${termsType}:`, error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to accept terms';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  /**
   * Check if user can perform a specific action
   */
  const checkActionPermission = useCallback(async (action) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/terms/permission/${action}`,
        getAuthHeaders()
      );

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to check action permission');
      }
    } catch (error) {
      console.error(`Error checking permission for ${action}:`, error);
      throw error;
    }
  }, [getAuthHeaders]);

  /**
   * Check if user needs to accept terms before performing an action
   */
  const requiresTermsAcceptance = useCallback(async (action) => {
    try {
      const permission = await checkActionPermission(action);
      return !permission.allowed;
    } catch (error) {
      console.error(`Error checking if ${action} requires terms acceptance:`, error);
      // Default to requiring acceptance if we can't determine
      return true;
    }
  }, [checkActionPermission]);

  /**
   * Get the appropriate terms type for an action
   */
  const getTermsTypeForAction = useCallback((action) => {
    const actionTermsMap = {
      createNotice: 'noticeBoardTerms',
      createReport: 'reportTerms'
    };
    return actionTermsMap[action] || null;
  }, []);

  /**
   * Handle terms acceptance flow for a specific action
   */
  const handleTermsForAction = useCallback(async (action) => {
    try {
      const termsType = getTermsTypeForAction(action);
      if (!termsType) {
        throw new Error(`Unknown action: ${action}`);
      }

      const needsAcceptance = await requiresTermsAcceptance(action);
      
      return {
        needsAcceptance,
        termsType,
        currentStatus: termsStatus[termsType]
      };
    } catch (error) {
      console.error(`Error handling terms for ${action}:`, error);
      throw error;
    }
  }, [getTermsTypeForAction, requiresTermsAcceptance, termsStatus]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Refresh terms status
   */
  const refreshTermsStatus = useCallback(() => {
    fetchTermsStatus();
  }, [fetchTermsStatus]);

  // Load terms status on mount
  useEffect(() => {
    fetchTermsStatus();
  }, [fetchTermsStatus]);

  /**
   * Check if user can post a notice (has accepted notice board terms)
   */
  const canPostNotice = useCallback(() => {
    return termsStatus.noticeBoardTerms.accepted;
  }, [termsStatus.noticeBoardTerms.accepted]);

  /**
   * Check if user can submit a report (has accepted report terms)
   */
  const canSubmitReport = useCallback(() => {
    return termsStatus.reportTerms.accepted;
  }, [termsStatus.reportTerms.accepted]);

  return {
    // State
    termsStatus,
    loading,
    error,
    
    // Actions
    acceptTerms,
    hasAcceptedTerms,
    checkActionPermission,
    requiresTermsAcceptance,
    handleTermsForAction,
    getTermsTypeForAction,
    refreshTermsStatus,
    clearError,
    canPostNotice,
    canSubmitReport,
    
    // Computed values
    hasAcceptedNoticeBoardTerms: termsStatus.noticeBoardTerms.accepted,
    hasAcceptedReportTerms: termsStatus.reportTerms.accepted,
    hasAcceptedAllTerms: termsStatus.noticeBoardTerms.accepted && termsStatus.reportTerms.accepted
  };
};

export default useTermsAcceptance;