import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ImageThumbnailGrid from './ImageThumbnailGrid';

// Mock the FluentIcon component
jest.mock('../Icons/FluentIcon', () => {
  return function MockFluentIcon({ name, size }) {
    return <span data-testid={`fluent-icon-${name}`} style={{ fontSize: size }}>{name}</span>;
  };
});

// Mock the useImageModal hook
jest.mock('../../../hooks/useImageModal', () => ({
  __esModule: true,
  default: () => ({
    isOpen: false,
    imageSrc: '',
    imageAlt: '',
    openModal: jest.fn(),
    closeModal: jest.fn()
  })
}));

// Mock the ImageModal component
jest.mock('../ImageModal/ImageModal', () => {
  return function MockImageModal({ isOpen, src, alt, onClose }) {
    return isOpen ? (
      <div data-testid="image-modal">
        <img src={src} alt={alt} />
        <button onClick={onClose}>Close</button>
      </div>
    ) : null;
  };
});

describe('ImageThumbnailGrid', () => {
  const mockImages = [
    { url: 'image1.jpg', alt: 'Image 1', filename: 'image1.jpg' },
    { url: 'image2.jpg', alt: 'Image 2', filename: 'image2.jpg' },
    { url: 'image3.jpg', alt: 'Image 3', filename: 'image3.jpg' },
    { url: 'image4.jpg', alt: 'Image 4', filename: 'image4.jpg' }
  ];

  it('renders nothing when no images provided', () => {
    const { container } = render(<ImageThumbnailGrid images={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when images is null or undefined', () => {
    const { container } = render(<ImageThumbnailGrid images={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders image thumbnails for provided images', () => {
    render(<ImageThumbnailGrid images={mockImages.slice(0, 2)} />);
    
    const images = screen.getAllByRole('img', { hidden: true });
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src', 'image1.jpg');
    expect(images[1]).toHaveAttribute('src', 'image2.jpg');
  });

  it('limits displayed images to maxImages prop', () => {
    render(<ImageThumbnailGrid images={mockImages} maxImages={2} />);
    
    const images = screen.getAllByRole('img', { hidden: true });
    expect(images).toHaveLength(2);
  });

  it('shows remaining count when there are more images than maxImages', () => {
    render(<ImageThumbnailGrid images={mockImages} maxImages={3} />);
    
    expect(screen.getByText('+1 more')).toBeInTheDocument();
  });

  it('applies correct variant class', () => {
    const { container } = render(
      <ImageThumbnailGrid images={mockImages.slice(0, 1)} variant="grid" />
    );
    
    const thumbnail = container.querySelector('.image-thumbnail--grid');
    expect(thumbnail).toBeInTheDocument();
  });

  it('handles images with different data structures', () => {
    const mixedImages = [
      { url: 'image1.jpg', filename: 'image1.jpg' },
      { src: 'image2.jpg', alt: 'Image 2' },
      'image3.jpg' // string URL
    ];

    render(<ImageThumbnailGrid images={mixedImages} />);
    
    const images = screen.getAllByRole('img', { hidden: true });
    expect(images).toHaveLength(3);
    expect(images[0]).toHaveAttribute('src', 'image1.jpg');
    expect(images[1]).toHaveAttribute('src', 'image2.jpg');
    expect(images[2]).toHaveAttribute('src', 'image3.jpg');
  });

  it('applies custom className', () => {
    const { container } = render(
      <ImageThumbnailGrid 
        images={mockImages.slice(0, 1)} 
        className="custom-class" 
      />
    );
    
    const container_div = container.querySelector('.image-thumbnails-container.custom-class');
    expect(container_div).toBeInTheDocument();
  });
});