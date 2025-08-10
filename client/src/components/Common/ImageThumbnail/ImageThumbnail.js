import React, { useState } from 'react';
import FluentIcon from '../Icons/FluentIcon';
import './ImageThumbnail.css';

const ImageThumbnail = ({ 
  src, 
  alt, 
  maxWidth = 200, 
  maxHeight = 150, 
  onClick,
  className = '',
  variant = 'default' // 'default', 'single', 'grid', 'list'
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  const handleClick = () => {
    if (!imageError && onClick) {
      onClick();
    }
  };

  const getVariantClass = () => {
    switch (variant) {
      case 'single': return 'image-thumbnail--single';
      case 'grid': return 'image-thumbnail--grid';
      case 'list': return 'image-thumbnail--list';
      default: return '';
    }
  };

  const getContainerStyle = () => {
    if (variant !== 'default') {
      return {}; // Use CSS classes for variants
    }
    return { maxWidth, maxHeight };
  };

  if (imageError) {
    return (
      <div 
        className={`image-thumbnail image-thumbnail--error ${getVariantClass()} ${className}`}
        style={getContainerStyle()}
      >
        <FluentIcon name="ImageOff" size={24} />
        <span className="image-thumbnail__error-text">Image not available</span>
      </div>
    );
  }

  return (
    <div 
      className={`image-thumbnail ${onClick ? 'image-thumbnail--clickable' : ''} ${getVariantClass()} ${className}`}
      style={getContainerStyle()}
      onClick={handleClick}
    >
      {isLoading && (
        <div className="image-thumbnail__loading">
          <FluentIcon name="CircleRing" size={20} />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className="image-thumbnail__image"
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{ display: isLoading ? 'none' : 'block' }}
      />
      {onClick && !isLoading && (
        <div className="image-thumbnail__overlay">
          <FluentIcon name="ZoomIn" size={20} />
        </div>
      )}
    </div>
  );
};

export default ImageThumbnail;