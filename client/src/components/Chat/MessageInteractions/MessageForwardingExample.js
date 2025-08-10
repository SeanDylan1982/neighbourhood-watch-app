import React, { useState } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import MessageForwardingWrapper from './MessageForwardingWrapper';
import MessageBubble from '../ChatWindow/MessageBubble';
import { CHAT_TYPES } from '../../../constants/chat';

/**
 * MessageForwardingExample Component
 * 
 * Example implementation showing how to use the message forwarding system.
 * This demonstrates the integration between MessageBubble, MessageForwardingWrapper,
 * and the forwarding dialog.
 */
const MessageForwardingExample = () => {
  const [forwardedMessages, setForwardedMessages] = useState([]);

  // Example messages
  const exampleMessages = [
    {
      id: 'msg1',
      content: 'Hello everyone! How is your day going?',
      type: 'text',
      senderId: 'user1',
      senderName: 'John Doe',
      timestamp: new Date('2024-01-01T10:00:00Z'),
      chatId: 'chat1',
      chatName: 'General Chat'
    },
    {
      id: 'msg2',
      content: '🖼️ Photo',
      type: 'image',
      senderId: 'user2',
      senderName: 'Jane Smith',
      timestamp: new Date('2024-01-01T10:05:00Z'),
      chatId: 'chat1',
      chatName: 'General Chat',
      attachments: [{ type: 'image', url: '/example.jpg', filename: 'example.jpg' }]
    },
    {
      id: 'msg3',
      content: 'This is a forwarded message from another chat',
      type: 'text',
      senderId: 'user3',
      senderName: 'Bob Wilson',
      timestamp: new Date('2024-01-01T10:10:00Z'),
      chatId: 'chat2',
      chatName: 'Work Chat',
      isForwarded: true,
      forwardedFrom: {
        messageId: 'original-msg',
        originalSenderId: 'user4',
        originalSenderName: 'Alice Brown',
        originalChatId: 'chat3',
        originalChatName: 'Project Team',
        forwardedBy: 'user3',
        forwardedByName: 'Bob Wilson',
        forwardedAt: new Date('2024-01-01T10:10:00Z')
      }
    }
  ];

  // Handle successful forwarding
  const handleForwardComplete = (message, targetChats, result) => {
    console.log('Message forwarded successfully:', { message, targetChats, result });
    
    // Add to forwarded messages list for demonstration
    const newForwardedMessage = {
      ...message,
      id: `forwarded-${Date.now()}`,
      isForwarded: true,
      forwardedFrom: {
        messageId: message.id,
        originalSenderId: message.senderId,
        originalSenderName: message.senderName,
        originalChatId: message.chatId,
        originalChatName: message.chatName,
        forwardedBy: 'current-user',
        forwardedByName: 'Current User',
        forwardedAt: new Date()
      },
      targetChats: targetChats.map(chat => chat.name).join(', ')
    };
    
    setForwardedMessages(prev => [...prev, newForwardedMessage]);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Message Forwarding System Example
      </Typography>
      
      <Typography variant="body1" paragraph>
        This example demonstrates the message forwarding functionality. Click on any message
        to see the context menu, then select "Forward" to open the forwarding dialog.
      </Typography>

      {/* Original Messages */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Original Messages
        </Typography>
        <MessageForwardingWrapper
          messages={exampleMessages}
          onForwardComplete={handleForwardComplete}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {exampleMessages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={index % 2 === 0} // Alternate between own and others' messages
                chatType={CHAT_TYPES.GROUP}
                currentUserId="current-user"
                showSender={true}
                showTime={true}
              />
            ))}
          </Box>
        </MessageForwardingWrapper>
      </Paper>

      {/* Forwarded Messages */}
      {forwardedMessages.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Forwarded Messages (Demo)
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            These messages show how forwarded messages would appear with attribution.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {forwardedMessages.map((message, index) => (
              <Box key={message.id}>
                <MessageBubble
                  message={message}
                  isOwn={true}
                  chatType={CHAT_TYPES.GROUP}
                  currentUserId="current-user"
                  showSender={true}
                  showTime={true}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Forwarded to: {message.targetChats}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* Instructions */}
      <Paper sx={{ p: 2, mt: 3, bgcolor: 'info.light' }}>
        <Typography variant="h6" gutterBottom>
          How to Use
        </Typography>
        <Typography variant="body2" component="div">
          <ol>
            <li>Right-click (desktop) or long-press (mobile) on any message above</li>
            <li>Select "Forward" from the context menu</li>
            <li>Choose one or more chats to forward the message to</li>
            <li>Click "Forward" to complete the action</li>
            <li>The forwarded message will appear in the demo section below</li>
          </ol>
        </Typography>
      </Paper>
    </Box>
  );
};

export default MessageForwardingExample;