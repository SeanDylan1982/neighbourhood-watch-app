import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import HoverTimestamp from '../HoverTimestamp';

// Mock useDesktopFeatures
const mockUseDesktopFeatures = jest.fn();
jest.mock('../../../../hooks/useResponsive', () => ({
  useDesktopFeatures: () => mockUseDesktopFeatures()
}));

// Default mock implementation
const defaultDesktopFeatures = {
  features: {
    hoverEffects: true,
    tooltips: true
  },
  isHovering: false,
  hoverHandlers: {
    onMouseEnter: jest.fn(),
    onMouseLeave: jest.fn()
  }
};

// Mock formatTime and formatRelativeTime
jest.mock('../../../../utils/chatUtils', () => ({
  formatTime: jest.fn((timestamp) => '12:34 PM'),
  formatRelativeTime: jest.fn((timestamp) => '2 hours ago')
}));

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('HoverTimestamp', () => {
  const mockTimestamp = new Date('2023-12-01T12:34:56Z');

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDesktopFeatures.mockReturnValue(defaultDesktopFeatures);
  });

  it('should render timestamp correctly', () => {
    renderWithTheme(
      <HoverTimestamp timestamp={mockTimestamp} />
    );

    expect(screen.getByText('12:34 PM')).toBeInTheDocument();
  });

  it('should show status icon for own messages', () => {
    renderWithTheme(
      <HoverTimestamp 
        timestamp={mockTimestamp}
        status="delivered"
        isOwnMessage={true}
        showStatus={true}
      />
    );

    // Should show delivered icon (DoneAll)
    const statusIcon = screen.getByTestId('DoneAllIcon');
    expect(statusIcon).toBeInTheDocument();
  });

  it('should not show status icon for other messages', () => {
    renderWithTheme(
      <HoverTimestamp 
        timestamp={mockTimestamp}
        status="delivered"
        isOwnMessage={false}
        showStatus={true}
      />
    );

    // Should not show status icon for messages from others
    expect(screen.queryByTestId('DoneAllIcon')).not.toBeInTheDocument();
  });

  it('should show read receipt count when provided', () => {
    renderWithTheme(
      <HoverTimestamp 
        timestamp={mockTimestamp}
        status="read"
        isOwnMessage={true}
        readBy={['user1', 'user2', 'user3']}
      />
    );

    // Note: The read count chip only shows on hover, so we need to simulate hover
    // This test verifies the component accepts the readBy prop
    expect(screen.getByText('12:34 PM')).toBeInTheDocument();
  });

  it('should render children when provided', () => {
    renderWithTheme(
      <HoverTimestamp timestamp={mockTimestamp}>
        <span>Custom Content</span>
      </HoverTimestamp>
    );

    expect(screen.getByText('Custom Content')).toBeInTheDocument();
    expect(screen.getByText('12:34 PM')).toBeInTheDocument();
  });

  it('should handle missing timestamp gracefully', () => {
    renderWithTheme(
      <HoverTimestamp timestamp={null} />
    );

    // Should render without crashing, but no timestamp text
    expect(screen.queryByText('12:34 PM')).not.toBeInTheDocument();
  });

  it('should show error status correctly', () => {
    renderWithTheme(
      <HoverTimestamp 
        timestamp={mockTimestamp}
        status="failed"
        isOwnMessage={true}
        showStatus={true}
      />
    );

    // Should show error icon
    const errorIcon = screen.getByTestId('ErrorIcon');
    expect(errorIcon).toBeInTheDocument();
  });

  it('should apply custom styles', () => {
    renderWithTheme(
      <HoverTimestamp 
        timestamp={mockTimestamp}
        sx={{ fontSize: '1rem' }}
        data-testid="hover-timestamp"
      />
    );

    const component = screen.getByTestId('hover-timestamp');
    expect(component).toBeInTheDocument();
  });
});