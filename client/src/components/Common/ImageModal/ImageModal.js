import React, { useEffect, useState } from 'react';
import FluentIcon from '../Icons/FluentIcon';
import './ImageModal.css';

const ImageModal = ({ src, alt, isOpen, onClose }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      // Reset states when modal opens
      setImageLoading(true);
      setImageError(false);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="image-modal" onClick={handleBackdropClick}>
      <div className="image-modal__content">
        <button 
          className="image-modal__close"
          onClick={onClose}
          aria-label="Close image"
        >
          <FluentIcon name="Dismiss" size={24} />
        </button>
        {imageLoading && !imageError && (
          <div className="image-modal__loading">
            <FluentIcon name="CircleRing" size={32} />
            <span>Loading image...</span>
          </div>
        )}
        
        {imageError && (
          <div className="image-modal__error">
            <FluentIcon name="ImageOff" size={48} />
            <span>Failed to load image</span>
          </div>
        )}
        
        <img 
          src={src} 
          alt={alt}
          className="image-modal__image"
          style={{ display: imageLoading || imageError ? 'none' : 'block' }}
          onError={() => {
            setImageLoading(false);
            setImageError(true);
          }}
          onLoad={() => {
            setImageLoading(false);
            setImageError(false);
          }}
        />
      </div>
    </div>
  );
};

export default ImageModal;