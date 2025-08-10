import React, { useState } from 'react';
import useAutoDelete from '../../../hooks/useAutoDelete';
import './AutoDeleteSettings.css';

/**
 * Component for managing auto-delete settings in a chat
 */
const AutoDeleteSettings = ({ 
  chatId, 
  currentUserId, 
  chatType = 'private',
  onClose 
}) => {
  const {
    autoDeleteSettings,
    isLoading,
    error,
    AUTO_DELETE_PERIODS,
    enableAutoDelete,
    disableAutoDelete,
    getStatusText,
  } = useAutoDelete(chatId, currentUserId);

  const [selectedPeriod, setSelectedPeriod] = useState(autoDeleteSettings.period || 24);
  const [applyToExisting, setApplyToExisting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleEnableAutoDelete = async () => {
    setIsUpdating(true);
    
    try {
      const success = await enableAutoDelete(selectedPeriod, applyToExisting);
      if (success) {
        // Settings updated successfully
      }
    } catch (err) {
      console.error('Failed to enable auto-delete:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDisableAutoDelete = async () => {
    if (!window.confirm('Are you sure you want to disable auto-delete? Existing messages will not be deleted.')) {
      return;
    }

    setIsUpdating(true);
    
    try {
      const success = await disableAutoDelete();
      if (success) {
        // Settings updated successfully
      }
    } catch (err) {
      console.error('Failed to disable auto-delete:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const getDescription = () => {
    if (chatType === 'group') {
      return 'Auto-delete will remove messages from this group chat after the specified time period. This setting applies to all group members.';
    }
    return 'Auto-delete will remove messages from this private chat after the specified time period. Both participants will see the same auto-delete behavior.';
  };

  const getWarningMessage = () => {
    if (autoDeleteSettings.enabled) {
      return 'Auto-delete is currently enabled. Messages will be permanently deleted and cannot be recovered.';
    }
    
    if (applyToExisting) {
      return 'Enabling "Apply to existing messages" will immediately delete messages older than the selected period.';
    }

    return null;
  };

  return (
    <div className="auto-delete-settings">
      <div className="auto-delete-settings__header">
        <h3>Auto-Delete Messages</h3>
        <button 
          className="auto-delete-settings__close"
          onClick={onClose}
          aria-label="Close auto-delete settings"
        >
          ✕
        </button>
      </div>

      <div className="auto-delete-settings__content">
        <div className="auto-delete-settings__status">
          <div className={`auto-delete-settings__status-indicator ${
            autoDeleteSettings.enabled ? 'auto-delete-settings__status-indicator--enabled' : ''
          }`}>
            {autoDeleteSettings.enabled ? '🕒' : '⏸️'}
          </div>
          <div className="auto-delete-settings__status-text">
            {getStatusText()}
          </div>
        </div>

        <div className="auto-delete-settings__description">
          <p>{getDescription()}</p>
        </div>

        {error && (
          <div className="auto-delete-settings__error">
            <span className="auto-delete-settings__error-icon">⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {getWarningMessage() && (
          <div className="auto-delete-settings__warning">
            <span className="auto-delete-settings__warning-icon">⚠️</span>
            <p>{getWarningMessage()}</p>
          </div>
        )}

        {!autoDeleteSettings.enabled ? (
          <div className="auto-delete-settings__enable">
            <div className="auto-delete-settings__field">
              <label className="auto-delete-settings__label">
                Delete messages after:
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                className="auto-delete-settings__select"
                disabled={isUpdating}
              >
                {AUTO_DELETE_PERIODS.map(period => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="auto-delete-settings__field">
              <label className="auto-delete-settings__checkbox-label">
                <input
                  type="checkbox"
                  checked={applyToExisting}
                  onChange={(e) => setApplyToExisting(e.target.checked)}
                  className="auto-delete-settings__checkbox"
                  disabled={isUpdating}
                />
                <span className="auto-delete-settings__checkbox-text">
                  Apply to existing messages
                </span>
              </label>
              <p className="auto-delete-settings__field-help">
                If checked, existing messages older than the selected period will be deleted immediately.
              </p>
            </div>

            <button
              onClick={handleEnableAutoDelete}
              disabled={isUpdating || isLoading}
              className="auto-delete-settings__enable-button"
            >
              {isUpdating ? 'Enabling...' : 'Enable Auto-Delete'}
            </button>
          </div>
        ) : (
          <div className="auto-delete-settings__disable">
            <div className="auto-delete-settings__current-settings">
              <h4>Current Settings:</h4>
              <ul>
                <li>Period: {AUTO_DELETE_PERIODS.find(p => p.value === autoDeleteSettings.period)?.label}</li>
                <li>Enabled: {new Date(autoDeleteSettings.enabledAt).toLocaleString()}</li>
                {autoDeleteSettings.enabledBy && (
                  <li>Enabled by: {autoDeleteSettings.enabledBy === currentUserId ? 'You' : 'Another user'}</li>
                )}
              </ul>
            </div>

            <button
              onClick={handleDisableAutoDelete}
              disabled={isUpdating || isLoading}
              className="auto-delete-settings__disable-button"
            >
              {isUpdating ? 'Disabling...' : 'Disable Auto-Delete'}
            </button>
          </div>
        )}

        <div className="auto-delete-settings__info">
          <h4>How auto-delete works:</h4>
          <ul>
            <li>Messages are automatically deleted after the specified time period</li>
            <li>Deleted messages cannot be recovered</li>
            <li>The timer starts from when the message was sent</li>
            <li>All participants in the chat will see the same deletion behavior</li>
            <li>Media files and attachments are also deleted</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AutoDeleteSettings;