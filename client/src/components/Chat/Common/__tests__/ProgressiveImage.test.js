import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ProgressiveImage from '../ProgressiveImage';

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

describe('ProgressiveImage', () => {
  const defaultProps = {
    src: 'https://example.com/image.jpg',
    thumbnail: 'data:image/jpeg;base64,thumbnail-data',
    alt: 'Test image'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render thumbnail initially', () => {
    render(<ProgressiveImage {...defaultProps} />);
    
    const thumbnail = screen.getByAltText('Test image');
    expect(thumbnail).toBeInTheDocument();
    expect(thumbnail).toHaveClass('progressive-image__thumbnail');
    expect(thumbnail.src).toBe('data:image/jpeg;base64,thumbnail-data');
  });

  it('should set up intersection observer', () => {
    render(<ProgressiveImage {...defaultProps} />);
    
    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      { rootMargin: '50px' }
    );
  });

  it('should load main image when in view', async () => {
    let intersectionCallback;
    mockIntersectionObserver.mockImplementation((callback) => {
      intersectionCallback = callback;
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
    });

    render(<ProgressiveImage {...defaultProps} />);
    
    // Simulate intersection
    intersectionCallback([{ isIntersecting: true }]);
    
    await waitFor(() => {
      const mainImages = screen.getAllByAltText('Test image');
      const mainImage = mainImages.find(img => 
        img.classList.contains('progressive-image__main')
      );
      expect(mainImage).toBeInTheDocument();
      expect(mainImage.src).toBe('https://example.com/image.jpg');
    });
  });

  it('should show loading indicator when main image is loading', async () => {
    let intersectionCallback;
    mockIntersectionObserver.mockImplementation((callback) => {
      intersectionCallback = callback;
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
    });

    render(<ProgressiveImage {...defaultProps} />);
    
    // Simulate intersection
    intersectionCallback([{ isIntersecting: true }]);
    
    await waitFor(() => {
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  it('should hide thumbnail when main image loads', async () => {
    let intersectionCallback;
    mockIntersectionObserver.mockImplementation((callback) => {
      intersectionCallback = callback;
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
    });

    const { container } = render(<ProgressiveImage {...defaultProps} />);
    
    // Simulate intersection
    intersectionCallback([{ isIntersecting: true }]);
    
    await waitFor(() => {
      const mainImage = container.querySelector('.progressive-image__main');
      expect(mainImage).toBeInTheDocument();
    });

    // Simulate main image load
    const mainImage = container.querySelector('.progressive-image__main');
    mainImage.onload();

    await waitFor(() => {
      const thumbnail = container.querySelector('.progressive-image__thumbnail');
      expect(thumbnail).toHaveClass('progressive-image__thumbnail--hidden');
    });
  });

  it('should show error state when image fails to load', async () => {
    let intersectionCallback;
    mockIntersectionObserver.mockImplementation((callback) => {
      intersectionCallback = callback;
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
    });

    const { container } = render(<ProgressiveImage {...defaultProps} />);
    
    // Simulate intersection
    intersectionCallback([{ isIntersecting: true }]);
    
    await waitFor(() => {
      const mainImage = container.querySelector('.progressive-image__main');
      expect(mainImage).toBeInTheDocument();
    });

    // Simulate main image error
    const mainImage = container.querySelector('.progressive-image__main');
    mainImage.onerror();

    await waitFor(() => {
      expect(screen.getByText('Failed to load image')).toBeInTheDocument();
    });
  });

  it('should call onLoad callback when image loads', async () => {
    const onLoad = jest.fn();
    let intersectionCallback;
    mockIntersectionObserver.mockImplementation((callback) => {
      intersectionCallback = callback;
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
    });

    const { container } = render(
      <ProgressiveImage {...defaultProps} onLoad={onLoad} />
    );
    
    // Simulate intersection
    intersectionCallback([{ isIntersecting: true }]);
    
    await waitFor(() => {
      const mainImage = container.querySelector('.progressive-image__main');
      expect(mainImage).toBeInTheDocument();
    });

    // Simulate main image load
    const mainImage = container.querySelector('.progressive-image__main');
    const mockEvent = { target: mainImage };
    mainImage.onload(mockEvent);

    expect(onLoad).toHaveBeenCalledWith(mockEvent);
  });

  it('should call onError callback when image fails', async () => {
    const onError = jest.fn();
    let intersectionCallback;
    mockIntersectionObserver.mockImplementation((callback) => {
      intersectionCallback = callback;
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
    });

    const { container } = render(
      <ProgressiveImage {...defaultProps} onError={onError} />
    );
    
    // Simulate intersection
    intersectionCallback([{ isIntersecting: true }]);
    
    await waitFor(() => {
      const mainImage = container.querySelector('.progressive-image__main');
      expect(mainImage).toBeInTheDocument();
    });

    // Simulate main image error
    const mainImage = container.querySelector('.progressive-image__main');
    const mockEvent = { target: mainImage };
    mainImage.onerror(mockEvent);

    expect(onError).toHaveBeenCalledWith(mockEvent);
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ProgressiveImage {...defaultProps} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('progressive-image', 'custom-class');
  });

  it('should work without thumbnail', async () => {
    let intersectionCallback;
    mockIntersectionObserver.mockImplementation((callback) => {
      intersectionCallback = callback;
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
    });

    render(<ProgressiveImage src={defaultProps.src} alt={defaultProps.alt} />);
    
    // Should not render thumbnail
    expect(document.querySelector('.progressive-image__thumbnail')).not.toBeInTheDocument();
    
    // Simulate intersection
    intersectionCallback([{ isIntersecting: true }]);
    
    await waitFor(() => {
      const mainImage = screen.getByAltText('Test image');
      expect(mainImage).toHaveClass('progressive-image__main');
    });
  });

  it('should cleanup intersection observer on unmount', () => {
    const mockDisconnect = jest.fn();
    mockIntersectionObserver.mockReturnValue({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: mockDisconnect,
    });

    const { unmount } = render(<ProgressiveImage {...defaultProps} />);
    
    unmount();
    
    expect(mockDisconnect).toHaveBeenCalled();
  });
});