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
import MessageStatus from './MessageStatus';
import EmojiRenderer from '../Common/EmojiRenderer';
import MessageInteractions from './MessageInteractions';

const PrivateMessageThread = ({ 
  messages, 
  loading, 
  error, 
  otherUser,
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
      
      if (!message.createdAt) {
        console.warn('Message missing createdAt timestamp:', message);
        return;
      }
      
      try {
        const date = new Date(message.createdAt);
        if (isNaN(date.getTime())) {
          console.warn('Invalid date in message:', message.createdAt);
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
            if (!msg || !msg._id) {
              console.warn('Invalid message object:', msg);
              return null;
            }
            
            const isOwn = msg.senderId && user && msg.senderId._id === user._id;
            
            // Safely check previous message sender
            const showAvatar = !isOwn && 
              (msgIndex === 0 || 
               (group.messages[msgIndex - 1]?.senderId && 
                msg.senderId && 
                group.messages[msgIndex - 1].senderId._id !== msg.senderId._id));
            
            return (
              <Box
                key={msg._id}
                sx={{
                  display: 'flex',
                  justifyContent: isOwn ? 'flex-end' : 'flex-start',
                  mb: 1.5,
                  position: 'relative'
                }}
                onMouseEnter={() => setHoveredMessage(msg._id)}
                onMouseLeave={() => setHoveredMessage(null)}
              >
                {!isOwn && (
                  <Box sx={{ mr: 1, width: 36, height: 36, alignSelf: 'flex-end' }}>
                    {showAvatar ? (
                      <Avatar 
                        src={otherUser?.profileImageUrl} 
                        alt={otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'User'}
                        sx={{ width: 36, height: 36 }}
                      />
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
                    <Typography variant="body1" component="div">
                      <EmojiRenderer 
                        content={msg.content || '(No content)'} 
                        size={20} 
                      />
                    </Typography>
                    
                    {isOwn && (
                      <MessageStatus status={msg.status} timestamp={msg.createdAt} />
                    )}
                    
                    {!isOwn && msg.createdAt && (
                      <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', textAlign: 'right' }}>
                        {new Date(msg.createdAt).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        })}
                      </Typography>
                    )}
                  </Paper>

                  {/* Message Interactions */}
                  <MessageInteractions
                    messageId={msg._id}
                    isVisible={hoveredMessage === msg._id}
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

export default PrivateMessageThread;