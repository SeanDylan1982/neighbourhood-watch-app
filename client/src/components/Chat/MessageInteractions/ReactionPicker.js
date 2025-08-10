import React, { useState, useEffect, useRef } from 'react';
import './ReactionPicker.css';

const COMMON_REACTIONS = [
  { emoji: '👍', name: 'thumbs_up' },
  { emoji: '😂', name: 'laugh' },
  { emoji: '😮', name: 'wow' },
  { emoji: '❤️', name: 'heart' },
  { emoji: '😢', name: 'sad' },
  { emoji: '😡', name: 'angry' }
];

const ReactionPicker = ({
  messageId,
  existingReactions = [],
  currentUserId,
  onReact,
  onClose,
  position = { x: 0, y: 0 },
  isVisible = false
}) => {
  const [selectedReaction, setSelectedReaction] = useState(null);
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isVisible, onClose]);

  const handleReactionClick = (reactionType) => {
    setSelectedReaction(reactionType);
    onReact(messageId, reactionType);
    
    // Close picker after a brief delay to show selection
    setTimeout(() => {
      onClose();
    }, 150);
  };

  const getUserReactionType = () => {
    const userReaction = existingReactions.find(reaction => 
      reaction.users.includes(currentUserId)
    );
    return userReaction?.type || null;
  };

  const getReactionCount = (reactionType) => {
    const reaction = existingReactions.find(r => r.type === reactionType);
    return reaction?.count || 0;
  };

  const hasUserReacted = (reactionType) => {
    const reaction = existingReactions.find(r => r.type === reactionType);
    return reaction?.users.includes(currentUserId) || false;
  };

  if (!isVisible) return null;

  return (
    <div 
      className="reaction-picker"
      ref={pickerRef}
      style={{
        left: position.x,
        top: position.y,
        transform: 'translateY(-100%)'
      }}
    >
      <div className="reaction-picker-content">
        {COMMON_REACTIONS.map((reaction) => {
          const count = getReactionCount(reaction.name);
          const isSelected = hasUserReacted(reaction.name);
          const isCurrentlySelected = selectedReaction === reaction.name;
          
          return (
            <button
              key={reaction.name}
              className={`reaction-button ${isSelected ? 'selected' : ''} ${isCurrentlySelected ? 'animating' : ''}`}
              onClick={() => handleReactionClick(reaction.name)}
              title={`${reaction.emoji} ${reaction.name.replace('_', ' ')}`}
              aria-label={`React with ${reaction.name.replace('_', ' ')}`}
            >
              <span className="reaction-emoji">{reaction.emoji}</span>
              {count > 0 && (
                <span className="reaction-count">{count}</span>
              )}
            </button>
          );
        })}
      </div>
      <div className="reaction-picker-arrow" />
    </div>
  );
};

export default ReactionPicker;