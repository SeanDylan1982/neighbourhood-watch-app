import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import EmojiRenderer from '../Common/EmojiRenderer';
import MessageInteractions from './MessageInteractions';

const GroupMessageThread = ({ 
  messages, 
  loading, 
  error, 
  groupMembers = [],
  onReplyToMessage,
  onReactToMessage 
}) => {
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const [hoveredMessage, setHoveredMessage] = useState(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    
    // If today, show "Today"
    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    }
    
    // If yesterday, show "Yesterday"
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // Otherwise show date
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Group messages by date
  const groupMessagesByDate = (messages) => {
    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid messages data:', messages);
      return [];
    }
    
    const groups = {};
    
    messages.forEach(message => {
      if (!message) {
        console.warn('Undefined or null message in messages array');
        return;
      }
      
      if (!message.createdAt && !message.time) {
        console.warn('Message missing timestamp:', message);
        return;
      }
      
      try {
        // Handle both createdAt (from API) and time (formatted) fields
        const timestamp = message.createdAt || message.time;
        const date = new Date(timestamp);
        
        if (isNaN(date.getTime())) {
          console.warn('Invalid date in message:', timestamp);
          return;
        }
        
        const dateString = date.toDateString();
        
        if (!groups[dateString]) {
          groups[dateString] = [];
        }
        
        groups[dateString].push(message);
      } catch (error) {
        console.error('Error processing message date:', error, message);
      }
    });
    
    return Object.entries(groups).map(([date, messages]) => ({
      date,
      formattedDate: formatDate(date),
      messages
    }));
  };

  // Get member info by ID
  const getMemberInfo = (senderId) => {
    if (!senderId) return null;
    
    // Handle both string IDs and object IDs
    const memberIdToFind = typeof senderId === 'object' ? senderId._id : senderId;
    
    return groupMembers.find(member => 
      member._id === memberIdToFind || member.id === memberIdToFind
    );
  };

  // Get sender display name
  const getSenderDisplayName = (message) => {
    if (!message) return 'Unknown User';
    
    // Check if it's the current user's message
    const isOwn = message.senderId && user && 
      (message.senderId === user._id || 
       message.senderId === user.id ||
       (typeof message.senderId === 'object' && message.senderId._id === user._id));
    
    if (isOwn) {
      return 'You';
    }
    
    // Try to get name from message.senderName first
    if (message.senderName && message.senderName !== 'Unknown User') {
      return message.senderName;
    }
    
    // Try to get from sender object if available
    if (typeof message.senderId === 'object' && message.senderId.firstName) {
      return `${message.senderId.firstName} ${message.senderId.lastName || ''}`.trim();
    }
    
    // Try to get from group members
    const memberInfo = getMemberInfo(message.senderId);
    if (memberInfo) {
      return `${memberInfo.firstName} ${memberInfo.lastName || ''}`.trim();
    }
    
    return 'Unknown User';
  };

  // Get sender avatar
  const getSenderAvatar = (message) => {
    // Try to get from sender object first
    if (typeof message.senderId === 'object' && message.senderId.profileImageUrl) {
      return message.senderId.profileImageUrl;
    }
    
    // Try to get from group members
    const memberInfo = getMemberInfo(message.senderId);
    return memberInfo?.profileImageUrl || null;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load messages. Please try again.
      </Alert>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        p: 3,
        textAlign: 'center'
      }}>
        <Typography variant="body1" color="text.secondary">
          No messages yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Send a message to start the conversation
        </Typography>
      </Box>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <Box sx={{ 
      flex: 1, 
      overflow: 'auto', 
      p: 2,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {messageGroups.map((group, groupIndex) => (
        <Box key={group.date}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            my: 2 
          }}>
            <Typography 
              variant="caption" 
              sx={{ 
                bgcolor: 'background.default', 
                px: 2, 
                py: 0.5, 
                borderRadius: 4,
                color: 'text.secondary'
              }}
            >
              {group.formattedDate}
            </Typography>
          </Box>
          
          {group.messages.map((msg, msgIndex) => {
            if (!msg || (!msg._id && !msg.id)) {
              console.warn('Invalid message object:', msg);
              return null;
            }
            
            const messageId = msg._id || msg.id;
            const isOwn = msg.senderId && user && 
              (msg.senderId === user._id || 
               msg.senderId === user.id ||
               (typeof msg.senderId === 'object' && msg.senderId._id === user._id) ||
               msg.isOwn === true);
            
            const senderName = getSenderDisplayName(msg);
            const senderAvatar = getSenderAvatar(msg);
            
            // Show avatar for non-own messages and when sender changes
            const showAvatar = !isOwn && 
              (msgIndex === 0 || 
               getSenderDisplayName(group.messages[msgIndex - 1]) !== senderName);
            
            return (
              <Box
                key={messageId}
                sx={{
                  display: 'flex',
                  justifyContent: isOwn ? 'flex-end' : 'flex-start',
                  mb: 1.5,
                  position: 'relative'
                }}
                onMouseEnter={() => setHoveredMessage(messageId)}
                onMouseLeave={() => setHoveredMessage(null)}
              >
                {!isOwn && (
                  <Box sx={{ mr: 1, width: 36, height: 36, alignSelf: 'flex-end' }}>
                    {showAvatar ? (
                      <Avatar 
                        src={senderAvatar} 
                        alt={senderName}
                        sx={{ width: 36, height: 36 }}
                      >
                        {senderName.charAt(0).toUpperCase()}
                      </Avatar>
                    ) : null}
                  </Box>
                )}
                
                <Box sx={{ position: 'relative', maxWidth: '70%' }}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor: isOwn ? 'primary.main' : 'grey.100',
                      color: isOwn ? 'primary.contrastText' : 'text.primary',
                      borderTopRightRadius: isOwn ? 0 : 2,
                      borderTopLeftRadius: !isOwn ? 0 : 2,
                      transition: 'box-shadow 0.2s ease',
                      '&:hover': {
                        boxShadow: 2,
                      }
                    }}
                  >
                    {/* Show sender name for group messages (except own messages) */}
                    {!isOwn && senderName !== 'You' && (
                      <Typography 
                        variant="caption" 
                        fontWeight="bold" 
                        sx={{ 
                          display: 'block', 
                          mb: 0.5,
                          color: 'primary.main'
                        }}
                      >
                        {senderName}
                      </Typography>
                    )}
                    
                    <Typography variant="body1" component="div">
                      <EmojiRenderer 
                        content={msg.content || msg.message || '(No content)'} 
                        size={20} 
                      />
                    </Typography>
                    
                    {/* Message timestamp */}
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        opacity: 0.7, 
                        display: 'block', 
                        textAlign: isOwn ? 'right' : 'left',
                        mt: 0.5
                      }}
                    >
                      {msg.time || (msg.createdAt && new Date(msg.createdAt).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      }))}
                    </Typography>
                  </Paper>

                  {/* Message Interactions */}
                  <MessageInteractions
                    messageId={messageId}
                    isVisible={hoveredMessage === messageId}
                    isOwnMessage={isOwn}
                    existingReactions={msg.reactions || []}
                    currentUserId={user?._id || user?.id}
                    onReply={onReplyToMessage}
                    onReact={onReactToMessage}
                  />
                </Box>
              </Box>
            );
          })}
        </Box>
      ))}
      <div ref={messagesEndRef} />
    </Box>
  );
};

export default GroupMessageThread;