import { useMediaQuery, useTheme } from '@mui/material';
import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive design utilities
 * Provides device detection and responsive helpers
 */
export const useResponsive = () => {
  const theme = useTheme();
  
  // Breakpoint queries
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('xl'));
  
  // Touch device detection
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  useEffect(() => {
    const checkTouchDevice = () => {
      return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0
      );
    };
    
    setIsTouchDevice(checkTouchDevice());
  }, []);
  
  // Device type helpers
  const deviceType = {
    mobile: isMobile,
    tablet: isTablet,
    desktop: isDesktop,
    touch: isTouchDevice,
    smallScreen: isSmallScreen,
    largeScreen: isLargeScreen
  };
  
  // Responsive values helper
  const getResponsiveValue = (mobileValue, tabletValue, desktopValue) => {
    if (isMobile) return mobileValue;
    if (isTablet) return tabletValue || mobileValue;
    return desktopValue || tabletValue || mobileValue;
  };
  
  // Spacing helpers
  const spacing = {
    xs: getResponsiveValue(1, 1.5, 2),
    sm: getResponsiveValue(1.5, 2, 2.5),
    md: getResponsiveValue(2, 2.5, 3),
    lg: getResponsiveValue(2.5, 3, 4),
    xl: getResponsiveValue(3, 4, 5)
  };
  
  // Typography helpers
  const typography = {
    fontSize: {
      xs: getResponsiveValue('0.75rem', '0.8rem', '0.875rem'),
      sm: getResponsiveValue('0.875rem', '0.9rem', '1rem'),
      md: getResponsiveValue('1rem', '1.1rem', '1.25rem'),
      lg: getResponsiveValue('1.25rem', '1.4rem', '1.5rem'),
      xl: getResponsiveValue('1.5rem', '1.75rem', '2rem')
    }
  };
  
  return {
    // Device detection
    isMobile,
    isTablet,
    isDesktop,
    isSmallScreen,
    isLargeScreen,
    isTouchDevice,
    deviceType,
    
    // Helpers
    getResponsiveValue,
    spacing,
    typography,
    
    // Breakpoints
    breakpoints: theme.breakpoints
  };
};

/**
 * Hook for desktop-specific features
 */
export const useDesktopFeatures = () => {
  const responsive = useResponsive();
  const { isDesktop, isTouchDevice } = responsive;
  
  // Desktop-specific states
  const [isHovering, setIsHovering] = useState(false);
  const [showDesktopTooltips, setShowDesktopTooltips] = useState(true);
  const [enableRightClickMenus, setEnableRightClickMenus] = useState(true);
  
  // Desktop feature flags
  const features = {
    rightClickMenus: isDesktop && !isTouchDevice && enableRightClickMenus,
    hoverEffects: isDesktop && !isTouchDevice,
    tooltips: isDesktop && showDesktopTooltips,
    keyboardShortcuts: isDesktop,
    sidebar: isDesktop,
    multiColumn: isDesktop
  };
  
  // Hover handlers
  const hoverHandlers = features.hoverEffects ? {
    onMouseEnter: () => setIsHovering(true),
    onMouseLeave: () => setIsHovering(false)
  } : {};
  
  return {
    isDesktop,
    features,
    isHovering,
    hoverHandlers,
    setShowDesktopTooltips,
    setEnableRightClickMenus,
    ...responsive
  };
};

export default useResponsive;