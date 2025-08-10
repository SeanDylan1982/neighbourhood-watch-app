import React, { useEffect, useState } from 'react';
import { Box, Fade, Zoom } from '@mui/material';
import { keyframes } from '@mui/system';

/**
 * ReactionAnimation component for animated reaction feedback
 * Shows floating emoji animations when reactions are added
 */
const ReactionAnimation = ({ 
  emoji, 
  isVisible, 
  onAnimationComplete,
  position = 'center',
  size = 'medium'
}) => {
  const [showAnimation, setShowAnimation] = useState(false);

  // Float up animation
  const floatUpAnimation = keyframes`
    0% {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
    50% {
      transform: translateY(-20px) scale(1.2);
      opacity: 0.8;
    }
    100% {
      transform: translateY(-40px) scale(0.8);
      opacity: 0;
    }
  `;

  // Bounce animation
  const bounceAnimation = keyframes`
    0% {
      transform: scale(0);
    }
    50% {
      transform: scale(1.3);
    }
    100% {
      transform: scale(1);
    }
  `;

  // Pulse animation
  const pulseAnimation = keyframes`
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  `;

  useEffect(() => {
    if (isVisible) {
      setShowAnimation(true);
      
      // Auto-complete animation after duration
      const timer = setTimeout(() => {
        setShowAnimation(false);
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onAnimationComplete]);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { fontSize: '16px' };
      case 'large':
        return { fontSize: '32px' };
      default:
        return { fontSize: '24px' };
    }
  };

  const getPositionStyles = () => {
    switch (position) {
      case 'left':
        return { left: '10%' };
      case 'right':
        return { right: '10%' };
      default:
        return { left: '50%', transform: 'translateX(-50%)' };
    }
  };

  if (!isVisible && !showAnimation) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        zIndex: 1000,
        pointerEvents: 'none',
        ...getPositionStyles()
      }}
    >
      <Fade in={showAnimation} timeout={200}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: `${floatUpAnimation} 1s ease-out`,
            ...getSizeStyles()
          }}
        >
          <Zoom in={showAnimation} timeout={300}>
            <Box
              sx={{
                animation: `${bounceAnimation} 0.3s ease-out, ${pulseAnimation} 0.5s ease-in-out 0.3s`,
                userSelect: 'none'
              }}
            >
              {emoji}
            </Box>
          </Zoom>
        </Box>
      </Fade>
    </Box>
  );
};

/**
 * ReactionNotification component for showing reaction notifications
 * Displays who reacted with what emoji
 */
export const ReactionNotification = ({ 
  userName, 
  emoji, 
  isVisible, 
  onClose,
  duration = 3000 
}) => {
  useEffect(() => {
    if (isVisible && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, duration]);

  return (
    <Fade in={isVisible} timeout={300}>
      <Box
        sx={(theme) => ({
          position: 'fixed',
          top: 20,
          right: 20,
          bgcolor: theme.palette.mode === 'dark' ? '#333' : '#fff',
          color: theme.palette.mode === 'dark' ? '#fff' : '#000',
          px: 2,
          py: 1,
          borderRadius: 2,
          boxShadow: theme.shadows[4],
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          zIndex: 1300,
          maxWidth: 300,
          animation: `${bounceAnimation} 0.3s ease-out`
        })}
      >
        <Box sx={{ fontSize: '20px' }}>{emoji}</Box>
        <Box sx={{ fontSize: '14px', fontWeight: 500 }}>
          {userName} reacted
        </Box>
      </Box>
    </Fade>
  );
};

export default ReactionAnimation;