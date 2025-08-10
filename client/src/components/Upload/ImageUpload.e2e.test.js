import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ImageUpload from './ImageUpload';

// Mock the icons
jest.mock('../Common/Icons', () => ({
  CloudUpload: () => <div data-testid="cloud-upload-icon">CloudUpload</div>,
  Delete: () => <div data-testid="delete-icon">Delete</div>,
  Image: () => <div data-testid="image-icon">Image</div>,
  VideoFile: () => <div data-testid="video-icon">VideoFile</div>,
  InsertDriveFile: () => <div data-testid="file-icon">InsertDriveFile</div>
}));

describe('ImageUpload E2E', () => {
  beforeEach(() => {
    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('simulates complete user workflow with image uploads', async () => {
    const mockOnFilesChange = jest.fn();
    render(<ImageUpload onFilesChange={mockOnFilesChange} showPreview={true} />);
    
    // Simulate user selecting multiple image files
    const imageFiles = [
      new File(['image1'], 'photo1.jpg', { type: 'image/jpeg' }),
      new File(['image2'], 'photo2.png', { type: 'image/png' }),
      new File(['image3'], 'photo3.gif', { type: 'image/gif' })
    ];
    
    const input = document.querySelector('input[type="file"]');
    
    // Step 1: User selects files
    fireEvent.change(input, { target: { files: imageFiles } });
    
    // Step 2: Verify files are processed and displayed
    await waitFor(() => {
      expect(mockOnFilesChange).toHaveBeenCalledWith(imageFiles);
      expect(screen.getByText('Selected Files (3)')).toBeInTheDocument();
      expect(screen.getByText('photo1.jpg')).toBeInTheDocument();
      expect(screen.getByText('photo2.png')).toBeInTheDocument();
      expect(screen.getByText('photo3.gif')).toBeInTheDocument();
    });
    
    // Step 3: User decides to remove one file
    const deleteButtons = screen.getAllByTestId('delete-icon');
    fireEvent.click(deleteButtons[1].closest('button')); // Remove photo2.png
    
    // Step 4: Verify file was removed
    await waitFor(() => {
      expect(mockOnFilesChange).toHaveBeenCalledWith([imageFiles[0], imageFiles[2]]);
      expect(screen.getByText('Selected Files (2)')).toBeInTheDocument();
      expect(screen.getByText('photo1.jpg')).toBeInTheDocument();
      expect(screen.queryByText('photo2.png')).not.toBeInTheDocument();
      expect(screen.getByText('photo3.gif')).toBeInTheDocument();
    });
    
    // Step 5: User adds another file
    const newFile = new File(['image4'], 'photo4.webp', { type: 'image/webp' });
    fireEvent.change(input, { target: { files: [newFile] } });
    
    // Step 6: Verify new file was added to existing files
    await waitFor(() => {
      const expectedFiles = [imageFiles[0], imageFiles[2], newFile];
      expect(mockOnFilesChange).toHaveBeenCalledWith(expectedFiles);
      expect(screen.getByText('Selected Files (3)')).toBeInTheDocument();
      expect(screen.getByText('photo4.webp')).toBeInTheDocument();
    });
    
    // Step 7: User clears all files
    const clearButton = screen.getByText('Clear All');
    fireEvent.click(clearButton);
    
    // Step 8: Verify all files are cleared
    expect(mockOnFilesChange).toHaveBeenCalledWith([]);
    expect(screen.queryByText('Selected Files')).not.toBeInTheDocument();
  });

  it('handles upload errors gracefully', async () => {
    const mockOnFilesChange = jest.fn();
    render(<ImageUpload onFilesChange={mockOnFilesChange} maxSize={1000} maxFiles={2} />);
    
    const input = document.querySelector('input[type="file"]');
    
    // Test 1: File too large
    const largeFile = new File(['x'.repeat(2000)], 'large.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [largeFile] } });
    
    await waitFor(() => {
      expect(screen.getByText(/File "large.jpg" is too large/)).toBeInTheDocument();
    });
    expect(mockOnFilesChange).not.toHaveBeenCalled();
    
    // Test 2: Invalid file type
    const textFile = new File(['text'], 'document.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [textFile] } });
    
    await waitFor(() => {
      expect(screen.getByText(/File "document.txt" is not a supported file type/)).toBeInTheDocument();
    });
    expect(mockOnFilesChange).not.toHaveBeenCalled();
    
    // Test 3: Too many files
    const manyFiles = [
      new File(['1'], 'file1.jpg', { type: 'image/jpeg' }),
      new File(['2'], 'file2.jpg', { type: 'image/jpeg' }),
      new File(['3'], 'file3.jpg', { type: 'image/jpeg' })
    ];
    fireEvent.change(input, { target: { files: manyFiles } });
    
    await waitFor(() => {
      expect(screen.getByText('Maximum 2 files allowed.')).toBeInTheDocument();
    });
    expect(mockOnFilesChange).not.toHaveBeenCalled();
  });

  it('maintains file metadata correctly', async () => {
    const mockOnFilesChange = jest.fn();
    render(<ImageUpload onFilesChange={mockOnFilesChange} showPreview={true} />);
    
    // Create files with different sizes and types
    const files = [
      new File(['small'], 'small.jpg', { type: 'image/jpeg' }),
      new File(['medium'.repeat(50)], 'medium.png', { type: 'image/png' }),
      new File(['large'.repeat(500)], 'large.gif', { type: 'image/gif' })
    ];
    
    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files } });
    
    await waitFor(() => {
      expect(mockOnFilesChange).toHaveBeenCalledWith(files);
      
      // Verify all files are displayed
      expect(screen.getByText('small.jpg')).toBeInTheDocument();
      expect(screen.getByText('medium.png')).toBeInTheDocument();
      expect(screen.getByText('large.gif')).toBeInTheDocument();
      
      // Verify file sizes are calculated and displayed
      const sizeElements = screen.getAllByText(/Bytes|KB|MB/);
      expect(sizeElements.length).toBeGreaterThan(0);
    });
    
    // Verify that the actual File objects passed to callback have correct properties
    const passedFiles = mockOnFilesChange.mock.calls[0][0];
    expect(passedFiles[0].name).toBe('small.jpg');
    expect(passedFiles[0].type).toBe('image/jpeg');
    expect(passedFiles[1].name).toBe('medium.png');
    expect(passedFiles[1].type).toBe('image/png');
    expect(passedFiles[2].name).toBe('large.gif');
    expect(passedFiles[2].type).toBe('image/gif');
  });
});