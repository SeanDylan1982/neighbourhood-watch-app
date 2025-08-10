import React from 'react';
import { Box, Tooltip } from '@mui/material';
import FluentIcon from '../Icons/FluentIcon';

/**
 * Pin Icon Component for displaying pinned content indicator
 * 
 * @param {Object} props
 * @param {number} props.size - Size of the pin icon (default: 20)
 * @param {string} props.color - Color of the pin icon (default: 'primary.main')
 * @param {string} props.position - Position style: 'absolute' or 'relative' (default: 'relative')
 * @param {Object} props.sx - Additional styles
 * @param {string} props.tooltip - Tooltip text (default: 'Pinned')
 * @param {boolean} props.showTooltip - Whether to show tooltip (default: true)
 */
const PinIcon = ({
  size = 30,
  color = 'primary.main',
  position = 'relative',
  sx = {},
  tooltip = 'Pinned',
  showTooltip = true,
  ...props
}) => {
  const iconStyles = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    position: position,
    rotate: "300deg",
    width: "30px",
    height: "30px",
    ...(position === "absolute" && {
      top: 1,
      right: 1,
      zIndex: 1,
    }),
    ...sx,
  };

  const pinIcon = (
    <Box sx={iconStyles} {...props}>
      <FluentIcon
        name="Pin"
        size={size}
        color={color}
        sx={{
          transform: 'rotate(45deg)', // Rotate pin to look more natural
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))', // Add subtle shadow
        }}
      />
    </Box>
  );

  if (showTooltip) {
    return (
      <Tooltip title={tooltip} arrow placement="top">
        {pinIcon}
      </Tooltip>
    );
  }

  return pinIcon;
};

export default PinIcon;