import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Paper,
  Chip,
  Fade,
  Zoom
} from '@mui/material';
import {
  Reply as ReplyIcon,
  ThumbUp as ThumbUpIcon,
  Favorite as HeartIcon,
  SentimentSatisfied as SmileIcon,
  SentimentVerySatisfied as LaughIcon,
  SentimentDissatisfied as SadIcon,
  SentimentVeryDissatisfied as AngryIcon
} from '@mui/icons-material';

// Define available reaction types
const REACTION_TYPES = [
  { type: 'thumbs_up', icon: <ThumbUpIcon />, label: 'Thumbs Up' },
  { type: 'heart', icon: <HeartIcon />, label: 'Heart' },
  { type: 'smile', icon: <SmileIcon />, label: 'Smile' },
  { type: 'laugh', icon: <LaughIcon />, label: 'Laugh' },
  { type: 'sad', icon: <SadIcon />, label: 'Sad' },
  { type: 'angry', icon: <AngryIcon />, label: 'Angry' }
];

/**
 * MessageInteractions component provides hover-triggered reply and reaction functionality
 * positioned outside message card borders for private chat messages
 * 
 * @param {Object} props
 * @param {string} props.messageId - Unique identifier for the message
 * @param {boolean} props.isVisible - Whether interactions should be visible (hover state)
 * @param {boolean} props.isOwnMessage - Whether this is the current user's message
 * @param {Array} props.existingReactions - Array of existing reactions on the message
 * @param {string} props.currentUserId - Current user's ID for reaction toggle logic
 * @param {Function} props.onReply - Callback when reply button is clicked
 * @param {Function} props.onReact - Callback when reaction button is clicked
 */
const MessageInteractions = ({
  messageId,
  isVisible = false,
  isOwnMessage = false,
  existingReactions = [],
  currentUserId,
  onReply,
  onReact
}) => {
  const [showReactions, setShowReactions] = useState(false);

  // Handle reply button click
  const handleReply = () => {
    if (onReply) {
      onReply(messageId);
    }
  };

  // Handle reaction selection
  const handleReaction = (reactionType) => {
    if (onReact) {
      onReact(messageId, reactionType);
    }
    setShowReactions(false);
  };

  // Check if current user has already reacted with a specific type
  const hasUserReacted = (reactionType) => {
    const reaction = existingReactions.find(r => r.type === reactionType);
    return reaction && reaction.users.includes(currentUserId);
  };

  // Get reaction count for a specific type
  const getReactionCount = (reactionType) => {
    const reaction = existingReactions.find(r => r.type === reactionType);
    return reaction ? reaction.count : 0;
  };

  // Show reactions on hover over reaction button
  const handleReactionHover = () => {
    setShowReactions(true);
  };

  const handleReactionLeave = () => {
    // Delay hiding to allow moving to reaction buttons
    setTimeout(() => setShowReactions(false), 200);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Reply Button - Top Right Corner */}
      <Fade in={isVisible} timeout={200}>
        <Box
          sx={{
            position: 'absolute',
            top: -8,
            right: isOwnMessage ? 'auto' : -8,
            left: isOwnMessage ? -8 : 'auto',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5
          }}
        >
        {/* Reply Button */}
        <Tooltip title="Reply to message" placement="top">
          <Paper
            elevation={2}
            sx={{
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <IconButton
              size="small"
              onClick={handleReply}
              sx={{
                width: 28,
                height: 28,
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                  bgcolor: 'primary.light'
                }
              }}
            >
              <ReplyIcon fontSize="small" />
            </IconButton>
          </Paper>
        </Tooltip>

        </Box>
      </Fade>

      {/* Reaction Button - Bottom Right Corner */}
      <Fade in={isVisible} timeout={200}>
        <Box
          sx={{
            position: 'absolute',
            bottom: -8,
            right: isOwnMessage ? 'auto' : -8,
            left: isOwnMessage ? -8 : 'auto',
            zIndex: 10
          }}
          onMouseEnter={handleReactionHover}
          onMouseLeave={handleReactionLeave}
        >
          <Tooltip title="Add reaction" placement="top">
            <Paper
              elevation={2}
              sx={{
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <IconButton
                size="small"
                sx={{
                  width: 28,
                  height: 28,
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                    bgcolor: 'primary.light'
                  }
                }}
              >
                <SmileIcon fontSize="small" />
              </IconButton>
            </Paper>
          </Tooltip>

          {/* Reaction Options Popup */}
          <Zoom in={showReactions} timeout={150}>
            <Paper
              elevation={4}
              sx={{
                position: 'absolute',
                bottom: 40,
                left: '50%',
                transform: 'translateX(-50%)',
                display: showReactions ? 'flex' : 'none',
                alignItems: 'center',
                gap: 0.5,
                p: 0.5,
                borderRadius: 3,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                zIndex: 20
              }}
              onMouseEnter={() => setShowReactions(true)}
              onMouseLeave={() => setShowReactions(false)}
            >
              {REACTION_TYPES.map((reaction) => {
                const hasReacted = hasUserReacted(reaction.type);
                const count = getReactionCount(reaction.type);
                
                return (
                  <Tooltip key={reaction.type} title={reaction.label} placement="top">
                    <Box sx={{ position: 'relative' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleReaction(reaction.type)}
                        sx={{
                          width: 32,
                          height: 32,
                          color: hasReacted ? 'primary.main' : 'text.secondary',
                          bgcolor: hasReacted ? 'primary.light' : 'transparent',
                          '&:hover': {
                            color: 'primary.main',
                            bgcolor: 'primary.light',
                            transform: 'scale(1.1)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {reaction.icon}
                      </IconButton>
                      
                      {/* Reaction Count Badge */}
                      {count > 0 && (
                        <Chip
                          label={count}
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: -4,
                            right: -4,
                            height: 16,
                            minWidth: 16,
                            fontSize: '0.7rem',
                            bgcolor: hasReacted ? 'primary.main' : 'grey.500',
                            color: 'white',
                            '& .MuiChip-label': {
                              px: 0.5
                            }
                          }}
                        />
                      )}
                    </Box>
                  </Tooltip>
                );
              })}
            </Paper>
          </Zoom>
        </Box>
      </Fade>

      {/* Existing Reactions Display - Bottom Left of Message Bubble */}
      {existingReactions.length > 0 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: -12,
            left: isOwnMessage ? 'auto' : 0,
            right: isOwnMessage ? 0 : 'auto',
            zIndex: 5,
            display: 'flex',
            gap: 0.5,
            flexWrap: 'wrap'
          }}
        >
          {existingReactions.map((reaction) => {
            const reactionType = REACTION_TYPES.find(r => r.type === reaction.type);
            const hasReacted = hasUserReacted(reaction.type);
            
            if (!reactionType || reaction.count === 0) return null;
            
            return (
              <Tooltip
                key={reaction.type}
                title={`${reaction.count} ${reaction.count === 1 ? 'person' : 'people'} reacted with ${reactionType.label}`}
                placement="top"
              >
                <Chip
                  icon={reactionType.icon}
                  label={reaction.count}
                  size="small"
                  clickable
                  onClick={() => handleReaction(reaction.type)}
                  sx={{
                    height: 24,
                    fontSize: '0.75rem',
                    bgcolor: hasReacted ? 'primary.light' : 'grey.100',
                    color: hasReacted ? 'primary.main' : 'text.secondary',
                    border: hasReacted ? '1px solid' : 'none',
                    borderColor: hasReacted ? 'primary.main' : 'transparent',
                    '&:hover': {
                      bgcolor: 'primary.light',
                      color: 'primary.main'
                    },
                    '& .MuiChip-icon': {
                      fontSize: '0.9rem',
                      color: 'inherit'
                    }
                  }}
                />
              </Tooltip>
            );
          })}
        </Box>
      )}
    </>
  );
};

export default MessageInteractions;