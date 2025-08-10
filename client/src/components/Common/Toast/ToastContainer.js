import React from 'react';
import { useToast } from '../../../contexts/ToastContext';
import Toast from './Toast';
import './ToastContainer.css';

const ToastContainer = () => {
  const { toasts, hideToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast 
          key={toast.id} 
          toast={toast} 
          onClose={hideToast}
        />
      ))}
    </div>
  );
};

export default ToastContainer;