import { renderHook } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import useResponsive, { useDesktopFeatures } from '../useResponsive';

// Mock useMediaQuery
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: jest.fn()
}));

const { useMediaQuery } = require('@mui/material');

const theme = createTheme();

const wrapper = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('useResponsive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should detect mobile device correctly', () => {
    useMediaQuery
      .mockReturnValueOnce(true)  // isMobile
      .mockReturnValueOnce(false) // isTablet
      .mockReturnValueOnce(false) // isDesktop
      .mockReturnValueOnce(true)  // isSmallScreen
      .mockReturnValueOnce(false); // isLargeScreen

    const { result } = renderHook(() => useResponsive(), { wrapper });

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.deviceType.mobile).toBe(true);
  });

  it('should detect desktop device correctly', () => {
    useMediaQuery
      .mockReturnValueOnce(false) // isMobile
      .mockReturnValueOnce(false) // isTablet
      .mockReturnValueOnce(true)  // isDesktop
      .mockReturnValueOnce(false) // isSmallScreen
      .mockReturnValueOnce(false); // isLargeScreen

    const { result } = renderHook(() => useResponsive(), { wrapper });

    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.deviceType.desktop).toBe(true);
  });

  it('should provide responsive values correctly', () => {
    useMediaQuery
      .mockReturnValueOnce(true)  // isMobile
      .mockReturnValueOnce(false) // isTablet
      .mockReturnValueOnce(false) // isDesktop
      .mockReturnValueOnce(false) // isSmallScreen
      .mockReturnValueOnce(false); // isLargeScreen

    const { result } = renderHook(() => useResponsive(), { wrapper });

    const responsiveValue = result.current.getResponsiveValue('mobile', 'tablet', 'desktop');
    expect(responsiveValue).toBe('mobile');
  });

  it('should provide spacing helpers', () => {
    useMediaQuery
      .mockReturnValueOnce(false) // isMobile
      .mockReturnValueOnce(false) // isTablet
      .mockReturnValueOnce(true)  // isDesktop
      .mockReturnValueOnce(false) // isSmallScreen
      .mockReturnValueOnce(false); // isLargeScreen

    const { result } = renderHook(() => useResponsive(), { wrapper });

    expect(result.current.spacing).toBeDefined();
    expect(result.current.spacing.xs).toBeDefined();
    expect(result.current.spacing.sm).toBeDefined();
    expect(result.current.spacing.md).toBeDefined();
  });
});

describe('useDesktopFeatures', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock touch device detection
    Object.defineProperty(window, 'ontouchstart', {
      writable: true,
      value: undefined
    });
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      value: 0
    });
    Object.defineProperty(navigator, 'msMaxTouchPoints', {
      writable: true,
      value: 0
    });
  });

  it('should enable desktop features on desktop non-touch device', () => {
    useMediaQuery
      .mockReturnValueOnce(false) // isMobile
      .mockReturnValueOnce(false) // isTablet
      .mockReturnValueOnce(true)  // isDesktop
      .mockReturnValueOnce(false) // isSmallScreen
      .mockReturnValueOnce(false); // isLargeScreen

    const { result } = renderHook(() => useDesktopFeatures(), { wrapper });

    expect(result.current.isDesktop).toBe(true);
    expect(result.current.features.rightClickMenus).toBe(true);
    expect(result.current.features.hoverEffects).toBe(true);
    expect(result.current.features.tooltips).toBe(true);
    expect(result.current.features.keyboardShortcuts).toBe(true);
    expect(result.current.features.sidebar).toBe(true);
  });

  it('should disable desktop features on mobile device', () => {
    useMediaQuery
      .mockReturnValueOnce(true)  // isMobile
      .mockReturnValueOnce(false) // isTablet
      .mockReturnValueOnce(false) // isDesktop
      .mockReturnValueOnce(true)  // isSmallScreen
      .mockReturnValueOnce(false); // isLargeScreen

    const { result } = renderHook(() => useDesktopFeatures(), { wrapper });

    expect(result.current.isDesktop).toBe(false);
    expect(result.current.features.rightClickMenus).toBe(false);
    expect(result.current.features.hoverEffects).toBe(false);
    expect(result.current.features.sidebar).toBe(false);
  });

  it('should provide hover handlers when hover effects are enabled', () => {
    useMediaQuery
      .mockReturnValueOnce(false) // isMobile
      .mockReturnValueOnce(false) // isTablet
      .mockReturnValueOnce(true)  // isDesktop
      .mockReturnValueOnce(false) // isSmallScreen
      .mockReturnValueOnce(false); // isLargeScreen

    const { result } = renderHook(() => useDesktopFeatures(), { wrapper });

    expect(result.current.hoverHandlers).toBeDefined();
    expect(result.current.hoverHandlers.onMouseEnter).toBeDefined();
    expect(result.current.hoverHandlers.onMouseLeave).toBeDefined();
  });

  it('should not provide hover handlers when hover effects are disabled', () => {
    useMediaQuery
      .mockReturnValueOnce(true)  // isMobile
      .mockReturnValueOnce(false) // isTablet
      .mockReturnValueOnce(false) // isDesktop
      .mockReturnValueOnce(true)  // isSmallScreen
      .mockReturnValueOnce(false); // isLargeScreen

    const { result } = renderHook(() => useDesktopFeatures(), { wrapper });

    expect(result.current.hoverHandlers).toEqual({});
  });
});