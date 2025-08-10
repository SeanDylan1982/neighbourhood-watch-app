import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  IconButton,
  InputAdornment,
  Fade,
  Zoom
} from '@mui/material';
import {
  Send as SendIcon,
  Add as AddIcon,
  Mic as MicIcon,
  KeyboardVoice as VoiceIcon
} from '@mui/icons-material';
import { useResponsive } from '../../../hooks/useResponsive';

/**
 * Mobile-optimized input component with virtual keyboard handling
 * Provides better UX for mobile chat input
 */
const MobileOptimizedInput = ({
  value = '',
  onChange,
  onSend,
  onAttachment,
  onVoiceRecord,
  placeholder = 'Type a message...',
  disabled = false,
  multiline = true,
  maxRows = 4,
  showAttachmentButton = true,
  showVoiceButton = true,
  className = '',
  ...props
}) => {
  const { isMobile, isTouchDevice } = useResponsive();
  const [isFocused, setIsFocused] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isVirtualKeyboardOpen, setIsVirtualKeyboardOpen] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const initialViewportHeight = useRef(window.innerHeight);
  
  // Handle virtual keyboard detection
  useEffect(() => {
    if (!isMobile || !isTouchDevice) return;
    
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDifference = initialViewportHeight.current - currentHeight;
      
      // If height decreased significantly, keyboard is likely open
      if (heightDifference > 150) {
        setKeyboardHeight(heightDifference);
        setIsVirtualKeyboardOpen(true);
      } else {
        setKeyboardHeight(0);
        setIsVirtualKeyboardOpen(false);
      }
    };
    
    // Use visualViewport API if available (more accurate)
    if (window.visualViewport) {
      const handleViewportChange = () => {
        const heightDifference = window.innerHeight - window.visualViewport.height;
        setKeyboardHeight(heightDifference);
        setIsVirtualKeyboardOpen(heightDifference > 150);
      };
      
      window.visualViewport.addEventListener('resize', handleViewportChange);
      return () => {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
      };
    } else {
      // Fallback to window resize
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isMobile, isTouchDevice]);
  
  // Scroll input into view when keyboard opens
  useEffect(() => {
    if (isVirtualKeyboardOpen && isFocused && containerRef.current) {
      // Small delay to ensure keyboard is fully open
      setTimeout(() => {
        containerRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'end'
        });
      }, 300);
    }
  }, [isVirtualKeyboardOpen, isFocused]);
  
  // Handle input focus
  const handleFocus = useCallback((event) => {
    setIsFocused(true);
    
    // On mobile, ensure input is visible above keyboard
    if (isMobile && isTouchDevice) {
      setTimeout(() => {
        event.target.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
    }
    
    if (props.onFocus) {
      props.onFocus(event);
    }
  }, [isMobile, isTouchDevice, props]);
  
  // Handle input blur
  const handleBlur = useCallback((event) => {
    setIsFocused(false);
    
    if (props.onBlur) {
      props.onBlur(event);
    }
  }, [props]);
  
  // Handle input change
  const handleChange = useCallback((event) => {
    if (onChange) {
      onChange(event);
    }
  }, [onChange]);
  
  // Handle send
  const handleSend = useCallback(() => {
    if (value.trim() && onSend) {
      onSend(value.trim());
    }
  }, [value, onSend]);
  
  // Handle key press
  const handleKeyPress = useCallback((event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
    
    if (props.onKeyPress) {
      props.onKeyPress(event);
    }
  }, [handleSend, props]);
  
  // Get input styles based on mobile state
  const getInputStyles = () => {
    const baseStyles = {
      '& .MuiOutlinedInput-root': {
        borderRadius: isMobile ? 3 : 2,
        backgroundColor: 'background.paper',
        fontSize: isMobile ? '16px' : '14px', // Prevent zoom on iOS
        lineHeight: isMobile ? 1.4 : 1.2,
        minHeight: isMobile ? 48 : 40,
        paddingRight: 1
      },
      '& .MuiOutlinedInput-input': {
        padding: isMobile ? '12px 14px' : '8px 12px',
        '&::placeholder': {
          fontSize: isMobile ? '16px' : '14px',
          opacity: 0.6
        }
      },
      '& .MuiInputAdornment-root': {
        marginLeft: 0.5
      }
    };
    
    // Add keyboard-specific styles
    if (isVirtualKeyboardOpen) {
      baseStyles['& .MuiOutlinedInput-root'].boxShadow = '0 -2px 8px rgba(0,0,0,0.1)';
    }
    
    return baseStyles;
  };
  
  return (
    <Box
      ref={containerRef}
      className={className}
      sx={{
        position: 'relative',
        transition: 'all 0.3s ease-in-out',
        // Adjust position when keyboard is open
        ...(isVirtualKeyboardOpen && isMobile && {
          transform: `translateY(-${Math.min(keyboardHeight * 0.1, 20)}px)`
        }),
        ...props.sx
      }}
    >
      <TextField
        ref={inputRef}
        fullWidth
        multiline={multiline}
        maxRows={maxRows}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled}
        variant="outlined"
        size={isMobile ? "medium" : "small"}
        sx={getInputStyles()}
        InputProps={{
          startAdornment: showAttachmentButton ? (
            <InputAdornment position="start">
              <Zoom in={!isFocused || !isMobile} timeout={200}>
                <IconButton
                  size={isMobile ? "medium" : "small"}
                  onClick={onAttachment}
                  disabled={disabled}
                  sx={{
                    color: 'action.active',
                    '&:hover': {
                      color: 'primary.main',
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <AddIcon />
                </IconButton>
              </Zoom>
            </InputAdornment>
          ) : null,
          endAdornment: (
            <InputAdornment position="end">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {/* Voice button - show when no text */}
                {showVoiceButton && !value.trim() && (
                  <Fade in={true} timeout={200}>
                    <IconButton
                      size={isMobile ? "medium" : "small"}
                      onClick={onVoiceRecord}
                      disabled={disabled}
                      sx={{
                        color: 'action.active',
                        '&:hover': {
                          color: 'primary.main',
                          backgroundColor: 'action.hover'
                        }
                      }}
                    >
                      <MicIcon />
                    </IconButton>
                  </Fade>
                )}
                
                {/* Send button - show when there's text */}
                {value.trim() && (
                  <Fade in={true} timeout={200}>
                    <IconButton
                      size={isMobile ? "medium" : "small"}
                      onClick={handleSend}
                      disabled={disabled}
                      sx={{
                        color: 'primary.main',
                        backgroundColor: 'primary.light',
                        '&:hover': {
                          backgroundColor: 'primary.main',
                          color: 'primary.contrastText'
                        },
                        '&:disabled': {
                          backgroundColor: 'action.disabledBackground',
                          color: 'action.disabled'
                        }
                      }}
                    >
                      <SendIcon />
                    </IconButton>
                  </Fade>
                )}
              </Box>
            </InputAdornment>
          )
        }}
        {...props}
      />
      
      {/* Keyboard height indicator for debugging */}
      {process.env.NODE_ENV === 'development' && isVirtualKeyboardOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 10,
            right: 10,
            backgroundColor: 'warning.main',
            color: 'warning.contrastText',
            padding: 1,
            borderRadius: 1,
            fontSize: '0.75rem',
            zIndex: 9999
          }}
        >
          Keyboard: {keyboardHeight}px
        </Box>
      )}
    </Box>
  );
};

export default MobileOptimizedInput;