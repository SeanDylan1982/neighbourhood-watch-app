import React from 'react';
import './EncryptionStatus.css';

/**
 * Component to display encryption status in chat windows
 */
const EncryptionStatus = ({ 
  isEnabled, 
  status, 
  statusText, 
  showIcon = true, 
  showText = true,
  size = 'medium',
  onClick 
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'enabled':
        return '🔒';
      case 'checking':
        return '⏳';
      case 'error':
        return '⚠️';
      case 'disabled':
      default:
        return '🔓';
    }
  };

  const getStatusClass = () => {
    return `encryption-status encryption-status--${status} encryption-status--${size}`;
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div 
      className={getStatusClass()}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={statusText}
    >
      {showIcon && (
        <span className="encryption-status__icon">
          {getStatusIcon()}
        </span>
      )}
      
      {showText && (
        <span className="encryption-status__text">
          {statusText}
        </span>
      )}
    </div>
  );
};

export default EncryptionStatus;