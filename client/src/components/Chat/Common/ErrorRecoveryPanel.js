import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './ErrorRecoveryPanel.css';

const ErrorRecoveryPanel = ({
  errors = [],
  isRecovering = false,
  onRetry,
  onDismiss,
  onClearAll,
  className = ''
}) => {
  const [expandedError, setExpandedError] = useState(null);
  const [filter, setFilter] = useState('all');

  const filteredErrors = errors.filter(error => {
    if (filter === 'all') return true;
    if (filter === 'recoverable') return error.canRetry;
    return error.severity === filter;
  });

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L2 22h20L12 2zm0 15h-2v-2h2v2zm0-4h-2V9h2v4z"
              fill="currentColor"
            />
          </svg>
        );
      case 'error':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
              fill="currentColor"
            />
          </svg>
        );
      case 'warning':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"
              fill="currentColor"
            />
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
              fill="currentColor"
            />
          </svg>
        );
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) { // Less than 1 minute
      return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
      return `${Math.floor(diff / 60000)}m ago`;
    } else if (diff < 86400000) { // Less than 1 day
      return `${Math.floor(diff / 3600000)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'network':
        return 'Network';
      case 'server':
        return 'Server';
      case 'client':
        return 'Client';
      case 'javascript':
        return 'JavaScript';
      default:
        return category.replace('component_', '').replace('_', ' ');
    }
  };

  if (errors.length === 0) {
    return (
      <div className={`error-recovery-panel error-recovery-panel--empty ${className}`}>
        <div className="error-recovery-panel__empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
              fill="currentColor"
            />
          </svg>
          <p>No errors to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`error-recovery-panel ${className}`}>
      <div className="error-recovery-panel__header">
        <h3 className="error-recovery-panel__title">
          Error Recovery ({errors.length})
        </h3>
        
        <div className="error-recovery-panel__controls">
          <select
            className="error-recovery-panel__filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Errors</option>
            <option value="recoverable">Recoverable</option>
            <option value="critical">Critical</option>
            <option value="error">Errors</option>
            <option value="warning">Warnings</option>
          </select>
          
          <button
            className="error-recovery-panel__clear-all"
            onClick={onClearAll}
            disabled={isRecovering}
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="error-recovery-panel__list">
        {filteredErrors.map((error) => (
          <div
            key={error.id}
            className={`error-recovery-panel__item error-recovery-panel__item--${error.severity}`}
          >
            <div className="error-recovery-panel__item-header">
              <div className="error-recovery-panel__item-info">
                <div className="error-recovery-panel__item-icon">
                  {getSeverityIcon(error.severity)}
                </div>
                
                <div className="error-recovery-panel__item-details">
                  <div className="error-recovery-panel__item-title">
                    {error.name}
                  </div>
                  <div className="error-recovery-panel__item-message">
                    {error.message}
                  </div>
                  <div className="error-recovery-panel__item-meta">
                    <span className="error-recovery-panel__item-category">
                      {getCategoryLabel(error.category)}
                    </span>
                    <span className="error-recovery-panel__item-timestamp">
                      {formatTimestamp(error.timestamp)}
                    </span>
                    {error.retryCount > 0 && (
                      <span className="error-recovery-panel__item-retry-count">
                        Retries: {error.retryCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="error-recovery-panel__item-actions">
                {error.canRetry && (
                  <button
                    className="error-recovery-panel__retry-btn"
                    onClick={() => onRetry(error.id)}
                    disabled={isRecovering}
                  >
                    {isRecovering ? 'Retrying...' : 'Retry'}
                  </button>
                )}
                
                <button
                  className="error-recovery-panel__expand-btn"
                  onClick={() => setExpandedError(
                    expandedError === error.id ? null : error.id
                  )}
                >
                  {expandedError === error.id ? 'Less' : 'More'}
                </button>
                
                <button
                  className="error-recovery-panel__dismiss-btn"
                  onClick={() => onDismiss(error.id)}
                  disabled={isRecovering}
                >
                  ×
                </button>
              </div>
            </div>

            {expandedError === error.id && (
              <div className="error-recovery-panel__item-expanded">
                {error.context && Object.keys(error.context).length > 0 && (
                  <div className="error-recovery-panel__context">
                    <h4>Context:</h4>
                    <pre>{JSON.stringify(error.context, null, 2)}</pre>
                  </div>
                )}
                
                {error.stack && (
                  <div className="error-recovery-panel__stack">
                    <h4>Stack Trace:</h4>
                    <pre>{error.stack}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {isRecovering && (
        <div className="error-recovery-panel__loading">
          <div className="error-recovery-panel__spinner"></div>
          <span>Attempting recovery...</span>
        </div>
      )}
    </div>
  );
};

ErrorRecoveryPanel.propTypes = {
  errors: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    severity: PropTypes.oneOf(['critical', 'error', 'warning', 'info']).isRequired,
    category: PropTypes.string.isRequired,
    timestamp: PropTypes.number.isRequired,
    canRetry: PropTypes.bool.isRequired,
    retryCount: PropTypes.number,
    context: PropTypes.object,
    stack: PropTypes.string
  })),
  isRecovering: PropTypes.bool,
  onRetry: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired,
  onClearAll: PropTypes.func.isRequired,
  className: PropTypes.string
};

export default ErrorRecoveryPanel;