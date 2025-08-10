import React, { useState, useEffect } from 'react';
import TermsModal from './TermsModal';
import useTermsAcceptance from '../../hooks/useTermsAcceptance';

/**
 * TermsGuard Component
 * Wraps content creation actions and shows terms modal when needed
 * Prevents action execution until terms are accepted
 */
const TermsGuard = ({ 
  children, 
  action, 
  onTermsAccepted,
  onTermsDeclined,
  disabled = false 
}) => {
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  
  const {
    termsStatus,
    acceptTerms,
    handleTermsForAction,
    getTermsTypeForAction,
    loading,
    error,
    clearError
  } = useTermsAcceptance();

  /**
   * Handle action execution with terms check
   */
  const handleAction = async (actionCallback) => {
    try {
      if (disabled) {
        return;
      }

      clearError();
      
      // Check if terms are needed for this action
      const termsInfo = await handleTermsForAction(action);
      
      if (termsInfo.needsAcceptance) {
        // Store the action to execute after terms acceptance
        setPendingAction(actionCallback);
        setShowTermsModal(true);
      } else {
        // Terms already accepted, execute action directly
        if (typeof actionCallback === 'function') {
          await actionCallback();
        }
      }
    } catch (error) {
      console.error('Error handling action with terms guard:', error);
      // Execute action anyway if terms check fails (graceful degradation)
      if (typeof actionCallback === 'function') {
        await actionCallback();
      }
    }
  };

  /**
   * Handle terms acceptance
   */
  const handleAcceptTerms = async () => {
    try {
      const termsType = getTermsTypeForAction(action);
      if (!termsType) {
        throw new Error(`Unknown action: ${action}`);
      }

      await acceptTerms(termsType);
      
      // Close modal
      setShowTermsModal(false);
      
      // Execute pending action
      if (pendingAction && typeof pendingAction === 'function') {
        await pendingAction();
      }
      
      // Clear pending action
      setPendingAction(null);
      
      // Notify parent component
      if (onTermsAccepted) {
        onTermsAccepted(termsType);
      }
    } catch (error) {
      console.error('Error accepting terms:', error);
      // Keep modal open to show error or allow retry
    }
  };

  /**
   * Handle terms decline
   */
  const handleDeclineTerms = () => {
    setShowTermsModal(false);
    setPendingAction(null);
    
    if (onTermsDeclined) {
      onTermsDeclined();
    }
  };

  /**
   * Handle modal close
   */
  const handleCloseModal = () => {
    setShowTermsModal(false);
    setPendingAction(null);
  };

  /**
   * Check if user has already accepted terms for this action
   */
  const hasAcceptedRequiredTerms = () => {
    const termsType = getTermsTypeForAction(action);
    if (!termsType) return true; // Unknown action, allow it
    
    return termsStatus[termsType]?.accepted === true;
  };

  /**
   * Clone children and inject the guarded action handler
   */
  const renderChildren = () => {
    if (typeof children === 'function') {
      // Render prop pattern
      return children({
        executeAction: handleAction,
        hasAcceptedTerms: hasAcceptedRequiredTerms(),
        loading,
        error
      });
    }

    // Clone React elements and inject props
    return React.Children.map(children, child => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, {
          onAction: handleAction,
          hasAcceptedTerms: hasAcceptedRequiredTerms(),
          disabled: disabled || loading,
          termsError: error
        });
      }
      return child;
    });
  };

  return (
    <>
      {renderChildren()}
      
      {showTermsModal && (
        <TermsModal
          isOpen={showTermsModal}
          type={getTermsTypeForAction(action) === 'noticeBoardTerms' ? 'noticeBoard' : 'reports'}
          onAccept={handleAcceptTerms}
          onDecline={handleDeclineTerms}
          onClose={handleCloseModal}
          alreadyAccepted={hasAcceptedRequiredTerms()}
        />
      )}
    </>
  );
};

/**
 * Higher-order component version of TermsGuard
 */
export const withTermsGuard = (WrappedComponent, action) => {
  return function TermsGuardedComponent(props) {
    return (
      <TermsGuard action={action}>
        {({ executeAction, hasAcceptedTerms, loading, error }) => (
          <WrappedComponent
            {...props}
            executeAction={executeAction}
            hasAcceptedTerms={hasAcceptedTerms}
            termsLoading={loading}
            termsError={error}
          />
        )}
      </TermsGuard>
    );
  };
};

/**
 * Hook version for more flexibility
 */
export const useTermsGuard = (action) => {
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  
  const {
    termsStatus,
    acceptTerms,
    handleTermsForAction,
    getTermsTypeForAction,
    loading,
    error,
    clearError
  } = useTermsAcceptance();

  const executeWithTermsCheck = async (actionCallback) => {
    try {
      clearError();
      
      const termsInfo = await handleTermsForAction(action);
      
      if (termsInfo.needsAcceptance) {
        setPendingAction(actionCallback);
        setShowTermsModal(true);
        return false; // Action not executed yet
      } else {
        if (typeof actionCallback === 'function') {
          await actionCallback();
        }
        return true; // Action executed
      }
    } catch (error) {
      console.error('Error in terms guard:', error);
      // Execute action anyway (graceful degradation)
      if (typeof actionCallback === 'function') {
        await actionCallback();
      }
      return true;
    }
  };

  const acceptTermsAndExecute = async () => {
    try {
      const termsType = getTermsTypeForAction(action);
      await acceptTerms(termsType);
      
      setShowTermsModal(false);
      
      if (pendingAction && typeof pendingAction === 'function') {
        await pendingAction();
      }
      
      setPendingAction(null);
      return true;
    } catch (error) {
      console.error('Error accepting terms:', error);
      return false;
    }
  };

  const declineTerms = () => {
    setShowTermsModal(false);
    setPendingAction(null);
  };

  const hasAcceptedRequiredTerms = () => {
    const termsType = getTermsTypeForAction(action);
    if (!termsType) return true;
    return termsStatus[termsType]?.accepted === true;
  };

  return {
    executeWithTermsCheck,
    acceptTermsAndExecute,
    declineTerms,
    showTermsModal,
    setShowTermsModal,
    hasAcceptedRequiredTerms: hasAcceptedRequiredTerms(),
    termsType: getTermsTypeForAction(action),
    loading,
    error,
    clearError
  };
};

export default TermsGuard;