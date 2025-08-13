import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const hideToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback((messageOrToast, type = 'info', duration = 5000) => {
    const id = Date.now().toString();
    
    // Handle both object format and separate parameters format
    let toastConfig;
    if (typeof messageOrToast === 'string') {
      // Legacy format: showToast(message, type, duration)
      toastConfig = {
        message: messageOrToast,
        type,
        duration
      };
    } else {
      // Object format: showToast({ message, type, duration, ... })
      toastConfig = messageOrToast;
    }
    
    const newToast = {
      id,
      type: 'info',
      duration: 5000,
      ...toastConfig,
      timestamp: new Date(),
      dismissed: false
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-dismiss after duration
    if (newToast.duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, newToast.duration);
    }

    return id;
  }, [hideToast]);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const value = {
    toasts,
    showToast,
    hideToast,
    clearAll
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};