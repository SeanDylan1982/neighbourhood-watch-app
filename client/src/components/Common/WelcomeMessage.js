import React, { useState, useEffect } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  IconButton,
  Collapse,
  Typography,
  Button,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  Chat as ChatIcon,
  Campaign as NoticeIcon,
  Report as ReportIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const WelcomeMessage = ({ 
  type, 
  title, 
  children, 
  severity = 'info',
  collapsible = true,
  showDismiss = true,
  icon: CustomIcon,
  actions = []
}) => {
  const { user, updateUser } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingState, setSavingState] = useState(false);

  // Load dismissed and collapsed state from user settings
  useEffect(() => {
    if (user && type) {
      const welcomeStates = user.settings?.welcomeMessageStates || {};
      const messageState = welcomeStates[type] || {};
      
      // Check both old and new format for backward compatibility
      const oldDismissed = user.settings?.dismissedWelcomeMessages?.[type] === true;
      const newDismissed = messageState.dismissed === true;
      
      // Also check localStorage as backup
      const localStorageKey = `welcomeMessage_${type}_dismissed_${user.id}`;
      const localDismissed = localStorage.getItem(localStorageKey) === 'true';
      
      const finalDismissed = oldDismissed || newDismissed || localDismissed;
      
      setIsDismissed(finalDismissed);
      setIsExpanded(!messageState.collapsed);
    }
  }, [user, type]);

  // Handle dismiss
  const handleDismiss = async () => {
    if (!user || !type) return;

    setLoading(true);
    try {
      const currentStates = user.settings?.welcomeMessageStates || {};
      const currentMessageState = currentStates[type] || {};
      
      const updatePayload = {
        welcomeMessageStates: {
          ...currentStates,
          [type]: {
            ...currentMessageState,
            dismissed: true
          }
        }
      };
      
      await axios.put('/api/users/settings', updatePayload);

      // Save to localStorage as backup
      const localStorageKey = `welcomeMessage_${type}_dismissed_${user.id}`;
      localStorage.setItem(localStorageKey, 'true');

      setIsDismissed(true);
      
      // Refresh user data to update context
      try {
        const userResponse = await axios.get('/api/users/me');
        updateUser(userResponse.data);
      } catch (refreshError) {
        console.error('Error refreshing user data:', refreshError);
        // If refresh fails, revert the local state
        setIsDismissed(false);
      }
    } catch (error) {
      console.error('Error dismissing welcome message:', error);
      // Revert local state on error
      setIsDismissed(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle show again
  const handleShowAgain = async () => {
    if (!user || !type) return;

    setLoading(true);
    try {
      const currentStates = user.settings?.welcomeMessageStates || {};
      const currentMessageState = currentStates[type] || {};
      
      await axios.put('/api/users/settings', {
        welcomeMessageStates: {
          ...currentStates,
          [type]: {
            ...currentMessageState,
            dismissed: false,
            collapsed: false
          }
        }
      });

      setIsDismissed(false);
      setIsExpanded(true);
      
      // Refresh user data to update context
      try {
        const userResponse = await axios.get('/api/users/me');
        updateUser(userResponse.data);
      } catch (refreshError) {
        console.error('Error refreshing user data:', refreshError);
      }
    } catch (error) {
      console.error('Error showing welcome message again:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle collapse/expand state change
  const handleToggleExpanded = async (newExpandedState) => {
    if (!user || !type) {
      setIsExpanded(newExpandedState);
      return;
    }

    // Update local state immediately for better UX
    setIsExpanded(newExpandedState);

    // Save to backend
    setSavingState(true);
    try {
      const currentStates = user.settings?.welcomeMessageStates || {};
      const currentMessageState = currentStates[type] || {};
      
      await axios.put('/api/users/settings', {
        welcomeMessageStates: {
          ...currentStates,
          [type]: {
            ...currentMessageState,
            collapsed: !newExpandedState
          }
        }
      });
    } catch (error) {
      console.error('Error saving welcome message state:', error);
      // Revert local state on error
      setIsExpanded(!newExpandedState);
    } finally {
      setSavingState(false);
    }
  };

  // Don't render if dismissed
  if (isDismissed) {
    return (
      <Box sx={{ mb: 1 }}>
        <Button
          size="small"
          variant="text"
          color="primary"
          onClick={handleShowAgain}
          disabled={loading}
          startIcon={<InfoIcon />}
        >
          Show welcome message
        </Button>
      </Box>
    );
  }

  const getIcon = () => {
    if (CustomIcon) return <CustomIcon />;
    
    switch (type) {
      case 'chat':
        return <ChatIcon />;
      case 'noticeBoard':
        return <NoticeIcon />;
      case 'reports':
        return <ReportIcon />;
      case 'groupChat':
        return <GroupIcon />;
      default:
        return <InfoIcon />;
    }
  };

  return (
    <Alert
      severity={severity}
      icon={getIcon()}
      sx={{ mb: 2 }}
      action={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {collapsible && (
            <IconButton
              size="small"
              onClick={() => handleToggleExpanded(!isExpanded)}
              disabled={savingState}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}
          {showDismiss && (
            <IconButton
              size="small"
              onClick={handleDismiss}
              disabled={loading}
              aria-label="Dismiss"
            >
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      }
    >
      <AlertTitle>{title}</AlertTitle>
      
      <Collapse in={isExpanded}>
        <Box>
          {children}
          
          {actions.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    size="small"
                    variant={action.variant || 'outlined'}
                    color={action.color || 'primary'}
                    onClick={action.onClick}
                    startIcon={action.icon}
                    disabled={action.disabled}
                  >
                    {action.label}
                  </Button>
                ))}
              </Box>
            </>
          )}
        </Box>
      </Collapse>
    </Alert>
  );
};

export default WelcomeMessage;