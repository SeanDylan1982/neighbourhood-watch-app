import React from 'react';
import { Box } from '@mui/material';
import { BRAND } from '../../../constants/branding';
import './Logo.css';
import logoImage from './logo.png';

const Logo = ({ 
  size = 'medium', 
  variant = 'full', 
  className = '',
  alt = 'neibrly logo',
  onClick,
  style = {}
}) => {
  const sizeMap = {
    small: { width: 32, height: 32 },
    medium: { width: 48, height: 48 },
    large: { width: 64, height: 64 },
    xlarge: { width: 96, height: 96 }
  };

  const logoSize = sizeMap[size] || sizeMap.medium;

  // Use the imported logo image
  const logoSrc = logoImage;

  return (
    <Box
      className={`logo ${className}`}
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}
    >
      <img
        src={logoSrc}
        alt={alt}
        className={`logo-image logo-${size}`}
        style={{
          width: logoSize.width,
          height: logoSize.height,
          objectFit: 'contain'
        }}
        onError={(e) => {
          // Fallback to text if image fails to load
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'block';
        }}
      />
      <span 
        className="logo-fallback"
        style={{ 
          display: 'none',
          fontWeight: 'bold',
          fontSize: size === 'small' ? '14px' : size === 'large' ? '24px' : '18px',
          color: BRAND.colors.primary
        }}
      >
        {BRAND.name}
      </span>
    </Box>
  );
};

export default Logo;