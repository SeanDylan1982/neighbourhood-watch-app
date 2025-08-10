import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import DocumentUpload from '../DocumentUpload';

// Mock Material-UI useMediaQuery
jest.mock('@mui/material/useMediaQuery', () => ({
  __esModule: true,
  default: jest.fn(() => false) // Default to desktop
}));

// Test theme
const theme = createTheme();

// Test wrapper component
const TestWrapper = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

describe('DocumentUpload Component', () => {
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
          <DocumentUpload onFilesChange={mockOnFilesChange} />
        </TestWrapper>
      );

      expect(screen.getByText('Drag & drop documents')).toBeInTheDocument();
      expect(screen.getByText('or click to browse files')).toBeInTheDocument();
    });

    it('should render browse button when drag and drop is disabled', () => {
      render(
        <TestWrapper>
          <DocumentUpload 
            onFilesChange={mockOnFilesChange}
            dragAndDrop={false}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Select Documents')).toBeInTheDocument();
      expect(screen.queryByText('Drag & drop documents')).not.toBeInTheDocument();
    });

    it('should show file limit information', () => {
      render(
        <TestWrapper>
          <DocumentUpload 
            onFilesChange={mockOnFilesChange}
            maxFiles={5}
            maxSize={50 * 1024 * 1024}
          />
        </TestWrapper>
      );

      expect(screen.getByText(/Up to 5 files.*Max 50MB each/)).toBeInTheDocument();
    });

    it('should show supported file types', () => {
      render(
        <TestWrapper>
          <DocumentUpload 
            onFilesChange={mockOnFilesChange}
            acceptedTypes=".pdf,.doc,.docx"
          />
        </TestWrapper>
      );

      expect(screen.getByText(/Supported: PDF,DOC,DOCX/)).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      render(
        <TestWrapper>
          <DocumentUpload 
            onFilesChange={mockOnFilesChange}
            disabled={true}
          />
        </TestWrapper>
      );

      const dropZone = screen.getByText('Drag & drop documents').closest('div');
      expect(dropZone).toHaveStyle('cursor: not-allowed');
      expect(dropZone).toHaveStyle('opacity: 0.6');
    });
  });

  describe('File Selection', () => {
    it('should handle file input change with valid PDF file', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DocumentUpload onFilesChange={mockOnFilesChange} />
        </TestWrapper>
      );

      const file = new File(['test pdf content'], 'test.pdf', { type: 'application/pdf' });
      const input = screen.getByRole('button', { hidden: true });
      
      await user.upload(input, file);

      await waitFor(() => {
        expect(mockOnFilesChange).toHaveBeenCalled();
        const calledFiles = mockOnFilesChange.mock.calls[0][0];
        expect(calledFiles).toHaveLength(1);
        expect(calledFiles[0].name).toBe('test.pdf');
        expect(calledFiles[0].type).toBe('document');
      });
    });

    it('should handle multiple file selection', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DocumentUpload 
            onFilesChange={mockOnFilesChange}
            multiple={true}
          />
        </TestWrapper>
      );

      const files = [
        new File(['pdf content'], 'doc1.pdf', { type: 'application/pdf' }),
        new File(['word content'], 'doc2.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
      ];
      
      const input = screen.getByRole('button', { hidden: true });
      await user.upload(input, files);

      await waitFor(() => {
        expect(mockOnFilesChange).toHaveBeenCalled();
        const calledFiles = mockOnFilesChange.mock.calls[0][0];
        expect(calledFiles).toHaveLength(2);
      });
    });

    it('should validate file types and show error for invalid files', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DocumentUpload onFilesChange={mockOnFilesChange} />
        </TestWrapper>
      );

      const file = new File(['test'], 'test.mp3', { type: 'audio/mpeg' });
      const input = screen.getByRole('button', { hidden: true });
      
      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText(/not a supported document type/)).toBeInTheDocument();
      });
    });

    it('should validate file size and show error for large files', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DocumentUpload 
            onFilesChange={mockOnFilesChange}
            maxSize={1024} // 1KB
          />
        </TestWrapper>
      );

      const file = new File(['x'.repeat(2048)], 'large.pdf', { type: 'application/pdf' });
      const input = screen.getByRole('button', { hidden: true });
      
      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText(/too large/)).toBeInTheDocument();
      });
    });

    it('should enforce maximum file count', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DocumentUpload 
            onFilesChange={mockOnFilesChange}
            maxFiles={2}
          />
        </TestWrapper>
      );

      const files = [
        new File(['content1'], 'doc1.pdf', { type: 'application/pdf' }),
        new File(['content2'], 'doc2.pdf', { type: 'application/pdf' }),
        new File(['content3'], 'doc3.pdf', { type: 'application/pdf' })
      ];
      
      const input = screen.getByRole('button', { hidden: true });
      await user.upload(input, files);

      await waitFor(() => {
        expect(screen.getByText(/Maximum 2 files allowed/)).toBeInTheDocument();
      });
    });
  });

  describe('File Preview and Management', () => {
    it('should display file preview with correct information', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DocumentUpload 
            onFilesChange={mockOnFilesChange}
            showPreview={true}
          />
        </TestWrapper>
      );

      const file = new File(['test content'], 'test-document.pdf', { type: 'application/pdf' });
      const input = screen.getByRole('button', { hidden: true });
      
      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
        expect(screen.getByText('PDF')).toBeInTheDocument();
        expect(screen.getByText(/\d+ Bytes/)).toBeInTheDocument();
      });
    });

    it('should allow removing individual files', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DocumentUpload 
            onFilesChange={mockOnFilesChange}
            showPreview={true}
          />
        </TestWrapper>
      );

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const input = screen.getByRole('button', { hidden: true });
      
      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });

      const removeButton = screen.getByLabelText('Remove file');
      await user.click(removeButton);

      await waitFor(() => {
        expect(mockOnFilesChange).toHaveBeenCalledWith([]);
      });
    });

    it('should allow clearing all files', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DocumentUpload 
            onFilesChange={mockOnFilesChange}
            showPreview={true}
          />
        </TestWrapper>
      );

      const files = [
        new File(['content1'], 'doc1.pdf', { type: 'application/pdf' }),
        new File(['content2'], 'doc2.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
      ];
      
      const input = screen.getByRole('button', { hidden: true });
      await user.upload(input, files);

      await waitFor(() => {
        expect(screen.getByText('Selected Documents (2)')).toBeInTheDocument();
      });

      const clearButton = screen.getByText('Clear All');
      await user.click(clearButton);

      await waitFor(() => {
        expect(mockOnFilesChange).toHaveBeenCalledWith([]);
      });
    });

    it('should hide preview when showPreview is false', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DocumentUpload 
            onFilesChange={mockOnFilesChange}
            showPreview={false}
          />
        </TestWrapper>
      );

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const input = screen.getByRole('button', { hidden: true });
      
      await user.upload(input, file);

      await waitFor(() => {
        expect(mockOnFilesChange).toHaveBeenCalled();
      });

      expect(screen.queryByText('Selected Documents')).not.toBeInTheDocument();
    });
  });

  describe('Document Type Recognition', () => {
    const documentTypes = [
      { file: 'test.pdf', type: 'application/pdf', expectedLabel: 'PDF' },
      { file: 'test.doc', type: 'application/msword', expectedLabel: 'Word' },
      { file: 'test.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', expectedLabel: 'Word' },
      { file: 'test.xls', type: 'application/vnd.ms-excel', expectedLabel: 'Excel' },
      { file: 'test.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', expectedLabel: 'Excel' },
      { file: 'test.ppt', type: 'application/vnd.ms-powerpoint', expectedLabel: 'PowerPoint' },
      { file: 'test.pptx', type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', expectedLabel: 'PowerPoint' },
      { file: 'test.txt', type: 'text/plain', expectedLabel: 'Text' },
      { file: 'test.csv', type: 'text/csv', expectedLabel: 'CSV' },
      { file: 'test.json', type: 'application/json', expectedLabel: 'JSON' },
      { file: 'test.xml', type: 'application/xml', expectedLabel: 'XML' },
      { file: 'test.zip', type: 'application/zip', expectedLabel: 'ZIP' }
    ];

    documentTypes.forEach(({ file, type, expectedLabel }) => {
      it(`should recognize ${expectedLabel} files correctly`, async () => {
        const user = userEvent.setup();
        
        render(
          <TestWrapper>
            <DocumentUpload 
              onFilesChange={mockOnFilesChange}
              showPreview={true}
            />
          </TestWrapper>
        );

        const testFile = new File(['test content'], file, { type });
        const input = screen.getByRole('button', { hidden: true });
        
        await user.upload(input, testFile);

        await waitFor(() => {
          expect(screen.getByText(expectedLabel)).toBeInTheDocument();
        });
      });
    });
  });

  describe('Drag and Drop', () => {
    it('should handle drag over events', () => {
      render(
        <TestWrapper>
          <DocumentUpload onFilesChange={mockOnFilesChange} />
        </TestWrapper>
      );

      const dropZone = screen.getByText('Drag & drop documents').closest('div');
      
      fireEvent.dragOver(dropZone, {
        dataTransfer: {
          files: [new File(['test'], 'test.pdf', { type: 'application/pdf' })]
        }
      });

      expect(screen.getByText('Drop documents here')).toBeInTheDocument();
    });

    it('should handle drag leave events', () => {
      render(
        <TestWrapper>
          <DocumentUpload onFilesChange={mockOnFilesChange} />
        </TestWrapper>
      );

      const dropZone = screen.getByText('Drag & drop documents').closest('div');
      
      fireEvent.dragOver(dropZone);
      fireEvent.dragLeave(dropZone);

      expect(screen.getByText('Drag & drop documents')).toBeInTheDocument();
    });

    it('should handle file drop', async () => {
      render(
        <TestWrapper>
          <DocumentUpload onFilesChange={mockOnFilesChange} />
        </TestWrapper>
      );

      const dropZone = screen.getByText('Drag & drop documents').closest('div');
      const file = new File(['test content'], 'dropped.pdf', { type: 'application/pdf' });
      
      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file]
        }
      });

      await waitFor(() => {
        expect(mockOnFilesChange).toHaveBeenCalled();
      });
    });

    it('should not handle drag and drop when disabled', () => {
      render(
        <TestWrapper>
          <DocumentUpload 
            onFilesChange={mockOnFilesChange}
            disabled={true}
          />
        </TestWrapper>
      );

      const dropZone = screen.getByText('Drag & drop documents').closest('div');
      
      fireEvent.dragOver(dropZone);
      
      expect(screen.queryByText('Drop documents here')).not.toBeInTheDocument();
    });
  });

  describe('Configuration', () => {
    it('should respect custom file types', () => {
      render(
        <TestWrapper>
          <DocumentUpload 
            onFilesChange={mockOnFilesChange}
            acceptedTypes=".pdf,.doc"
          />
        </TestWrapper>
      );

      const fileInput = screen.getByRole('button', { hidden: true });
      expect(fileInput).toHaveAttribute('accept', '.pdf,.doc');
    });

    it('should respect single file mode', () => {
      render(
        <TestWrapper>
          <DocumentUpload 
            onFilesChange={mockOnFilesChange}
            multiple={false}
          />
        </TestWrapper>
      );

      const fileInput = screen.getByRole('button', { hidden: true });
      expect(fileInput).not.toHaveAttribute('multiple');
      expect(screen.getByText('1 file')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <TestWrapper>
          <DocumentUpload 
            onFilesChange={mockOnFilesChange}
            className="custom-class"
          />
        </TestWrapper>
      );

      const component = screen.getByText('Drag & drop documents').closest('.document-upload');
      expect(component).toHaveClass('custom-class');
    });
  });

  describe('File Size Formatting', () => {
    it('should format file sizes correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DocumentUpload 
            onFilesChange={mockOnFilesChange}
            showPreview={true}
          />
        </TestWrapper>
      );

      // Create files with different sizes
      const smallFile = new File(['x'.repeat(500)], 'small.pdf', { type: 'application/pdf' });
      const mediumFile = new File(['x'.repeat(1500)], 'medium.pdf', { type: 'application/pdf' });
      
      const input = screen.getByRole('button', { hidden: true });
      await user.upload(input, [smallFile, mediumFile]);

      await waitFor(() => {
        expect(screen.getByText(/500 Bytes/)).toBeInTheDocument();
        expect(screen.getByText(/1.46 KB/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should clear error when new valid files are selected', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DocumentUpload onFilesChange={mockOnFilesChange} />
        </TestWrapper>
      );

      // First, upload an invalid file
      const invalidFile = new File(['test'], 'test.mp3', { type: 'audio/mpeg' });
      const input = screen.getByRole('button', { hidden: true });
      
      await user.upload(input, invalidFile);

      await waitFor(() => {
        expect(screen.getByText(/not a supported document type/)).toBeInTheDocument();
      });

      // Then upload a valid file
      const validFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      await user.upload(input, validFile);

      await waitFor(() => {
        expect(screen.queryByText(/not a supported document type/)).not.toBeInTheDocument();
      });
    });

    it('should allow closing error alerts', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DocumentUpload onFilesChange={mockOnFilesChange} />
        </TestWrapper>
      );

      const invalidFile = new File(['test'], 'test.mp3', { type: 'audio/mpeg' });
      const input = screen.getByRole('button', { hidden: true });
      
      await user.upload(input, invalidFile);

      await waitFor(() => {
        expect(screen.getByText(/not a supported document type/)).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText('Close');
      await user.click(closeButton);

      expect(screen.queryByText(/not a supported document type/)).not.toBeInTheDocument();
    });
  });
});