import React, { useState, useEffect, useRef } from 'react';
import './ProgressiveImage.css';

/**
 * Progressive image loading component with blur-to-sharp transition
 * Loads a low-quality placeholder first, then the full-quality image
 */
const ProgressiveImage = ({
  src,
  thumbnail,
  alt = '',
  className = '',
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: '50px' // Start loading 50px before image comes into view
      }
    );

    observerRef.current.observe(img);

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  // Handle image loading
  const handleLoad = (event) => {
    setIsLoaded(true);
    onLoad?.(event);
  };

  const handleError = (event) => {
    setHasError(true);
    onError?.(event);
  };

  return (
    <div 
      className={`progressive-image ${className}`}
      ref={imgRef}
      {...props}
    >
      {/* Low-quality thumbnail - always visible initially */}
      {thumbnail && !hasError && (
        <img
          src={thumbnail}
          alt={alt}
          className={`progressive-image__thumbnail ${isLoaded ? 'progressive-image__thumbnail--hidden' : ''}`}
          loading="eager"
        />
      )}
      
      {/* High-quality image - loaded when in view */}
      {isInView && !hasError && (
        <img
          src={src}
          alt={alt}
          className={`progressive-image__main ${isLoaded ? 'progressive-image__main--visible' : ''}`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}
      
      {/* Error state */}
      {hasError && (
        <div className="progressive-image__error">
          <span className="progressive-image__error-icon">🖼️</span>
          <span className="progressive-image__error-text">Failed to load image</span>
        </div>
      )}
      
      {/* Loading indicator */}
      {!isLoaded && !hasError && isInView && (
        <div className="progressive-image__loading">
          <div className="progressive-image__spinner"></div>
        </div>
      )}
    </div>
  );
};

export default ProgressiveImage;