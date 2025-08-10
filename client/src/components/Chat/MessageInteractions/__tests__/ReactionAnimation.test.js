import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ReactionAnimation, { ReactionNotification } from '../ReactionAnimation';

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('ReactionAnimation', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should not render when not visible', () => {
    const { container } = renderWithTheme(
      <ReactionAnimation emoji="👍" isVisible={false} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render when visible', () => {
    const { container } = renderWithTheme(
      <ReactionAnimation emoji="👍" isVisible={true} />
    );

    expect(container.firstChild).not.toBeNull();
    expect(container.textContent).toBe('👍');
  });

  it('should call onAnimationComplete after timeout', () => {
    const onAnimationComplete = jest.fn();
    
    renderWithTheme(
      <ReactionAnimation 
        emoji="👍" 
        isVisible={true} 
        onAnimationComplete={onAnimationComplete}
      />
    );

    expect(onAnimationComplete).not.toHaveBeenCalled();

    // Fast forward time
    jest.advanceTimersByTime(1000);

    expect(onAnimationComplete).toHaveBeenCalled();
  });

  it('should handle different sizes', () => {
    const { rerender, container } = renderWithTheme(
      <ReactionAnimation emoji="👍" isVisible={true} size="small" />
    );

    let emojiElement = container.querySelector('div[style*="font-size"]');
    expect(emojiElement).toHaveStyle({ fontSize: '16px' });

    rerender(
      <ThemeProvider theme={theme}>
        <ReactionAnimation emoji="👍" isVisible={true} size="large" />
      </ThemeProvider>
    );

    emojiElement = container.querySelector('div[style*="font-size"]');
    expect(emojiElement).toHaveStyle({ fontSize: '32px' });

    rerender(
      <ThemeProvider theme={theme}>
        <ReactionAnimation emoji="👍" isVisible={true} size="medium" />
      </ThemeProvider>
    );

    emojiElement = container.querySelector('div[style*="font-size"]');
    expect(emojiElement).toHaveStyle({ fontSize: '24px' });
  });

  it('should handle different positions', () => {
    const { rerender, container } = renderWithTheme(
      <ReactionAnimation emoji="👍" isVisible={true} position="left" />
    );

    let positionElement = container.firstChild;
    expect(positionElement).toHaveStyle({ left: '10%' });

    rerender(
      <ThemeProvider theme={theme}>
        <ReactionAnimation emoji="👍" isVisible={true} position="right" />
      </ThemeProvider>
    );

    positionElement = container.firstChild;
    expect(positionElement).toHaveStyle({ right: '10%' });

    rerender(
      <ThemeProvider theme={theme}>
        <ReactionAnimation emoji="👍" isVisible={true} position="center" />
      </ThemeProvider>
    );

    positionElement = container.firstChild;
    expect(positionElement).toHaveStyle({ left: '50%' });
  });

  it('should have proper styling for animation', () => {
    const { container } = renderWithTheme(
      <ReactionAnimation emoji="👍" isVisible={true} />
    );

    const animationContainer = container.firstChild;
    expect(animationContainer).toHaveStyle({
      position: 'absolute',
      top: '50%',
      zIndex: '1000',
      pointerEvents: 'none'
    });
  });

  it('should handle emoji content correctly', () => {
    const { container } = renderWithTheme(
      <ReactionAnimation emoji="❤️" isVisible={true} />
    );

    expect(container.textContent).toBe('❤️');
  });

  it('should clean up timeout when component unmounts', () => {
    const onAnimationComplete = jest.fn();
    
    const { unmount } = renderWithTheme(
      <ReactionAnimation 
        emoji="👍" 
        isVisible={true} 
        onAnimationComplete={onAnimationComplete}
      />
    );

    unmount();

    // Fast forward time after unmount
    jest.advanceTimersByTime(1000);

    // Should not call callback after unmount
    expect(onAnimationComplete).not.toHaveBeenCalled();
  });

  it('should handle visibility changes', () => {
    const { rerender, container } = renderWithTheme(
      <ReactionAnimation emoji="👍" isVisible={false} />
    );

    expect(container.firstChild).toBeNull();

    rerender(
      <ThemeProvider theme={theme}>
        <ReactionAnimation emoji="👍" isVisible={true} />
      </ThemeProvider>
    );

    expect(container.firstChild).not.toBeNull();
  });
});

describe('ReactionNotification', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render notification when visible', () => {
    renderWithTheme(
      <ReactionNotification 
        userName="John Doe" 
        emoji="👍" 
        isVisible={true} 
      />
    );

    expect(screen.getByText('👍')).toBeInTheDocument();
    expect(screen.getByText('John Doe reacted')).toBeInTheDocument();
  });

  it('should not render when not visible', () => {
    renderWithTheme(
      <ReactionNotification 
        userName="John Doe" 
        emoji="👍" 
        isVisible={false} 
      />
    );

    expect(screen.queryByText('John Doe reacted')).not.toBeInTheDocument();
  });

  it('should call onClose after duration', () => {
    const onClose = jest.fn();
    
    renderWithTheme(
      <ReactionNotification 
        userName="John Doe" 
        emoji="👍" 
        isVisible={true}
        onClose={onClose}
        duration={2000}
      />
    );

    expect(onClose).not.toHaveBeenCalled();

    // Fast forward time
    jest.advanceTimersByTime(2000);

    expect(onClose).toHaveBeenCalled();
  });

  it('should use default duration when not specified', () => {
    const onClose = jest.fn();
    
    renderWithTheme(
      <ReactionNotification 
        userName="John Doe" 
        emoji="👍" 
        isVisible={true}
        onClose={onClose}
      />
    );

    // Fast forward default duration (3000ms)
    jest.advanceTimersByTime(3000);

    expect(onClose).toHaveBeenCalled();
  });

  it('should handle different user names and emojis', () => {
    renderWithTheme(
      <ReactionNotification 
        userName="Jane Smith" 
        emoji="❤️" 
        isVisible={true} 
      />
    );

    expect(screen.getByText('❤️')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith reacted')).toBeInTheDocument();
  });

  it('should have proper styling', () => {
    const { container } = renderWithTheme(
      <ReactionNotification 
        userName="John Doe" 
        emoji="👍" 
        isVisible={true} 
      />
    );

    const notification = container.firstChild.firstChild;
    expect(notification).toHaveStyle({
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: '1300'
    });
  });

  it('should clean up timeout when component unmounts', () => {
    const onClose = jest.fn();
    
    const { unmount } = renderWithTheme(
      <ReactionNotification 
        userName="John Doe" 
        emoji="👍" 
        isVisible={true}
        onClose={onClose}
        duration={1000}
      />
    );

    unmount();

    // Fast forward time after unmount
    jest.advanceTimersByTime(1000);

    // Should not call callback after unmount
    expect(onClose).not.toHaveBeenCalled();
  });

  it('should not set timeout when not visible', () => {
    const onClose = jest.fn();
    
    renderWithTheme(
      <ReactionNotification 
        userName="John Doe" 
        emoji="👍" 
        isVisible={false}
        onClose={onClose}
        duration={1000}
      />
    );

    // Fast forward time
    jest.advanceTimersByTime(1000);

    // Should not call callback when not visible
    expect(onClose).not.toHaveBeenCalled();
  });

  it('should handle missing onClose gracefully', () => {
    expect(() => {
      renderWithTheme(
        <ReactionNotification 
          userName="John Doe" 
          emoji="👍" 
          isVisible={true}
        />
      );

      jest.advanceTimersByTime(3000);
    }).not.toThrow();
  });
});