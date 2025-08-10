import { renderHook, act } from '@testing-library/react';
import useAttachmentPicker from '../useAttachmentPicker';

// Mock navigator APIs
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn()
};

const mockMediaDevices = {
  getUserMedia: jest.fn()
};

const mockContacts = {
  select: jest.fn()
};

// Setup mocks
Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true
});

Object.defineProperty(global.navigator, 'mediaDevices', {
  value: mockMediaDevices,
  writable: true
});

Object.defineProperty(global.navigator, 'contacts', {
  value: mockContacts,
  writable: true
});

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');

describe('useAttachmentPicker Hook', () => {
  const mockOnAttachmentSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic functionality', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useAttachmentPicker());

      expect(result.current.isOpen).toBe(false);
      expect(result.current.anchorEl).toBe(null);
      expect(result.current.selectedAttachment).toBe(null);
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.disabled).toBe(false);
    });

    it('should open picker when openPicker is called', () => {
      const { result } = renderHook(() => useAttachmentPicker());
      const mockEvent = { currentTarget: document.createElement('button') };

      act(() => {
        result.current.openPicker(mockEvent);
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.anchorEl).toBe(mockEvent.currentTarget);
    });

    it('should close picker when closePicker is called', () => {
      const { result } = renderHook(() => useAttachmentPicker());
      const mockEvent = { currentTarget: document.createElement('button') };

      act(() => {
        result.current.openPicker(mockEvent);
      });

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.closePicker();
      });

      expect(result.current.isOpen).toBe(false);
      expect(result.current.anchorEl).toBe(null);
    });

    it('should not open picker when disabled', () => {
      const { result } = renderHook(() => useAttachmentPicker({ disabled: true }));
      const mockEvent = { currentTarget: document.createElement('button') };

      act(() => {
        result.current.openPicker(mockEvent);
      });

      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('Attachment selection', () => {
    it('should handle camera capture', async () => {
      const { result } = renderHook(() => useAttachmentPicker({
        onAttachmentSelect: mockOnAttachmentSelect
      }));

      // Mock file input behavior
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const createElementSpy = jest.spyOn(document, 'createElement');
      const mockInput = {
        type: '',
        accept: '',
        capture: '',
        onchange: null,
        oncancel: null,
        click: jest.fn()
      };
      createElementSpy.mockReturnValue(mockInput);

      await act(async () => {
        const promise = result.current.handleAttachmentSelect('camera');
        
        // Simulate file selection
        mockInput.onchange({ target: { files: [mockFile] } });
        
        await promise;
      });

      expect(mockOnAttachmentSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'camera',
          file: mockFile,
          name: 'test.jpg',
          size: mockFile.size,
          mimeType: 'image/jpeg'
        })
      );

      createElementSpy.mockRestore();
    });

    it('should handle gallery selection', async () => {
      const { result } = renderHook(() => useAttachmentPicker({
        onAttachmentSelect: mockOnAttachmentSelect
      }));

      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const createElementSpy = jest.spyOn(document, 'createElement');
      const mockInput = {
        type: '',
        accept: '',
        multiple: false,
        onchange: null,
        oncancel: null,
        click: jest.fn()
      };
      createElementSpy.mockReturnValue(mockInput);

      await act(async () => {
        const promise = result.current.handleAttachmentSelect('gallery');
        
        mockInput.onchange({ target: { files: [mockFile] } });
        
        await promise;
      });

      expect(mockOnAttachmentSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'gallery',
          file: mockFile,
          name: 'test.jpg'
        })
      );

      createElementSpy.mockRestore();
    });

    it('should handle document selection', async () => {
      const { result } = renderHook(() => useAttachmentPicker({
        onAttachmentSelect: mockOnAttachmentSelect
      }));

      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const createElementSpy = jest.spyOn(document, 'createElement');
      const mockInput = {
        type: '',
        accept: '',
        multiple: false,
        onchange: null,
        oncancel: null,
        click: jest.fn()
      };
      createElementSpy.mockReturnValue(mockInput);

      await act(async () => {
        const promise = result.current.handleAttachmentSelect('document');
        
        mockInput.onchange({ target: { files: [mockFile] } });
        
        await promise;
      });

      expect(mockOnAttachmentSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'document',
          file: mockFile,
          name: 'test.pdf',
          extension: 'pdf'
        })
      );

      createElementSpy.mockRestore();
    });

    it('should handle location selection', async () => {
      const { result } = renderHook(() => useAttachmentPicker({
        onAttachmentSelect: mockOnAttachmentSelect
      }));

      const mockPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10
        },
        timestamp: Date.now()
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      await act(async () => {
        await result.current.handleAttachmentSelect('location');
      });

      expect(mockOnAttachmentSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'location',
          coordinates: {
            latitude: 40.7128,
            longitude: -74.0060
          },
          accuracy: 10
        })
      );
    });

    it('should handle contact selection', async () => {
      const { result } = renderHook(() => useAttachmentPicker({
        onAttachmentSelect: mockOnAttachmentSelect
      }));

      const mockContact = {
        name: ['John Doe'],
        email: ['john@example.com'],
        tel: ['+1234567890']
      };

      // Mock ContactsManager API
      Object.defineProperty(window, 'ContactsManager', {
        value: function() {},
        writable: true
      });

      mockContacts.select.mockResolvedValue([mockContact]);

      await act(async () => {
        await result.current.handleAttachmentSelect('contact');
      });

      expect(mockOnAttachmentSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'contact',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890'
        })
      );
    });
  });

  describe('Error handling', () => {
    it('should handle geolocation errors', async () => {
      const { result } = renderHook(() => useAttachmentPicker({
        onAttachmentSelect: mockOnAttachmentSelect
      }));

      const mockError = {
        code: 1, // PERMISSION_DENIED
        message: 'Permission denied',
        PERMISSION_DENIED: 1
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError);
      });

      await act(async () => {
        await result.current.handleAttachmentSelect('location');
      });

      expect(result.current.error).toContain('Location access denied');
    });

    it('should handle unsupported attachment types', async () => {
      const { result } = renderHook(() => useAttachmentPicker({
        onAttachmentSelect: mockOnAttachmentSelect
      }));

      await act(async () => {
        await result.current.handleAttachmentSelect('unsupported');
      });

      expect(result.current.error).toContain('Unsupported attachment type');
    });

    it('should clear errors', () => {
      const { result } = renderHook(() => useAttachmentPicker());

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('State management', () => {
    it('should clear selected attachment', () => {
      const { result } = renderHook(() => useAttachmentPicker());

      act(() => {
        result.current.clearAttachment();
      });

      expect(result.current.selectedAttachment).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should handle processing state', async () => {
      const { result } = renderHook(() => useAttachmentPicker({
        onAttachmentSelect: mockOnAttachmentSelect
      }));

      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const createElementSpy = jest.spyOn(document, 'createElement');
      const mockInput = {
        type: '',
        accept: '',
        capture: '',
        onchange: null,
        oncancel: null,
        click: jest.fn()
      };
      createElementSpy.mockReturnValue(mockInput);

      // Start the attachment selection process
      act(() => {
        result.current.handleAttachmentSelect('camera');
      });

      // Check that processing state is true
      expect(result.current.isProcessing).toBe(true);

      // Complete the file selection
      await act(async () => {
        mockInput.onchange({ target: { files: [mockFile] } });
      });

      // Check that processing state is false after completion
      expect(result.current.isProcessing).toBe(false);

      createElementSpy.mockRestore();
    });
  });
});