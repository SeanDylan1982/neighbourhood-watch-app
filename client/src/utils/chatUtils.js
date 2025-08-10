/**
 * Chat UI Overhaul - Utility Functions
 * Provides helper functions for chat operations, formatting, and data manipulation
 */

// Time formatting utilities
export const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  }
};

export const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));
  
  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInMinutes < 1440) { // 24 hours
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `${days}d ago`;
  }
};

// Message content utilities
export const truncateMessage = (content, maxLength = 50) => {
  if (!content) return '';
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
};

export const getMessagePreview = (message) => {
  if (!message) return 'No messages yet';
  
  switch (message.type) {
    case 'text':
      return truncateMessage(message.content);
    case 'image':
      return '🖼️ Photo';
    case 'audio':
      return `🎙️ Audio${message.metadata?.duration ? ` (${formatDuration(message.metadata.duration)})` : ''}`;
    case 'document':
      return `📄 ${message.filename || 'Document'}`;
    case 'location':
      return '📍 Location';
    case 'contact':
      return '👤 Contact';
    case 'system':
      return message.content;
    default:
      return truncateMessage(message.content);
  }
};

export const formatDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Chat utilities
export const getChatDisplayName = (chat, currentUserId) => {
  if (chat.type === 'group') {
    return chat.name || 'Group Chat';
  } else {
    return chat.participantName || 'Private Chat';
  }
};

export const getChatAvatar = (chat) => {
  if (chat.type === 'group') {
    return chat.avatar || null; // Will use group icon as fallback
  } else {
    return chat.participantAvatar || null; // Will use user initials as fallback
  }
};

export const getInitials = (name) => {
  if (!name) return '?';
  const words = name.trim().split(' ');
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

// Message status utilities
export const getDeliveryStatusIcon = (status) => {
  switch (status) {
    case 'sending':
      return '⏳';
    case 'sent':
      return '✓';
    case 'delivered':
      return '✓✓';
    case 'read':
      return '✓✓'; // Could be styled differently (blue)
    case 'failed':
      return '❌';
    default:
      return '';
  }
};

export const getMessageStatusText = (status) => {
  switch (status) {
    case 'sending':
      return 'Sending...';
    case 'sent':
      return 'Sent';
    case 'delivered':
      return 'Delivered';
    case 'read':
      return 'Read';
    case 'failed':
      return 'Failed to send';
    default:
      return '';
  }
};

// Reaction utilities
export const getReactionEmoji = (reactionType) => {
  const reactionMap = {
    'like': '👍',
    'love': '❤️',
    'laugh': '😂',
    'wow': '😮',
    'sad': '😢',
    'angry': '😡',
    'thumbs_up': '👍',
    'heart': '❤️',
    'laughing': '😂',
    'surprised': '😮',
    'crying': '😢',
    'mad': '😡'
  };
  
  return reactionMap[reactionType] || reactionType;
};

export const formatReactionCount = (count) => {
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
  return `${(count / 1000000).toFixed(1)}M`;
};

// Typing indicator utilities
export const formatTypingIndicator = (typingUsers) => {
  if (!typingUsers || typingUsers.length === 0) return '';
  
  const names = typingUsers.map(user => user.userName);
  
  if (names.length === 1) {
    return `${names[0]} is typing...`;
  } else if (names.length === 2) {
    return `${names[0]} and ${names[1]} are typing...`;
  } else {
    return `${names[0]} and ${names.length - 1} others are typing...`;
  }
};

// Search utilities
export const highlightSearchTerm = (text, searchTerm) => {
  if (!searchTerm || !text) return text;
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

export const searchMessages = (messages, query) => {
  if (!query) return messages;
  
  const lowercaseQuery = query.toLowerCase();
  return messages.filter(message => 
    message.content.toLowerCase().includes(lowercaseQuery) ||
    message.senderName.toLowerCase().includes(lowercaseQuery)
  );
};

export const searchChats = (chats, query) => {
  if (!query) return chats;
  
  const lowercaseQuery = query.toLowerCase();
  return chats.filter(chat => 
    chat.name.toLowerCase().includes(lowercaseQuery) ||
    chat.description?.toLowerCase().includes(lowercaseQuery) ||
    chat.lastMessage?.content.toLowerCase().includes(lowercaseQuery)
  );
};

// Attachment utilities
export const getAttachmentIcon = (type) => {
  switch (type) {
    case 'image':
      return '🖼️';
    case 'audio':
      return '🎙️';
    case 'document':
      return '📄';
    case 'location':
      return '📍';
    case 'contact':
      return '👤';
    default:
      return '📎';
  }
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const isImageFile = (filename) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return imageExtensions.includes(extension);
};

export const isVideoFile = (filename) => {
  const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'];
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return videoExtensions.includes(extension);
};

export const isAudioFile = (filename) => {
  const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return audioExtensions.includes(extension);
};

// Validation utilities
export const validateMessage = (content, attachments = []) => {
  const errors = [];
  
  if (!content.trim() && attachments.length === 0) {
    errors.push('Message cannot be empty');
  }
  
  if (content.length > 4000) {
    errors.push('Message is too long (max 4000 characters)');
  }
  
  if (attachments.length > 10) {
    errors.push('Too many attachments (max 10)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateChatName = (name) => {
  const errors = [];
  
  if (!name.trim()) {
    errors.push('Chat name is required');
  }
  
  if (name.length > 100) {
    errors.push('Chat name is too long (max 100 characters)');
  }
  
  if (name.length < 2) {
    errors.push('Chat name is too short (min 2 characters)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Sorting utilities
export const sortChatsByActivity = (chats) => {
  return [...chats].sort((a, b) => {
    const aTime = a.lastMessage?.timestamp || a.updatedAt;
    const bTime = b.lastMessage?.timestamp || b.updatedAt;
    return new Date(bTime) - new Date(aTime);
  });
};

export const sortMessagesByTime = (messages) => {
  return [...messages].sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );
};

// Group utilities
export const formatMemberCount = (count) => {
  if (count === 1) return '1 member';
  return `${count} members`;
};

export const getMemberNames = (members, maxDisplay = 3) => {
  if (!members || members.length === 0) return '';
  
  const names = members.map(member => 
    `${member.firstName} ${member.lastName}`.trim()
  );
  
  if (names.length <= maxDisplay) {
    return names.join(', ');
  }
  
  const displayNames = names.slice(0, maxDisplay);
  const remaining = names.length - maxDisplay;
  
  return `${displayNames.join(', ')} and ${remaining} other${remaining > 1 ? 's' : ''}`;
};

// URL utilities
export const extractUrls = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
};

export const replaceUrlsWithLinks = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
};

// Emoji utilities
export const containsOnlyEmojis = (text) => {
  const emojiRegex = /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]*$/u;
  return emojiRegex.test(text.trim());
};

export const countEmojis = (text) => {
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
  const matches = text.match(emojiRegex);
  return matches ? matches.length : 0;
};

// Color utilities for avatars
export const getAvatarColor = (name) => {
  const colors = [
    '#f44336', '#e91e63', '#9c27b0', '#673ab7',
    '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
    '#009688', '#4caf50', '#8bc34a', '#cddc39',
    '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

// Export all utilities as default object
export default {
  formatTime,
  formatDate,
  formatRelativeTime,
  truncateMessage,
  getMessagePreview,
  formatDuration,
  getChatDisplayName,
  getChatAvatar,
  getInitials,
  getDeliveryStatusIcon,
  getMessageStatusText,
  getReactionEmoji,
  formatReactionCount,
  formatTypingIndicator,
  highlightSearchTerm,
  searchMessages,
  searchChats,
  getAttachmentIcon,
  formatFileSize,
  isImageFile,
  isVideoFile,
  isAudioFile,
  validateMessage,
  validateChatName,
  sortChatsByActivity,
  sortMessagesByTime,
  formatMemberCount,
  getMemberNames,
  extractUrls,
  replaceUrlsWithLinks,
  containsOnlyEmojis,
  countEmojis,
  getAvatarColor
};