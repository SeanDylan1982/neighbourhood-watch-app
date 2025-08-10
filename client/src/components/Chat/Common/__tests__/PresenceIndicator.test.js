import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import PresenceIndicator, { OnlineUsersCount, LastSeenIndicator } from '../PresenceIndicator';

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('PresenceIndicator', () => {
  it('should render online status with green circle', () => {
    renderWithTheme(
      <PresenceIndicator isOnline={true} lastSeenText="Online" />
    );

    const indicator = screen.getByTestId('presence-indicator');
    expect(indicator).toBeInTheDocument();

    const circleIcon = indicator.querySelector('[data-testid="CircleIcon"]');
    expect(circleIcon).toBeInTheDocument();
    expect(circleIcon).toHaveStyle({ color: 'rgb(76, 175, 80)' });
  });

  it('should render offline status with clock icon', () => {
    renderWithTheme(
      <PresenceIndicator isOnline={false} lastSeenText="Last seen 5 minutes ago" />
    );

    const indicator = screen.getByTestId('presence-indicator');
    expect(indicator).toBeInTheDocument();

    const clockIcon = indicator.querySelector('[data-testid="AccessTimeIcon"]');
    expect(clockIcon).toBeInTheDocument();
    expect(clockIcon).toHaveStyle({ color: 'rgb(158, 158, 158)' });
  });

  it('should show text when showText is true', () => {
    renderWithTheme(
      <PresenceIndicator 
        isOnline={true} 
        lastSeenText="Online" 
        showText={true}
      />
    );

    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('should show last seen text when offline and showText is true', () => {
    renderWithTheme(
      <PresenceIndicator 
        isOnline={false} 
        lastSeenText="Last seen 5 minutes ago" 
        showText={true}
      />
    );

    expect(screen.getByText('Last seen 5 minutes ago')).toBeInTheDocument();
  });

  it('should not show text when showText is false', () => {
    renderWithTheme(
      <PresenceIndicator 
        isOnline={true} 
        lastSeenText="Online" 
        showText={false}
      />
    );

    expect(screen.queryByText('Online')).not.toBeInTheDocument();
  });

  it('should handle different sizes', () => {
    const { rerender } = renderWithTheme(
      <PresenceIndicator isOnline={true} size="tiny" />
    );

    let indicator = screen.getByTestId('presence-indicator');
    let icon = indicator.querySelector('[data-testid="CircleIcon"]');
    expect(icon).toHaveStyle({ width: '6px', height: '6px' });

    rerender(
      <ThemeProvider theme={theme}>
        <PresenceIndicator isOnline={true} size="small" />
      </ThemeProvider>
    );

    indicator = screen.getByTestId('presence-indicator');
    icon = indicator.querySelector('[data-testid="CircleIcon"]');
    expect(icon).toHaveStyle({ width: '8px', height: '8px' });

    rerender(
      <ThemeProvider theme={theme}>
        <PresenceIndicator isOnline={true} size="medium" />
      </ThemeProvider>
    );

    indicator = screen.getByTestId('presence-indicator');
    icon = indicator.querySelector('[data-testid="CircleIcon"]');
    expect(icon).toHaveStyle({ width: '12px', height: '12px' });

    rerender(
      <ThemeProvider theme={theme}>
        <PresenceIndicator isOnline={true} size="large" />
      </ThemeProvider>
    );

    indicator = screen.getByTestId('presence-indicator');
    icon = indicator.querySelector('[data-testid="CircleIcon"]');
    expect(icon).toHaveStyle({ width: '16px', height: '16px' });
  });

  it('should handle different positions when not showing text', () => {
    const { rerender, container } = renderWithTheme(
      <PresenceIndicator isOnline={true} position="top-right" showText={false} />
    );

    let indicator = container.querySelector('[data-testid="presence-indicator"]');
    expect(indicator).toHaveStyle({ position: 'absolute', top: '0px', right: '0px' });

    rerender(
      <ThemeProvider theme={theme}>
        <PresenceIndicator isOnline={true} position="bottom-left" showText={false} />
      </ThemeProvider>
    );

    indicator = container.querySelector('[data-testid="presence-indicator"]');
    expect(indicator).toHaveStyle({ position: 'absolute', bottom: '0px', left: '0px' });

    rerender(
      <ThemeProvider theme={theme}>
        <PresenceIndicator isOnline={true} position="center" showText={false} />
      </ThemeProvider>
    );

    indicator = container.querySelector('[data-testid="presence-indicator"]');
    expect(indicator).toHaveStyle({ 
      position: 'absolute', 
      top: '50%', 
      left: '50%',
      transform: 'translate(-50%, -50%)'
    });
  });

  it('should show tooltip when showTooltip is true and showText is false', () => {
    renderWithTheme(
      <PresenceIndicator 
        isOnline={true} 
        lastSeenText="Online" 
        showTooltip={true}
        showText={false}
      />
    );

    const indicator = screen.getByTestId('presence-indicator');
    expect(indicator.parentElement).toHaveAttribute('aria-describedby');
  });

  it('should not show tooltip when showText is true', () => {
    renderWithTheme(
      <PresenceIndicator 
        isOnline={true} 
        lastSeenText="Online" 
        showTooltip={true}
        showText={true}
      />
    );

    const indicator = screen.getByTestId('presence-indicator');
    expect(indicator.parentElement).not.toHaveAttribute('aria-describedby');
  });
});

describe('OnlineUsersCount', () => {
  it('should not render when count is 0', () => {
    renderWithTheme(<OnlineUsersCount count={0} />);

    expect(screen.queryByTestId('online-users-count')).not.toBeInTheDocument();
  });

  it('should render count when greater than 0', () => {
    renderWithTheme(<OnlineUsersCount count={3} />);

    const countElement = screen.getByTestId('online-users-count');
    expect(countElement).toBeInTheDocument();
    expect(screen.getByText('3 online')).toBeInTheDocument();
  });

  it('should show total users when provided', () => {
    renderWithTheme(<OnlineUsersCount count={3} totalUsers={10} />);

    expect(screen.getByText('3 online of 10')).toBeInTheDocument();
  });

  it('should show singular form for count of 1', () => {
    renderWithTheme(<OnlineUsersCount count={1} />);

    expect(screen.getByText('1 online')).toBeInTheDocument();
  });

  it('should show tooltip when showTooltip is true', () => {
    renderWithTheme(<OnlineUsersCount count={3} showTooltip={true} />);

    const countElement = screen.getByTestId('online-users-count');
    expect(countElement.parentElement).toHaveAttribute('aria-describedby');
  });

  it('should not show tooltip when showTooltip is false', () => {
    renderWithTheme(<OnlineUsersCount count={3} showTooltip={false} />);

    const countElement = screen.getByTestId('online-users-count');
    expect(countElement.parentElement).not.toHaveAttribute('aria-describedby');
  });

  it('should have proper styling', () => {
    renderWithTheme(<OnlineUsersCount count={3} />);

    const countElement = screen.getByTestId('online-users-count');
    const circleIcon = countElement.querySelector('[data-testid="CircleIcon"]');
    
    expect(circleIcon).toHaveStyle({ 
      width: '6px', 
      height: '6px',
      color: 'rgb(76, 175, 80)'
    });
  });
});

describe('LastSeenIndicator', () => {
  it('should show online status when user is online', () => {
    renderWithTheme(
      <LastSeenIndicator isOnline={true} lastSeenText="Last seen 5 minutes ago" />
    );

    const indicator = screen.getByTestId('last-seen-indicator');
    expect(indicator).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();

    const circleIcon = indicator.querySelector('[data-testid="CircleIcon"]');
    expect(circleIcon).toBeInTheDocument();
    expect(circleIcon).toHaveStyle({ color: 'rgb(76, 175, 80)' });
  });

  it('should show last seen text when user is offline', () => {
    renderWithTheme(
      <LastSeenIndicator isOnline={false} lastSeenText="Last seen 5 minutes ago" />
    );

    const indicator = screen.getByTestId('last-seen-indicator');
    expect(indicator).toBeInTheDocument();
    expect(screen.getByText('Last seen 5 minutes ago')).toBeInTheDocument();

    const clockIcon = indicator.querySelector('[data-testid="AccessTimeIcon"]');
    expect(clockIcon).toBeInTheDocument();
  });

  it('should handle compact mode', () => {
    renderWithTheme(
      <LastSeenIndicator 
        isOnline={false} 
        lastSeenText="Last seen 5 minutes ago" 
        compact={true}
      />
    );

    const text = screen.getByText('Last seen 5 minutes ago');
    expect(text).toHaveStyle({ fontSize: '0.7rem' });
  });

  it('should handle normal mode', () => {
    renderWithTheme(
      <LastSeenIndicator 
        isOnline={false} 
        lastSeenText="Last seen 5 minutes ago" 
        compact={false}
      />
    );

    const text = screen.getByText('Last seen 5 minutes ago');
    expect(text).toHaveStyle({ fontSize: '0.75rem' });
  });

  it('should show online text in compact mode', () => {
    renderWithTheme(
      <LastSeenIndicator 
        isOnline={true} 
        lastSeenText="Last seen 5 minutes ago" 
        compact={true}
      />
    );

    const text = screen.getByText('Online');
    expect(text).toHaveStyle({ fontSize: '0.7rem' });
  });

  it('should have proper styling for online status', () => {
    renderWithTheme(
      <LastSeenIndicator isOnline={true} lastSeenText="Last seen 5 minutes ago" />
    );

    const indicator = screen.getByTestId('last-seen-indicator');
    expect(indicator).toHaveStyle({ color: 'rgb(76, 175, 80)' });
  });

  it('should have proper styling for offline status', () => {
    renderWithTheme(
      <LastSeenIndicator isOnline={false} lastSeenText="Last seen 5 minutes ago" />
    );

    const indicator = screen.getByTestId('last-seen-indicator');
    const clockIcon = indicator.querySelector('[data-testid="AccessTimeIcon"]');
    
    expect(clockIcon).toHaveStyle({ 
      width: '12px', 
      height: '12px'
    });
  });
});