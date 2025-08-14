/**
 * Simple verification component to test ChatList loading
 * This helps verify the chunk loading issue is fixed
 */

import React from 'react';
import { Box, Typography, Alert } from '@mui/material';

const ChatListVerification = () => {
  let ChatListComponent = null;
  let loadError = null;

  try {
    // Try to import ChatList
    ChatListComponent = require('./ChatList').default;
  } catch (error) {
    loadError = error.message;
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        ChatList Component Verification
      </Typography>
      
      {loadError ? (
        <Alert severity="error">
          <Typography variant="body2">
            <strong>Error loading ChatList:</strong> {loadError}
          </Typography>
        </Alert>
      ) : (
        <Alert severity="success">
          <Typography variant="body2">
            <strong>Success!</strong> ChatList component loaded successfully.
            Component type: {typeof ChatListComponent}
          </Typography>
        </Alert>
      )}
      
      {ChatListComponent && (
        <Box sx={{ mt: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            ChatList Component Preview:
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Component is available and ready to use.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ChatListVerification;