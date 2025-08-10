import React from 'react';
import { Box } from '@mui/material';

/**
 * WhatsApp-style chat background with subtle wallpaper pattern
 * Provides a non-distracting background for the chat window
 */
const ChatBackground = ({ variant = 'default', opacity = 0.05 }) => {
  // SVG pattern for subtle texture
  const patternSvg = `
    <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="chat-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
          <circle cx="15" cy="15" r="1" fill="currentColor" opacity="0.1"/>
          <circle cx="45" cy="15" r="1" fill="currentColor" opacity="0.1"/>
          <circle cx="30" cy="30" r="1" fill="currentColor" opacity="0.1"/>
          <circle cx="15" cy="45" r="1" fill="currentColor" opacity="0.1"/>
          <circle cx="45" cy="45" r="1" fill="currentColor" opacity="0.1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#chat-pattern)"/>
    </svg>
  `;

  const backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(patternSvg)}")`;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        backgroundImage,
        backgroundRepeat: 'repeat',
        backgroundSize: '60px 60px',
        opacity,
        pointerEvents: 'none',
        // Subtle gradient overlay for depth
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: (theme) => 
            theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, rgba(0,0,0,0.02) 0%, rgba(255,255,255,0.01) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0.01) 100%)',
        }
      }}
    />
  );
};

export default ChatBackground;