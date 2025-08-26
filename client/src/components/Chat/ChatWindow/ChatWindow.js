import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, IconButton, Tooltip } from '@mui/material';
import { Info as InfoIcon, Search as SearchIcon } from '@mui/icons-material';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChatBackground from './ChatBackground';
import ChatSidebar from '../Common/ChatSidebar';
import InChatSearchBar from '../Common/InChatSearchBar';
import OfflineIndicator from '../Common/OfflineIndicator';
import MessageForwardDialog from '../MessageInteractions/MessageForwardDialog';
import { useChat } from '../../../hooks/useChat';
import { useSocket } from '../../../contexts/SocketContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useDesktopFeatures } from '../../../hooks/useResponsive';
import { useChatKeyboard } from '../../../hooks/useVirtualKeyboard';
import useInChatSearch from '../../../hooks/useInChatSearch';
import useOfflineManager from '../../../hooks/useOfflineManager';
import useMessageForwarding from '../../../hooks/useMessageForwarding';
import { useToast } from '../../../contexts/ToastContext';

/**
 * Unified ChatWindow component that works for both group and private chats
 * Implements WhatsApp-style design with subtle wallpaper background
 * Includes offline functionality with message queuing and caching
 */
const ChatWindow = ({ 
  chat, 
  messages = [], 
  onSendMessage, 
  onReaction, 
  onReply, 
  onMessageAction,
  className = '',
  showSidebar = false,
  onSidebarToggle,
  ...props 
}) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { features } = useDesktopFeatures();
  const { showToast } = useToast();
  const { forwardMessage, isForwarding } = useMessageForwarding();
  const [typingUsers, setTypingUsers] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(showSidebar && features.sidebar);
  const [displayMessages, setDisplayMessages] = useState(messages);
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutsRef = useRef({});

  // Unified offline functionality
  const offlineManager = useOfflineManager(chat?.id, onSendMessage);
  
  // In-chat search functionality
  const {
    isSearchVisible,
    searchResults,
    currentResultIndex,
    highlightedMessageId,
    searchQuery,
    showSearch,
    hideSearch,
    toggleSearch,
    handleSearchResults,
    highlightMessage,
    registerMessageRef,
    isMessageHighlighted,
    getHighlightedText
  } = useInChatSearch(messages);
  
  // Virtual keyboard handling for mobile
  const keyboard = useChatKeyboard({
    messagesContainerRef,
    inputRef,
    autoScrollToBottom: true
  });

  // Load messages when chat changes
  useEffect(() => {
    if (!chat?.id) return;

    // Load messages for the selected chat
    const loadChatMessages = async () => {
      try {
        // Use the loadMessages function from useChat hook
        const chatMessages = await fetch(`/api/chat/${chat.type === 'group' ? 'groups' : 'private'}/${chat.id}/messages`)
          .then(res => res.ok ? res.json() : [])
          .catch(() => {
            // Generate mock messages for demonstration
            return [
              {
                id: `${chat.id}-msg-1`,
                content: chat.type === 'group' ? 'Welcome to the group chat!' : 'Hello! 👋',
                senderId: chat.type === 'group' ? 'system' : (chat.participantId || 'other-user'),
                senderName: chat.type === 'group' ? 'System' : (chat.participantName || 'Friend'),
                timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
                type: 'text',
                status: 'read',
                reactions: [],
                attachments: []
              },
              {
                id: `${chat.id}-msg-2`,
                content: chat.type === 'group' ? 'Hello everyone! 👋' : 'How are you doing?',
                senderId: chat.type === 'group' ? `${chat.id}-member-1` : (chat.participantId || 'other-user'),
                senderName: chat.type === 'group' ? 'John Doe' : (chat.participantName || 'Friend'),
                timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
                type: 'text',
                status: 'read',
                reactions: [],
                attachments: []
              },
              {
                id: `${chat.id}-msg-3`,
                content: 'This is a sample message to show the chat interface working!',
                senderId: user?.id || user?._id,
                senderName: user?.name || `${user?.firstName} ${user?.lastName}` || 'You',
                timestamp: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
                type: 'text',
                status: 'sent',
                reactions: [],
                attachments: []
              }
            ];
          });
        
        setDisplayMessages(chatMessages);
      } catch (error) {
        console.error('Error loading messages:', error);
        setDisplayMessages([]);
      }
    };

    loadChatMessages();
  }, [chat?.id, chat?.type, chat?.participantId, chat?.participantName, user]);

  // Sync messages with offline manager
  useEffect(() => {
    if (!chat?.id) return;

    // Get merged messages from offline manager
    const mergedMessages = offlineManager.getMergedMessages(messages);
    setDisplayMessages(mergedMessages);
    
    // Cache server messages
    if (messages.length > 0) {
      offlineManager.cacheMessages(messages);
    }
  }, [messages, chat?.id, offlineManager]);

  // Handle retry message
  const handleRetryMessage = (messageId) => {
    offlineManager.retryMessage(messageId);
  };

  // Handle remove failed message
  const handleRemoveFailedMessage = (messageId) => {
    offlineManager.removeFromQueue(messageId);
    // Update display messages
    setDisplayMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  // Handle retry all failed messages
  const handleRetryAllFailed = () => {
    offlineManager.processQueue();
  };

  // Handle clear all failed messages
  const handleClearAllFailed = () => {
    offlineManager.clearFailedMessages();
    // Update display messages
    setDisplayMessages(prev => prev.filter(msg => msg.status !== 'failed'));
  };

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    if (keyboard.isKeyboardOpen) {
      keyboard.scrollToBottom();
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, keyboard, scrollToBottom]);

  // Handle typing indicators
  useEffect(() => {
    if (!socket || !chat?.id) return;

    const handleUserTyping = (data) => {
      if (data.chatId === chat.id || data.groupId === chat.id) {
        setTypingUsers(prev => ({
          ...prev,
          [data.userId]: {
            name: data.userName,
            timestamp: Date.now()
          }
        }));

        // Clear typing indicator after 3 seconds
        if (typingTimeoutsRef.current[data.userId]) {
          clearTimeout(typingTimeoutsRef.current[data.userId]);
        }

        typingTimeoutsRef.current[data.userId] = setTimeout(() => {
          setTypingUsers(prev => {
            const updated = { ...prev };
            delete updated[data.userId];
            return updated;
          });
        }, 3000);
      }
    };

    const handleUserStoppedTyping = (data) => {
      if (data.chatId === chat.id || data.groupId === chat.id) {
        setTypingUsers(prev => {
          const updated = { ...prev };
          delete updated[data.userId];
          return updated;
        });

        if (typingTimeoutsRef.current[data.userId]) {
          clearTimeout(typingTimeoutsRef.current[data.userId]);
        }
      }
    };

    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);

    return () => {
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);

      // Clear all typing timeouts
      Object.values(typingTimeoutsRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, [socket, chat?.id]);

  // Handle message sending with offline support
  const handleSendMessage = async (content, attachments = []) => {
    try {
      const messageData = {
        chatId: chat.id,
        content,
        type: attachments.length > 0 ? 'attachment' : 'text',
        attachments,
        replyTo: replyingTo,
        senderName: user?.name || user?.firstName + ' ' + user?.lastName
      };

      const result = await offlineManager.sendMessage(messageData);
      
      // If message was queued, update display messages
      if (result.isQueued) {
        const queuedMessage = {
          ...result,
          id: result.id,
          senderId: user?.id || user?._id,
          senderName: messageData.senderName,
          timestamp: new Date(result.queuedAt),
          status: 'queued',
          isQueued: true
        };
        
        setDisplayMessages(prev => [...prev, queuedMessage]);
      }
      
      setReplyingTo(null);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Show error to user
      if (onMessageAction) {
        onMessageAction(null, 'show_error', { message: error.message });
      }
    }
  };

  // Handle reply to message
  const handleReplyToMessage = (messageId) => {
    const messageToReplyTo = messages.find(msg => msg.id === messageId);
    if (messageToReplyTo) {
      setReplyingTo({
        id: messageId,
        content: messageToReplyTo.content || messageToReplyTo.message,
        senderName: messageToReplyTo.senderName || messageToReplyTo.sender
      });
    }
  };

  // Handle cancel reply
  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  // Handle forward message
  const handleForwardMessage = (messageId) => {
    const messageToForward = messages.find(msg => msg.id === messageId);
    if (messageToForward) {
      setMessageToForward(messageToForward);
      setForwardDialogOpen(true);
    }
  };

  // Handle forward dialog close
  const handleForwardDialogClose = () => {
    setForwardDialogOpen(false);
    setMessageToForward(null);
  };

  // Handle forward confirmation
  const handleForwardConfirm = async (message, targetChats) => {
    try {
      await forwardMessage(message, targetChats);
      showToast('Message forwarded successfully', 'success');
      handleForwardDialogClose();
    } catch (error) {
      console.error('Failed to forward message:', error);
      showToast(error.message || 'Failed to forward message', 'error');
    }
  };

  // Handle sidebar toggle
  const handleSidebarToggle = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    if (onSidebarToggle) {
      onSidebarToggle(newState);
    }
  };

  // Handle sidebar actions
  const handleSidebarAction = (action, data) => {
    if (onMessageAction) {
      onMessageAction(null, action, data);
    }
  };

  // Handle typing events
  const handleTyping = () => {
    if (socket && chat?.id) {
      socket.emit('typing_start', chat.id);
    }
  };

  const handleStopTyping = () => {
    if (socket && chat?.id) {
      socket.emit('typing_stop', chat.id);
    }
  };

  if (!chat) {
    return (
      <Box 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'text.secondary'
        }}
      >
        Select a chat to start messaging
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', position: 'relative' }}>
      {/* Main Chat Window */}
      <Paper 
        elevation={1}
        className={className}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          bgcolor: 'background.paper',
          flex: 1,
          ...props.sx
        }}
        {...props}
      >
        {/* WhatsApp-style background */}
        <ChatBackground />
        
        {/* Chat Header */}
        <ChatHeader 
          chat={chat}
          onAction={(action) => {
            if (onMessageAction) {
              onMessageAction(null, action);
            }
          }}
          rightActions={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Tooltip title="Search in chat">
                <IconButton 
                  onClick={toggleSearch}
                  sx={{ 
                    color: isSearchVisible ? 'primary.main' : 'inherit',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <SearchIcon />
                </IconButton>
              </Tooltip>
              {features.sidebar && (
                <Tooltip title="Chat Info">
                  <IconButton 
                    onClick={handleSidebarToggle}
                    sx={{ 
                      color: sidebarOpen ? 'primary.main' : 'inherit',
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                  >
                    <InfoIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          }
        />

        {/* In-Chat Search Bar */}
        <InChatSearchBar
          messages={displayMessages}
          onSearchResults={handleSearchResults}
          onHighlightMessage={highlightMessage}
          onClose={hideSearch}
          isVisible={isSearchVisible}
        />

        {/* Offline Indicator */}
        <OfflineIndicator
          isOnline={offlineManager.isOnline}
          queueStats={offlineManager.queueStats}
          onRetryAll={handleRetryAllFailed}
          onClearFailed={handleClearAllFailed}
        />
        
        {/* Messages Container */}
        <Box 
          ref={messagesContainerRef}
          sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            position: 'relative',
            zIndex: 1,
            overflow: 'hidden',
            // Adjust height when virtual keyboard is open
            ...(keyboard.isKeyboardOpen && features.isMobile && {
              height: `${keyboard.viewportHeight - 120}px`, // Account for header and input
              maxHeight: `${keyboard.viewportHeight - 120}px`
            })
          }}
        >
          <MessageList
            messages={displayMessages}
            currentUserId={user?.id || user?._id}
            chatType={chat.type}
            typingUsers={typingUsers}
            onReaction={onReaction}
            onReply={handleReplyToMessage}
            onMessageAction={(messageId, action, data) => {
              // Handle retry and remove actions for failed messages
              if (action === 'retry_message') {
                handleRetryMessage(messageId);
              } else if (action === 'remove_failed_message') {
                handleRemoveFailedMessage(messageId);
              } else if (action === 'forward') {
                handleForwardMessage(messageId);
              } else if (action === 'scroll_to_message') {
                // Handle scrolling to replied message
                const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
                if (messageElement) {
                  messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              } else if (onMessageAction) {
                onMessageAction(messageId, action, data);
              }
            }}
            searchQuery={searchQuery}
            highlightedMessageId={highlightedMessageId}
            onRegisterMessageRef={registerMessageRef}
            offlineMode={!offlineManager.isOnline}
          />
          
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </Box>
        
        {/* Message Input */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            // Ensure input stays above keyboard on mobile
            ...(keyboard.isKeyboardOpen && features.isMobile && {
              position: 'sticky',
              bottom: 0,
              backgroundColor: 'background.paper',
              borderTop: '1px solid',
              borderColor: 'divider'
            })
          }}
        >
          <MessageInput
            ref={inputRef}
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
            onStopTyping={handleStopTyping}
            replyingTo={replyingTo}
            onCancelReply={handleCancelReply}
            chatType={chat.type}
            onFocus={keyboard.ensureInputVisible}
          />
        </Box>
      </Paper>

      {/* Desktop Sidebar */}
      {features.sidebar && (
        <ChatSidebar
          chat={chat}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onAction={handleSidebarAction}
        />
      )}

      {/* Message Forward Dialog */}
      <MessageForwardDialog
        open={forwardDialogOpen}
        onClose={handleForwardDialogClose}
        message={messageToForward}
        onForward={handleForwardConfirm}
      />
    </Box>
  );
};

export default ChatWindow;