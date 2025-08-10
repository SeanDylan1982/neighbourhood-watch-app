import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ImageUpload, MediaPreview, ProfileImageUpload } from '../components/Upload';
import { AuthContext } from '../contexts/AuthContext';

// Mock user context
const mockUser = {
  _id: '123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  profileImageUrl: null
};

const MockAuthProvider = ({ children }) => (
  <AuthContext.Provider value={{ user: mockUser, loading: false }}>
    {children}
  </AuthContext.Provider>
);

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <MockAuthProvider>
        {component}
      </MockAuthProvider>
    </BrowserRouter>
  );
};

// Mock fetch
global.fetch = jest.fn();

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('ImageUpload Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders upload area correctly', () => {
    const mockOnFilesChange = jest.fn();
    
    render(
      <ImageUpload onFilesChange={mockOnFilesChange} />
    );

    expect(screen.getByText('Drag & drop files here')).toBeInTheDocument();
    expect(screen.getByText('or click to browse files')).toBeInTheDocument();
    expect(screen.getByText('Up to 5 files • Max 10MB each')).toBeInTheDocument();
  });

  test('handles file selection', async () => {
    const mockOnFilesChange = jest.fn();
    
    render(
      <ImageUpload onFilesChange={mockOnFilesChange} />
    );

    // Create a mock file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    // Get the hidden file input
    const fileInput = screen.getByRole('button', { hidden: true });
    
    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockOnFilesChange).toHaveBeenCalledWith([file]);
    });
  });

  test('validates file types', async () => {
    const mockOnFilesChange = jest.fn();
    
    render(
      <ImageUpload 
        onFilesChange={mockOnFilesChange} 
        acceptedTypes="image/*"
      />
    );

    // Create a mock invalid file
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    
    const fileInput = screen.getByRole('button', { hidden: true });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/not a supported file type/)).toBeInTheDocument();
    });

    expect(mockOnFilesChange).not.toHaveBeenCalled();
  });

  test('validates file size', async () => {
    const mockOnFilesChange = jest.fn();
    
    render(
      <ImageUpload 
        onFilesChange={mockOnFilesChange} 
        maxSize={1024} // 1KB limit
      />
    );

    // Create a mock large file
    const largeFile = new File(['x'.repeat(2048)], 'large.jpg', { type: 'image/jpeg' });
    
    const fileInput = screen.getByRole('button', { hidden: true });
    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(screen.getByText(/too large/)).toBeInTheDocument();
    });

    expect(mockOnFilesChange).not.toHaveBeenCalled();
  });

  test('limits number of files', async () => {
    const mockOnFilesChange = jest.fn();
    
    render(
      <ImageUpload 
        onFilesChange={mockOnFilesChange} 
        maxFiles={2}
      />
    );

    // Create mock files
    const files = [
      new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
      new File(['test3'], 'test3.jpg', { type: 'image/jpeg' })
    ];
    
    const fileInput = screen.getByRole('button', { hidden: true });
    fireEvent.change(fileInput, { target: { files } });

    await waitFor(() => {
      expect(screen.getByText(/Maximum 2 files allowed/)).toBeInTheDocument();
    });

    expect(mockOnFilesChange).not.toHaveBeenCalled();
  });

  test('shows file previews', async () => {
    const mockOnFilesChange = jest.fn();
    
    render(
      <ImageUpload 
        onFilesChange={mockOnFilesChange} 
        showPreview={true}
      />
    );

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    const fileInput = screen.getByRole('button', { hidden: true });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Selected Files (1)')).toBeInTheDocument();
      expect(screen.getByText('test.jpg')).toBeInTheDocument();
    });
  });

  test('allows file removal', async () => {
    const mockOnFilesChange = jest.fn();
    
    render(
      <ImageUpload 
        onFilesChange={mockOnFilesChange} 
        showPreview={true}
      />
    );

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    const fileInput = screen.getByRole('button', { hidden: true });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('test.jpg')).toBeInTheDocument();
    });

    // Click remove button
    const removeButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(mockOnFilesChange).toHaveBeenCalledWith([]);
    });
  });
});

describe('MediaPreview Component', () => {
  test('renders empty state when no media', () => {
    const { container } = render(<MediaPreview media={[]} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders image media correctly', () => {
    const media = [
      {
        type: 'image',
        url: 'test-image.jpg',
        filename: 'test.jpg',
        size: 1024
      }
    ];

    render(<MediaPreview media={media} />);

    expect(screen.getByAltText('test.jpg')).toBeInTheDocument();
    expect(screen.getByText('1 KB')).toBeInTheDocument();
  });

  test('renders video media correctly', () => {
    const media = [
      {
        type: 'video',
        url: 'test-video.mp4',
        filename: 'test.mp4',
        size: 2048
      }
    ];

    render(<MediaPreview media={media} />);

    expect(screen.getByText('test.mp4')).toBeInTheDocument();
    expect(screen.getByText('2 KB')).toBeInTheDocument();
  });

  test('renders file media correctly', () => {
    const media = [
      {
        type: 'file',
        url: 'test-document.pdf',
        filename: 'document.pdf',
        size: 4096
      }
    ];

    render(<MediaPreview media={media} />);

    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByText('4 KB')).toBeInTheDocument();
  });

  test('shows download buttons when enabled', () => {
    const media = [
      {
        type: 'image',
        url: 'test-image.jpg',
        filename: 'test.jpg',
        size: 1024
      }
    ];

    render(<MediaPreview media={media} showDownload={true} />);

    expect(screen.getByTitle('Download')).toBeInTheDocument();
  });

  test('hides download buttons when disabled', () => {
    const media = [
      {
        type: 'image',
        url: 'test-image.jpg',
        filename: 'test.jpg',
        size: 1024
      }
    ];

    render(<MediaPreview media={media} showDownload={false} />);

    expect(screen.queryByTitle('Download')).not.toBeInTheDocument();
  });
});

describe('ProfileImageUpload Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders user initials when no image', () => {
    renderWithProviders(
      <ProfileImageUpload 
        currentImageUrl={null}
        onImageUpdate={jest.fn()}
      />
    );

    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  test('renders current image when provided', () => {
    renderWithProviders(
      <ProfileImageUpload 
        currentImageUrl="test-image.jpg"
        onImageUpdate={jest.fn()}
      />
    );

    const avatar = screen.getByRole('img');
    expect(avatar).toHaveAttribute('src', 'test-image.jpg');
  });

  test('opens upload dialog when camera button clicked', async () => {
    renderWithProviders(
      <ProfileImageUpload 
        currentImageUrl={null}
        onImageUpdate={jest.fn()}
      />
    );

    const cameraButton = screen.getByRole('button');
    fireEvent.click(cameraButton);

    await waitFor(() => {
      expect(screen.getByText('Update Profile Picture')).toBeInTheDocument();
    });
  });

  test('handles successful upload', async () => {
    const mockOnImageUpdate = jest.fn();
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        file: { url: 'new-image.jpg' }
      })
    });

    renderWithProviders(
      <ProfileImageUpload 
        currentImageUrl={null}
        onImageUpdate={mockOnImageUpdate}
      />
    );

    // Open dialog
    const cameraButton = screen.getByRole('button');
    fireEvent.click(cameraButton);

    await waitFor(() => {
      expect(screen.getByText('Update Profile Picture')).toBeInTheDocument();
    });

    // Select file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText(/choose image/i);
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Upload
    const uploadButton = screen.getByText('Upload');
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/upload/profile-image', expect.objectContaining({
        method: 'POST'
      }));
      expect(mockOnImageUpdate).toHaveBeenCalledWith('new-image.jpg');
    });
  });

  test('handles upload error', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        message: 'Upload failed'
      })
    });

    renderWithProviders(
      <ProfileImageUpload 
        currentImageUrl={null}
        onImageUpdate={jest.fn()}
      />
    );

    // Open dialog and select file
    const cameraButton = screen.getByRole('button');
    fireEvent.click(cameraButton);

    await waitFor(() => {
      expect(screen.getByText('Update Profile Picture')).toBeInTheDocument();
    });

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText(/choose image/i);
    fireEvent.change(fileInput, { target: { files: [file] } });

    const uploadButton = screen.getByText('Upload');
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText('Upload failed')).toBeInTheDocument();
    });
  });

  test('validates file type', async () => {
    renderWithProviders(
      <ProfileImageUpload 
        currentImageUrl={null}
        onImageUpdate={jest.fn()}
      />
    );

    // Open dialog
    const cameraButton = screen.getByRole('button');
    fireEvent.click(cameraButton);

    await waitFor(() => {
      expect(screen.getByText('Update Profile Picture')).toBeInTheDocument();
    });

    // Select invalid file
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const fileInput = screen.getByLabelText(/choose image/i);
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Please select an image file.')).toBeInTheDocument();
    });
  });

  test('validates file size', async () => {
    renderWithProviders(
      <ProfileImageUpload 
        currentImageUrl={null}
        onImageUpdate={jest.fn()}
      />
    );

    // Open dialog
    const cameraButton = screen.getByRole('button');
    fireEvent.click(cameraButton);

    await waitFor(() => {
      expect(screen.getByText('Update Profile Picture')).toBeInTheDocument();
    });

    // Select large file (6MB)
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText(/choose image/i);
    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(screen.getByText('Image must be smaller than 5MB.')).toBeInTheDocument();
    });
  });
});