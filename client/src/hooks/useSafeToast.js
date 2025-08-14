import { useContext } from 'react';

/**
 * Safe toast hook that gracefully handles missing ToastProvider
 * Returns fallback functions if ToastContext is not available
 */
const useSafeToast = () => {
  try {
    // Try to import and use ToastContext
    const { ToastContext } = require('../contexts/ToastContext');
    const context = useContext(ToastContext);
    
    if (context) {
      return context;
    }
  } catch (error) {
    // ToastContext not available or not in provider tree
  }
  
  // Return fallback toast functions
  return {
    showToast: (message, type = 'info', duration = 5000) => {
      const messageText = typeof message === 'string' ? message : message.message;
      console.log(`[TOAST ${type.toUpperCase()}] ${messageText}`);
      
      // If message has an action, log it too
      if (typeof message === 'object' && message.action) {
        console.log(`[TOAST ACTION] ${message.action.label || 'Action available'}`);
      }
      
      // Return a mock toast ID
      return Date.now().toString();
    },
    hideToast: (id) => {
      console.log(`[TOAST] Hide toast ${id}`);
    },
    clearAll: () => {
      console.log('[TOAST] Clear all toasts');
    },
    toasts: []
  };
};

export default useSafeToast;