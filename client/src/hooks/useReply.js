import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * useReply Hook
 * 
 * Manages reply state and functionality for message interactions.
 * Handles reply preview display, reply cancellation, and reply submission.
 * 
 * Features:
 * - Reply state management
 * - Reply preview generation
 * - Auto-focus on input when replying
 * - Reply cancellation
 * - Integration with message input
 */
const useReply = () => {
  const [replyTo, setReplyTo] = useState(null);
  const [isReplying, setIsReplying] = useState(false);
  const inputRef = useRef(null);

  // Start a reply to a message
  const startReply = useCallback((message) => {
    if (!message) return;

    const replyData = {
      id: message.id,
      content: message.content,
      senderName: message.senderName,
      type: message.type,
      filename: message.filename, // For document messages
      timestamp: message.timestamp
    };

    setReplyTo(replyData);
    setIsReplying(true);

    // Auto-focus on input after a brief delay to ensure DOM is updated
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  }, []);

  // Cancel the current reply
  const cancelReply = useCallback(() => {
    setReplyTo(null);
    setIsReplying(false);
  }, []);

  // Clear reply after successful submission
  const clearReply = useCallback(() => {
    setReplyTo(null);
    setIsReplying(false);
  }, []);

  // Generate reply data for message submission
  const getReplyData = useCallback(() => {
    if (!replyTo) return null;

    return {
      messageId: replyTo.id,
      content: generateReplyExcerpt(replyTo),
      senderName: replyTo.senderName,
      type: replyTo.type
    };
  }, [replyTo]);

  // Generate excerpt for reply display
  const generateReplyExcerpt = useCallback((message, maxLength = 100) => {
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
  }, []);

  // Truncate text helper
  const truncateText = useCallback((text, maxLength) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxLength * 0.7) {
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Escape to cancel reply
      if (event.key === 'Escape' && isReplying) {
        cancelReply();
      }
    };

    if (isReplying) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isReplying, cancelReply]);

  // Validate reply data
  const isValidReply = useCallback(() => {
    return replyTo && replyTo.id && replyTo.senderName;
  }, [replyTo]);

  // Get reply context for display
  const getReplyContext = useCallback(() => {
    if (!replyTo) return null;

    return {
      ...replyTo,
      excerpt: generateReplyExcerpt(replyTo),
      isValid: isValidReply()
    };
  }, [replyTo, generateReplyExcerpt, isValidReply]);

  return {
    // State
    replyTo,
    isReplying,
    
    // Actions
    startReply,
    cancelReply,
    clearReply,
    
    // Helpers
    getReplyData,
    getReplyContext,
    isValidReply,
    
    // Refs
    inputRef
  };
};

export default useReply;