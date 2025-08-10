/**
 * Chat UI Overhaul - Constants
 * Centralized constants for chat functionality
 */

// Message Types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  AUDIO: 'audio',
  DOCUMENT: 'document',
  LOCATION: 'location',
  CONTACT: 'contact',
  SYSTEM: 'system'
};

// Message Status
export const MESSAGE_STATUS = {
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed'
};

// Chat Types
export const CHAT_TYPES = {
  GROUP: 'group',
  PRIVATE: 'private'
};

// Attachment Types
export const ATTACHMENT_TYPES = {
  CAMERA: 'camera',
  GALLERY: 'gallery',
  DOCUMENT: 'document',
  LOCATION: 'location',
  CONTACT: 'contact'
};

// Message Actions
export const MESSAGE_ACTIONS = {
  REACT: 'react',
  REPLY: 'reply',
  COPY: 'copy',
  FORWARD: 'forward',
  DELETE_FOR_ME: 'delete_for_me',
  DELETE_FOR_EVERYONE: 'delete_for_everyone',
  INFO: 'info',
  REPORT: 'report',
  STAR: 'star',
  UNSTAR: 'unstar',
  PIN: 'pin',
  UNPIN: 'unpin'
};

// Reaction Types
export const REACTION_TYPES = {
  LIKE: 'like',
  LOVE: 'love',
  LAUGH: 'laugh',
  WOW: 'wow',
  SAD: 'sad',
  ANGRY: 'angry'
};

// Common Reactions (emoji mapping)
export const COMMON_REACTIONS = [
  { type: REACTION_TYPES.LIKE, emoji: '👍', label: 'Like' },
  { type: REACTION_TYPES.LOVE, emoji: '❤️', label: 'Love' },
  { type: REACTION_TYPES.LAUGH, emoji: '😂', label: 'Laugh' },
  { type: REACTION_TYPES.WOW, emoji: '😮', label: 'Wow' },
  { type: REACTION_TYPES.SAD, emoji: '😢', label: 'Sad' },
  { type: REACTION_TYPES.ANGRY, emoji: '😡', label: 'Angry' }
];

// Socket Events
export const SOCKET_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  RECONNECT: 'reconnect',
  
  // Chat events
  JOIN_CHAT: 'join_chat',
  LEAVE_CHAT: 'leave_chat',
  JOIN_GROUP: 'join_group',
  LEAVE_GROUP: 'leave_group',
  
  // Message events
  SEND_MESSAGE: 'send_message',
  MESSAGE_RECEIVED: 'message_received',
  MESSAGE_UPDATED: 'message_updated',
  MESSAGE_DELETED: 'message_deleted',
  MESSAGE_READ: 'message_read',
  
  // Typing events
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',
  USER_TYPING: 'user_typing',
  USER_STOPPED_TYPING: 'user_stopped_typing',
  
  // Reaction events
  REACT_TO_MESSAGE: 'react_to_message',
  REACTION_UPDATED: 'reaction_updated',
  
  // Star/Pin events
  STAR_MESSAGE: 'star_message',
  UNSTAR_MESSAGE: 'unstar_message',
  PIN_MESSAGE: 'pin_message',
  UNPIN_MESSAGE: 'unpin_message',
  MESSAGE_STARRED: 'message_starred',
  MESSAGE_UNSTARRED: 'message_unstarred',
  MESSAGE_PINNED: 'message_pinned',
  MESSAGE_UNPINNED: 'message_unpinned',
  
  // Presence events
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
  
  // Chat management events
  CHAT_UPDATED: 'chat_updated',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left'
};

// UI Constants
export const UI_CONSTANTS = {
  // Message limits
  MAX_MESSAGE_LENGTH: 4000,
  MAX_ATTACHMENTS: 10,
  MESSAGE_PREVIEW_LENGTH: 50,
  
  // Chat limits
  MAX_CHAT_NAME_LENGTH: 100,
  MIN_CHAT_NAME_LENGTH: 2,
  MAX_CHAT_DESCRIPTION_LENGTH: 500,
  
  // Pagination
  MESSAGES_PER_PAGE: 50,
  CHATS_PER_PAGE: 20,
  
  // Timeouts
  TYPING_TIMEOUT: 2000, // 2 seconds
  TYPING_INDICATOR_TIMEOUT: 3000, // 3 seconds
  MESSAGE_RETRY_TIMEOUT: 5000, // 5 seconds
  
  // File size limits (in bytes)
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_AUDIO_SIZE: 25 * 1024 * 1024, // 25MB
  
  // Cache settings
  MEMBER_CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  MESSAGE_CACHE_SIZE: 1000,
  
  // Animation durations
  ANIMATION_DURATION_SHORT: 200,
  ANIMATION_DURATION_MEDIUM: 300,
  ANIMATION_DURATION_LONG: 500
};

// File Type Constants
export const FILE_TYPES = {
  IMAGES: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
  VIDEOS: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'],
  AUDIO: ['.mp3', '.wav', '.ogg', '.m4a', '.aac'],
  DOCUMENTS: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.xls', '.xlsx', '.ppt', '.pptx']
};

// MIME Type Constants
export const MIME_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'],
  VIDEOS: ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-ms-wmv', 'video/webm'],
  AUDIO: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac'],
  DOCUMENTS: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/rtf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'Resource not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  FILE_TOO_LARGE: 'File is too large. Please choose a smaller file.',
  UNSUPPORTED_FILE_TYPE: 'File type not supported.',
  MESSAGE_TOO_LONG: 'Message is too long.',
  CHAT_NAME_REQUIRED: 'Chat name is required.',
  CHAT_NAME_TOO_SHORT: 'Chat name is too short.',
  CHAT_NAME_TOO_LONG: 'Chat name is too long.',
  NO_INTERNET: 'No internet connection.',
  SEND_MESSAGE_FAILED: 'Failed to send message.',
  LOAD_MESSAGES_FAILED: 'Failed to load messages.',
  LOAD_CHATS_FAILED: 'Failed to load chats.',
  CREATE_CHAT_FAILED: 'Failed to create chat.',
  DELETE_CHAT_FAILED: 'Failed to delete chat.',
  REACT_FAILED: 'Failed to add reaction.',
  UPLOAD_FAILED: 'Failed to upload file.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  MESSAGE_SENT: 'Message sent successfully.',
  CHAT_CREATED: 'Chat created successfully.',
  CHAT_UPDATED: 'Chat updated successfully.',
  CHAT_DELETED: 'Chat deleted successfully.',
  FILE_UPLOADED: 'File uploaded successfully.',
  REACTION_ADDED: 'Reaction added.',
  MESSAGE_COPIED: 'Message copied to clipboard.',
  MESSAGE_FORWARDED: 'Message forwarded successfully.',
  MESSAGE_STARRED: 'Message starred.',
  MESSAGE_UNSTARRED: 'Message unstarred.',
  MESSAGE_PINNED: 'Message pinned.',
  MESSAGE_UNPINNED: 'Message unpinned.'
};

// Theme Constants
export const THEME_COLORS = {
  LIGHT: {
    PRIMARY: '#1976d2',
    SECONDARY: '#dc004e',
    BACKGROUND: '#f5f5f5',
    SURFACE: '#ffffff',
    TEXT: '#000000',
    TEXT_SECONDARY: '#666666',
    BORDER: '#e0e0e0',
    MESSAGE_SENT: '#dcf8c6',
    MESSAGE_RECEIVED: '#ffffff',
    ONLINE_INDICATOR: '#4caf50',
    TYPING_INDICATOR: '#2196f3'
  },
  DARK: {
    PRIMARY: '#90caf9',
    SECONDARY: '#f48fb1',
    BACKGROUND: '#121212',
    SURFACE: '#1e1e1e',
    TEXT: '#ffffff',
    TEXT_SECONDARY: '#aaaaaa',
    BORDER: '#333333',
    MESSAGE_SENT: '#056162',
    MESSAGE_RECEIVED: '#1e1e1e',
    ONLINE_INDICATOR: '#4caf50',
    TYPING_INDICATOR: '#90caf9'
  }
};

// Keyboard Shortcuts
export const KEYBOARD_SHORTCUTS = {
  SEND_MESSAGE: 'Enter',
  NEW_LINE: 'Shift+Enter',
  SEARCH: 'Ctrl+F',
  ESCAPE: 'Escape',
  REPLY: 'Ctrl+R',
  FORWARD: 'Ctrl+Shift+F',
  DELETE: 'Delete',
  COPY: 'Ctrl+C',
  SELECT_ALL: 'Ctrl+A'
};

// Local Storage Keys
export const STORAGE_KEYS = {
  CHAT_SETTINGS: 'chat_settings',
  DRAFT_MESSAGES: 'draft_messages',
  SEARCH_HISTORY: 'search_history',
  THEME_PREFERENCE: 'theme_preference',
  NOTIFICATION_SETTINGS: 'notification_settings',
  PRIVACY_SETTINGS: 'privacy_settings',
  LAST_ACTIVE_CHAT: 'last_active_chat',
  MEMBER_CACHE: 'member_cache',
  EMOJI_RECENT: 'emoji_recent'
};

// API Endpoints
export const API_ENDPOINTS = {
  // Chat endpoints
  CHATS: '/api/chats',
  GROUP_CHATS: '/api/chat/groups',
  PRIVATE_CHATS: '/api/chat/private',
  
  // Message endpoints
  MESSAGES: '/api/messages',
  GROUP_MESSAGES: (groupId) => `/api/chat/groups/${groupId}/messages`,
  PRIVATE_MESSAGES: (chatId) => `/api/chat/private/${chatId}/messages`,
  MESSAGE_REACT: (messageId) => `/api/messages/${messageId}/react`,
  MESSAGE_READ: (chatId) => `/api/chats/${chatId}/read`,
  MESSAGE_STAR: (messageId) => `/api/messages/${messageId}/star`,
  MESSAGE_PIN: (messageId) => `/api/messages/${messageId}/pin`,
  STARRED_MESSAGES: (chatId) => `/api/chats/${chatId}/starred`,
  PINNED_MESSAGES: (chatId) => `/api/chats/${chatId}/pinned`,
  
  // Attachment endpoints
  ATTACHMENTS: '/api/attachments',
  UPLOAD: '/api/upload',
  
  // User endpoints
  USERS: '/api/users',
  NEIGHBOURS: '/api/users/neighbours',
  
  // Group management
  GROUP_MEMBERS: (groupId) => `/api/chat/groups/${groupId}/members`,
  GROUP_JOIN: (groupId) => `/api/chat/groups/${groupId}/join`,
  GROUP_LEAVE: (groupId) => `/api/chat/groups/${groupId}/leave`
};

// Default Values
export const DEFAULT_VALUES = {
  CHAT_NAME: 'New Chat',
  GROUP_DESCRIPTION: '',
  MESSAGE_PLACEHOLDER: 'Type a message...',
  SEARCH_PLACEHOLDER: 'Search chats...',
  NO_MESSAGES: 'No messages yet',
  NO_CHATS: 'No chats available',
  LOADING_MESSAGES: 'Loading messages...',
  LOADING_CHATS: 'Loading chats...',
  TYPING_INDICATOR: 'typing...',
  ONLINE_STATUS: 'online',
  OFFLINE_STATUS: 'offline',
  LAST_SEEN: 'last seen',
  MEMBER_COUNT: (count) => count === 1 ? '1 member' : `${count} members`
};

// Feature Flags (for gradual rollout)
export const FEATURE_FLAGS = {
  REACTIONS: true,
  REPLIES: true,
  FORWARDING: true,
  MESSAGE_EDITING: true,
  MESSAGE_DELETION: true,
  TYPING_INDICATORS: true,
  READ_RECEIPTS: true,
  ONLINE_STATUS: true,
  VOICE_MESSAGES: false, // Not implemented yet
  VIDEO_CALLS: false, // Not implemented yet
  SCREEN_SHARING: false, // Not implemented yet
  MESSAGE_ENCRYPTION: false, // Not implemented yet
  AUTO_DELETE: false, // Not implemented yet
  MESSAGE_SEARCH: true,
  CHAT_SEARCH: true,
  EMOJI_PICKER: true,
  ATTACHMENT_PREVIEW: true,
  LOCATION_SHARING: false, // Not implemented yet
  CONTACT_SHARING: false // Not implemented yet
};

export default {
  MESSAGE_TYPES,
  MESSAGE_STATUS,
  CHAT_TYPES,
  ATTACHMENT_TYPES,
  MESSAGE_ACTIONS,
  REACTION_TYPES,
  COMMON_REACTIONS,
  SOCKET_EVENTS,
  UI_CONSTANTS,
  FILE_TYPES,
  MIME_TYPES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  THEME_COLORS,
  KEYBOARD_SHORTCUTS,
  STORAGE_KEYS,
  API_ENDPOINTS,
  DEFAULT_VALUES,
  FEATURE_FLAGS
};