import { renderHook, act } from '@testing-library/react';
import useImageModal from './useImageModal';

describe('useImageModal', () => {
  it('initializes with correct default values', () => {
    const { result } = renderHook(() => useImageModal());
    
    expect(result.current.isOpen).toBe(false);
    expect(result.current.imageSrc).toBe('');
    expect(result.current.imageAlt).toBe('');
    expect(typeof result.current.openModal).toBe('function');
    expect(typeof result.current.closeModal).toBe('function');
  });

  it('opens modal with provided src and alt', () => {
    const { result } = renderHook(() => useImageModal());
    
    act(() => {
      result.current.openModal('test-image.jpg', 'Test image');
    });
    
    expect(result.current.isOpen).toBe(true);
    expect(result.current.imageSrc).toBe('test-image.jpg');
    expect(result.current.imageAlt).toBe('Test image');
  });

  it('opens modal with default alt when not provided', () => {
    const { result } = renderHook(() => useImageModal());
    
    act(() => {
      result.current.openModal('test-image.jpg');
    });
    
    expect(result.current.isOpen).toBe(true);
    expect(result.current.imageSrc).toBe('test-image.jpg');
    expect(result.current.imageAlt).toBe('');
  });

  it('closes modal and resets values', () => {
    const { result } = renderHook(() => useImageModal());
    
    // First open the modal
    act(() => {
      result.current.openModal('test-image.jpg', 'Test image');
    });
    
    expect(result.current.isOpen).toBe(true);
    
    // Then close it
    act(() => {
      result.current.closeModal();
    });
    
    expect(result.current.isOpen).toBe(false);
    expect(result.current.imageSrc).toBe('');
    expect(result.current.imageAlt).toBe('');
  });

  it('can open modal multiple times with different images', () => {
    const { result } = renderHook(() => useImageModal());
    
    // Open first image
    act(() => {
      result.current.openModal('image1.jpg', 'Image 1');
    });
    
    expect(result.current.imageSrc).toBe('image1.jpg');
    expect(result.current.imageAlt).toBe('Image 1');
    
    // Open second image without closing first
    act(() => {
      result.current.openModal('image2.jpg', 'Image 2');
    });
    
    expect(result.current.isOpen).toBe(true);
    expect(result.current.imageSrc).toBe('image2.jpg');
    expect(result.current.imageAlt).toBe('Image 2');
  });
});