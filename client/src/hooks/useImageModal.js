import { useState } from 'react';

const useImageModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState('');
  const [imageAlt, setImageAlt] = useState('');

  const openModal = (src, alt = '') => {
    setImageSrc(src);
    setImageAlt(alt);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setImageSrc('');
    setImageAlt('');
  };

  return {
    isOpen,
    imageSrc,
    imageAlt,
    openModal,
    closeModal
  };
};

export default useImageModal;