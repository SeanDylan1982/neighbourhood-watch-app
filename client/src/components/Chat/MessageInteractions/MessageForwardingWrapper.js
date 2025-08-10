import React, { useState, useCallback } from 'react';
import MessageForwardDialog from './MessageForwardDialog';
import useMessageForwarding from '../../../hooks/useMessageForwarding';
import { useToast } from '../../../contexts/ToastContext';

/**
 * MessageForwardingWrapper Component
 * 
 * Wrapper component that handles the integration between message forwarding
 * dialog and the forwarding logic. Manages state and provides a clean API
 * for parent components.
 */
const MessageForwardingWrapper = ({
  children,
  messages = [], // Array of messages available for forwarding
  onForwardComplete
}) => {
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);
  
  const { forwardMessage, isForwarding, error, clearError } = useMessageForwarding();
  const { showToast } = useToast();

  // Handle opening forward dialog
  const handleOpenForwardDialog = useCallback((messageId) => {
    const message = messages.find(m => (m.id || m._id) === messageId);
    if (message) {
      setMessageToForward(message);
      setForwardDialogOpen(true);
      clearError();
    }
  }, [messages, clearError]);

  // Handle closing forward dialog
  const handleCloseForwardDialog = useCallback(() => {
    setForwardDialogOpen(false);
    setMessageToForward(null);
    clearError();
  }, [clearError]);

  // Handle message forwarding
  const handleForwardMessage = useCallback(async (message, targetChats) => {
    try {
      const result = await forwardMessage(message, targetChats);
      
      // Show success message
      showToast(result.message, 'success');
      
      // Notify parent component
      onForwardComplete?.(message, targetChats, result);
      
      return result;
    } catch (err) {
      // Show error message
      showToast(err.message, 'error');
      throw err;
    }
  }, [forwardMessage, showToast, onForwardComplete]);

  // Clone children and inject forward handler
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        onForward: handleOpenForwardDialog,
        ...child.props
      });
    }
    return child;
  });

  return (
    <>
      {childrenWithProps}
      
      <MessageForwardDialog
        open={forwardDialogOpen}
        onClose={handleCloseForwardDialog}
        message={messageToForward}
        onForward={handleForwardMessage}
        maxSelections={5}
      />
    </>
  );
};

export default MessageForwardingWrapper;