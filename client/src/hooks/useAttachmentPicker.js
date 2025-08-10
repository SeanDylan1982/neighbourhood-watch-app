import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for managing attachment picker state and interactions
 * Provides unified interface for attachment selection across different chat types
 * 
 * Requirements addressed:
 * - 7.1: Display options for Camera, Photo & Video Library, Document, Location, and Contact
 * - 7.2: Show upload progress and inline preview
 * - 7.3: Display properly sized thumbnails in chat
 * - 7.4: Show filename, type, and size information for documents
 * - 7.5: Request geolocation permissions and display location preview
 * - 7.6: Show name and phone/email information for contacts
 */
const useAttachmentPicker = ({
  onAttachmentSelect,
  availableTypes = ['camera', 'gallery', 'document', 'location', 'contact'],
  disabled = false
} = {}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  const attachmentInputRef = useRef(null);

  // Open attachment picker
  const openPicker = useCallback((event) => {
    if (disabled) return;
    
    setAnchorEl(event.currentTarget);
    setIsOpen(true);
    setError(null);
  }, [disabled]);

  // Close attachment picker
  const closePicker = useCallback(() => {
    setIsOpen(false);
    setAnchorEl(null);
  }, []);

  // Handle camera capture
  const handleCameraCapture = useCallback(async () => {
    try {
      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not available on this device');
      }

      // For now, we'll use file input with camera capture
      // In a real implementation, you might use getUserMedia for live camera
      return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,video/*';
        input.capture = 'environment'; // Use rear camera on mobile
        
        input.onchange = (event) => {
          const file = event.target.files[0];
          if (file) {
            resolve({
              type: 'camera',
              file,
              preview: URL.createObjectURL(file),
              name: file.name,
              size: file.size,
              mimeType: file.type,
              needsProcessing: true // Flag for MediaUpload processing
            });
          } else {
            reject(new Error('No file selected'));
          }
        };
        
        input.oncancel = () => {
          reject(new Error('Camera capture cancelled'));
        };
        
        input.click();
      });
    } catch (error) {
      throw new Error(`Camera capture failed: ${error.message}`);
    }
  }, []);

  // Handle gallery selection
  const handleGallerySelection = useCallback(async () => {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,video/*';
      input.multiple = true;
      
      input.onchange = (event) => {
        const files = Array.from(event.target.files);
        if (files.length > 0) {
          const processedFiles = files.map(file => ({
            type: 'gallery',
            file,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
            name: file.name,
            size: file.size,
            mimeType: file.type,
            needsProcessing: true // Flag for MediaUpload processing
          }));
          
          resolve(files.length === 1 ? processedFiles[0] : processedFiles);
        } else {
          reject(new Error('No files selected'));
        }
      };
      
      input.oncancel = () => {
        reject(new Error('Gallery selection cancelled'));
      };
      
      input.click();
    });
  }, []);

  // Handle document selection
  const handleDocumentSelection = useCallback(async () => {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.zip,.rar';
      input.multiple = true;
      
      input.onchange = (event) => {
        const files = Array.from(event.target.files);
        if (files.length > 0) {
          const processedFiles = files.map(file => ({
            type: 'document',
            file,
            name: file.name,
            size: file.size,
            mimeType: file.type,
            extension: file.name.split('.').pop()?.toLowerCase()
          }));
          
          resolve(files.length === 1 ? processedFiles[0] : processedFiles);
        } else {
          reject(new Error('No files selected'));
        }
      };
      
      input.oncancel = () => {
        reject(new Error('Document selection cancelled'));
      };
      
      input.click();
    });
  }, []);

  // Handle location selection
  const handleLocationSelection = useCallback(async () => {
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation not supported on this device');
      }

      return new Promise((resolve, reject) => {
        const options = {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        };

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            try {
              // Try to get address from coordinates (reverse geocoding)
              let address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
              
              // You could integrate with a geocoding service here
              // For now, we'll use the coordinates as the address
              
              resolve({
                type: 'location',
                coordinates: { latitude, longitude },
                address,
                accuracy: position.coords.accuracy,
                timestamp: position.timestamp
              });
            } catch (geocodingError) {
              // If geocoding fails, still return the coordinates
              resolve({
                type: 'location',
                coordinates: { latitude, longitude },
                address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                accuracy: position.coords.accuracy,
                timestamp: position.timestamp
              });
            }
          },
          (error) => {
            let errorMessage = 'Failed to get location';
            
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Location access denied. Please enable location permissions.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Location information unavailable.';
                break;
              case error.TIMEOUT:
                errorMessage = 'Location request timed out.';
                break;
              default:
                errorMessage = 'Failed to get location';
                break;
            }
            
            reject(new Error(errorMessage));
          },
          options
        );
      });
    } catch (error) {
      throw new Error(`Location selection failed: ${error.message}`);
    }
  }, []);

  // Handle contact selection
  const handleContactSelection = useCallback(async () => {
    try {
      // Check if Contact Picker API is available
      if ('contacts' in navigator && 'ContactsManager' in window) {
        const props = ['name', 'email', 'tel'];
        const opts = { multiple: false };
        
        const contacts = await navigator.contacts.select(props, opts);
        
        if (contacts.length > 0) {
          const contact = contacts[0];
          return {
            type: 'contact',
            name: contact.name?.[0] || 'Unknown Contact',
            email: contact.email?.[0] || null,
            phone: contact.tel?.[0] || null,
            raw: contact
          };
        } else {
          throw new Error('No contact selected');
        }
      } else {
        // Fallback: Manual contact input or file selection
        throw new Error('Contact picker not supported. Please share contact manually.');
      }
    } catch (error) {
      throw new Error(`Contact selection failed: ${error.message}`);
    }
  }, []);

  // Handle attachment type selection
  const handleAttachmentSelect = useCallback(async (attachmentType) => {
    if (disabled || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      let result = null;

      switch (attachmentType) {
        case 'camera':
          result = await handleCameraCapture();
          break;
        case 'gallery':
          result = await handleGallerySelection();
          break;
        case 'document':
          result = await handleDocumentSelection();
          break;
        case 'location':
          result = await handleLocationSelection();
          break;
        case 'contact':
          result = await handleContactSelection();
          break;
        default:
          throw new Error(`Unsupported attachment type: ${attachmentType}`);
      }

      if (result) {
        setSelectedAttachment(result);
        
        if (onAttachmentSelect) {
          await onAttachmentSelect(result);
        }
      }

      closePicker();
    } catch (error) {
      console.error('Error selecting attachment:', error);
      setError(error.message || 'Failed to select attachment');
    } finally {
      setIsProcessing(false);
    }
  }, [disabled, isProcessing, closePicker, handleCameraCapture, handleGallerySelection, handleDocumentSelection, handleLocationSelection, handleContactSelection, onAttachmentSelect]);

  // Clear selected attachment
  const clearAttachment = useCallback(() => {
    setSelectedAttachment(null);
    setError(null);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isOpen,
    anchorEl,
    selectedAttachment,
    isProcessing,
    error,
    
    // Actions
    openPicker,
    closePicker,
    handleAttachmentSelect,
    clearAttachment,
    clearError,
    
    // Configuration
    availableTypes,
    disabled: disabled || isProcessing,
    
    // Refs
    attachmentInputRef
  };
};

export default useAttachmentPicker;