import React from 'react';
import ImageThumbnail from './ImageThumbnail';
import useImageModal from '../../../hooks/useImageModal';
import ImageModal from '../ImageModal/ImageModal';
import './ImageThumbnail.css';

const ImageThumbnailGrid = ({ 
  images = [], 
  variant = 'default',
  maxImages = 3,
  className = ''
}) => {
  const { isOpen, imageSrc, imageAlt, openModal, closeModal } = useImageModal();

  if (!images || images.length === 0) {
    return null;
  }

  const handleImageClick = (image) => {
    const src = image.url || image.src || image;
    const alt = image.alt || image.filename || 'Image';
    openModal(src, alt);
  };

  const displayImages = images.slice(0, maxImages);
  const remainingCount = images.length - maxImages;

  return (
    <>
      <div className={`image-thumbnails-container ${className}`}>
        {displayImages.map((image, index) => {
          const src = image.url || image.src || image;
          const alt = image.alt || image.filename || `Image ${index + 1}`;
          
          return (
            <div key={index} style={{ position: 'relative' }}>
              <ImageThumbnail
                src={src}
                alt={alt}
                variant={variant}
                onClick={() => handleImageClick(image)}
              />
              {index === maxImages - 1 && remainingCount > 0 && (
                <div 
                  className="image-thumbnail__overlay"
                  style={{ 
                    opacity: 1, 
                    background: 'rgba(0, 0, 0, 0.7)',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  +{remainingCount} more
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <ImageModal
        src={imageSrc}
        alt={imageAlt}
        isOpen={isOpen}
        onClose={closeModal}
      />
    </>
  );
};

export default ImageThumbnailGrid;