import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../contexts/AuthContext';
import ChatWindow from '../../components/Chat/ChatWindow/ChatWindow';
import ResponsiveChatContainer from '../../components/Chat/ChatWindow/ResponsiveChatContainer';
import { ChatSkeleton } from '../../components/Common/LoadingSkeleton';
import ChatWelcomeMessage from '../../components/Welcome/ChatWelcomeMessage';
import ChatList from '../../components/Chat/ChatList/ChatList';
import ChatListErrorBoundary from '../../components/Chat/ChatList/ChatListErrorBoundary';

const GroupChatTab = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { chatId } = useParams();
  const { user } = useAuth();
  const {
    chats,
    selectedChatId,
    selectedChat,
    messages,
    isLoadingChats,
    selectChat,
    createGroupChat,
    updateChatSettings,
    deleteChat,
    loadMessages,
    sendMessage
  } = useChat();

  const [localSelectedChatId, setLocalSelectedChatId] = useState(chatId || null);

  // Filter chats to show only group chats
  const groupChats = chats.filter(chat => chat.type === 'group');

  // Handle chat selection
  const handleChatSelect = useCallback((chatId) => {
    setLocalSelectedChatId(chatId);
    selectChat(chatId);
    
    // Update URL for mobile navigation
    if (isMobile) {
      navigate(`/chat/group/${chatId}`, { replace: true });
    }
  }, [selectChat, navigate, isMobile]);

  // Handle chat actions (mute, archive, delete, etc.)
  const handleChatAction = useCallback(async (chatId, action) => {
    const chat = groupChats.find(c => c.id === chatId);
    if (!chat) return;

    try {
      switch (action) {
        case 'mute':
          await updateChatSettings(chatId, { isMuted: !chat.isMuted });
          break;
        case 'archive':
          await updateChatSettings(chatId, { isArchived: !chat.isArchived });
          break;
        case 'pin':
          await updateChatSettings(chatId, { isPinned: !chat.isPinned });
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this group chat?')) {
            await deleteChat(chatId);
            if (localSelectedChatId === chatId) {
              setLocalSelectedChatId(null);
              selectChat(null);
            }
          }
          break;
        case 'clear':
          if (window.confirm('Are you sure you want to clear all messages in this chat?')) {
            // TODO: Implement clear chat functionality
            console.log('Clear chat not implemented yet');
          }
          break;
        case 'export':
          // TODO: Implement export chat functionality
          console.log('Export chat not implemented yet');
          break;
        case 'info':
          // Navigate to group info page
          navigate(`/chat/group/${chatId}/info`);
          break;
        default:
          console.warn('Unknown chat action:', action);
      }
    } catch (error) {
      console.error('Error performing chat action:', error);
    }
  }, [groupChats, updateChatSettings, deleteChat, localSelectedChatId, selectChat, navigate]);

  // Handle back navigation on mobile
  const handleBack = useCallback(() => {
    setLocalSelectedChatId(null);
    selectChat(null);
    navigate('/chat', { replace: true });
  }, [selectChat, navigate]);

  // Initialize selected chat from URL
  useEffect(() => {
    if (chatId && chatId !== localSelectedChatId) {
      setLocalSelectedChatId(chatId);
      selectChat(chatId);
    }
  }, [chatId, localSelectedChatId, selectChat]);

  // Load messages when chat is selected
  useEffect(() => {
    if (localSelectedChatId) {
      loadMessages(localSelectedChatId);
    }
  }, [localSelectedChatId, loadMessages]);

  // Show loading state
  if (isLoadingChats) {
    return (
      <Box sx={{ p: 2, height: '100%' }}>
        <ChatSkeleton />
      </Box>
    );
  }

  // Chat List Component
  const chatListComponent = (
    <Card sx={{ height: '100%', borderRadius: 0, display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" gutterBottom>
          Group Chats
        </Typography>

        {/* Welcome message for new users */}
        {groupChats.length === 0 && (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChatWelcomeMessage
              hasGroupChats={false}
              hasPrivateChats={chats.some(chat => chat.type === 'private')}
            />
          </Box>
        )}

        {/* Chat List */}
        {groupChats.length > 0 && (
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <ChatListErrorBoundary>
              <ChatList
                chatType="group"
                chats={groupChats}
                selectedChatId={localSelectedChatId}
                onChatSelect={handleChatSelect}
                onChatAction={handleChatAction}
              />
            </ChatListErrorBoundary>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  // Message Content Component
  const messageContentComponent = localSelectedChatId && selectedChat ? (
    <ChatWindow
      chat={selectedChat}
      messages={messages}
      onSendMessage={sendMessage}
      onBack={isMobile ? handleBack : undefined}
    />
  ) : (
    <Card sx={{ height: '100%', borderRadius: 0 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          p: 3,
          textAlign: 'center'
        }}
      >
        <Alert severity="info" sx={{ width: '100%', maxWidth: 400 }}>
          <Typography variant="h6" gutterBottom>
            Welcome to Group Chats
          </Typography>
          <Typography variant="body2">
            Select a group chat from the list to start messaging, or create a new group to get started.
          </Typography>
        </Alert>
      </Box>
    </Card>
  );

  return (
    <ResponsiveChatContainer
      chatListComponent={chatListComponent}
      messageContentComponent={messageContentComponent}
      selectedChatId={localSelectedChatId}
      showChatList={true}
      showMessageContent={true}
    />
  );
};

export default GroupChatTab;