import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { useResponsive } from '../../../hooks/useResponsive';
import './ResponsiveChatLayout.css';

/**
 * Responsive chat layout component that fits within existing container layouts
 * and provides auto-scroll functionality for chat messages
 */
const ResponsiveChatLayout = ({
  children,
  chatId,
  autoScrollToBottom = true,
  className = '',
  ...props
}) => {
  const theme = useTheme();
  const { isMobile, getResponsiveValue } = useResponsive();
  const isMobileView = useMediaQuery(theme.breakpoints.down('md'));
  
  const containerRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize component
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Auto-scroll to bottom when chat changes (if enabled)
  useEffect(() => {
    if (autoScrollToBottom && chatId && isInitialized) {
      // Find the messages container and scroll to bottom
      const messagesContainer = containerRef.current?.querySelector('[data-messages-container]');
      if (messagesContainer) {
        // Use setTimeout to ensure DOM is updated
        setTimeout(() => {
          messagesContainer.scrollTo({
            top: messagesContainer.scrollHeight,
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  }, [chatId, autoScrollToBottom, isInitialized]);

  // Responsive padding and spacing
  const containerPadding = getResponsiveValue(0, 0, 0); // No padding to avoid layout conflicts
  const containerGap = getResponsiveValue(0, 0, 0);

  return (
    <Box
      ref={containerRef}
      className={`responsive-chat-layout ${className}`}
      sx={{
        height: '100%', // Use full height of parent container
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        
        // Minimal padding to avoid conflicts
        p: containerPadding,
        gap: containerGap,
        
        // Ensure proper box sizing
        boxSizing: 'border-box',
        
        // Prevent content overflow
        '& > *': {
          minHeight: 0, // Allow flex children to shrink
        },
        
        // Custom scrollbar styling for child elements
        '& .scrollable-section': {
          overflowY: 'auto',
          overflowX: 'hidden',
          
          // Custom scrollbar
          '&::-webkit-scrollbar': {
            width: isMobileView ? '4px' : '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme.palette.mode === 'dark' 
              ? 'rgba(255,255,255,0.2)' 
              : 'rgba(0,0,0,0.2)',
            borderRadius: '3px',
            '&:hover': {
              background: theme.palette.mode === 'dark' 
                ? 'rgba(255,255,255,0.3)' 
                : 'rgba(0,0,0,0.3)',
            },
          },
          
          // Smooth scrolling
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch', // iOS smooth scrolling
        },
        
        // Ensure proper touch handling on mobile
        ...(isMobileView && {
          touchAction: 'pan-y',
          WebkitOverflowScrolling: 'touch',
        }),
        
        ...props.sx
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

export default ResponsiveChatLayout;