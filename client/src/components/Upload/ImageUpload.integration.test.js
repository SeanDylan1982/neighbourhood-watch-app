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

describe('ImageUpload Integration', () => {
  beforeEach(() => {
    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('handles complete upload workflow', async () => {
    const mockOnFilesChange = jest.fn();
    render(<ImageUpload onFilesChange={mockOnFilesChange} showPreview={true} />);
    
    // Step 1: Upload files
    const files = [
      new File(['image1'], 'image1.jpg', { type: 'image/jpeg' }),
      new File(['image2'], 'image2.png', { type: 'image/png' })
    ];
    
    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files } });
    
    // Step 2: Verify files are processed
    await waitFor(() => {
      expect(mockOnFilesChange).toHaveBeenCalledWith(files);
      expect(screen.getByText('Selected Files (2)')).toBeInTheDocument();
      expect(screen.getByText('image1.jpg')).toBeInTheDocument();
      expect(screen.getByText('image2.png')).toBeInTheDocument();
    });
    
    // Step 3: Remove one file
    const deleteButtons = screen.getAllByTestId('delete-icon');
    fireEvent.click(deleteButtons[0].closest('button'));
    
    // Step 4: Verify file was removed
    await waitFor(() => {
      expect(mockOnFilesChange).toHaveBeenCalledWith([files[1]]);
    });
    
    // Step 5: Clear all files
    const clearButton = screen.getByText('Clear All');
    fireEvent.click(clearButton);
    
    // Step 6: Verify all files cleared
    expect(mockOnFilesChange).toHaveBeenCalledWith([]);
  });

  it('handles error scenarios gracefully', async () => {
    const mockOnFilesChange = jest.fn();
    render(<ImageUpload onFilesChange={mockOnFilesChange} maxSize={1024} maxFiles={1} />);
    
    // Test file too large
    const largeFile = new File(['x'.repeat(2048)], 'large.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]');
    
    fireEvent.change(input, { target: { files: [largeFile] } });
    
    await waitFor(() => {
      expect(screen.getByText(/File "large.jpg" is too large/)).toBeInTheDocument();
    });
    
    expect(mockOnFilesChange).not.toHaveBeenCalled();
    
    // Test too many files
    const files = [
      new File(['1'], 'file1.jpg', { type: 'image/jpeg' }),
      new File(['2'], 'file2.jpg', { type: 'image/jpeg' })
    ];
    
    fireEvent.change(input, { target: { files } });
    
    await waitFor(() => {
      expect(screen.getByText('Maximum 1 files allowed.')).toBeInTheDocument();
    });
    
    expect(mockOnFilesChange).not.toHaveBeenCalled();
  });

  it('supports different file types correctly', async () => {
    const mockOnFilesChange = jest.fn();
    render(<ImageUpload onFilesChange={mockOnFilesChange} acceptedTypes="image/*,video/*" showPreview={true} />);
    
    const files = [
      new File(['image'], 'test.jpg', { type: 'image/jpeg' }),
      new File(['video'], 'test.mp4', { type: 'video/mp4' })
    ];
    
    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files } });
    
    await waitFor(() => {
      expect(mockOnFilesChange).toHaveBeenCalledWith(files);
      expect(screen.getByText('test.jpg')).toBeInTheDocument();
      expect(screen.getByText('test.mp4')).toBeInTheDocument();
    });
    
    // Verify correct display - images show as img tags, videos show icons
    expect(screen.getByRole('img', { name: 'test.jpg' })).toBeInTheDocument();
    expect(screen.getByTestId('video-icon')).toBeInTheDocument();
  });

  it('maintains file order and metadata', async () => {
    const mockOnFilesChange = jest.fn();
    render(<ImageUpload onFilesChange={mockOnFilesChange} showPreview={true} />);
    
    const files = [
      new File(['small'], 'small.jpg', { type: 'image/jpeg' }),
      new File(['medium'.repeat(100)], 'medium.png', { type: 'image/png' }),
      new File(['large'.repeat(1000)], 'large.gif', { type: 'image/gif' })
    ];
    
    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files } });
    
    await waitFor(() => {
      expect(mockOnFilesChange).toHaveBeenCalledWith(files);
      
      // Check that files are displayed in order
      const fileNames = screen.getAllByText(/\.(jpg|png|gif)$/);
      expect(fileNames[0]).toHaveTextContent('small.jpg');
      expect(fileNames[1]).toHaveTextContent('medium.png');
      expect(fileNames[2]).toHaveTextContent('large.gif');
      
      // Check that file sizes are displayed
      expect(screen.getAllByText(/Bytes/)).toHaveLength(2); // small and medium files
      expect(screen.getByText(/KB/)).toBeInTheDocument(); // large file
    });
  });
});