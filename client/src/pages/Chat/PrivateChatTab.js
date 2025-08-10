import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Alert,
  useTheme,
  useMediaQuery,
  Chip,
  Stack,
  CircularProgress
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../contexts/AuthContext';
import { ChatSkeleton } from '../../components/Common/LoadingSkeleton';
import ChatWelcomeMessage from '../../components/Welcome/ChatWelcomeMessage';
import useApi from '../../hooks/useApi';

// Lazy load heavy components for better performance
const ChatList = lazy(() => import('../../components/Chat/ChatList/ChatList'));
const ChatWindow = lazy(() => import('../../components/Chat/ChatWindow/ChatWindow'));

const PrivateChatTab = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { chatId } = useParams();
  const { user } = useAuth();
  const { get } = useApi();
  const {
    chats,
    selectedChatId,
    selectedChat,
    messages,
    isLoadingChats,
    onlineUsers,
    selectChat,
    createPrivateChat,
    updateChatSettings,
    deleteChat,
    loadMessages,
    sendMessage
  } = useChat();

  const [localSelectedChatId, setLocalSelectedChatId] = useState(chatId || null);
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  // Filter chats to show only private chats
  const privateChats = chats.filter(chat => chat.type === 'private');

  // Enhance private chats with friend status and presence
  const enhancedPrivateChats = privateChats.map(chat => ({
    ...chat,
    isOnline: onlineUsers.includes(chat.participantId),
    friendStatus: friends.find(f => f._id === chat.participantId)?.status || 'unknown'
  }));

  // Load friends list
  const loadFriends = useCallback(async () => {
    if (!user) return;
    
    setLoadingFriends(true);
    try {
      const friendsData = await get('/api/users/friends');
      setFriends(Array.isArray(friendsData) ? friendsData : []);
    } catch (error) {
      console.error('Error loading friends:', error);
      setFriends([]);
    } finally {
      setLoadingFriends(false);
    }
  }, [user, get]);

  // Load friends on mount
  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  // Handle chat selection
  const handleChatSelect = useCallback((chatId) => {
    setLocalSelectedChatId(chatId);
    selectChat(chatId);
    
    // Update URL for mobile navigation
    if (isMobile) {
      navigate(`/chat/private/${chatId}`, { replace: true });
    }
  }, [selectChat, navigate, isMobile]);

  // Handle chat actions (mute, archive, delete, etc.)
  const handleChatAction = useCallback(async (chatId, action) => {
    const chat = privateChats.find(c => c.id === chatId);
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
          if (window.confirm('Are you sure you want to delete this private chat?')) {
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
          // Navigate to contact info page
          navigate(`/contacts/${chat.participantId}`);
          break;
        case 'block':
          if (window.confirm(`Are you sure you want to block ${chat.participantName}?`)) {
            // TODO: Implement block user functionality
            console.log('Block user not implemented yet');
          }
          break;
        case 'report':
          // TODO: Implement report user functionality
          console.log('Report user not implemented yet');
          break;
        default:
          console.warn('Unknown chat action:', action);
      }
    } catch (error) {
      console.error('Error performing chat action:', error);
    }
  }, [privateChats, updateChatSettings, deleteChat, localSelectedChatId, selectChat, navigate]);

  // Handle back navigation on mobile
  const handleBack = useCallback(() => {
    setLocalSelectedChatId(null);
    selectChat(null);
    navigate('/chat?tab=private', { replace: true });
  }, [selectChat, navigate]);

  // Handle starting a new private chat
  const handleStartNewChat = useCallback(() => {
    navigate('/contacts?tab=friends&action=start-chat');
  }, [navigate]);

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

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Grid container sx={{ height: '100%', flex: 1 }}>
        {/* Chat List */}
        <Grid
          item
          xs={12}
          md={4}
          sx={{
            display: { xs: localSelectedChatId ? 'none' : 'block', md: 'block' },
            height: '100%'
          }}
        >
          <Card sx={{ height: '100%', borderRadius: 0 }}>
            <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom>
                Private Messages
              </Typography>

              {/* Welcome message for new users */}
              {privateChats.length === 0 && (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChatWelcomeMessage
                    hasGroupChats={chats.some(chat => chat.type === 'group')}
                    hasPrivateChats={false}
                  />
                </Box>
              )}

              {/* Chat List */}
              {privateChats.length > 0 && (
                <Box sx={{ flex: 1, overflow: 'hidden' }}>
                  {/* Online Friends Status */}
                  {enhancedPrivateChats.some(chat => chat.isOnline) && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Online Now
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                        {enhancedPrivateChats
                          .filter(chat => chat.isOnline)
                          .slice(0, 5) // Show max 5 online friends
                          .map(chat => (
                            <Chip
                              key={chat.id}
                              label={chat.participantName}
                              size="small"
                              color="success"
                              variant="outlined"
                              onClick={() => handleChatSelect(chat.id)}
                              sx={{ cursor: 'pointer' }}
                            />
                          ))}
                      </Stack>
                    </Box>
                  )}

                  <Suspense fallback={
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress />
                    </Box>
                  }>
                    <ChatList
                      chatType="private"
                      chats={enhancedPrivateChats}
                      selectedChatId={localSelectedChatId}
                      onChatSelect={handleChatSelect}
                      onChatAction={handleChatAction}
                    />
                  </Suspense>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Chat Window */}
        <Grid
          item
          xs={12}
          md={8}
          sx={{
            display: { xs: localSelectedChatId ? 'block' : 'none', md: 'block' },
            height: '100%'
          }}
        >
          <Card sx={{ height: '100%', borderRadius: 0 }}>
            {localSelectedChatId && selectedChat ? (
              <Suspense fallback={
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              }>
                <ChatWindow
                  chat={selectedChat}
                  messages={messages}
                  onSendMessage={sendMessage}
                  onBack={isMobile ? handleBack : undefined}
                />
              </Suspense>
            ) : (
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
                    Welcome to Private Messages
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Start a private conversation with your neighbors and friends.
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="primary" 
                    sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={handleStartNewChat}
                  >
                    Browse your contacts to start chatting
                  </Typography>
                </Alert>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PrivateChatTab;