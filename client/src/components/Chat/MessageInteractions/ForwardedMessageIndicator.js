import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { Forward as ForwardIcon } from '@mui/icons-material';

/**
 * ForwardedMessageIndicator Component
 * 
 * Displays an indicator when a message has been forwarded from another chat.
 * Shows the original sender information and forwarded status.
 * 
 * Features:
 * - Visual forwarded indicator
 * - Original sender attribution
 * - Consistent styling with WhatsApp-like design
 */
const ForwardedMessageIndicator = ({
  originalSender = null,
  originalChatName = null,
  forwardedBy = null,
  forwardedAt = null,
  variant = 'default', // 'default' | 'compact'
  className = ''
}) => {
  // Don't render if no forwarding information
  if (!originalSender && !forwardedBy) {
    return null;
  }

  const formatForwardedText = () => {
    if (originalSender && originalChatName) {
      return `Forwarded from ${originalSender} in ${originalChatName}`;
    } else if (originalSender) {
      return `Forwarded from ${originalSender}`;
    } else if (forwardedBy) {
      return `Forwarded by ${forwardedBy}`;
    }
    return 'Forwarded message';
  };

  if (variant === 'compact') {
    return (
      <Box
        className={className}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          mb: 0.5,
          opacity: 0.7
        }}
      >
        <ForwardIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            fontSize: '0.75rem',
            fontStyle: 'italic'
          }}
        >
          Forwarded
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      className={className}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        mb: 1,
        p: 1,
        bgcolor: 'action.hover',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <ForwardIcon sx={{ fontSize: 16, color: 'primary.main' }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="caption"
          color="primary.main"
          sx={{
            fontWeight: 600,
            display: 'block',
            lineHeight: 1.2
          }}
        >
          Forwarded Message
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            fontSize: '0.7rem',
            display: 'block',
            lineHeight: 1.2,
            mt: 0.25
          }}
        >
          {formatForwardedText()}
        </Typography>
        {forwardedAt && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              fontSize: '0.65rem',
              display: 'block',
              lineHeight: 1.2,
              mt: 0.25,
              opacity: 0.8
            }}
          >
            {new Date(forwardedAt).toLocaleString()}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default ForwardedMessageIndicator;