import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { useLocation } from 'react-router-dom';
import icons from './Icons';

/**
 * Page-specific action button that appears in the top right corner
 * Shows different actions based on the current page
 */
const PageActionButton = ({ onAction }) => {
  const location = useLocation();

  // Define page-specific actions
  const getPageAction = () => {
    const currentPath = location.pathname;
    
    switch (currentPath) {
      case '/chat':
        return {
          icon: <icons.Chat size={24} />,
          tooltip: 'New Community Message',
          action: () => onAction && onAction('new-community-message')
        };
      case '/private-chat':
        return {
          icon: <icons.Message size={24} />,
          tooltip: 'New Private Message',
          action: () => onAction && onAction('new-private-message')
        };
      case '/notices':
        return {
          icon: <icons.Campaign size={24} />,
          tooltip: 'New Notice',
          action: () => onAction && onAction('new-notice')
        };
      case '/reports':
        return {
          icon: <icons.Report size={24} />,
          tooltip: 'New Report',
          action: () => onAction && onAction('new-report')
        };
      case '/contacts':
        return {
          icon: <icons.PersonAdd size={24} />,
          tooltip: 'Add Contact',
          action: () => onAction && onAction('add-contact')
        };
      case '/dashboard':
        return {
          icon: <icons.Add size={24} />,
          tooltip: 'Quick Create',
          action: () => onAction && onAction('quick-create')
        };
      case '/admin':
        return {
          icon: <icons.AdminPanelSettings size={24} />,
          tooltip: 'Admin Actions',
          action: () => onAction && onAction('admin-actions')
        };
      default:
        return null;
    }
  };

  const pageAction = getPageAction();

  // Don't show button if no action is defined for this page
  if (!pageAction) {
    return null;
  }

  return (
    <Tooltip title={pageAction.tooltip}>
      <IconButton
        color="inherit"
        onClick={pageAction.action}
        sx={{ mr: 1 }}
      >
        {pageAction.icon}
      </IconButton>
    </Tooltip>
  );
};

export default PageActionButton;