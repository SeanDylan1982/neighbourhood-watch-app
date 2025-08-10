import React, { useState, useEffect } from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Badge,
  Typography,
  Box,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import icons from '../../components/Common/Icons';
import useApi from '../../hooks/useApi';

const PrivateChatList = ({ onSelectChat, selectedChatId }) => {
  const { loading, error, get } = useApi();
  const [privateChats, setPrivateChats] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  const fetchPrivateChats = async () => {
    try {
      const data = await get('/api/private-chat');
      // Ensure data is an array
      if (Array.isArray(data)) {
        setPrivateChats(data);
      } else {
        console.error('Expected array but got:', typeof data, data);
        setPrivateChats([]);
      }
    } catch (error) {
      console.error('Error fetching private chats:', error);
      setPrivateChats([]);
    } finally {
      setDataLoaded(true);
    }
  };
  
  useEffect(() => {
    fetchPrivateChats();
  }, []); // Remove fetchPrivateChats dependency to prevent infinite loop

  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    
    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    }
    
    // If this year, show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
    
    // Otherwise show date
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading && !dataLoaded) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load chats. Please try again.
      </Alert>
    );
  }

  if (!Array.isArray(privateChats) || privateChats.length === 0) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        No private conversations yet. Start a chat with a friend!
      </Alert>
    );
  }

  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
      {privateChats.map((chat) => (
        <React.Fragment key={chat._id}>
          <ListItem
            button
            selected={selectedChatId === chat._id}
            onClick={() => onSelectChat(chat._id)}
            sx={{
              borderRadius: 1,
              '&.Mui-selected': {
                backgroundColor: 'primary.light',
                color: 'primary.contrastText',
              },
            }}
          >
            <ListItemAvatar>
              <Badge 
                color="success" 
                variant="dot" 
                invisible={chat.otherParticipant?.status !== 'online'}
              >
                <Avatar 
                  src={chat.otherParticipant?.profileImageUrl} 
                  alt={chat.otherParticipant ? `${chat.otherParticipant.firstName} ${chat.otherParticipant.lastName}` : 'User'}
                >
                  <icons.Person />
                </Avatar>
              </Badge>
            </ListItemAvatar>
            <ListItemText
              primary={chat.otherParticipant ? `${chat.otherParticipant.firstName} ${chat.otherParticipant.lastName}` : 'Unknown User'}
              secondary={
                <Box>
                  <Typography 
                    variant="body2" 
                    noWrap 
                    sx={{ 
                      fontWeight: chat.unreadCount > 0 ? 'bold' : 'normal',
                      color: chat.unreadCount > 0 ? 'text.primary' : 'text.secondary'
                    }}
                  >
                    {chat.lastMessage?.content || 'Start a conversation'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatTime(chat.updatedAt)}
                  </Typography>
                </Box>
              }
            />
            {chat.unreadCount > 0 && (
              <Badge 
                badgeContent={chat.unreadCount} 
                color="primary"
                sx={{ ml: 1 }}
              />
            )}
          </ListItem>
          <Divider variant="inset" component="li" />
        </React.Fragment>
      ))}
    </List>
  );
};

export default PrivateChatList;