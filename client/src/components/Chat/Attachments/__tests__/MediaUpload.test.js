import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MediaUpload from '../MediaUpload';

// Mock Material-UI useMediaQuery
jest.mock('@mui/material/useMediaQuery', () => ({
  __esModule: true,
  default: jest.fn(() => false) // Default to desktop
}));

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock canvas and image
const mockCanvas = {
  getContext: jest.fn(() => ({
    drawImage: jest.fn(),
  })),
  toBlob: jest.fn((callback) => {
    callback(new Blob(['mock'], { type: 'image/jpeg' }));
  }),
  width: 0,
  height: 0
};

global.HTMLCanvasElement.prototype.getContext = mockCanvas.getContext;
global.HTMLCanvasElement.prototype.toBlob = mockCanvas.toBlob;

// Mock Image constructor
global.Image = class {
  constructor() {
    setTimeout(() => {
      this.onload && this.onload();
    }, 100);
  }
  set src(value) {
    this._src = value;
  }
  get src() {
    return this._src;
  }
  width = 1920;
  height = 1080;
};

// Test theme
const theme = createTheme();

// Test wrapper component
const TestWrapper = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

describe('MediaUpload Component', () => {
  const mockOnFilesChange = jest.fn();
  const mockOnUploadProgress = jest.fn();
  const mockOnUploadComplete = jest.fn();
  const mockOnUploadError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render drag and drop area by default', () => {
      render(
        <TestWrapper>
          <MediaUpload onFilesChange={mockOnFilesChange} />
        </TestWrapper>
      );

      expect(screen.getByText('Drag & drop media files')).toBeInTheDocument();
      expect(screen.getByText('or click to browse files')).toBeInTheDocument();
    });

    it('should render browse button when drag and drop is disabled', () => {
      render(
        <TestWrapper>
          <MediaUpload 
            onFilesChange={mockOnFilesChange}
            dragAndDrop={false}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Select Media Files')).toBeInTheDocument();
      expect(screen.queryByText('Drag & drop media files')).not.toBeInTheDocument();
    });

    it('should show file limit information', () => {
      render(
        <TestWrapper>
          <MediaUpload 
            onFilesChange={mockOnFilesChange}
            maxFiles={5}
            maxSize={10 * 1024 * 1024}
          />
        </TestWrapper>
      );

      expect(screen.getByText(/Up to 5 files.*Max 10MB each/)).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      render(
        <TestWrapper>
          <MediaUpload 
            onFilesChange={mockOnFilesChange}
            disabled={true}
          />
        </TestWrapper>
      );

      const dropZone = screen.getByText('Drag & drop media files').closest('div');
      expect(dropZone).toHaveStyle('cursor: not-allowed');
      expect(dropZone).toHaveStyle('opacity: 0.6');
    });
  });

  describe('File Selection', () => {
    it('should handle file input change', async () => {
      render(
        <TestWrapper>
          <MediaUpload onFilesChange={mockOnFilesChange} />
        </TestWrapper>
      );

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]');
      
      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(mockOnFilesChange).toHaveBeenCalled();
      });
    });

    it('should validate file types', async () => {
      render(
        <TestWrapper>
          <MediaUpload onFilesChange={mockOnFilesChange} />
        </TestWrapper>
      );

      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const input = document.querySelector('input[type="file"]');
      
      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByText(/not a supported file type/)).toBeInTheDocument();
      });
    });

    it('should validate file size', async () => {
      render(
        <TestWrapper>
          <MediaUpload 
            onFilesChange={mockOnFilesChange}
            maxSize={1024} // 1KB
          />
        </TestWrapper>
      );

      const file = new File(['x'.repeat(2048)], 'large.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]');
      
      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByText(/too large/)).toBeInTheDocument();
      });
    });
  });

  describe('Configuration', () => {
    it('should respect custom file types', () => {
      render(
        <TestWrapper>
          <MediaUpload 
            onFilesChange={mockOnFilesChange}
            acceptedTypes="image/png,image/jpeg"
          />
        </TestWrapper>
      );

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', 'image/png,image/jpeg');
    });

    it('should respect single file mode', () => {
      render(
        <TestWrapper>
          <MediaUpload 
            onFilesChange={mockOnFilesChange}
            multiple={false}
          />
        </TestWrapper>
      );

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).not.toHaveAttribute('multiple');
    });
  });
});