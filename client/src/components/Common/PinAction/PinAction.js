import React, { useState } from 'react';
import { IconButton, Tooltip, CircularProgress } from '@mui/material';
import FluentIcon from '../Icons/FluentIcon';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../Toast';

/**
 * Pin Action Component for admin users to pin/unpin content
 * 
 * @param {Object} props
 * @param {string} props.contentType - Type of content ('notice' or 'report')
 * @param {string} props.contentId - ID of the content to pin/unpin
 * @param {boolean} props.isPinned - Current pin status
 * @param {Function} props.onPinChange - Callback when pin status changes
 * @param {number} props.size - Size of the pin icon (default: 20)
 * @param {Object} props.sx - Additional styles
 */
const PinAction = ({
  contentType,
  contentId,
  isPinned,
  onPinChange,
  size = 20,
  sx = {},
  ...props
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  // Only show for admin users
  if (!user || user.role !== 'admin') {
    return null;
  }

  const handlePinToggle = async (e) => {
    e.stopPropagation(); // Prevent card click events
    
    setLoading(true);
    
    try {
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const endpoint = isPinned 
        ? `${baseURL}/api/${contentType}s/${contentId}/unpin`
        : `${baseURL}/api/${contentType}s/${contentId}/pin`;
      
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        
        // Call the callback to update parent component
        if (onPinChange) {
          onPinChange(contentId, !isPinned);
        }
        
        showToast(
          isPinned 
            ? `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} unpinned successfully`
            : `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} pinned successfully`,
          'success'
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 400 && errorData.message?.includes('maximum')) {
          showToast('Maximum of 2 items can be pinned at once. Please unpin another item first.', 'warning');
        } else if (response.status === 403) {
          showToast('You do not have permission to pin/unpin content.', 'error');
        } else {
          showToast(`Failed to ${isPinned ? 'unpin' : 'pin'} ${contentType}`, 'error');
        }
      }
    } catch (error) {
      console.error('Error toggling pin status:', error);
      showToast(`Error ${isPinned ? 'unpinning' : 'pinning'} ${contentType}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip 
      title={isPinned ? `Unpin this ${contentType}` : `Pin this ${contentType}`}
      arrow
      placement="top"
    >
      <IconButton
        onClick={handlePinToggle}
        disabled={loading}
        size="small"
        sx={{
          color: isPinned ? 'primary.main' : 'action.disabled',
          '&:hover': {
            color: isPinned ? 'primary.dark' : 'primary.main',
            backgroundColor: 'action.hover',
          },
          ...sx
        }}
        {...props}
      >
        {loading ? (
          <CircularProgress size={size} />
        ) : (
          <FluentIcon
            name="Pin"
            size={size}
            color={isPinned ? 'primary.main' : 'action.disabled'}
            sx={{
              transform: 'rotate(45deg)',
              transition: 'all 0.2s ease-in-out',
            }}
          />
        )}
      </IconButton>
    </Tooltip>
  );
};

export default PinAction;