import { useState, useEffect, useCallback } from 'react';
import encryptionManager from '../utils/encryption';

/**
 * Hook for managing end-to-end encryption in chat components
 */
export const useEncryption = (chatId, currentUserId) => {
  const [isEncryptionEnabled, setIsEncryptionEnabled] = useState(false);
  const [isEncryptionSupported, setIsEncryptionSupported] = useState(false);
  const [encryptionStatus, setEncryptionStatus] = useState('checking'); // checking, enabled, disabled, error
  const [publicKey, setPublicKey] = useState(null);

  // Check encryption support on mount
  useEffect(() => {
    const supported = encryptionManager.isEncryptionSupported();
    setIsEncryptionSupported(supported);
    
    if (!supported) {
      setEncryptionStatus('disabled');
      console.warn('End-to-end encryption not supported in this browser');
    }
  }, []);

  // Initialize encryption for chat
  const initializeEncryption = useCallback(async (participantPublicKeys = []) => {
    if (!isEncryptionSupported || !chatId) return false;

    try {
      setEncryptionStatus('checking');
      
      const success = await encryptionManager.initializeChatEncryption(
        chatId, 
        participantPublicKeys
      );
      
      if (success) {
        const userPublicKey = await encryptionManager.getPublicKeyForSharing(chatId);
        setPublicKey(userPublicKey);
        setIsEncryptionEnabled(true);
        setEncryptionStatus('enabled');
      } else {
        setEncryptionStatus('error');
      }
      
      return success;
    } catch (error) {
      console.error('Failed to initialize encryption:', error);
      setEncryptionStatus('error');
      return false;
    }
  }, [chatId, isEncryptionSupported]);

  // Encrypt message before sending
  const encryptMessage = useCallback(async (message, recipientUserIds) => {
    if (!isEncryptionEnabled || !chatId) {
      return { content: message, isEncrypted: false };
    }

    try {
      const encryptedData = await encryptionManager.encryptMessageForSending(
        chatId,
        message,
        recipientUserIds
      );
      
      return {
        content: encryptedData.encryptedContent,
        encryptionData: {
          iv: encryptedData.iv,
          encryptedKeys: encryptedData.encryptedKeys,
          isEncrypted: true,
        },
        isEncrypted: true,
      };
    } catch (error) {
      console.error('Failed to encrypt message:', error);
      // Fall back to unencrypted if encryption fails
      return { content: message, isEncrypted: false };
    }
  }, [chatId, isEncryptionEnabled]);

  // Decrypt received message
  const decryptMessage = useCallback(async (encryptedData) => {
    if (!isEncryptionEnabled || !chatId || !encryptedData.isEncrypted) {
      return encryptedData.content;
    }

    try {
      const decryptedContent = await encryptionManager.decryptReceivedMessage(
        chatId,
        {
          encryptedContent: encryptedData.content,
          iv: encryptedData.encryptionData?.iv,
          encryptedKeys: encryptedData.encryptionData?.encryptedKeys,
        },
        currentUserId
      );
      
      return decryptedContent;
    } catch (error) {
      console.error('Failed to decrypt message:', error);
      return '[Encrypted message - decryption failed]';
    }
  }, [chatId, currentUserId, isEncryptionEnabled]);

  // Toggle encryption on/off
  const toggleEncryption = useCallback(async (enable) => {
    if (!isEncryptionSupported) return false;

    try {
      if (enable && !isEncryptionEnabled) {
        const success = await initializeEncryption();
        return success;
      } else if (!enable && isEncryptionEnabled) {
        encryptionManager.clearChatEncryption(chatId);
        setIsEncryptionEnabled(false);
        setEncryptionStatus('disabled');
        setPublicKey(null);
        return true;
      }
      
      return isEncryptionEnabled === enable;
    } catch (error) {
      console.error('Failed to toggle encryption:', error);
      return false;
    }
  }, [chatId, isEncryptionEnabled, isEncryptionSupported, initializeEncryption]);

  // Get encryption info for display
  const getEncryptionInfo = useCallback(() => {
    return {
      isSupported: isEncryptionSupported,
      isEnabled: isEncryptionEnabled,
      status: encryptionStatus,
      publicKey,
      statusText: getStatusText(encryptionStatus, isEncryptionSupported),
    };
  }, [isEncryptionSupported, isEncryptionEnabled, encryptionStatus, publicKey]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (chatId && isEncryptionEnabled) {
        encryptionManager.clearChatEncryption(chatId);
      }
    };
  }, [chatId, isEncryptionEnabled]);

  return {
    isEncryptionSupported,
    isEncryptionEnabled,
    encryptionStatus,
    publicKey,
    initializeEncryption,
    encryptMessage,
    decryptMessage,
    toggleEncryption,
    getEncryptionInfo,
  };
};

// Helper function to get human-readable status text
function getStatusText(status, isSupported) {
  if (!isSupported) {
    return 'Encryption not supported in this browser';
  }
  
  switch (status) {
    case 'checking':
      return 'Setting up encryption...';
    case 'enabled':
      return 'Messages are end-to-end encrypted';
    case 'disabled':
      return 'Encryption is disabled';
    case 'error':
      return 'Encryption setup failed';
    default:
      return 'Unknown encryption status';
  }
}

export default useEncryption;