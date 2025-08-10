// Chat UI Overhaul - Core Type Definitions

export type ChatType = 'group' | 'private';
export type MessageType = 'text' | 'image' | 'audio' | 'document' | 'location' | 'contact' | 'system';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type AttachmentType = 'camera' | 'gallery' | 'document' | 'location' | 'contact';
export type MessageAction = 'react' | 'reply' | 'copy' | 'forward' | 'delete_for_me' | 'delete_for_everyone' | 'info' | 'report';

// Core Chat Interface
export interface Chat {
  id: string;
  type: ChatType;
  name: string;
  description?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Group-specific fields
  memberCount?: number;
  members?: ChatMember[];
  isPublic?: boolean;
  
  // Private chat-specific fields
  participantId?: string;
  participantName?: string;
  participantAvatar?: string;
  isOnline?: boolean;
  lastSeen?: Date;
  
  // Common fields
  lastMessage?: {
    id: string;
    content: string;
    type: MessageType;
    senderId: string;
    senderName: string;
    timestamp: Date;
  };
  unreadCount: number;
  isMuted: boolean;
  isArchived: boolean;
  isPinned: boolean;
}

// Chat Member Interface
export interface ChatMember {
  _id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: Date;
  joinedAt?: Date;
  role?: 'admin' | 'member';
}

// Message Interface
export interface Message {
  id: string;
  chatId: string;
  chatType: ChatType;
  senderId: string;
  senderName: string;
  content: string;
  type: MessageType;
  timestamp: Date;
  editedAt?: Date;
  
  // Status tracking
  status: MessageStatus;
  deliveredTo: string[]; // User IDs who received the message
  readBy: ReadStatus[];
  
  // Interactions
  reactions: Reaction[];
  replyTo?: {
    messageId: string;
    content: string;
    senderName: string;
    type: MessageType;
  };
  
  // Attachments
  attachments: Attachment[];
  
  // Moderation
  isDeleted: boolean;
  deletedFor: string[]; // User IDs for whom message is deleted
  isReported: boolean;
  moderationStatus?: 'pending' | 'approved' | 'removed';
}

// Read Status Interface
export interface ReadStatus {
  userId: string;
  readAt: Date;
}

// Reaction Interface
export interface Reaction {
  type: string; // emoji or reaction type
  users: string[]; // User IDs who reacted
  count: number;
  createdAt?: Date;
}

// Attachment Interface
export interface Attachment {
  id: string;
  type: AttachmentType;
  url?: string;
  filename?: string;
  size?: number;
  thumbnail?: string;
  metadata?: {
    duration?: number; // For audio/video
    coordinates?: { lat: number; lng: number }; // For location
    contactInfo?: { name: string; phone?: string; email?: string }; // For contacts
    width?: number; // For images
    height?: number; // For images
  };
}

// Typing Indicator Interface
export interface TypingIndicator {
  userId: string;
  userName: string;
  chatId: string;
  timestamp: number;
}

// Chat Context State Interface
export interface ChatContextState {
  // Chat management
  chats: Chat[];
  selectedChatId: string | null;
  selectedChat: Chat | null;
  
  // Loading states
  isLoading: boolean;
  isLoadingChats: boolean;
  isLoadingMessages: boolean;
  
  // Error handling
  error: string | null;
  
  // Real-time features
  typingIndicators: Record<string, TypingIndicator[]>;
  onlineUsers: string[];
  
  // UI state
  searchQuery: string;
  filteredChats: Chat[];
}

// Message Context State Interface
export interface MessageContextState {
  // Messages for current chat
  messages: Message[];
  
  // Message composition
  currentMessage: string;
  replyingTo: Message | null;
  attachments: Attachment[];
  
  // Message interactions
  selectedMessages: string[];
  showEmojiPicker: boolean;
  
  // Loading states
  isSendingMessage: boolean;
  isLoadingMessages: boolean;
  
  // Error handling
  failedMessages: string[];
  error: string | null;
}

// Chat Actions Interface
export interface ChatActions {
  // Chat management
  loadChats: () => Promise<void>;
  selectChat: (chatId: string) => void;
  createGroupChat: (name: string, description?: string, memberIds?: string[]) => Promise<Chat>;
  createPrivateChat: (participantId: string) => Promise<Chat>;
  updateChatSettings: (chatId: string, settings: Partial<Chat>) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  
  // Search and filtering
  searchChats: (query: string) => void;
  clearSearch: () => void;
  
  // Real-time features
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  
  // Error handling
  clearError: () => void;
}

// Message Actions Interface
export interface MessageActions {
  // Message management
  loadMessages: (chatId: string, options?: { before?: string; after?: string; limit?: number }) => Promise<void>;
  sendMessage: (content: string, type?: MessageType, attachments?: Attachment[]) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string, deleteForEveryone?: boolean) => Promise<void>;
  
  // Message interactions
  reactToMessage: (messageId: string, reactionType: string) => Promise<void>;
  replyToMessage: (message: Message) => void;
  cancelReply: () => void;
  forwardMessage: (messageId: string, chatIds: string[]) => Promise<void>;
  
  // Message composition
  updateCurrentMessage: (content: string) => void;
  addAttachment: (attachment: Attachment) => void;
  removeAttachment: (attachmentId: string) => void;
  clearAttachments: () => void;
  
  // Message selection
  selectMessage: (messageId: string) => void;
  deselectMessage: (messageId: string) => void;
  clearSelection: () => void;
  
  // Typing indicators
  startTyping: () => void;
  stopTyping: () => void;
  
  // Message status
  markMessagesAsRead: (messageIds: string[]) => Promise<void>;
  retryFailedMessage: (messageId: string) => Promise<void>;
  
  // Error handling
  clearError: () => void;
}

// Hook return types
export interface UseChatReturn extends ChatContextState, ChatActions {}
export interface UseMessageReturn extends MessageContextState, MessageActions {}

// Socket event types
export interface SocketEvents {
  // Message events
  'message_received': (data: { chatId: string; message: Message }) => void;
  'message_updated': (data: { messageId: string; updates: Partial<Message> }) => void;
  'message_deleted': (data: { messageId: string; deletedFor: string[] }) => void;
  'message_read': (data: { messageId: string; readBy: ReadStatus }) => void;
  'reaction_updated': (data: { messageId: string; reactions: Reaction[] }) => void;
  
  // Typing events
  'user_typing': (data: { chatId: string; userId: string; userName: string }) => void;
  'user_stopped_typing': (data: { chatId: string; userId: string }) => void;
  
  // Chat events
  'chat_updated': (data: { chatId: string; updates: Partial<Chat> }) => void;
  'user_joined': (data: { chatId: string; user: ChatMember }) => void;
  'user_left': (data: { chatId: string; userId: string }) => void;
  
  // Presence events
  'user_online': (data: { userId: string }) => void;
  'user_offline': (data: { userId: string }) => void;
}