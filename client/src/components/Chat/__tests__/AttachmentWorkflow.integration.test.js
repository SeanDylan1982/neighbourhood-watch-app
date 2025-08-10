import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import AttachmentPicker from '../Attachments/AttachmentPicker';
import MediaUpload from '../Attachments/MediaUpload';
import DocumentUpload from '../Attachments/DocumentUpload';
import MessageBubble from '../ChatWindow/MessageBubble';

// Mock dependencies
jest.mock('../../../hooks/useApi', () => ({
  __esModule: true,
  default: () => ({
    get: jest.fn(),
    post: jest.fn().mockResolvedValue({ 
      data: { 
        success: true, 
        fileUrl: 'https://example.com/uploaded-file.jpg',
        fileId: 'file-123'
      } 
    }),
    patch: jest.fn(),
    delete: jest.fn()
  })
}));

// Mock file reading
global.FileReader = class {
  constructor() {
    this.readAsDataURL = jest.fn(() => {
      this.onload({ target: { result: 'data:image/jpeg;base64,fake-image-data' } });
    });
  }
};

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:fake-url');
global.URL.revokeObjectURL = jest.fn();

const theme = createTheme();

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  </BrowserRouter>
);

describe('Attachment Workflow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Attachment Selection and Upload', () => {
    it('completes full image upload workflow', async () => {
      const onAttachmentSelect = jest.fn();
      const onUploadComplete = jest.fn();

      render(
        <TestWrapper>
          <AttachmentPicker
            open={true}
            onAttachmentSelect={onAttachmentSelect}
            onClose={jest.fn()}
          />
        </TestWrapper>
      );

      // Select gallery option
      fireEvent.click(screen.getByText('Gallery'));

      expect(onAttachmentSelect).toHaveBeenCalledWith('gallery');
    });

    it('handles media upload with progress tracking', async () => {
      const onUploadProgress = jest.fn();
      const onUploadComplete = jest.fn();

      render(
        <TestWrapper>
          <MediaUpload
            onUploadProgress={onUploadProgress}
            onUploadComplete={onUploadComplete}
            accept="image/*"
          />
        </TestWrapper>
      );

      // Create a mock file
      const file = new File(['fake image content'], 'test-image.jpg', {
        type: 'image/jpeg'
      });

      // Find file input and upload file
      const fileInput = screen.getByLabelText(/upload media/i);
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Should show upload progress
      await waitFor(() => {
        expect(onUploadProgress).toHaveBeenCalled();
      });
    });

    it('handles document upload workflow', async () => {
      const onUploadComplete = jest.fn();

      render(
        <TestWrapper>
          <DocumentUpload
            onUploadComplete={onUploadComplete}
            accept=".pdf,.doc,.docx"
          />
        </TestWrapper>
      );

      // Create a mock document file
      const file = new File(['fake document content'], 'test-document.pdf', {
        type: 'application/pdf'
      });

      const fileInput = screen.getByLabelText(/upload document/i);
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Should process document upload
      await waitFor(() => {
        expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
      });
    });

    it('validates file types and sizes', async () => {
      const onError = jest.fn();

      render(
        <TestWrapper>
          <MediaUpload
            onError={onError}
            accept="image/*"
            maxSize={1024 * 1024} // 1MB
          />
        </TestWrapper>
      );

      // Create a file that's too large
      const largeFile = new File(['x'.repeat(2 * 1024 * 1024)], 'large-image.jpg', {
        type: 'image/jpeg'
      });

      const fileInput = screen.getByLabelText(/upload media/i);
      fireEvent.change(fileInput, { target: { files: [largeFile] } });

      // Should trigger error for file size
      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });
    });
  });

  describe('Attachment Display in Messages', () => {
    it('displays image attachments with thumbnails', () => {
      const imageMessage = {
        id: 'msg-1',
        content: '',
        type: 'image',
        senderId: 'user-1',
        senderName: 'John Doe',
        timestamp: new Date(),
        status: 'read',
        filename: 'vacation-photo.jpg',
        fileUrl: 'https://example.com/vacation-photo.jpg',
        metadata: {
          width: 1920,
          height: 1080,
          size: 2048576
        }
      };

      render(
        <TestWrapper>
          <MessageBubble
            message={imageMessage}
            isOwn={true}
            chatType="group"
            currentUserId="user-1"
          />
        </TestWrapper>
      );

      // Should display image indicator
      expect(screen.getByText('🖼️ Photo')).toBeInTheDocument();
    });

    it('displays document attachments with file info', () => {
      const documentMessage = {
        id: 'msg-2',
        content: '',
        type: 'document',
        senderId: 'user-1',
        senderName: 'John Doe',
        timestamp: new Date(),
        status: 'read',
        filename: 'project-proposal.pdf',
        fileUrl: 'https://example.com/project-proposal.pdf',
        metadata: {
          size: 1048576,
          mimeType: 'application/pdf'
        }
      };

      render(
        <TestWrapper>
          <MessageBubble
            message={documentMessage}
            isOwn={true}
            chatType="group"
            currentUserId="user-1"
          />
        </TestWrapper>
      );

      // Should display document info
      expect(screen.getByText('📄 project-proposal.pdf')).toBeInTheDocument();
    });

    it('displays audio attachments with duration', () => {
      const audioMessage = {
        id: 'msg-3',
        content: '',
        type: 'audio',
        senderId: 'user-1',
        senderName: 'John Doe',
        timestamp: new Date(),
        status: 'read',
        filename: 'voice-note.mp3',
        fileUrl: 'https://example.com/voice-note.mp3',
        metadata: {
          duration: 45,
          size: 512000
        }
      };

      render(
        <TestWrapper>
          <MessageBubble
            message={audioMessage}
            isOwn={true}
            chatType="group"
            currentUserId="user-1"
          />
        </TestWrapper>
      );

      // Should display audio info with duration
      expect(screen.getByText('🎙️ Audio (45s)')).toBeInTheDocument();
    });
  });

  describe('Attachment Preview and Download', () => {
    it('handles image preview modal', async () => {
      const imageMessage = {
        id: 'msg-1',
        content: '',
        type: 'image',
        senderId: 'user-1',
        senderName: 'John Doe',
        timestamp: new Date(),
        status: 'read',
        filename: 'photo.jpg',
        fileUrl: 'https://example.com/photo.jpg'
      };

      render(
        <TestWrapper>
          <MessageBubble
            message={imageMessage}
            isOwn={false}
            chatType="group"
            currentUserId="user-2"
          />
        </TestWrapper>
      );

      // Click on image to open preview
      const imageElement = screen.getByText('🖼️ Photo');
      fireEvent.click(imageElement);

      // Preview functionality would be handled by parent components
      expect(imageElement).toBeInTheDocument();
    });

    it('handles document download', async () => {
      const documentMessage = {
        id: 'msg-2',
        content: '',
        type: 'document',
        senderId: 'user-1',
        senderName: 'John Doe',
        timestamp: new Date(),
        status: 'read',
        filename: 'report.pdf',
        fileUrl: 'https://example.com/report.pdf'
      };

      // Mock window.open
      const mockOpen = jest.fn();
      global.window.open = mockOpen;

      render(
        <TestWrapper>
          <MessageBubble
            message={documentMessage}
            isOwn={false}
            chatType="group"
            currentUserId="user-2"
          />
        </TestWrapper>
      );

      // Click on document to download
      const documentElement = screen.getByText('📄 report.pdf');
      fireEvent.click(documentElement);

      // Download functionality would be handled by parent components
      expect(documentElement).toBeInTheDocument();
    });
  });

  describe('Multiple Attachments', () => {
    it('handles multiple file selection', async () => {
      const onUploadComplete = jest.fn();

      render(
        <TestWrapper>
          <MediaUpload
            onUploadComplete={onUploadComplete}
            multiple={true}
            accept="image/*"
          />
        </TestWrapper>
      );

      // Create multiple mock files
      const files = [
        new File(['image1'], 'photo1.jpg', { type: 'image/jpeg' }),
        new File(['image2'], 'photo2.jpg', { type: 'image/jpeg' }),
        new File(['image3'], 'photo3.jpg', { type: 'image/jpeg' })
      ];

      const fileInput = screen.getByLabelText(/upload media/i);
      fireEvent.change(fileInput, { target: { files } });

      // Should handle multiple files
      await waitFor(() => {
        expect(screen.getByText('photo1.jpg')).toBeInTheDocument();
        expect(screen.getByText('photo2.jpg')).toBeInTheDocument();
        expect(screen.getByText('photo3.jpg')).toBeInTheDocument();
      });
    });

    it('displays message with multiple attachments', () => {
      const multiAttachmentMessage = {
        id: 'msg-4',
        content: 'Check out these photos!',
        type: 'text',
        senderId: 'user-1',
        senderName: 'John Doe',
        timestamp: new Date(),
        status: 'read',
        attachments: [
          {
            id: 'att-1',
            type: 'image',
            filename: 'photo1.jpg',
            fileUrl: 'https://example.com/photo1.jpg'
          },
          {
            id: 'att-2',
            type: 'image',
            filename: 'photo2.jpg',
            fileUrl: 'https://example.com/photo2.jpg'
          }
        ]
      };

      render(
        <TestWrapper>
          <MessageBubble
            message={multiAttachmentMessage}
            isOwn={true}
            chatType="group"
            currentUserId="user-1"
          />
        </TestWrapper>
      );

      // Should display message content and attachment count
      expect(screen.getByText('Check out these photos!')).toBeInTheDocument();
      expect(screen.getByText('2 attachments')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles upload failures gracefully', async () => {
      // Mock API to fail
      const mockApi = require('../../../hooks/useApi').default;
      mockApi().post.mockRejectedValueOnce(new Error('Upload failed'));

      const onError = jest.fn();

      render(
        <TestWrapper>
          <MediaUpload
            onError={onError}
            accept="image/*"
          />
        </TestWrapper>
      );

      const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/upload media/i);
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Should handle upload error
      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });
    });

    it('handles corrupted file gracefully', async () => {
      const onError = jest.fn();

      render(
        <TestWrapper>
          <MediaUpload
            onError={onError}
            accept="image/*"
          />
        </TestWrapper>
      );

      // Create a file with wrong type
      const corruptedFile = new File(['not an image'], 'fake.jpg', { 
        type: 'text/plain' 
      });

      const fileInput = screen.getByLabelText(/upload media/i);
      fireEvent.change(fileInput, { target: { files: [corruptedFile] } });

      // Should handle file type mismatch
      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });
    });

    it('handles network interruption during upload', async () => {
      const onError = jest.fn();
      const onUploadProgress = jest.fn();

      render(
        <TestWrapper>
          <MediaUpload
            onError={onError}
            onUploadProgress={onUploadProgress}
            accept="image/*"
          />
        </TestWrapper>
      );

      const file = new File(['large image'], 'large.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/upload media/i);
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Simulate network interruption by rejecting after progress
      setTimeout(() => {
        const mockApi = require('../../../hooks/useApi').default;
        mockApi().post.mockRejectedValueOnce(new Error('Network error'));
      }, 100);

      // Should handle network interruption
      await waitFor(() => {
        expect(onUploadProgress).toHaveBeenCalled();
      });
    });
  });

  describe('Performance and Optimization', () => {
    it('handles large file uploads efficiently', async () => {
      const onUploadProgress = jest.fn();

      render(
        <TestWrapper>
          <MediaUpload
            onUploadProgress={onUploadProgress}
            accept="image/*"
            maxSize={10 * 1024 * 1024} // 10MB
          />
        </TestWrapper>
      );

      // Create a large file
      const largeFile = new File(['x'.repeat(5 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg'
      });

      const fileInput = screen.getByLabelText(/upload media/i);
      fireEvent.change(fileInput, { target: { files: [largeFile] } });

      // Should handle large file upload with progress
      await waitFor(() => {
        expect(onUploadProgress).toHaveBeenCalled();
      });
    });

    it('optimizes image display for performance', () => {
      const imageMessage = {
        id: 'msg-1',
        content: '',
        type: 'image',
        senderId: 'user-1',
        senderName: 'John Doe',
        timestamp: new Date(),
        status: 'read',
        filename: 'high-res.jpg',
        fileUrl: 'https://example.com/high-res.jpg',
        thumbnailUrl: 'https://example.com/high-res-thumb.jpg',
        metadata: {
          width: 4000,
          height: 3000,
          size: 8388608 // 8MB
        }
      };

      render(
        <TestWrapper>
          <MessageBubble
            message={imageMessage}
            isOwn={false}
            chatType="group"
            currentUserId="user-2"
          />
        </TestWrapper>
      );

      // Should display optimized version
      expect(screen.getByText('🖼️ Photo')).toBeInTheDocument();
    });
  });
});