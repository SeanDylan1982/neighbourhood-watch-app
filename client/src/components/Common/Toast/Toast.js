import React, { useEffect, useState } from 'react';
import FluentIcon from '../Icons/FluentIcon';
import './Toast.css';

const Toast = ({ toast, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(toast.id), 300); // Wait for animation
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return 'Check';
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      default:
        return 'Info';
    }
  };

  const getTypeClass = () => {
    return `toast--${toast.type}`;
  };

  return (
    <div className={`toast ${getTypeClass()} ${isVisible ? 'toast--visible' : ''}`}>
      <div className="toast__icon">
        <FluentIcon name={getIcon()} size={20} />
      </div>
      <div className="toast__content">
        <p className="toast__message">{toast.message}</p>
        {toast.action && (
          <button 
            className="toast__action"
            onClick={toast.action.onClick}
          >
            {toast.action.label}  
          </button>
        )}
      </div>
      <button 
        className="toast__close"
        onClick={handleClose}
        aria-label="Close notification"
      >
        <FluentIcon name="Dismiss" size={16} />
      </button>
    </div>
  );
};

export default Toast;