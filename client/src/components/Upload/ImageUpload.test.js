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

describe('ImageUpload', () => {
  const mockOnFilesChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders upload area with correct text', () => {
    render(<ImageUpload onFilesChange={mockOnFilesChange} />);
    
    expect(screen.getByText('Drag & drop files here')).toBeInTheDocument();
    expect(screen.getByText('or click to browse files')).toBeInTheDocument();
  });

  it('shows correct file limits in description', () => {
    render(<ImageUpload onFilesChange={mockOnFilesChange} maxFiles={3} maxSize={5 * 1024 * 1024} />);
    
    expect(screen.getByText('Up to 3 files • Max 5MB each')).toBeInTheDocument();
  });

  it('shows single file text when multiple is false', () => {
    render(<ImageUpload onFilesChange={mockOnFilesChange} multiple={false} />);
    
    expect(screen.getByText('1 file • Max 10MB each')).toBeInTheDocument();
  });

  it('handles file selection through input', async () => {
    render(<ImageUpload onFilesChange={mockOnFilesChange} />);
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(mockOnFilesChange).toHaveBeenCalledWith([file]);
    });
  });

  it('validates file size', async () => {
    render(<ImageUpload onFilesChange={mockOnFilesChange} maxSize={1024} />);
    
    const largeFile = new File(['x'.repeat(2048)], 'large.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]');
    
    fireEvent.change(input, { target: { files: [largeFile] } });
    
    await waitFor(() => {
      expect(screen.getByText(/File "large.jpg" is too large/)).toBeInTheDocument();
    });
    
    expect(mockOnFilesChange).not.toHaveBeenCalled();
  });

  it('validates file type', async () => {
    render(<ImageUpload onFilesChange={mockOnFilesChange} acceptedTypes="image/*" />);
    
    const textFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    const input = document.querySelector('input[type="file"]');
    
    fireEvent.change(input, { target: { files: [textFile] } });
    
    await waitFor(() => {
      expect(screen.getByText(/File "test.txt" is not a supported file type/)).toBeInTheDocument();
    });
    
    expect(mockOnFilesChange).not.toHaveBeenCalled();
  });

  it('limits number of files', async () => {
    render(<ImageUpload onFilesChange={mockOnFilesChange} maxFiles={2} />);
    
    const files = [
      new File(['1'], 'file1.jpg', { type: 'image/jpeg' }),
      new File(['2'], 'file2.jpg', { type: 'image/jpeg' }),
      new File(['3'], 'file3.jpg', { type: 'image/jpeg' })
    ];
    
    const input = document.querySelector('input[type="file"]');
    
    fireEvent.change(input, { target: { files } });
    
    await waitFor(() => {
      expect(screen.getByText('Maximum 2 files allowed.')).toBeInTheDocument();
    });
    
    expect(mockOnFilesChange).not.toHaveBeenCalled();
  });

  it('shows file previews when showPreview is true', async () => {
    render(<ImageUpload onFilesChange={mockOnFilesChange} showPreview={true} />);
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText('Selected Files (1)')).toBeInTheDocument();
      expect(screen.getByText('test.jpg')).toBeInTheDocument();
    });
  });

  it('allows removing files', async () => {
    render(<ImageUpload onFilesChange={mockOnFilesChange} showPreview={true} />);
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText('test.jpg')).toBeInTheDocument();
    });
    
    const deleteButton = screen.getByTestId('delete-icon').closest('button');
    fireEvent.click(deleteButton);
    
    expect(mockOnFilesChange).toHaveBeenCalledWith([]);
  });

  it('clears all files when Clear All button is clicked', async () => {
    render(<ImageUpload onFilesChange={mockOnFilesChange} showPreview={true} />);
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });
    
    const clearButton = screen.getByText('Clear All');
    fireEvent.click(clearButton);
    
    expect(mockOnFilesChange).toHaveBeenCalledWith([]);
  });

  it('handles drag and drop', async () => {
    render(<ImageUpload onFilesChange={mockOnFilesChange} />);
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const uploadArea = screen.getByText('Drag & drop files here').closest('div');
    
    fireEvent.dragOver(uploadArea, {
      dataTransfer: { files: [file] }
    });
    
    expect(screen.getByText('Drop files here')).toBeInTheDocument();
    
    fireEvent.drop(uploadArea, {
      dataTransfer: { files: [file] }
    });
    
    await waitFor(() => {
      expect(mockOnFilesChange).toHaveBeenCalledWith([file]);
    });
  });

  it('is disabled when disabled prop is true', () => {
    render(<ImageUpload onFilesChange={mockOnFilesChange} disabled={true} />);
    
    const input = document.querySelector('input[type="file"]');
    expect(input).toBeDisabled();
  });
});