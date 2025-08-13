import React, { useEffect, useState } from 'react';
import FluentIcon from '../Icons/FluentIcon';
import './Toast.css';

const Toast = ({ toast, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Progress bar animation for auto-dismiss
    if (toast.duration > 0 && isVisible && !isDismissing) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const decrement = 100 / (toast.duration / 100);
          const newProgress = prev - decrement;
          return newProgress <= 0 ? 0 : newProgress;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [toast.duration, isVisible, isDismissing]);

  const handleClose = () => {
    setIsDismissing(true);
    setTimeout(() => onClose(toast.id), 200); // Wait for animation
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return 'CheckCircle';
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

  // Don't render if toast is missing required properties
  if (!toast || !toast.message) {
    return null;
  }

  return (
    <div className={`toast ${getTypeClass()} ${isVisible ? 'toast--visible' : ''} ${isDismissing ? 'toast--dismissing' : ''}`}>
      <div className="toast__icon">
        <FluentIcon name={getIcon()} size={20} />
      </div>
      <div className="toast__content">
        <p className="toast__message">{toast.message}</p>
        {toast.action && toast.action.onClick && (
          <button 
            className="toast__action"
            onClick={toast.action.onClick}
          >
            {toast.action.label || 'Action'}
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
      {toast.duration > 0 && (
        <div className="toast__progress">
          <div 
            className="toast__progress-bar" 
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default Toast;