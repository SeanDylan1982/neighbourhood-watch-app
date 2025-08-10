import React from 'react';
import { Box, Typography, Paper, Fade } from '@mui/material';
import { keyframes } from '@mui/system';

/**
 * Typing indicator component with animated dots
 * Shows when other users are typing in the chat
 * Enhanced with better animations and responsive design
 */
const TypingIndicator = ({ users = [], chatType = 'group' }) => {
  // Animation for the typing dots
  const typingAnimation = keyframes`
    0%, 60%, 100% {
      transform: translateY(0);
      opacity: 0.4;
    }
    30% {
      transform: translateY(-8px);
      opacity: 1;
    }
  `;

  // Pulse animation for the container
  const pulseAnimation = keyframes`
    0% {
      opacity: 0.8;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0.8;
    }
  `;

  if (users.length === 0) return null;

  // Format user names for display
  const formatUserNames = (users) => {
    if (users.length === 1) {
      return `${users[0].name} is typing`;
    } else if (users.length === 2) {
      return `${users[0].name} and ${users[1].name} are typing`;
    } else {
      return `${users[0].name} and ${users.length - 1} others are typing`;
    }
  };

  return (
    <Fade in={true} timeout={300}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-start',
          mb: 1,
          px: 1
        }}
      >
        <Paper
          data-testid="typing-indicator"
          elevation={1}
          sx={(theme) => ({
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1.5,
            borderRadius: '18px',
            bgcolor: theme.palette.mode === 'dark' ? '#262d31' : '#e5e5ea',
            color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
            maxWidth: '70%',
            minWidth: '80px',
            animation: `${pulseAnimation} 2s infinite ease-in-out`,
            // WhatsApp-style tail for received messages
            '&::before': {
              content: '""',
              position: 'absolute',
              bottom: 2,
              left: -6,
              width: 0,
              height: 0,
              borderRight: `6px solid ${theme.palette.mode === 'dark' ? '#262d31' : '#e5e5ea'}`,
              borderBottom: '6px solid transparent'
            },
            // Responsive design
            [theme.breakpoints.down('sm')]: {
              px: 1.5,
              py: 1,
              maxWidth: '80%'
            }
          })}
        >
          {/* Typing text */}
          <Typography
            variant="body2"
            sx={(theme) => ({
              fontSize: '0.875rem',
              opacity: 0.9,
              fontWeight: 400,
              [theme.breakpoints.down('sm')]: {
                fontSize: '0.8rem'
              }
            })}
          >
            {formatUserNames(users)}
          </Typography>

          {/* Animated dots */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              ml: 0.5
            }}
          >
            {[0, 1, 2].map((index) => (
              <Box
                key={index}
                sx={(theme) => ({
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: theme.palette.mode === 'dark' ? '#ffffff' : '#666666',
                  animation: `${typingAnimation} 1.4s infinite ease-in-out`,
                  animationDelay: `${index * 0.2}s`,
                  [theme.breakpoints.down('sm')]: {
                    width: 5,
                    height: 5
                  }
                })}
              />
            ))}
          </Box>
        </Paper>
      </Box>
    </Fade>
  );
};

export default TypingIndicator;