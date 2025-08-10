import React, { useState, useRef } from 'react';
import { Tooltip, Popper, Paper, ClickAwayListener, Fade } from '@mui/material';
import './MessageReactions.css';

/**
 * MessageReactions Component
 * 
 * Displays existing reactions on a message with count badges and user tooltips.
 * Allows users to add/remove their own reactions by clicking on reaction badges.
 * 
 * Features:
 * - Reaction display with emoji and count
 * - User tooltips showing who reacted
 * - Click to add/remove reactions
 * - Highlighted reactions for current user
 * - Responsive design for mobile and desktop
 * - Animation for reaction changes
 * - Accessibility support
 */
const MessageReactions = ({
  // Message data
  messageId,
  reactions = [],
  currentUserId,
  
  // Handlers
  onReactionClick,
  onReactionHover,
  
  // Display options
  maxVisibleReactions = 6,
  showUserTooltips = true,
  animateChanges = true,
  
  // Styling
  className = '',
  size = 'medium', // 'small', 'medium', 'large'
  variant = 'default', // 'default', 'compact', 'minimal'
  
  // Behavior
  allowToggle = true,
  disabled = false
}) => {
  const [tooltipOpen, setTooltipOpen] = useState(null);
  const [tooltipAnchor, setTooltipAnchor] = useState(null);
  const reactionRefs = useRef({});

  if (!reactions || reactions.length === 0) {
    return null;
  }

  // Get emoji for reaction type
  const getEmojiForReaction = (reactionType) => {
    const emojiMap = {
      thumbs_up: '👍',
      laugh: '😂',
      wow: '😮',
      heart: '❤️',
      sad: '😢',
      angry: '😡',
      like: '👍',
      love: '❤️',
      haha: '😂',
      care: '🤗',
      surprised: '😮',
      cry: '😢',
      mad: '😡'
    };
    return emojiMap[reactionType] || '👍';
  };

  // Check if current user has reacted with this type
  const hasUserReacted = (reaction) => {
    return reaction.users && reaction.users.includes(currentUserId);
  };

  // Handle reaction click
  const handleReactionClick = (reactionType, event) => {
    if (disabled || !allowToggle) return;
    
    event?.stopPropagation();
    onReactionClick?.(messageId, reactionType);
  };

  // Handle reaction hover for tooltips
  const handleReactionHover = (reaction, event, isEntering) => {
    if (!showUserTooltips || disabled) return;

    if (isEntering) {
      setTooltipAnchor(event.currentTarget);
      setTooltipOpen(reaction.type);
      onReactionHover?.(messageId, reaction.type, true);
    } else {
      setTooltipOpen(null);
      setTooltipAnchor(null);
      onReactionHover?.(messageId, reaction.type, false);
    }
  };

  // Generate tooltip content
  const generateTooltipContent = (reaction) => {
    if (!reaction.users || reaction.users.length === 0) {
      return `${getEmojiForReaction(reaction.type)} ${reaction.type.replace('_', ' ')}`;
    }

    const userNames = reaction.users.map(userId => {
      // In a real app, you'd get user names from a user store/context
      // For now, we'll use placeholder names or user IDs
      return getUserName(userId);
    });

    if (userNames.length === 1) {
      return `${userNames[0]} reacted with ${getEmojiForReaction(reaction.type)}`;
    } else if (userNames.length === 2) {
      return `${userNames[0]} and ${userNames[1]} reacted with ${getEmojiForReaction(reaction.type)}`;
    } else if (userNames.length <= 5) {
      const lastUser = userNames.pop();
      return `${userNames.join(', ')} and ${lastUser} reacted with ${getEmojiForReaction(reaction.type)}`;
    } else {
      const displayUsers = userNames.slice(0, 3);
      const remainingCount = userNames.length - 3;
      return `${displayUsers.join(', ')} and ${remainingCount} others reacted with ${getEmojiForReaction(reaction.type)}`;
    }
  };

  // Get user name (placeholder implementation)
  const getUserName = (userId) => {
    if (userId === currentUserId) return 'You';
    // In a real app, this would come from a user context or store
    return `User ${userId.slice(-4)}`;
  };

  // Sort reactions by count (descending) and then by type
  const sortedReactions = [...reactions]
    .filter(reaction => reaction.count > 0)
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.type.localeCompare(b.type);
    });

  // Limit visible reactions
  const visibleReactions = sortedReactions.slice(0, maxVisibleReactions);
  const hiddenCount = sortedReactions.length - visibleReactions.length;

  return (
    <div className={`message-reactions ${size} ${variant} ${className}`}>
      <div className="reactions-container">
        {visibleReactions.map((reaction) => {
          const isUserReacted = hasUserReacted(reaction);
          const emoji = getEmojiForReaction(reaction.type);
          
          return (
            <button
              key={reaction.type}
              ref={el => reactionRefs.current[reaction.type] = el}
              className={`reaction-badge ${isUserReacted ? 'user-reacted' : ''} ${disabled ? 'disabled' : ''}`}
              onClick={(e) => handleReactionClick(reaction.type, e)}
              onMouseEnter={(e) => handleReactionHover(reaction, e, true)}
              onMouseLeave={(e) => handleReactionHover(reaction, e, false)}
              disabled={disabled}
              aria-label={`${emoji} ${reaction.count} ${reaction.count === 1 ? 'reaction' : 'reactions'}${isUserReacted ? ', you reacted' : ''}`}
              title={generateTooltipContent(reaction)}
            >
              <span className="reaction-emoji" role="img" aria-label={reaction.type.replace('_', ' ')}>
                {emoji}
              </span>
              <span className="reaction-count">
                {reaction.count}
              </span>
              {animateChanges && (
                <div className="reaction-animation-overlay" />
              )}
            </button>
          );
        })}
        
        {hiddenCount > 0 && (
          <div className="hidden-reactions-indicator">
            +{hiddenCount}
          </div>
        )}
      </div>

      {/* Enhanced Tooltip */}
      {showUserTooltips && tooltipOpen && tooltipAnchor && (
        <Popper
          open={Boolean(tooltipOpen)}
          anchorEl={tooltipAnchor}
          placement="top"
          transition
          disablePortal={false}
          modifiers={[
            {
              name: 'flip',
              enabled: true,
              options: {
                altBoundary: true,
                rootBoundary: 'viewport',
                padding: 8,
              },
            },
            {
              name: 'preventOverflow',
              enabled: true,
              options: {
                altAxis: true,
                altBoundary: true,
                tether: true,
                rootBoundary: 'viewport',
                padding: 8,
              },
            },
          ]}
          sx={{ zIndex: 1500 }}
        >
          {({ TransitionProps }) => (
            <Fade {...TransitionProps} timeout={200}>
              <Paper
                className="reaction-tooltip"
                elevation={8}
                sx={{
                  padding: '8px 12px',
                  fontSize: '12px',
                  maxWidth: 200,
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  color: 'white',
                  borderRadius: '6px',
                  wordWrap: 'break-word'
                }}
              >
                {generateTooltipContent(
                  sortedReactions.find(r => r.type === tooltipOpen)
                )}
              </Paper>
            </Fade>
          )}
        </Popper>
      )}
    </div>
  );
};

export default MessageReactions;