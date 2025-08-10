import { renderHook, act } from '@testing-library/react';
import useDocumentUpload from '../useDocumentUpload';

describe('useDocumentUpload Hook', () => {
  const mockOnFilesChange = jest.fn();
  const mockOnUploadProgress = jest.fn();
  const mockOnUploadComplete = jest.fn();
  const mockOnUploadError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useDocumentUpload());

      expect(result.current.files).toEqual([]);
      expect(result.current.uploading).toBe(false);
      expect(result.current.uploadProgress).toEqual({});
      expect(result.current.error).toBe('');
    });
  });

  describe('File Validation', () => {
    it('should validate file size correctly', () => {
      const { result } = renderHook(() => 
        useDocumentUpload({ maxSize: 1024 }) // 1KB
      );

      const smallFile = new File(['small'], 'small.pdf', { type: 'application/pdf' });
      const largeFile = new File(['x'.repeat(2048)], 'large.pdf', { type: 'application/pdf' });

      expect(result.current.validateFile(smallFile)).toBeNull();
      expect(result.current.validateFile(largeFile)).toContain('too large');
    });

    it('should validate file types correctly', () => {
      const { result } = renderHook(() => 
        useDocumentUpload({ acceptedTypes: '.pdf,.doc' })
      );

      const pdfFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const txtFile = new File(['content'], 'test.txt', { type: 'text/plain' });

      expect(result.current.validateFile(pdfFile)).toBeNull();
      expect(result.current.validateFile(txtFile)).toContain('not a supported document type');
    });
  });

  describe('Document Type Recognition', () => {
    it('should recognize PDF files', () => {
      const { result } = renderHook(() => useDocumentUpload());

      const pdfFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const typeInfo = result.current.getDocumentTypeInfo(pdfFile);

      expect(typeInfo.label).toBe('PDF');
      expect(typeInfo.color).toBe('#d32f2f');
    });

    it('should recognize Word documents', () => {
      const { result } = renderHook(() => useDocumentUpload());

      const docFile = new File(['content'], 'test.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const typeInfo = result.current.getDocumentTypeInfo(docFile);

      expect(typeInfo.label).toBe('Word');
      expect(typeInfo.color).toBe('#1976d2');
    });

    it('should fallback to extension matching when MIME type is not recognized', () => {
      const { result } = renderHook(() => useDocumentUpload());

      const file = new File(['content'], 'test.pdf', { type: 'application/octet-stream' });
      const typeInfo = result.current.getDocumentTypeInfo(file);

      expect(typeInfo.label).toBe('PDF');
    });

    it('should use default type for unknown files', () => {
      const { result } = renderHook(() => useDocumentUpload());

      const file = new File(['content'], 'test.unknown', { type: 'application/unknown' });
      const typeInfo = result.current.getDocumentTypeInfo(file);

      expect(typeInfo.label).toBe('File');
      expect(typeInfo.color).toBe('#757575');
    });
  });

  describe('File Processing', () => {
    it('should process valid files correctly', async () => {
      const { result } = renderHook(() => 
        useDocumentUpload({ onFilesChange: mockOnFilesChange })
      );

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      await act(async () => {
        await result.current.processFiles([file]);
      });

      expect(mockOnFilesChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'test.pdf',
            type: 'document',
            uploadStatus: 'pending'
          })
        ])
      );
    });

    it('should reject files exceeding maximum count', async () => {
      const { result } = renderHook(() => 
        useDocumentUpload({ 
          maxFiles: 2,
          onUploadError: mockOnUploadError
        })
      );

      const files = [
        new File(['1'], 'doc1.pdf', { type: 'application/pdf' }),
        new File(['2'], 'doc2.pdf', { type: 'application/pdf' }),
        new File(['3'], 'doc3.pdf', { type: 'application/pdf' })
      ];

      await act(async () => {
        await result.current.processFiles(files);
      });

      expect(result.current.error).toContain('Maximum 2 files allowed');
      expect(mockOnUploadError).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const { result } = renderHook(() => 
        useDocumentUpload({ onUploadError: mockOnUploadError })
      );

      const invalidFile = new File(['content'], 'test.mp3', { type: 'audio/mpeg' });

      await act(async () => {
        await result.current.processFiles([invalidFile]);
      });

      expect(result.current.error).toContain('not a supported document type');
      expect(mockOnUploadError).toHaveBeenCalled();
    });
  });

  describe('File Management', () => {
    it('should remove files correctly', async () => {
      const { result } = renderHook(() => 
        useDocumentUpload({ onFilesChange: mockOnFilesChange })
      );

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      await act(async () => {
        await result.current.processFiles([file]);
      });

      const fileId = result.current.files[0].id;

      act(() => {
        result.current.removeFile(fileId);
      });

      expect(mockOnFilesChange).toHaveBeenLastCalledWith([]);
    });

    it('should clear all files', async () => {
      const { result } = renderHook(() => 
        useDocumentUpload({ onFilesChange: mockOnFilesChange })
      );

      const files = [
        new File(['1'], 'doc1.pdf', { type: 'application/pdf' }),
        new File(['2'], 'doc2.pdf', { type: 'application/pdf' })
      ];

      await act(async () => {
        await result.current.processFiles(files);
      });

      act(() => {
        result.current.clearAllFiles();
      });

      expect(result.current.files).toEqual([]);
      expect(result.current.error).toBe('');
      expect(result.current.uploadProgress).toEqual({});
      expect(mockOnFilesChange).toHaveBeenLastCalledWith([]);
    });
  });

  describe('Upload Process', () => {
    it('should start upload process', async () => {
      const { result } = renderHook(() => 
        useDocumentUpload({ 
          onUploadProgress: mockOnUploadProgress,
          onUploadComplete: mockOnUploadComplete
        })
      );

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      await act(async () => {
        await result.current.processFiles([file]);
      });

      await act(async () => {
        await result.current.startUpload();
      });

      expect(mockOnUploadProgress).toHaveBeenCalled();
      expect(mockOnUploadComplete).toHaveBeenCalled();
      expect(result.current.uploading).toBe(false);
    });

    it('should update file progress', () => {
      const { result } = renderHook(() => 
        useDocumentUpload({ onUploadProgress: mockOnUploadProgress })
      );

      const fileId = 'test-file-id';
      const progress = 50;

      act(() => {
        result.current.updateFileProgress(fileId, progress);
      });

      expect(result.current.uploadProgress[fileId]).toBe(progress);
      expect(mockOnUploadProgress).toHaveBeenCalledWith(fileId, progress);
    });

    it('should update file status', async () => {
      const { result } = renderHook(() => useDocumentUpload());

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      await act(async () => {
        await result.current.processFiles([file]);
      });

      const fileId = result.current.files[0].id;

      act(() => {
        result.current.updateFileStatus(fileId, 'completed');
      });

      expect(result.current.files[0].uploadStatus).toBe('completed');
    });
  });

  describe('Utility Functions', () => {
    it('should format file sizes correctly', () => {
      const { result } = renderHook(() => useDocumentUpload());

      expect(result.current.formatFileSize(0)).toBe('0 Bytes');
      expect(result.current.formatFileSize(1024)).toBe('1 KB');
      expect(result.current.formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(result.current.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should clear errors', () => {
      const { result } = renderHook(() => useDocumentUpload());

      act(() => {
        result.current.processFiles([
          new File(['content'], 'test.mp3', { type: 'audio/mpeg' })
        ]);
      });

      expect(result.current.error).toBeTruthy();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe('');
    });
  });

  describe('Configuration', () => {
    it('should use custom configuration', () => {
      const customConfig = {
        maxFiles: 5,
        maxSize: 50 * 1024 * 1024,
        acceptedTypes: '.pdf,.doc'
      };

      const { result } = renderHook(() => useDocumentUpload(customConfig));

      const largeFile = new File(['x'.repeat(60 * 1024 * 1024)], 'large.pdf', { 
        type: 'application/pdf' 
      });
      const txtFile = new File(['content'], 'test.txt', { type: 'text/plain' });

      expect(result.current.validateFile(largeFile)).toContain('Maximum size is 50MB');
      expect(result.current.validateFile(txtFile)).toContain('not a supported document type');
    });
  });
});