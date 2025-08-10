import React from 'react';
import { Close as CloseIcon } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import './ReplyPreview.css';

/**
 * ReplyPreview Component
 * 
 * Displays a quoted message preview for replies, showing an excerpt of the original
 * message with visual connection and formatting. Used in message input area when
 * replying to a message.
 * 
 * Features:
 * - Quoted message excerpt with truncation
 * - Visual connection line to original message
 * - Sender name display
 * - Media type indicators for non-text messages
 * - Close button to cancel reply
 * - Responsive design for mobile and desktop
 */
const ReplyPreview = ({
  // Reply data
  replyTo,
  
  // Handlers
  onClose,
  
  // Customization
  maxLength = 100,
  showCloseButton = true,
  className = '',
  
  // Styling options
  variant = 'default', // 'default', 'compact', 'inline'
  position = 'top' // 'top', 'bottom', 'inline'
}) => {
  if (!replyTo) {
    return null;
  }

  // Generate excerpt based on message type
  const generateExcerpt = (message) => {
    if (!message) return '';

    switch (message.type) {
      case 'text':
        return truncateText(message.content, maxLength);
      
      case 'image':
        return '🖼️ Photo';
      
      case 'video':
        return '🎥 Video';
      
      case 'audio':
        return '🎙️ Audio';
      
      case 'document':
        return `📄 ${message.filename || 'Document'}`;
      
      case 'location':
        return '📍 Location';
      
      case 'contact':
        return '👤 Contact';
      
      default:
        return truncateText(message.content || 'Message', maxLength);
    }
  };

  // Truncate text with ellipsis
  const truncateText = (text, maxLen) => {
    if (!text) return '';
    if (text.length <= maxLen) return text;
    
    // Find the last space before maxLen to avoid cutting words
    const truncated = text.substring(0, maxLen);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxLen * 0.7) {
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  };

  // Handle close button click
  const handleClose = (event) => {
    event?.preventDefault();
    event?.stopPropagation();
    onClose?.();
  };

  // Handle keyboard events
  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      handleClose(event);
    }
  };

  const excerpt = generateExcerpt(replyTo);
  const senderName = replyTo.senderName || 'Unknown';

  return (
    <div 
      className={`reply-preview ${variant} ${position} ${className}`}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label={`Replying to message from ${senderName}`}
    >
      <div className="reply-preview-content">
        {/* Visual connection line */}
        <div className="reply-connection-line" />
        
        {/* Reply content */}
        <div className="reply-content">
          <div className="reply-header">
            <span className="reply-sender" title={senderName}>
              {senderName}
            </span>
            {showCloseButton && (
              <IconButton
                size="small"
                onClick={handleClose}
                className="reply-close-button"
                aria-label="Cancel reply"
                title="Cancel reply"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </div>
          
          <div className="reply-excerpt" title={replyTo.content}>
            {excerpt}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReplyPreview;