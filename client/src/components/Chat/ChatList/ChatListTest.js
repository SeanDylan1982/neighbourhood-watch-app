/**
 * Simple test component to verify ChatList is working properly
 * This helps debug chunk loading issues
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import ChatList from './ChatList';

const ChatListTest = () => {
  const mockChats = [
    {
      id: '1',
      name: 'Test Group 1',
      type: 'group',
      lastMessage: {
        content: 'Hello world',
        timestamp: new Date().toISOString()
      },
      memberCount: 5,
      unreadCount: 2
    },
    {
      id: '2',
      name: 'Test Group 2',
      type: 'group',
      lastMessage: {
        content: 'How are you?',
        timestamp: new Date().toISOString()
      },
      memberCount: 3,
      unreadCount: 0
    }
  ];

  const handleChatSelect = (chatId) => {
    console.log('Selected chat:', chatId);
  };

  return (
    <Box sx={{ p: 2, height: '400px' }}>
      <Typography variant="h6" gutterBottom>
        ChatList Test Component
      </Typography>
      <ChatList
        chatType="group"
        onChatSelect={handleChatSelect}
        selectedChatId={null}
        showSearch={true}
        maxHeight="300px"
      />
    </Box>
  );
};

export default ChatListTest;