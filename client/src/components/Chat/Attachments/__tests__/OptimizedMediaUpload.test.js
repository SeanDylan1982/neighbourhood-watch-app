import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OptimizedMediaUpload from '../OptimizedMediaUpload';

// Mock the media optimization hook
jest.mock('../../../hooks/useMediaOptimization', () => ({
  useMediaOptimization: () => ({
    optimizeImage: jest.fn().mockResolvedValue({
      originalFile: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
      optimizedFile: new File(['optimized'], 'test.jpg', { type: 'image/jpeg' }),
      thumbnails: { small: 'data:image/jpeg;base64,small' },
      compressionRatio: 50,
      originalSize: 1000000,
      optimizedSize: 500000,
      url: 'blob:test-url'
    }),
    optimizeMultipleImages: jest.fn().mockResolvedValue([]),
    isProcessing: false,
    progress: 0,
    error: null,
    cancelProcessing: jest.fn()
  })
}));

// Mock ProgressiveImage
jest.mock('../../Common/ProgressiveImage', () => {
  return function MockProgressiveImage({ src, thumbnail, alt, ...props }) {
    return <img src={src} alt={alt} data-thumbnail={thumbnail} {...props} />;
  };
});

describe('OptimizedMediaUpload', () => {
  const defaultProps = {
    onUpload: jest.fn(),
    onError: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render upload dropzone', () => {
    render(<OptimizedMediaUpload {...defaultProps} />);
    
    expect(screen.getByText(/click to select files or drag and drop/i)).toBeInTheDocument();
  });

  it('should handle file selection', async () => {
    const { container } = render(<OptimizedMediaUpload {...defaultProps} />);
    
    const fileInput = container.querySelector('input[type="file"]');
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(defaultProps.onUpload).toHaveBeenCalled();
    });
  });

  it('should show processing indicator when optimizing', () => {
    const mockHook = require('../../../hooks/useMediaOptimization').useMediaOptimization;
    mockHook.mockReturnValue({
      optimizeImage: jest.fn(),
      optimizeMultipleImages: jest.fn(),
      isProcessing: true,
      progress: 50,
      error: null,
      cancelProcessing: jest.fn()
    });

    render(<OptimizedMediaUpload {...defaultProps} />);
    
    expect(screen.getByText(/optimizing images/i)).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should show error message when optimization fails', () => {
    const mockHook = require('../../../hooks/useMediaOptimization').useMediaOptimization;
    mockHook.mockReturnValue({
      optimizeImage: jest.fn(),
      optimizeMultipleImages: jest.fn(),
      isProcessing: false,
      progress: 0,
      error: 'Optimization failed',
      cancelProcessing: jest.fn()
    });

    render(<OptimizedMediaUpload {...defaultProps} />);
    
    expect(screen.getByText(/optimization failed/i)).toBeInTheDocument();
  });

  it('should handle drag and drop', () => {
    const { container } = render(<OptimizedMediaUpload {...defaultProps} />);
    
    const dropzone = container.querySelector('.optimized-media-upload__dropzone');
    
    fireEvent.dragEnter(dropzone);
    expect(dropzone).toHaveClass('optimized-media-upload__dropzone--active');
    
    fireEvent.dragLeave(dropzone);
    expect(dropzone).not.toHaveClass('optimized-media-upload__dropzone--active');
  });

  it('should allow canceling processing', () => {
    const mockCancelProcessing = jest.fn();
    const mockHook = require('../../../hooks/useMediaOptimization').useMediaOptimization;
    mockHook.mockReturnValue({
      optimizeImage: jest.fn(),
      optimizeMultipleImages: jest.fn(),
      isProcessing: true,
      progress: 30,
      error: null,
      cancelProcessing: mockCancelProcessing
    });

    render(<OptimizedMediaUpload {...defaultProps} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockCancelProcessing).toHaveBeenCalled();
  });

  it('should respect maxFiles limit', () => {
    render(<OptimizedMediaUpload {...defaultProps} maxFiles={2} />);
    
    expect(screen.getByText(/up to 2 files/i)).toBeInTheDocument();
  });

  it('should handle custom children', () => {
    render(
      <OptimizedMediaUpload {...defaultProps}>
        <div>Custom upload content</div>
      </OptimizedMediaUpload>
    );
    
    expect(screen.getByText('Custom upload content')).toBeInTheDocument();
  });
});