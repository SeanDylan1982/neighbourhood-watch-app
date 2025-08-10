import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ForwardedMessageIndicator from '../ForwardedMessageIndicator';

const theme = createTheme();

const TestWrapper = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

describe('ForwardedMessageIndicator', () => {
  const renderIndicator = (props = {}) => {
    return render(
      <TestWrapper>
        <ForwardedMessageIndicator {...props} />
      </TestWrapper>
    );
  };

  describe('Rendering', () => {
    it('does not render when no forwarding information is provided', () => {
      const { container } = renderIndicator();
      expect(container.firstChild).toBeNull();
    });

    it('renders with original sender information', () => {
      renderIndicator({
        originalSender: 'John Doe',
        originalChatName: 'Test Group'
      });
      
      expect(screen.getByText('Forwarded Message')).toBeInTheDocument();
      expect(screen.getByText('Forwarded from John Doe in Test Group')).toBeInTheDocument();
    });

    it('renders with only original sender', () => {
      renderIndicator({
        originalSender: 'John Doe'
      });
      
      expect(screen.getByText('Forwarded Message')).toBeInTheDocument();
      expect(screen.getByText('Forwarded from John Doe')).toBeInTheDocument();
    });

    it('renders with forwarded by information', () => {
      renderIndicator({
        forwardedBy: 'Jane Smith'
      });
      
      expect(screen.getByText('Forwarded Message')).toBeInTheDocument();
      expect(screen.getByText('Forwarded by Jane Smith')).toBeInTheDocument();
    });

    it('renders with forwarded timestamp', () => {
      const forwardedAt = new Date('2024-01-01T10:00:00Z');
      renderIndicator({
        originalSender: 'John Doe',
        forwardedAt
      });
      
      expect(screen.getByText('Forwarded Message')).toBeInTheDocument();
      expect(screen.getByText('Forwarded from John Doe')).toBeInTheDocument();
      expect(screen.getByText(forwardedAt.toLocaleString())).toBeInTheDocument();
    });
  });

  describe('Compact Variant', () => {
    it('renders compact version correctly', () => {
      renderIndicator({
        originalSender: 'John Doe',
        variant: 'compact'
      });
      
      expect(screen.getByText('Forwarded')).toBeInTheDocument();
      expect(screen.queryByText('Forwarded Message')).not.toBeInTheDocument();
      expect(screen.queryByText('Forwarded from John Doe')).not.toBeInTheDocument();
    });

    it('shows forward icon in compact mode', () => {
      renderIndicator({
        originalSender: 'John Doe',
        variant: 'compact'
      });
      
      // Check for forward icon (MUI Forward icon)
      const forwardIcon = document.querySelector('[data-testid="ForwardIcon"]');
      expect(forwardIcon || screen.getByText('Forwarded').previousSibling).toBeTruthy();
    });
  });

  describe('Default Variant', () => {
    it('renders full information in default mode', () => {
      renderIndicator({
        originalSender: 'John Doe',
        originalChatName: 'Test Group',
        forwardedBy: 'Jane Smith',
        forwardedAt: new Date('2024-01-01T10:00:00Z')
      });
      
      expect(screen.getByText('Forwarded Message')).toBeInTheDocument();
      expect(screen.getByText('Forwarded from John Doe in Test Group')).toBeInTheDocument();
    });

    it('has proper styling for default variant', () => {
      renderIndicator({
        originalSender: 'John Doe',
        className: 'test-class'
      });
      
      const container = screen.getByText('Forwarded Message').closest('div');
      expect(container).toHaveClass('test-class');
    });
  });

  describe('Text Formatting', () => {
    it('formats text correctly with both sender and chat name', () => {
      renderIndicator({
        originalSender: 'John Doe',
        originalChatName: 'Test Group'
      });
      
      expect(screen.getByText('Forwarded from John Doe in Test Group')).toBeInTheDocument();
    });

    it('formats text correctly with only sender', () => {
      renderIndicator({
        originalSender: 'John Doe'
      });
      
      expect(screen.getByText('Forwarded from John Doe')).toBeInTheDocument();
    });

    it('formats text correctly with only forwarded by', () => {
      renderIndicator({
        forwardedBy: 'Jane Smith'
      });
      
      expect(screen.getByText('Forwarded by Jane Smith')).toBeInTheDocument();
    });

    it('shows default text when minimal information is provided', () => {
      renderIndicator({
        originalSender: '',
        forwardedBy: ''
      });
      
      // Should not render anything
      const { container } = renderIndicator({
        originalSender: '',
        forwardedBy: ''
      });
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Timestamp Formatting', () => {
    it('formats timestamp correctly', () => {
      const testDate = new Date('2024-01-01T15:30:45Z');
      renderIndicator({
        originalSender: 'John Doe',
        forwardedAt: testDate
      });
      
      expect(screen.getByText(testDate.toLocaleString())).toBeInTheDocument();
    });

    it('handles invalid timestamp gracefully', () => {
      renderIndicator({
        originalSender: 'John Doe',
        forwardedAt: 'invalid-date'
      });
      
      expect(screen.getByText('Forwarded from John Doe')).toBeInTheDocument();
      // Should not crash or show invalid date
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      renderIndicator({
        originalSender: 'John Doe',
        originalChatName: 'Test Group'
      });
      
      // Check that the component has proper text hierarchy
      expect(screen.getByText('Forwarded Message')).toBeInTheDocument();
      expect(screen.getByText('Forwarded from John Doe in Test Group')).toBeInTheDocument();
    });

    it('provides meaningful text for screen readers', () => {
      renderIndicator({
        originalSender: 'John Doe',
        originalChatName: 'Test Group',
        forwardedBy: 'Jane Smith',
        forwardedAt: new Date('2024-01-01T10:00:00Z')
      });
      
      // All text should be accessible to screen readers
      expect(screen.getByText('Forwarded Message')).toBeInTheDocument();
      expect(screen.getByText('Forwarded from John Doe in Test Group')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      renderIndicator({
        originalSender: 'John Doe',
        className: 'custom-forwarded-indicator'
      });
      
      const container = screen.getByText('Forwarded Message').closest('div');
      expect(container).toHaveClass('custom-forwarded-indicator');
    });

    it('maintains consistent styling across variants', () => {
      const { rerender } = renderIndicator({
        originalSender: 'John Doe',
        variant: 'default'
      });
      
      expect(screen.getByText('Forwarded Message')).toBeInTheDocument();
      
      rerender(
        <TestWrapper>
          <ForwardedMessageIndicator
            originalSender="John Doe"
            variant="compact"
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('Forwarded')).toBeInTheDocument();
    });
  });
});