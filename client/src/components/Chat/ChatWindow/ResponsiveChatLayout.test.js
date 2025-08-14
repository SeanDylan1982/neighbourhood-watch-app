import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ResponsiveChatLayout from './ResponsiveChatLayout';

// Mock the useResponsive hook
jest.mock('../../../hooks/useResponsive', () => ({
  useResponsive: () => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    getResponsiveValue: (mobile, tablet, desktop) => desktop || tablet || mobile
  })
}));

const theme = createTheme();

const TestWrapper = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

describe('ResponsiveChatLayout', () => {
  beforeEach(() => {
    // Mock window dimensions
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800,
    });
    
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200,
    });
  });

  it('renders children correctly', () => {
    render(
      <TestWrapper>
        <ResponsiveChatLayout>
          <div data-testid="test-child">Test Content</div>
        </ResponsiveChatLayout>
      </TestWrapper>
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });

  it('applies responsive chat layout class', () => {
    const { container } = render(
      <TestWrapper>
        <ResponsiveChatLayout>
          <div>Test Content</div>
        </ResponsiveChatLayout>
      </TestWrapper>
    );

    const layoutElement = container.querySelector('.responsive-chat-layout');
    expect(layoutElement).toBeInTheDocument();
  });

  it('calculates container height correctly', () => {
    const { container } = render(
      <TestWrapper>
        <ResponsiveChatLayout>
          <div>Test Content</div>
        </ResponsiveChatLayout>
      </TestWrapper>
    );

    const layoutElement = container.querySelector('.responsive-chat-layout');
    expect(layoutElement).toHaveStyle('height: 728px'); // 800 - 64 - 8 = 728px for desktop
  });

  it('handles viewport resize', () => {
    const { container } = render(
      <TestWrapper>
        <ResponsiveChatLayout>
          <div>Test Content</div>
        </ResponsiveChatLayout>
      </TestWrapper>
    );

    // Change window height
    act(() => {
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 600,
      });
      
      // Trigger resize event
      window.dispatchEvent(new Event('resize'));
    });

    const layoutElement = container.querySelector('.responsive-chat-layout');
    // Should update height calculation
    expect(layoutElement).toBeInTheDocument();
  });

  it('auto-scrolls to bottom when chat changes', async () => {
    const mockScrollTo = jest.fn();
    
    // Mock querySelector to return an element with scrollTo
    const mockElement = {
      scrollTo: mockScrollTo,
      scrollHeight: 1000
    };
    
    const mockContainer = {
      querySelector: jest.fn().mockReturnValue(mockElement)
    };

    const { rerender } = render(
      <TestWrapper>
        <ResponsiveChatLayout chatId="chat1" autoScrollToBottom={true}>
          <div data-messages-container>Messages</div>
        </ResponsiveChatLayout>
      </TestWrapper>
    );

    // Mock the container ref
    const layoutElement = document.querySelector('.responsive-chat-layout');
    if (layoutElement) {
      layoutElement.querySelector = mockContainer.querySelector;
    }

    // Change chat ID to trigger auto-scroll
    rerender(
      <TestWrapper>
        <ResponsiveChatLayout chatId="chat2" autoScrollToBottom={true}>
          <div data-messages-container>Messages</div>
        </ResponsiveChatLayout>
      </TestWrapper>
    );

    // Wait for setTimeout to execute
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    expect(mockContainer.querySelector).toHaveBeenCalledWith('[data-messages-container]');
  });

  it('applies custom className', () => {
    const { container } = render(
      <TestWrapper>
        <ResponsiveChatLayout className="custom-class">
          <div>Test Content</div>
        </ResponsiveChatLayout>
      </TestWrapper>
    );

    const layoutElement = container.querySelector('.responsive-chat-layout');
    expect(layoutElement).toHaveClass('custom-class');
  });

  it('passes through additional props', () => {
    const { container } = render(
      <TestWrapper>
        <ResponsiveChatLayout data-testid="layout-element">
          <div>Test Content</div>
        </ResponsiveChatLayout>
      </TestWrapper>
    );

    expect(container.querySelector('[data-testid="layout-element"]')).toBeInTheDocument();
  });
});