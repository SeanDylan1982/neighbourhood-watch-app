import React, { useRef, useEffect, useState } from 'react';
import { Box, Grid, useTheme, useMediaQuery } from '@mui/material';
import { useResponsive } from '../../../hooks/useResponsive';

/**
 * Responsive container for chat interface with independent scrolling areas
 * Handles the layout between chat list and message content windows
 */
const ResponsiveChatContainer = ({
  chatListComponent,
  messageContentComponent,
  selectedChatId,
  showChatList = true,
  showMessageContent = true,
  onChatListScroll,
  onMessageContentScroll,
  className = '',
  ...props
}) => {
  const theme = useTheme();
  const { getResponsiveValue } = useResponsive();
  const isMobileView = useMediaQuery(theme.breakpoints.down('md'));
  
  const chatListRef = useRef(null);
  const messageContentRef = useRef(null);
  const [chatListScrollTop, setChatListScrollTop] = useState(0);
  const [messageContentScrollTop, setMessageContentScrollTop] = useState(0);

  // Handle independent scrolling for chat list
  const handleChatListScroll = (event) => {
    const scrollTop = event.target.scrollTop;
    setChatListScrollTop(scrollTop);
    
    if (onChatListScroll) {
      onChatListScroll(event, scrollTop);
    }
  };

  // Handle independent scrolling for message content
  const handleMessageContentScroll = (event) => {
    const scrollTop = event.target.scrollTop;
    setMessageContentScrollTop(scrollTop);
    
    if (onMessageContentScroll) {
      onMessageContentScroll(event, scrollTop);
    }
  };

  // Auto-scroll message content to bottom when chat changes
  useEffect(() => {
    if (selectedChatId && messageContentRef.current) {
      const messageContainer = messageContentRef.current.querySelector('[data-messages-container]');
      if (messageContainer) {
        // Smooth scroll to bottom with a slight delay to ensure content is loaded
        setTimeout(() => {
          messageContainer.scrollTo({
            top: messageContainer.scrollHeight,
            behavior: 'smooth'
          });
        }, 150);
      }
    }
  }, [selectedChatId]);

  // Responsive grid configuration
  const chatListGridSize = getResponsiveValue(
    12, // Mobile: full width when visible
    5,  // Tablet: 5/12 width
    4   // Desktop: 4/12 width
  );
  
  const messageContentGridSize = getResponsiveValue(
    12, // Mobile: full width when visible
    7,  // Tablet: 7/12 width
    8   // Desktop: 8/12 width
  );

  // Mobile view logic - show only one panel at a time
  const showChatListOnMobile = isMobileView && showChatList && !selectedChatId;
  const showMessageContentOnMobile = isMobileView && showMessageContent && selectedChatId;
  
  // Desktop/tablet view - show both panels
  const showChatListOnDesktop = !isMobileView && showChatList;
  const showMessageContentOnDesktop = !isMobileView && showMessageContent;

  return (
    <Box
      className={className}
      sx={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        ...props.sx
      }}
      {...props}
    >
      <Grid 
        container 
        sx={{ 
          height: '100%',
          width: '100%',
          margin: 0,
          flex: 1,
          '& .MuiGrid-item': {
            paddingLeft: 0,
            paddingTop: 0,
          }
        }}
        spacing={0}
      >
        {/* Chat List Panel */}
        <Grid
          item
          xs={chatListGridSize}
          sx={{
            height: '100%',
            display: (showChatListOnMobile || showChatListOnDesktop) ? 'flex' : 'none',
            flexDirection: 'column',
            borderRight: !isMobileView ? `1px solid ${theme.palette.divider}` : 'none',
            position: 'relative'
          }}
        >
          <Box
            ref={chatListRef}
            className="scrollable-section"
            data-chat-list-container
            sx={{
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              backgroundColor: theme.palette.background.paper,
              
              // Independent scrolling
              '& > *': {
                flex: '1 1 auto',
                minHeight: 0,
                overflowY: 'auto',
                overflowX: 'hidden',
              }
            }}
            onScroll={handleChatListScroll}
          >
            {chatListComponent}
          </Box>
        </Grid>

        {/* Message Content Panel */}
        <Grid
          item
          xs={messageContentGridSize}
          sx={{
            height: '100%',
            display: (showMessageContentOnMobile || showMessageContentOnDesktop) ? 'flex' : 'none',
            flexDirection: 'column',
            position: 'relative'
          }}
        >
          <Box
            ref={messageContentRef}
            className="scrollable-section"
            data-message-content-container
            sx={{
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              backgroundColor: theme.palette.background.default,
              
              // Message content specific styling
              '& [data-messages-container]': {
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                
                // Auto-scroll behavior
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch',
                
                // Custom scrollbar for messages
                '&::-webkit-scrollbar': {
                  width: '6px',
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
              },
              
              // Message input area should stay at bottom
              '& [data-message-input]': {
                flexShrink: 0,
                borderTop: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.paper,
              }
            }}
            onScroll={handleMessageContentScroll}
          >
            {messageContentComponent}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ResponsiveChatContainer;