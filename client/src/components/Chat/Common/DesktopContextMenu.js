import React, { useState, useEffect, useCallback } from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box,
  Fade
} from '@mui/material';
import { useDesktopFeatures } from '../../../hooks/useResponsive';

/**
 * Enhanced desktop context menu with right-click support
 * Provides consistent right-click functionality across chat components
 */
const DesktopContextMenu = ({
  children,
  menuItems = [],
  onAction,
  disabled = false,
  className = '',
  ...props
}) => {
  const { features } = useDesktopFeatures();
  const [contextMenu, setContextMenu] = useState(null);
  
  // Handle right-click context menu
  const handleContextMenu = useCallback((event) => {
    if (!features.rightClickMenus || disabled || menuItems.length === 0) {
      return;
    }
    
    event.preventDefault();
    event.stopPropagation();
    
    setContextMenu(
      contextMenu === null
        ? {
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6,
          }
        : null
    );
  }, [features.rightClickMenus, disabled, menuItems.length, contextMenu]);
  
  // Handle menu close
  const handleClose = useCallback(() => {
    setContextMenu(null);
  }, []);
  
  // Handle menu item click
  const handleMenuItemClick = useCallback((action, data) => {
    handleClose();
    if (onAction) {
      onAction(action, data);
    }
  }, [handleClose, onAction]);
  
  // Close menu on escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && contextMenu) {
        handleClose();
      }
    };
    
    if (contextMenu) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [contextMenu, handleClose]);
  
  // Render menu items
  const renderMenuItems = () => {
    return menuItems.map((item, index) => {
      if (item.type === 'divider') {
        return <Divider key={`divider-${index}`} />;
      }
      
      if (item.type === 'header') {
        return (
          <Box key={`header-${index}`} sx={{ px: 2, py: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight="medium">
              {item.label}
            </Typography>
          </Box>
        );
      }
      
      return (
        <MenuItem
          key={item.id || `item-${index}`}
          onClick={() => handleMenuItemClick(item.action, item.data)}
          disabled={item.disabled}
          sx={{
            minHeight: 36,
            '&:hover': {
              backgroundColor: 'action.hover'
            },
            ...(item.danger && {
              color: 'error.main',
              '&:hover': {
                backgroundColor: 'error.light',
                color: 'error.contrastText'
              }
            })
          }}
        >
          {item.icon && (
            <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
              {item.icon}
            </ListItemIcon>
          )}
          <ListItemText 
            primary={item.label}
            secondary={item.description}
            primaryTypographyProps={{
              variant: 'body2',
              fontWeight: item.primary ? 'medium' : 'normal'
            }}
            secondaryTypographyProps={{
              variant: 'caption'
            }}
          />
          {item.shortcut && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
              {item.shortcut}
            </Typography>
          )}
        </MenuItem>
      );
    });
  };
  
  return (
    <>
      <Box
        onContextMenu={handleContextMenu}
        className={className}
        sx={{ 
          cursor: features.rightClickMenus && !disabled ? 'context-menu' : 'default',
          ...props.sx 
        }}
        {...props}
      >
        {children}
      </Box>
      
      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
        TransitionComponent={Fade}
        transitionDuration={150}
        slotProps={{
          paper: {
            sx: {
              minWidth: 200,
              maxWidth: 300,
              boxShadow: theme => theme.shadows[8],
              border: theme => `1px solid ${theme.palette.divider}`,
              borderRadius: 2
            }
          }
        }}
        MenuListProps={{
          dense: true,
          sx: { py: 1 }
        }}
      >
        {renderMenuItems()}
      </Menu>
    </>
  );
};

export default DesktopContextMenu;