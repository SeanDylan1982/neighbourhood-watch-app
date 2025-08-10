import React, { useState } from 'react';
import EncryptionStatus from './EncryptionStatus';
import './EncryptionSettings.css';

/**
 * Component for managing encryption settings in a chat
 */
const EncryptionSettings = ({ 
  encryptionInfo, 
  onToggleEncryption, 
  onClose,
  chatType = 'private' // 'private' or 'group'
}) => {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggleEncryption = async () => {
    if (isToggling) return;

    setIsToggling(true);
    try {
      await onToggleEncryption(!encryptionInfo.isEnabled);
    } catch (error) {
      console.error('Failed to toggle encryption:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const getEncryptionDescription = () => {
    if (!encryptionInfo.isSupported) {
      return 'Your browser does not support end-to-end encryption. Please use a modern browser for secure messaging.';
    }

    if (chatType === 'group') {
      return encryptionInfo.isEnabled
        ? 'Messages in this group are end-to-end encrypted. Only group members can read them.'
        : 'Enable encryption to secure messages in this group. All members must support encryption.';
    }

    return encryptionInfo.isEnabled
      ? 'Messages in this chat are end-to-end encrypted. Only you and the recipient can read them.'
      : 'Enable encryption to secure your private messages. Both participants must support encryption.';
  };

  const getWarningMessage = () => {
    if (encryptionInfo.status === 'error') {
      return 'Encryption setup failed. This may be due to browser compatibility or network issues.';
    }

    if (!encryptionInfo.isEnabled && encryptionInfo.isSupported) {
      return 'Messages are currently not encrypted and can be read by the server.';
    }

    return null;
  };

  return (
    <div className="encryption-settings">
      <div className="encryption-settings__header">
        <h3>End-to-End Encryption</h3>
        <button 
          className="encryption-settings__close"
          onClick={onClose}
          aria-label="Close encryption settings"
        >
          ✕
        </button>
      </div>

      <div className="encryption-settings__content">
        <div className="encryption-settings__status">
          <EncryptionStatus
            isEnabled={encryptionInfo.isEnabled}
            status={encryptionInfo.status}
            statusText={encryptionInfo.statusText}
            size="large"
          />
        </div>

        <div className="encryption-settings__description">
          <p>{getEncryptionDescription()}</p>
        </div>

        {getWarningMessage() && (
          <div className="encryption-settings__warning">
            <span className="encryption-settings__warning-icon">⚠️</span>
            <p>{getWarningMessage()}</p>
          </div>
        )}

        {encryptionInfo.isSupported && (
          <div className="encryption-settings__controls">
            <button
              className={`encryption-settings__toggle ${
                encryptionInfo.isEnabled ? 'encryption-settings__toggle--enabled' : ''
              }`}
              onClick={handleToggleEncryption}
              disabled={isToggling || encryptionInfo.status === 'checking'}
            >
              {isToggling ? (
                'Updating...'
              ) : encryptionInfo.isEnabled ? (
                'Disable Encryption'
              ) : (
                'Enable Encryption'
              )}
            </button>
          </div>
        )}

        {encryptionInfo.isEnabled && (
          <div className="encryption-settings__info">
            <h4>How it works:</h4>
            <ul>
              <li>Messages are encrypted on your device before sending</li>
              <li>Only you and the recipient(s) have the keys to decrypt messages</li>
              <li>The server cannot read your encrypted messages</li>
              <li>Keys are generated fresh for each chat session</li>
            </ul>
          </div>
        )}

        {encryptionInfo.publicKey && (
          <div className="encryption-settings__key-info">
            <h4>Your Public Key:</h4>
            <div className="encryption-settings__key-display">
              <code>{encryptionInfo.publicKey.substring(0, 50)}...</code>
              <button
                className="encryption-settings__copy-key"
                onClick={() => navigator.clipboard?.writeText(encryptionInfo.publicKey)}
                title="Copy public key"
              >
                📋
              </button>
            </div>
            <p className="encryption-settings__key-note">
              This key is shared with other participants to enable encryption.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EncryptionSettings;