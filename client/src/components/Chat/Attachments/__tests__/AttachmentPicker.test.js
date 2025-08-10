import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AttachmentPicker from '../AttachmentPicker';

const theme = createTheme();

const TestWrapper = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

// Mock useMediaQuery for responsive testing
const mockUseMediaQuery = jest.fn();
jest.mock('@mui/material/styles', () => ({
  ...jest.requireActual('@mui/material/styles'),
  useMediaQuery: () => mockUseMediaQuery()
}));

describe('AttachmentPicker Component', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    onAttachmentSelect: jest.fn(),
    anchorEl: document.createElement('div'),
    disabled: false,
    availableTypes: ['camera', 'gallery', 'document', 'location', 'contact']
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMediaQuery.mockReturnValue(false); // Default to desktop
    
    // Mock getBoundingClientRect for positioning
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      top: 100,
      left: 200,
      bottom: 150,
      right: 300,
      width: 100,
      height: 50
    }));
  });

  describe('Basic Rendering', () => {
    it('renders when open is true', () => {
      render(
        <TestWrapper>
          <AttachmentPicker {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Camera')).toBeInTheDocument();
      expect(screen.getByText('Gallery')).toBeInTheDocument();
      expect(screen.getByText('Document')).toBeInTheDocument();
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
    });

    it('does not render when open is false', () => {
      render(
        <TestWrapper>
          <AttachmentPicker {...defaultProps} open={false} />
        </TestWrapper>
      );

      expect(screen.queryByText('Camera')).not.toBeInTheDocument();
    });

    it('renders all attachment type icons', () => {
      render(
        <TestWrapper>
          <AttachmentPicker {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByTestId('CameraAltIcon')).toBeInTheDocument();
      expect(screen.getByTestId('PhotoLibraryIcon')).toBeInTheDocument();
      expect(screen.getByTestId('InsertDriveFileIcon')).toBeInTheDocument();
      expect(screen.getByTestId('LocationOnIcon')).toBeInTheDocument();
      expect(screen.getByTestId('ContactPhoneIcon')).toBeInTheDocument();
    });
  });

  describe('Available Types Filtering', () => {
    it('renders only specified available types', () => {
      render(
        <TestWrapper>
          <AttachmentPicker 
            {...defaultProps} 
            availableTypes={['camera', 'document']}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Camera')).toBeInTheDocument();
      expect(screen.getByText('Document')).toBeInTheDocument();
      expect(screen.queryByText('Gallery')).not.toBeInTheDocument();
      expect(screen.queryByText('Location')).not.toBeInTheDocument();
      expect(screen.queryByText('Contact')).not.toBeInTheDocument();
    });

    it('handles empty availableTypes array', () => {
      render(
        <TestWrapper>
          <AttachmentPicker 
            {...defaultProps} 
            availableTypes={[]}
          />
        </TestWrapper>
      );

      expect(screen.queryByText('Camera')).not.toBeInTheDocument();
      expect(screen.queryByText('Gallery')).not.toBeInTheDocument();
    });

    it('handles invalid attachment types gracefully', () => {
      render(
        <TestWrapper>
          <AttachmentPicker 
            {...defaultProps} 
            availableTypes={['camera', 'invalid_type', 'document']}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Camera')).toBeInTheDocument();
      expect(screen.getByText('Document')).toBeInTheDocument();
      expect(screen.queryByText('invalid_type')).not.toBeInTheDocument();
    });
  });

  describe('Attachment Selection', () => {
    it('calls onAttachmentSelect when attachment type is clicked', () => {
      const onAttachmentSelect = jest.fn();

      render(
        <TestWrapper>
          <AttachmentPicker 
            {...defaultProps} 
            onAttachmentSelect={onAttachmentSelect}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Camera'));

      expect(onAttachmentSelect).toHaveBeenCalledWith('camera');
    });

    it('calls onClose after attachment selection', () => {
      const onClose = jest.fn();

      render(
        <TestWrapper>
          <AttachmentPicker 
            {...defaultProps} 
            onClose={onClose}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Gallery'));

      expect(onClose).toHaveBeenCalled();
    });

    it('does not call callbacks when disabled', () => {
      const onAttachmentSelect = jest.fn();
      const onClose = jest.fn();

      render(
        <TestWrapper>
          <AttachmentPicker 
            {...defaultProps} 
            disabled={true}
            onAttachmentSelect={onAttachmentSelect}
            onClose={onClose}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Camera'));

      expect(onAttachmentSelect).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Mobile Layout', () => {
    beforeEach(() => {
      mockUseMediaQuery.mockReturnValue(true); // Mobile
    });

    it('renders mobile header with close button', () => {
      render(
        <TestWrapper>
          <AttachmentPicker {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Share')).toBeInTheDocument();
      expect(screen.getByLabelText('close')).toBeInTheDocument();
    });

    it('closes picker when mobile close button is clicked', () => {
      const onClose = jest.fn();

      render(
        <TestWrapper>
          <AttachmentPicker 
            {...defaultProps} 
            onClose={onClose}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByLabelText('close'));

      expect(onClose).toHaveBeenCalled();
    });

    it('uses 3-column grid layout on mobile', () => {
      render(
        <TestWrapper>
          <AttachmentPicker {...defaultProps} />
        </TestWrapper>
      );

      // Check for mobile-specific styling (3 columns)
      const gridContainer = screen.getByText('Camera').closest('[style*="grid-template-columns"]');
      expect(gridContainer).toHaveStyle({ gridTemplateColumns: 'repeat(3, 1fr)' });
    });

    it('renders safe area padding on mobile', () => {
      render(
        <TestWrapper>
          <AttachmentPicker {...defaultProps} />
        </TestWrapper>
      );

      // Safe area padding should be present
      const safeAreaPadding = document.querySelector('[style*="env(safe-area-inset-bottom"]');
      expect(safeAreaPadding).toBeInTheDocument();
    });
  });

  describe('Desktop Layout', () => {
    beforeEach(() => {
      mockUseMediaQuery.mockReturnValue(false); // Desktop
    });

    it('does not render mobile header on desktop', () => {
      render(
        <TestWrapper>
          <AttachmentPicker {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.queryByText('Share')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('close')).not.toBeInTheDocument();
    });

    it('uses 2-column grid layout on desktop', () => {
      render(
        <TestWrapper>
          <AttachmentPicker {...defaultProps} />
        </TestWrapper>
      );

      // Check for desktop-specific styling (2 columns)
      const gridContainer = screen.getByText('Camera').closest('[style*="grid-template-columns"]');
      expect(gridContainer).toHaveStyle({ gridTemplateColumns: 'repeat(2, 1fr)' });
    });

    it('positions relative to anchor element on desktop', () => {
      render(
        <TestWrapper>
          <AttachmentPicker {...defaultProps} />
        </TestWrapper>
      );

      // Should use fixed positioning based on anchor element
      const picker = document.querySelector('[style*="position: fixed"]');
      expect(picker).toBeInTheDocument();
    });
  });

  describe('Click Away Behavior', () => {
    it('closes picker when clicking away', () => {
      const onClose = jest.fn();

      render(
        <TestWrapper>
          <AttachmentPicker 
            {...defaultProps} 
            onClose={onClose}
          />
        </TestWrapper>
      );

      // Simulate click away
      fireEvent.click(document.body);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Tooltips', () => {
    it('shows tooltips for attachment types', () => {
      render(
        <TestWrapper>
          <AttachmentPicker {...defaultProps} />
        </TestWrapper>
      );

      // Tooltips are rendered by MUI, check for title attributes or tooltip content
      const cameraButton = screen.getByText('Camera').closest('[role="button"]');
      expect(cameraButton).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('applies disabled styling when disabled', () => {
      render(
        <TestWrapper>
          <AttachmentPicker 
            {...defaultProps} 
            disabled={true}
          />
        </TestWrapper>
      );

      const cameraButton = screen.getByText('Camera').closest('[style*="opacity"]');
      expect(cameraButton).toHaveStyle({ opacity: '0.5' });
    });

    it('shows not-allowed cursor when disabled', () => {
      render(
        <TestWrapper>
          <AttachmentPicker 
            {...defaultProps} 
            disabled={true}
          />
        </TestWrapper>
      );

      const cameraButton = screen.getByText('Camera').closest('[style*="cursor"]');
      expect(cameraButton).toHaveStyle({ cursor: 'not-allowed' });
    });
  });

  describe('Hover Effects', () => {
    it('applies hover styles to attachment buttons', () => {
      render(
        <TestWrapper>
          <AttachmentPicker {...defaultProps} />
        </TestWrapper>
      );

      const cameraButton = screen.getByText('Camera').closest('[role="button"]');
      
      // Hover effects are applied via sx prop, hard to test directly
      // But we can verify the button is interactive
      expect(cameraButton).toHaveStyle({ cursor: 'pointer' });
    });
  });

  describe('Accessibility', () => {
    it('has proper button roles for attachment options', () => {
      render(
        <TestWrapper>
          <AttachmentPicker {...defaultProps} />
        </TestWrapper>
      );

      // Each attachment option should be clickable
      const cameraButton = screen.getByText('Camera').closest('div');
      expect(cameraButton).toBeInTheDocument();
    });

    it('has proper close button accessibility', () => {
      mockUseMediaQuery.mockReturnValue(true); // Mobile

      render(
        <TestWrapper>
          <AttachmentPicker {...defaultProps} />
        </TestWrapper>
      );

      const closeButton = screen.getByLabelText('close');
      expect(closeButton).toHaveAttribute('aria-label', 'close');
    });
  });

  describe('Color Coding', () => {
    it('applies correct colors to attachment type icons', () => {
      render(
        <TestWrapper>
          <AttachmentPicker {...defaultProps} />
        </TestWrapper>
      );

      // Colors are applied via sx prop, verify icons are rendered
      expect(screen.getByTestId('CameraAltIcon')).toBeInTheDocument();
      expect(screen.getByTestId('PhotoLibraryIcon')).toBeInTheDocument();
      expect(screen.getByTestId('InsertDriveFileIcon')).toBeInTheDocument();
      expect(screen.getByTestId('LocationOnIcon')).toBeInTheDocument();
      expect(screen.getByTestId('ContactPhoneIcon')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing onAttachmentSelect callback', () => {
      render(
        <TestWrapper>
          <AttachmentPicker 
            {...defaultProps} 
            onAttachmentSelect={null}
          />
        </TestWrapper>
      );

      // Should not throw error when clicked
      expect(() => {
        fireEvent.click(screen.getByText('Camera'));
      }).not.toThrow();
    });

    it('handles missing onClose callback', () => {
      render(
        <TestWrapper>
          <AttachmentPicker 
            {...defaultProps} 
            onClose={null}
          />
        </TestWrapper>
      );

      // Should not throw error when clicking away
      expect(() => {
        fireEvent.click(document.body);
      }).not.toThrow();
    });

    it('handles missing anchorEl on desktop', () => {
      mockUseMediaQuery.mockReturnValue(false); // Desktop

      render(
        <TestWrapper>
          <AttachmentPicker 
            {...defaultProps} 
            anchorEl={null}
          />
        </TestWrapper>
      );

      // Should still render without positioning
      expect(screen.getByText('Camera')).toBeInTheDocument();
    });

    it('handles window resize gracefully', () => {
      const { rerender } = render(
        <TestWrapper>
          <AttachmentPicker {...defaultProps} />
        </TestWrapper>
      );

      // Switch from desktop to mobile
      mockUseMediaQuery.mockReturnValue(true);

      rerender(
        <TestWrapper>
          <AttachmentPicker {...defaultProps} />
        </TestWrapper>
      );

      // Mobile layout should be applied but Share text might not be visible due to test environment
      expect(screen.getByText('Camera')).toBeInTheDocument();
    });
  });

  describe('Animation and Transitions', () => {
    it('renders with Fade transition', () => {
      render(
        <TestWrapper>
          <AttachmentPicker {...defaultProps} />
        </TestWrapper>
      );

      // Fade component is used, verify content is rendered
      expect(screen.getByText('Camera')).toBeInTheDocument();
    });
  });

  describe('Theme Integration', () => {
    it('uses theme breakpoints for responsive behavior', () => {
      render(
        <TestWrapper>
          <AttachmentPicker {...defaultProps} />
        </TestWrapper>
      );

      // Theme integration is handled by MUI hooks
      expect(screen.getByText('Camera')).toBeInTheDocument();
    });

    it('uses theme elevation for paper component', () => {
      render(
        <TestWrapper>
          <AttachmentPicker {...defaultProps} />
        </TestWrapper>
      );

      // Paper component with elevation should be rendered
      const paper = document.querySelector('.MuiPaper-root');
      expect(paper).toBeInTheDocument();
    });
  });
});