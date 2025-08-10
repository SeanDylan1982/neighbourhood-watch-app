import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ImageModal from './ImageModal';

// Mock the FluentIcon component
jest.mock('../Icons/FluentIcon', () => {
  return function MockFluentIcon({ name, size }) {
    return <span data-testid={`fluent-icon-${name}`} style={{ fontSize: size }}>{name}</span>;
  };
});

describe('ImageModal', () => {
  const defaultProps = {
    src: 'test-image.jpg',
    alt: 'Test image',
    isOpen: true,
    onClose: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ImageModal {...defaultProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal when isOpen is true', () => {
    render(<ImageModal {...defaultProps} />);
    
    // Initially shows loading state
    expect(screen.getByText('Loading image...')).toBeInTheDocument();
    
    // Image exists but is hidden during loading
    const image = screen.getByRole('img', { hidden: true });
    expect(image).toHaveAttribute('src', 'test-image.jpg');
    expect(image).toHaveAttribute('alt', 'Test image');
  });

  it('renders close button', () => {
    render(<ImageModal {...defaultProps} />);
    
    const closeButton = screen.getByRole('button', { name: /close image/i });
    expect(closeButton).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const mockOnClose = jest.fn();
    render(<ImageModal {...defaultProps} onClose={mockOnClose} />);
    
    const closeButton = screen.getByRole('button', { name: /close image/i });
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    const mockOnClose = jest.fn();
    render(<ImageModal {...defaultProps} onClose={mockOnClose} />);
    
    const modal = document.querySelector('.image-modal');
    fireEvent.click(modal);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when image content is clicked', () => {
    const mockOnClose = jest.fn();
    render(<ImageModal {...defaultProps} onClose={mockOnClose} />);
    
    const modalContent = document.querySelector('.image-modal__content');
    fireEvent.click(modalContent);
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Escape key is pressed', () => {
    const mockOnClose = jest.fn();
    render(<ImageModal {...defaultProps} onClose={mockOnClose} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when other keys are pressed', () => {
    const mockOnClose = jest.fn();
    render(<ImageModal {...defaultProps} onClose={mockOnClose} />);
    
    fireEvent.keyDown(document, { key: 'Enter' });
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('sets body overflow to hidden when modal is open', () => {
    render(<ImageModal {...defaultProps} />);
    
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('resets body overflow when modal is closed', () => {
    const { rerender } = render(<ImageModal {...defaultProps} />);
    
    expect(document.body.style.overflow).toBe('hidden');
    
    rerender(<ImageModal {...defaultProps} isOpen={false} />);
    
    expect(document.body.style.overflow).toBe('unset');
  });

  it('shows loading state initially', () => {
    render(<ImageModal {...defaultProps} />);
    
    expect(screen.getByText('Loading image...')).toBeInTheDocument();
    expect(screen.getByTestId('fluent-icon-CircleRing')).toBeInTheDocument();
  });

  it('handles image error by showing error state', () => {
    render(<ImageModal {...defaultProps} />);
    
    const image = screen.getByRole('img', { hidden: true });
    fireEvent.error(image);
    
    expect(screen.getByText('Failed to load image')).toBeInTheDocument();
    expect(screen.getByTestId('fluent-icon-ImageOff')).toBeInTheDocument();
    expect(image.style.display).toBe('none');
  });

  it('handles image load by hiding loading state', () => {
    render(<ImageModal {...defaultProps} />);
    
    const image = screen.getByRole('img', { hidden: true });
    fireEvent.load(image);
    
    expect(screen.queryByText('Loading image...')).not.toBeInTheDocument();
    expect(image.style.display).toBe('block');
  });

  it('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    
    const { unmount } = render(<ImageModal {...defaultProps} />);
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    
    removeEventListenerSpy.mockRestore();
  });
});