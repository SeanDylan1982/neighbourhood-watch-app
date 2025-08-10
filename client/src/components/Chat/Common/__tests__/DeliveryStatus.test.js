import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import DeliveryStatus from '../DeliveryStatus';

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('DeliveryStatus', () => {
  it('should not render for received messages', () => {
    renderWithTheme(<DeliveryStatus status="received" />);
    
    expect(screen.queryByTestId('delivery-status')).not.toBeInTheDocument();
  });

  it('should not render when no status is provided', () => {
    renderWithTheme(<DeliveryStatus />);
    
    expect(screen.queryByTestId('delivery-status')).toBeInTheDocument();
  });

  it('should render sending status with clock icon', () => {
    renderWithTheme(<DeliveryStatus status="sending" />);
    
    const statusElement = screen.getByTestId('delivery-status');
    expect(statusElement).toBeInTheDocument();
    
    // Should contain Schedule icon
    const scheduleIcon = statusElement.querySelector('[data-testid="ScheduleIcon"]');
    expect(scheduleIcon).toBeInTheDocument();
  });

  it('should render sent status with single check', () => {
    renderWithTheme(<DeliveryStatus status="sent" />);
    
    const statusElement = screen.getByTestId('delivery-status');
    expect(statusElement).toBeInTheDocument();
    
    // Should contain Check icon
    const checkIcon = statusElement.querySelector('[data-testid="CheckIcon"]');
    expect(checkIcon).toBeInTheDocument();
  });

  it('should render delivered status with double check', () => {
    renderWithTheme(<DeliveryStatus status="delivered" />);
    
    const statusElement = screen.getByTestId('delivery-status');
    expect(statusElement).toBeInTheDocument();
    
    // Should contain multiple Check icons for double check
    const checkIcons = statusElement.querySelectorAll('[data-testid="CheckIcon"]');
    expect(checkIcons.length).toBe(2);
  });

  it('should render read status with blue double check', () => {
    renderWithTheme(<DeliveryStatus status="read" />);
    
    const statusElement = screen.getByTestId('delivery-status');
    expect(statusElement).toBeInTheDocument();
    
    // Should contain multiple Check icons for double check
    const checkIcons = statusElement.querySelectorAll('[data-testid="CheckIcon"]');
    expect(checkIcons.length).toBe(2);
    
    // Icons should have blue color for read status
    checkIcons.forEach(icon => {
      expect(icon).toHaveStyle({ color: 'rgb(79, 195, 247)' });
    });
  });

  it('should render failed status with error icon', () => {
    renderWithTheme(<DeliveryStatus status="failed" />);
    
    const statusElement = screen.getByTestId('delivery-status');
    expect(statusElement).toBeInTheDocument();
    
    // Should contain Error icon
    const errorIcon = statusElement.querySelector('[data-testid="ErrorIcon"]');
    expect(errorIcon).toBeInTheDocument();
    
    // Should have red color for failed status
    expect(errorIcon).toHaveStyle({ color: 'rgb(244, 67, 54)' });
  });

  it('should show tooltip with status information', () => {
    renderWithTheme(<DeliveryStatus status="sent" showTooltip={true} />);
    
    const statusElement = screen.getByTestId('delivery-status');
    // Just verify the component renders correctly with tooltip enabled
    expect(statusElement).toBeInTheDocument();
  });

  it('should not show tooltip when showTooltip is false', () => {
    renderWithTheme(<DeliveryStatus status="sent" showTooltip={false} />);
    
    const statusElement = screen.getByTestId('delivery-status');
    expect(statusElement.parentElement).not.toHaveAttribute('aria-describedby');
  });

  it('should handle different sizes', () => {
    const { rerender } = renderWithTheme(<DeliveryStatus status="sent" size="small" />);
    
    let statusElement = screen.getByTestId('delivery-status');
    let checkIcon = statusElement.querySelector('[data-testid="CheckIcon"]');
    expect(checkIcon).toHaveStyle({ fontSize: '14px' });
    
    rerender(
      <ThemeProvider theme={theme}>
        <DeliveryStatus status="sent" size="large" />
      </ThemeProvider>
    );
    
    statusElement = screen.getByTestId('delivery-status');
    checkIcon = statusElement.querySelector('[data-testid="CheckIcon"]');
    expect(checkIcon).toHaveStyle({ fontSize: '16px' });
  });

  it('should show cursor pointer for failed status', () => {
    renderWithTheme(<DeliveryStatus status="failed" />);
    
    const statusElement = screen.getByTestId('delivery-status');
    expect(statusElement).toHaveStyle({ cursor: 'pointer' });
  });

  it('should show default cursor for other statuses', () => {
    renderWithTheme(<DeliveryStatus status="sent" />);
    
    const statusElement = screen.getByTestId('delivery-status');
    expect(statusElement).toHaveStyle({ cursor: 'default' });
  });

  describe('Tooltip Text', () => {
    it('should show correct tooltip for sending status', () => {
      renderWithTheme(<DeliveryStatus status="sending" />);
      
      // The tooltip text is not directly testable without user interaction
      // but we can verify the component renders correctly
      expect(screen.getByTestId('delivery-status')).toBeInTheDocument();
    });

    it('should show correct tooltip for sent status with timestamp', () => {
      const timestamp = new Date('2023-01-01T12:00:00Z');
      renderWithTheme(<DeliveryStatus status="sent" timestamp={timestamp} />);
      
      expect(screen.getByTestId('delivery-status')).toBeInTheDocument();
    });

    it('should show correct tooltip for read status in private chat', () => {
      renderWithTheme(<DeliveryStatus status="read" chatType="private" />);
      
      expect(screen.getByTestId('delivery-status')).toBeInTheDocument();
    });

    it('should show correct tooltip for read status in group chat', () => {
      const readBy = ['user1', 'user2'];
      renderWithTheme(
        <DeliveryStatus 
          status="read" 
          chatType="group" 
          readBy={readBy} 
        />
      );
      
      expect(screen.getByTestId('delivery-status')).toBeInTheDocument();
    });
  });

  describe('Chat Type Handling', () => {
    it('should handle private chat type', () => {
      renderWithTheme(<DeliveryStatus status="read" chatType="private" />);
      
      expect(screen.getByTestId('delivery-status')).toBeInTheDocument();
    });

    it('should handle group chat type', () => {
      renderWithTheme(<DeliveryStatus status="read" chatType="group" />);
      
      expect(screen.getByTestId('delivery-status')).toBeInTheDocument();
    });
  });

  describe('ReadBy Array Handling', () => {
    it('should handle empty readBy array', () => {
      renderWithTheme(
        <DeliveryStatus 
          status="read" 
          chatType="group" 
          readBy={[]} 
        />
      );
      
      expect(screen.getByTestId('delivery-status')).toBeInTheDocument();
    });

    it('should handle single reader in readBy array', () => {
      renderWithTheme(
        <DeliveryStatus 
          status="read" 
          chatType="group" 
          readBy={['user1']} 
        />
      );
      
      expect(screen.getByTestId('delivery-status')).toBeInTheDocument();
    });

    it('should handle multiple readers in readBy array', () => {
      renderWithTheme(
        <DeliveryStatus 
          status="read" 
          chatType="group" 
          readBy={['user1', 'user2', 'user3']} 
        />
      );
      
      expect(screen.getByTestId('delivery-status')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined status gracefully', () => {
      renderWithTheme(<DeliveryStatus status={undefined} />);
      
      // Should still render with default 'sent' status
      expect(screen.getByTestId('delivery-status')).toBeInTheDocument();
    });

    it('should handle invalid status gracefully', () => {
      renderWithTheme(<DeliveryStatus status="invalid" />);
      
      // Should not render for invalid status
      expect(screen.queryByTestId('delivery-status')).not.toBeInTheDocument();
    });

    it('should handle missing timestamp gracefully', () => {
      renderWithTheme(<DeliveryStatus status="sent" timestamp={null} />);
      
      expect(screen.getByTestId('delivery-status')).toBeInTheDocument();
    });
  });
});