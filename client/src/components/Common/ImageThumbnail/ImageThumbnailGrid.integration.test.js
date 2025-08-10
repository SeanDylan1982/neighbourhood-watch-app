import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ImageThumbnailGrid from './ImageThumbnailGrid';

// Mock the FluentIcon component
jest.mock('../Icons/FluentIcon', () => {
  return function MockFluentIcon({ name, size }) {
    return <span data-testid={`fluent-icon-${name}`} style={{ fontSize: size }}>{name}</span>;
  };
});

describe('ImageThumbnailGrid Integration', () => {
  const mockImages = [
    { url: 'image1.jpg', alt: 'Image 1', filename: 'image1.jpg' },
    { url: 'image2.jpg', alt: 'Image 2', filename: 'image2.jpg' }
  ];

  it('opens image modal when thumbnail is clicked', async () => {
    render(<ImageThumbnailGrid images={mockImages} />);
    
    // Get the first thumbnail container
    const thumbnailContainers = screen.getAllByRole('img', { hidden: true }).map(img => 
      img.closest('.image-thumbnail')
    );
    
    // Click on the first thumbnail
    fireEvent.click(thumbnailContainers[0]);
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByRole('img', { name: /Image 1/i })).toBeInTheDocument();
    });
    
    // Check that the correct image is displayed in the modal
    const modalImage = document.querySelector('.image-modal__image');
    expect(modalImage).toHaveAttribute('src', 'image1.jpg');
    expect(modalImage).toHaveAttribute('alt', 'Image 1');
  });

  it('closes image modal when close button is clicked', async () => {
    render(<ImageThumbnailGrid images={mockImages} />);
    
    // Click on thumbnail to open modal
    const thumbnailContainers = screen.getAllByRole('img', { hidden: true }).map(img => 
      img.closest('.image-thumbnail')
    );
    fireEvent.click(thumbnailContainers[0]);
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(document.querySelector('.image-modal')).toBeInTheDocument();
    });
    
    // Click close button
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    
    // Wait for modal to disappear
    await waitFor(() => {
      expect(document.querySelector('.image-modal')).not.toBeInTheDocument();
    });
  });

  it('handles different image data structures correctly in modal', async () => {
    const mixedImages = [
      { url: 'image1.jpg', filename: 'image1.jpg' },
      { src: 'image2.jpg', alt: 'Image 2' },
      'image3.jpg' // string URL
    ];

    render(<ImageThumbnailGrid images={mixedImages} />);
    
    const thumbnailContainers = screen.getAllByRole('img', { hidden: true }).map(img => 
      img.closest('.image-thumbnail')
    );
    
    // Test first image (url property)
    fireEvent.click(thumbnailContainers[0]);
    await waitFor(() => {
      const modalImage = document.querySelector('.image-modal__image');
      expect(modalImage).toHaveAttribute('src', 'image1.jpg');
    });
    
    // Close modal
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(document.querySelector('.image-modal')).not.toBeInTheDocument();
    });
    
    // Test second image (src property)
    fireEvent.click(thumbnailContainers[1]);
    await waitFor(() => {
      const modalImage = document.querySelector('.image-modal__image');
      expect(modalImage).toHaveAttribute('src', 'image2.jpg');
      expect(modalImage).toHaveAttribute('alt', 'Image 2');
    });
    
    // Close modal
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(document.querySelector('.image-modal')).not.toBeInTheDocument();
    });
    
    // Test third image (string URL)
    fireEvent.click(thumbnailContainers[2]);
    await waitFor(() => {
      const modalImage = document.querySelector('.image-modal__image');
      expect(modalImage).toHaveAttribute('src', 'image3.jpg');
    });
  });

  it('displays correct image when clicking different thumbnails', async () => {
    render(<ImageThumbnailGrid images={mockImages} />);
    
    const thumbnailContainers = screen.getAllByRole('img', { hidden: true }).map(img => 
      img.closest('.image-thumbnail')
    );
    
    // Click first thumbnail
    fireEvent.click(thumbnailContainers[0]);
    await waitFor(() => {
      const modalImage = document.querySelector('.image-modal__image');
      expect(modalImage).toHaveAttribute('src', 'image1.jpg');
    });
    
    // Close modal
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(document.querySelector('.image-modal')).not.toBeInTheDocument();
    });
    
    // Click second thumbnail
    fireEvent.click(thumbnailContainers[1]);
    await waitFor(() => {
      const modalImage = document.querySelector('.image-modal__image');
      expect(modalImage).toHaveAttribute('src', 'image2.jpg');
    });
  });
});