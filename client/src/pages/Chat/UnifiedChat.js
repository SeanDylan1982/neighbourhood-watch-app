import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Add as AddIcon,
  Group as GroupIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../contexts/AuthContext';
import ErrorDisplay from '../../components/Common/ErrorDisplay';
import GroupChatTab from './GroupChatTab';
import PrivateChatTab from './PrivateChatTab';
import CreateGroupChatModal from '../../components/Chat/Common/CreateGroupChatModal';

const UnifiedChat = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { error, clearError, loadChats, createGroupChat } = useChat();
  
  // Tab state - 0 for group chats, 1 for private chats
  const [activeTab, setActiveTab] = useState(0);
  
  // Modal state
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  
  // Initialize tab based on URL or default to group chats
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    
    if (tab === 'private') {
      setActiveTab(1);
    } else {
      setActiveTab(0);
    }
  }, [location.search]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    // Update URL to reflect current tab
    const searchParams = new URLSearchParams(location.search);
    if (newValue === 1) {
      searchParams.set('tab', 'private');
    } else {
      searchParams.delete('tab');
    }
    
    const newSearch = searchParams.toString();
    const newPath = newSearch ? `${location.pathname}?${newSearch}` : location.pathname;
    navigate(newPath, { replace: true });
  };

  // Handle create new chat
  const handleCreateNew = () => {
    if (activeTab === 0) {
      // Create new group chat - show modal
      setShowCreateGroupModal(true);
    } else {
      // Create new private chat - navigate to contacts with friends tab
      navigate('/contacts?tab=friends&action=start-chat');
    }
  };

  // Handle group creation
  const handleGroupCreated = async (groupData) => {
    try {
      // Add the group to the chat list
      await createGroupChat(groupData);
      
      // Show success message or navigate to the new group
      console.log('Group created successfully:', groupData);
    } catch (error) {
      console.error('Error adding group to chat list:', error);
    }
  };

  // Get appropriate icon for create button
  const getCreateIcon = () => {
    return activeTab === 0 ? <GroupIcon /> : <PersonIcon />;
  };

  // Get appropriate tooltip text
  const getCreateTooltip = () => {
    return activeTab === 0 ? 'Create New Group Chat' : 'Start New Private Chat';
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}
      >
        <Typography variant="h4" component="h1">
          Messages
        </Typography>
        
        <Tooltip title={getCreateTooltip()}>
          <IconButton
            color="primary"
            size="large"
            onClick={handleCreateNew}
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            }}
          >
            {getCreateIcon()}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Error Display */}
      {error && (
        <Box sx={{ p: 2 }}>
          <ErrorDisplay
            error={error}
            onRetry={loadChats}
            onDismiss={clearError}
            showDetails={true}
          />
        </Box>
      )}

      {/* Tab Navigation */}
      <Box
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? 'fullWidth' : 'standard'}
          sx={{
            '& .MuiTab-root': {
              minHeight: 48,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500
            }
          }}
        >
          <Tab
            icon={<GroupIcon />}
            iconPosition="start"
            label="Group Chats"
            id="group-tab"
            aria-controls="group-tabpanel"
          />
          <Tab
            icon={<PersonIcon />}
            iconPosition="start"
            label="Private Messages"
            id="private-tab"
            aria-controls="private-tabpanel"
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {/* Group Chat Tab */}
        <Box
          role="tabpanel"
          hidden={activeTab !== 0}
          id="group-tabpanel"
          aria-labelledby="group-tab"
          sx={{ height: '100%' }}
        >
          {activeTab === 0 && <GroupChatTab />}
        </Box>

        {/* Private Chat Tab */}
        <Box
          role="tabpanel"
          hidden={activeTab !== 1}
          id="private-tabpanel"
          aria-labelledby="private-tab"
          sx={{ height: '100%' }}
        >
          {activeTab === 1 && <PrivateChatTab />}
        </Box>
      </Box>

      {/* Create Group Chat Modal */}
      {showCreateGroupModal && (
        <CreateGroupChatModal
          open={showCreateGroupModal}
          onClose={() => setShowCreateGroupModal(false)}
          onGroupCreated={handleGroupCreated}
        />
      )}
    </Box>
  );
};

export default UnifiedChat;