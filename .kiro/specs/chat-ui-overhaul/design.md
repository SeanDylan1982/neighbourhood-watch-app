# Design Document

## Overview

This design document outlines the technical approach for implementing a comprehensive chat UI/UX overhaul that unifies the group and private messaging experience with WhatsApp-like design patterns. The solution focuses on creating a consistent, modern messaging interface that maintains visual differentiation through subtle cues rather than structural changes.

## Architecture

### System Architecture Overview

The chat UI overhaul requires a full-stack approach with frontend, backend, database, and real-time communication components:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
├─────────────────────────────────────────────────────────────┤
│  Chat Components │ Real-time Socket │ State Management     │
│  - ChatList      │ - Socket.io      │ - React Context     │
│  - ChatWindow    │ - Event Handlers │ - Local Storage     │
│  - MessageBubble │ - Typing Events  │ - Cache Layer       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 API Gateway (Express.js)                    │
├─────────────────────────────────────────────────────────────┤
│  REST Endpoints  │ Socket.io Server │ Middleware          │
│  - /api/chats    │ - Message Events │ - Authentication    │
│  - /api/messages │ - Typing Events  │ - Rate Limiting     │
│  - /api/uploads  │ - Status Updates │ - File Upload       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database (MongoDB)                        │
├─────────────────────────────────────────────────────────────┤
│  Collections     │ Indexes          │ Aggregations        │
│  - chats         │ - chatId_userId  │ - Unread Counts     │
│  - messages      │ - timestamp      │ - Last Messages     │
│  - users         │ - text_search    │ - Member Lists      │
│  - attachments   │ - status_index   │ - Message Stats     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 External Services                           │
├─────────────────────────────────────────────────────────────┤
│  File Storage    │ Push Notifications│ Content Moderation │
│  - AWS S3/Local  │ - Web Push API    │ - Text Analysis    │
│  - Image Resize  │ - Email Alerts    │ - Spam Detection   │
│  - CDN Delivery  │ - Mobile Push     │ - Auto-moderation  │
└─────────────────────────────────────────────────────────────┘
```

### Component Structure

The chat system will be restructured with a unified component architecture:

```
client/src/
├── components/
│   ├── Chat/
│   │   ├── ChatList/
│   │   │   ├── ChatList.js              # Unified chat list container
│   │   │   ├── ChatListItem.js          # Individual chat row component
│   │   │   ├── ChatAvatar.js            # Smart avatar component (group/private)
│   │   │   ├── MessagePreview.js        # Last message preview component
│   │   │   └── ChatContextMenu.js       # Right-click/swipe menu
│   │   ├── ChatWindow/
│   │   │   ├── ChatWindow.js            # Unified chat window container
│   │   │   ├── ChatHeader.js            # Chat title and info bar
│   │   │   ├── MessageList.js           # Scrollable message container
│   │   │   ├── MessageBubble.js         # Individual message bubble
│   │   │   ├── MessageInput.js          # Input area with attachments
│   │   │   ├── TypingIndicator.js       # Real-time typing display
│   │   │   └── ChatBackground.js        # WhatsApp-style wallpaper
│   │   ├── MessageInteractions/
│   │   │   ├── MessageMenu.js           # Long-press/right-click menu
│   │   │   ├── ReactionPicker.js        # Emoji reaction selector
│   │   │   ├── ReplyPreview.js          # Quoted message display
│   │   │   └── MessageReactions.js      # Reaction display component
│   │   ├── Attachments/
│   │   │   ├── AttachmentPicker.js      # Attachment type selector
│   │   │   ├── MediaUpload.js           # Image/video upload handler
│   │   │   ├── DocumentUpload.js        # File upload handler
│   │   │   ├── LocationPicker.js        # Geolocation sharing
│   │   │   └── ContactPicker.js         # Contact sharing
│   │   └── Common/
│   │       ├── DeliveryStatus.js        # Message status indicators
│   │       ├── Timestamp.js             # Time display component
│   │       └── SearchBar.js             # In-chat search
├── pages/
│   └── Chat/
│       ├── UnifiedChat.js               # Main chat page with tabs
│       ├── GroupChatTab.js              # Group messages tab
│       └── PrivateChatTab.js            # Private messages tab
├── hooks/
│   ├── useChat.js                       # Chat state management
│   ├── useMessageInteractions.js        # Reactions and replies
│   ├── useAttachments.js                # File upload handling
│   ├── useTypingIndicator.js            # Typing state management
│   └── useMessageStatus.js              # Delivery/read status
└── contexts/
    ├── ChatContext.js                   # Global chat state
    └── MessageContext.js                # Message-specific state
```

## Components and Interfaces

### 1. Unified Chat List System

**Component: `ChatList` and `ChatListItem`**

```javascript
interface ChatListProps {
  chatType: 'group' | 'private';
  chats: Chat[];
  selectedChatId?: string;
  onChatSelect: (chatId: string) => void;
  onChatAction: (chatId: string, action: string) => void;
}

interface Chat {
  id: string;
  type: 'group' | 'private';
  name: string;
  avatar?: string; // For private chats
  lastMessage: {
    content: string;
    type: 'text' | 'image' | 'audio' | 'document';
    timestamp: Date;
    senderId: string;
    senderName: string;
  };
  unreadCount: number;
  deliveryStatus: 'sent' | 'delivered' | 'read';
  isOnline?: boolean; // For private chats
  memberCount?: number; // For group chats
}
```

**Design Decisions:**
- Single component handles both group and private chat lists
- Visual differentiation through `ChatAvatar` component logic
- Consistent row structure with flexible content
- Context menu integration for all chat actions

### 2. Smart Avatar System

**Component: `ChatAvatar`**

```javascript
interface ChatAvatarProps {
  chatType: 'group' | 'private';
  chatData: {
    avatar?: string;
    name: string;
    isOnline?: boolean;
    memberCount?: number;
  };
  size?: 'small' | 'medium' | 'large';
  showOnlineStatus?: boolean;
}
```

**Design Decisions:**
- Group chats: Consistent group icon (people/persons icon)
- Private chats: User's profile image with online status indicator
- Fallback to initials for missing profile images
- Responsive sizing for different contexts

### 3. Message Preview System

**Component: `MessagePreview`**

```javascript
interface MessagePreviewProps {
  message: {
    content: string;
    type: 'text' | 'image' | 'audio' | 'document';
    senderName?: string;
    timestamp: Date;
  };
  chatType: 'group' | 'private';
  maxLength?: number;
}
```

**Design Decisions:**
- Text messages: Truncated preview with ellipsis
- Media messages: Icon + descriptive label
- Group chats: Include sender name prefix
- Private chats: Direct message preview

### 4. Unified Chat Window

**Component: `ChatWindow`**

```javascript
interface ChatWindowProps {
  chat: Chat;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string, attachments?: Attachment[]) => void;
  onReaction: (messageId: string, reaction: string) => void;
  onReply: (messageId: string) => void;
  onMessageAction: (messageId: string, action: string) => void;
}

interface Message {
  id: string;
  content: string;
  type: 'text' | 'image' | 'audio' | 'document' | 'location' | 'contact';
  senderId: string;
  senderName: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  reactions: Reaction[];
  replyTo?: {
    messageId: string;
    content: string;
    senderName: string;
  };
  attachments?: Attachment[];
}
```

**Design Decisions:**
- WhatsApp-style background with subtle pattern
- Message bubbles: Green for sent, light gray for received
- Consistent spacing and typography
- Real-time status indicators

### 5. Message Interaction System

**Component: `MessageMenu` and `ReactionPicker`**

```javascript
interface MessageMenuProps {
  messageId: string;
  chatType: 'group' | 'private';
  isOwnMessage: boolean;
  onAction: (action: MessageAction) => void;
}

type MessageAction = 
  | 'react' 
  | 'reply' 
  | 'copy' 
  | 'forward' 
  | 'delete_for_me' 
  | 'delete_for_everyone' 
  | 'info' 
  | 'report';

interface ReactionPickerProps {
  messageId: string;
  existingReactions: Reaction[];
  onReact: (reaction: string) => void;
}
```

**Design Decisions:**
- Context-sensitive menu options based on chat type
- Group chats: Include "Report Message" and "Info" (seen-by list)
- Private chats: Include "Delete for Everyone" option
- Consistent reaction emoji set across all chats

### 6. Attachment System

**Component: `AttachmentPicker`**

```javascript
interface AttachmentPickerProps {
  onAttachmentSelect: (type: AttachmentType) => void;
  availableTypes: AttachmentType[];
}

type AttachmentType = 'camera' | 'gallery' | 'document' | 'location' | 'contact';

interface Attachment {
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
  };
}
```

**Design Decisions:**
- Unified attachment picker for all chat types
- Progressive upload with progress indicators
- Thumbnail generation for images and videos
- Metadata extraction for different file types

## Backend API Design

### REST API Endpoints

#### Chat Management Endpoints

```javascript
// Get all chats for user (unified endpoint)
GET /api/chats
Query params: type=group|private, limit=50, offset=0
Response: {
  chats: Chat[],
  totalCount: number,
  hasMore: boolean
}

// Get specific chat details
GET /api/chats/:chatId
Response: Chat

// Create new group chat
POST /api/chats/groups
Body: {
  name: string,
  description?: string,
  isPublic: boolean,
  memberIds: string[]
}

// Create/get private chat
POST /api/chats/private
Body: { participantId: string }
Response: Chat

// Update chat settings
PATCH /api/chats/:chatId
Body: {
  name?: string,
  description?: string,
  isMuted?: boolean,
  isArchived?: boolean,
  isPinned?: boolean
}

// Leave/delete chat
DELETE /api/chats/:chatId
```

#### Message Endpoints

```javascript
// Get messages for chat
GET /api/chats/:chatId/messages
Query params: limit=50, before=messageId, after=messageId
Response: {
  messages: Message[],
  hasMore: boolean,
  unreadCount: number
}

// Send new message
POST /api/chats/:chatId/messages
Body: {
  content: string,
  type: 'text' | 'image' | 'audio' | 'document' | 'location' | 'contact',
  replyToId?: string,
  attachments?: string[] // attachment IDs
}

// Update message (edit/delete)
PATCH /api/messages/:messageId
Body: {
  content?: string,
  isDeleted?: boolean,
  deletedFor?: string[] // user IDs
}

// Add/remove reaction
POST /api/messages/:messageId/reactions
Body: {
  type: string,
  action: 'add' | 'remove'
}

// Mark messages as read
POST /api/chats/:chatId/read
Body: {
  messageIds: string[],
  readAt: Date
}

// Search messages
GET /api/chats/:chatId/search
Query params: q=searchTerm, limit=20, offset=0
```

#### Attachment Endpoints

```javascript
// Upload attachment
POST /api/attachments
Content-Type: multipart/form-data
Body: file, metadata
Response: {
  id: string,
  url: string,
  thumbnail?: string,
  metadata: AttachmentMetadata
}

// Get attachment
GET /api/attachments/:attachmentId
Response: File stream or redirect to CDN

// Delete attachment
DELETE /api/attachments/:attachmentId
```

#### Real-time Socket Events

```javascript
// Client to Server Events
'join_chat' -> { chatId, chatType }
'leave_chat' -> { chatId }
'send_message' -> { chatId, content, type, replyToId?, attachments? }
'typing_start' -> { chatId }
'typing_stop' -> { chatId }
'message_read' -> { chatId, messageIds }
'react_to_message' -> { messageId, reactionType, action }

// Server to Client Events
'message_received' -> { chatId, message }
'message_updated' -> { messageId, updates }
'message_deleted' -> { messageId, deletedFor }
'user_typing' -> { chatId, userId, userName }
'user_stopped_typing' -> { chatId, userId }
'message_read' -> { messageId, readBy }
'reaction_updated' -> { messageId, reactions }
'chat_updated' -> { chatId, updates }
'user_joined' -> { chatId, user }
'user_left' -> { chatId, userId }
```

## Database Schema Design

### Enhanced Chat Collection

```javascript
// chats collection
{
  _id: ObjectId,
  type: 'group' | 'private',
  name: String, // Group name or generated name for private
  description: String, // Group description
  avatar: String, // Group avatar URL
  
  // Group-specific fields
  isPublic: Boolean,
  memberIds: [ObjectId], // References to users
  adminIds: [ObjectId], // Group administrators
  memberCount: Number, // Denormalized for performance
  
  // Private chat-specific fields
  participantIds: [ObjectId], // Always 2 users for private chats
  
  // Common metadata
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date,
  
  // Chat settings per user
  userSettings: [{
    userId: ObjectId,
    isMuted: Boolean,
    isArchived: Boolean,
    isPinned: Boolean,
    lastReadAt: Date,
    joinedAt: Date,
    leftAt: Date
  }],
  
  // Performance optimization fields
  lastMessage: {
    messageId: ObjectId,
    content: String,
    senderId: ObjectId,
    senderName: String,
    timestamp: Date,
    type: String
  },
  lastActivity: Date,
  
  // Moderation
  isActive: Boolean,
  moderationStatus: 'active' | 'restricted' | 'suspended',
  moderatedBy: ObjectId,
  moderatedAt: Date
}

// Indexes
db.chats.createIndex({ "participantIds": 1 }) // For private chats
db.chats.createIndex({ "memberIds": 1, "lastActivity": -1 }) // For user's chats
db.chats.createIndex({ "type": 1, "isPublic": 1 }) // For public groups
db.chats.createIndex({ "userSettings.userId": 1, "userSettings.isArchived": 1 })
```

### Enhanced Message Collection

```javascript
// messages collection
{
  _id: ObjectId,
  chatId: ObjectId,
  chatType: 'group' | 'private',
  
  // Message content
  content: String,
  type: 'text' | 'image' | 'audio' | 'document' | 'location' | 'contact' | 'system',
  
  // Sender information
  senderId: ObjectId,
  senderName: String, // Denormalized for performance
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date,
  editedAt: Date,
  
  // Message relationships
  replyTo: {
    messageId: ObjectId,
    content: String, // Excerpt for display
    senderName: String,
    type: String
  },
  
  // Attachments
  attachments: [{
    id: ObjectId,
    type: 'image' | 'video' | 'audio' | 'document',
    url: String,
    filename: String,
    size: Number,
    thumbnail: String,
    metadata: Mixed // Type-specific metadata
  }],
  
  // Message status and delivery
  status: 'sending' | 'sent' | 'delivered' | 'failed',
  deliveredTo: [{
    userId: ObjectId,
    deliveredAt: Date
  }],
  readBy: [{
    userId: ObjectId,
    readAt: Date
  }],
  
  // Interactions
  reactions: [{
    type: String, // emoji or reaction identifier
    users: [ObjectId],
    count: Number,
    createdAt: Date
  }],
  
  // Message state
  isEdited: Boolean,
  isDeleted: Boolean,
  deletedFor: [ObjectId], // Users for whom message is deleted
  
  // Moderation
  isReported: Boolean,
  reportedBy: [ObjectId],
  moderationStatus: 'active' | 'pending' | 'removed',
  moderatedBy: ObjectId,
  moderatedAt: Date,
  moderationReason: String
}

// Indexes
db.messages.createIndex({ "chatId": 1, "createdAt": -1 }) // Chat message history
db.messages.createIndex({ "senderId": 1, "createdAt": -1 }) // User's messages
db.messages.createIndex({ "content": "text" }) // Full-text search
db.messages.createIndex({ "chatId": 1, "readBy.userId": 1 }) // Unread messages
db.messages.createIndex({ "replyTo.messageId": 1 }) // Message threads
db.messages.createIndex({ "moderationStatus": 1, "isReported": 1 }) // Moderation queue
```

### Attachment Collection

```javascript
// attachments collection
{
  _id: ObjectId,
  originalName: String,
  filename: String, // Stored filename
  mimetype: String,
  size: Number,
  
  // Storage information
  storageType: 'local' | 's3' | 'cdn',
  storagePath: String,
  url: String,
  thumbnailUrl: String,
  
  // Upload metadata
  uploadedBy: ObjectId,
  uploadedAt: Date,
  
  // Processing status
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed',
  
  // Type-specific metadata
  metadata: {
    // For images
    width: Number,
    height: Number,
    format: String,
    
    // For videos/audio
    duration: Number,
    bitrate: Number,
    
    // For documents
    pageCount: Number,
    
    // For location
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    address: String,
    
    // For contacts
    contactInfo: {
      name: String,
      phone: String,
      email: String
    }
  },
  
  // Security and moderation
  scanStatus: 'pending' | 'clean' | 'infected' | 'suspicious',
  scanResults: Mixed,
  
  // Usage tracking
  usedInMessages: [ObjectId],
  downloadCount: Number,
  
  // Cleanup
  expiresAt: Date, // For temporary files
  isDeleted: Boolean
}

// Indexes
db.attachments.createIndex({ "uploadedBy": 1, "uploadedAt": -1 })
db.attachments.createIndex({ "scanStatus": 1, "processingStatus": 1 })
db.attachments.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 })
```

## Data Models

### Enhanced Chat Model

```javascript
interface Chat {
  id: string;
  type: 'group' | 'private';
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
```

### Enhanced Message Model

```javascript
interface Message {
  id: string;
  chatId: string;
  chatType: 'group' | 'private';
  senderId: string;
  senderName: string;
  content: string;
  type: MessageType;
  timestamp: Date;
  editedAt?: Date;
  
  // Status tracking
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
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

interface ReadStatus {
  userId: string;
  readAt: Date;
}

interface Reaction {
  type: string; // emoji or reaction type
  users: string[]; // User IDs who reacted
  count: number;
}
```

### User Preference Model

```javascript
interface ChatPreferences {
  userId: string;
  
  // Appearance
  theme: 'light' | 'dark' | 'auto';
  wallpaper: string;
  fontSize: 'small' | 'medium' | 'large';
  
  // Notifications
  muteAll: boolean;
  mutedChats: string[];
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  
  // Privacy
  readReceipts: boolean;
  lastSeen: boolean;
  onlineStatus: boolean;
  
  // Auto-delete settings
  autoDeleteEnabled: boolean;
  autoDeletePeriod: number; // in days
}
```

## Backend Service Layer

### Chat Service

```javascript
class ChatService {
  // Get user's chats with unified structure
  async getUserChats(userId, type = null, options = {}) {
    const pipeline = [
      {
        $match: {
          memberIds: new ObjectId(userId),
          ...(type && { type }),
          'userSettings.userId': new ObjectId(userId),
          'userSettings.isArchived': { $ne: true }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'participantIds',
          foreignField: '_id',
          as: 'participants'
        }
      },
      {
        $addFields: {
          // Calculate unread count
          unreadCount: {
            $size: {
              $filter: {
                input: '$messages',
                cond: {
                  $and: [
                    { $gt: ['$$this.createdAt', '$userSettings.lastReadAt'] },
                    { $ne: ['$$this.senderId', new ObjectId(userId)] }
                  ]
                }
              }
            }
          },
          // Format for unified display
          displayName: {
            $cond: {
              if: { $eq: ['$type', 'group'] },
              then: '$name',
              else: {
                $arrayElemAt: [
                  {
                    $map: {
                      input: {
                        $filter: {
                          input: '$participants',
                          cond: { $ne: ['$$this._id', new ObjectId(userId)] }
                        }
                      },
                      in: { $concat: ['$$this.firstName', ' ', '$$this.lastName'] }
                    }
                  },
                  0
                ]
              }
            }
          }
        }
      },
      { $sort: { lastActivity: -1 } },
      { $skip: options.offset || 0 },
      { $limit: options.limit || 50 }
    ];
    
    return await Chat.aggregate(pipeline);
  }
  
  // Create or get private chat
  async getOrCreatePrivateChat(userId1, userId2) {
    const existingChat = await Chat.findOne({
      type: 'private',
      participantIds: { $all: [userId1, userId2] }
    });
    
    if (existingChat) {
      return existingChat;
    }
    
    // Create new private chat
    const newChat = new Chat({
      type: 'private',
      participantIds: [userId1, userId2],
      memberIds: [userId1, userId2],
      name: `Private chat`, // Will be overridden in display
      createdBy: userId1,
      userSettings: [
        { userId: userId1, joinedAt: new Date() },
        { userId: userId2, joinedAt: new Date() }
      ]
    });
    
    return await newChat.save();
  }
  
  // Update chat settings for user
  async updateUserChatSettings(chatId, userId, settings) {
    return await Chat.updateOne(
      { _id: chatId, 'userSettings.userId': userId },
      { $set: { 'userSettings.$': { ...settings, userId } } }
    );
  }
}
```

### Message Service

```javascript
class MessageService {
  // Send message with full processing
  async sendMessage(chatId, senderId, messageData) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Create message
      const message = new Message({
        chatId,
        senderId,
        senderName: messageData.senderName,
        content: messageData.content,
        type: messageData.type,
        replyTo: messageData.replyTo,
        attachments: messageData.attachments
      });
      
      await message.save({ session });
      
      // Update chat's last message
      await Chat.updateOne(
        { _id: chatId },
        {
          $set: {
            lastMessage: {
              messageId: message._id,
              content: message.content,
              senderId: message.senderId,
              senderName: message.senderName,
              timestamp: message.createdAt,
              type: message.type
            },
            lastActivity: new Date()
          }
        },
        { session }
      );
      
      // Process attachments
      if (messageData.attachments?.length > 0) {
        await this.processMessageAttachments(message._id, messageData.attachments, session);
      }
      
      // Content moderation
      await this.moderateMessage(message._id, session);
      
      await session.commitTransaction();
      
      // Emit real-time event
      this.socketService.emitToChat(chatId, 'message_received', {
        chatId,
        message: await this.formatMessageForClient(message)
      });
      
      // Send push notifications
      await this.notificationService.sendMessageNotification(chatId, message);
      
      return message;
      
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  // Get messages with pagination and read status
  async getMessages(chatId, userId, options = {}) {
    const pipeline = [
      {
        $match: {
          chatId: new ObjectId(chatId),
          isDeleted: { $ne: true },
          deletedFor: { $ne: new ObjectId(userId) }
        }
      },
      {
        $lookup: {
          from: 'attachments',
          localField: 'attachments.id',
          foreignField: '_id',
          as: 'attachmentDetails'
        }
      },
      {
        $addFields: {
          // Check if user has read this message
          isRead: {
            $in: [new ObjectId(userId), '$readBy.userId']
          },
          // Format delivery status
          deliveryStatus: {
            $cond: {
              if: { $eq: ['$senderId', new ObjectId(userId)] },
              then: {
                $cond: {
                  if: { $gt: [{ $size: '$readBy' }, 0] },
                  then: 'read',
                  else: {
                    $cond: {
                      if: { $gt: [{ $size: '$deliveredTo' }, 0] },
                      then: 'delivered',
                      else: 'sent'
                    }
                  }
                }
              },
              else: null
            }
          }
        }
      },
      { $sort: { createdAt: options.before ? -1 : 1 } },
      ...(options.before ? [{ $match: { createdAt: { $lt: new Date(options.before) } } }] : []),
      ...(options.after ? [{ $match: { createdAt: { $gt: new Date(options.after) } } }] : []),
      { $limit: options.limit || 50 }
    ];
    
    const messages = await Message.aggregate(pipeline);
    
    // Mark messages as delivered for this user
    await this.markMessagesAsDelivered(chatId, userId, messages.map(m => m._id));
    
    return messages;
  }
  
  // Mark messages as read
  async markMessagesAsRead(chatId, userId, messageIds) {
    const result = await Message.updateMany(
      {
        _id: { $in: messageIds },
        chatId,
        senderId: { $ne: userId },
        'readBy.userId': { $ne: userId }
      },
      {
        $push: {
          readBy: {
            userId,
            readAt: new Date()
          }
        }
      }
    );
    
    // Emit read receipts
    this.socketService.emitToChat(chatId, 'messages_read', {
      messageIds,
      userId,
      readAt: new Date()
    });
    
    return result;
  }
  
  // Add reaction to message
  async addReaction(messageId, userId, reactionType) {
    const message = await Message.findById(messageId);
    if (!message) throw new Error('Message not found');
    
    const existingReaction = message.reactions.find(r => r.type === reactionType);
    
    if (existingReaction) {
      if (existingReaction.users.includes(userId)) {
        // Remove reaction
        existingReaction.users = existingReaction.users.filter(id => !id.equals(userId));
        existingReaction.count = Math.max(0, existingReaction.count - 1);
        
        if (existingReaction.count === 0) {
          message.reactions = message.reactions.filter(r => r.type !== reactionType);
        }
      } else {
        // Add reaction
        existingReaction.users.push(userId);
        existingReaction.count += 1;
      }
    } else {
      // Create new reaction
      message.reactions.push({
        type: reactionType,
        users: [userId],
        count: 1,
        createdAt: new Date()
      });
    }
    
    await message.save();
    
    // Emit reaction update
    this.socketService.emitToChat(message.chatId, 'reaction_updated', {
      messageId,
      reactions: message.reactions
    });
    
    return message.reactions;
  }
}
```

### Attachment Service

```javascript
class AttachmentService {
  // Process file upload
  async uploadAttachment(file, userId, metadata = {}) {
    // Validate file
    await this.validateFile(file);
    
    // Generate unique filename
    const filename = this.generateFilename(file.originalname);
    
    // Create attachment record
    const attachment = new Attachment({
      originalName: file.originalname,
      filename,
      mimetype: file.mimetype,
      size: file.size,
      uploadedBy: userId,
      processingStatus: 'pending',
      metadata
    });
    
    await attachment.save();
    
    try {
      // Upload to storage
      const uploadResult = await this.uploadToStorage(file, filename);
      
      // Generate thumbnail if needed
      let thumbnailUrl = null;
      if (this.isImageOrVideo(file.mimetype)) {
        thumbnailUrl = await this.generateThumbnail(uploadResult.url, attachment._id);
      }
      
      // Update attachment with URLs
      attachment.url = uploadResult.url;
      attachment.thumbnailUrl = thumbnailUrl;
      attachment.storageType = uploadResult.storageType;
      attachment.storagePath = uploadResult.path;
      attachment.processingStatus = 'completed';
      
      await attachment.save();
      
      // Virus scan (async)
      this.scanFile(attachment._id).catch(console.error);
      
      return attachment;
      
    } catch (error) {
      attachment.processingStatus = 'failed';
      await attachment.save();
      throw error;
    }
  }
  
  // Generate thumbnail for images/videos
  async generateThumbnail(fileUrl, attachmentId) {
    const thumbnailPath = `thumbnails/${attachmentId}.jpg`;
    
    // Use sharp for images or ffmpeg for videos
    if (fileUrl.includes('image')) {
      await sharp(fileUrl)
        .resize(200, 200, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);
    } else if (fileUrl.includes('video')) {
      // Use ffmpeg to extract frame
      await this.extractVideoFrame(fileUrl, thumbnailPath);
    }
    
    // Upload thumbnail to storage
    const thumbnailUpload = await this.uploadToStorage(
      { path: thumbnailPath },
      `thumbnails/${attachmentId}.jpg`
    );
    
    return thumbnailUpload.url;
  }
  
  // Validate uploaded file
  async validateFile(file) {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime',
      'audio/mpeg', 'audio/wav', 'audio/ogg',
      'application/pdf', 'text/plain',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} not allowed`);
    }
    
    // Size limits by type
    const sizeLimits = {
      image: 10 * 1024 * 1024, // 10MB
      video: 100 * 1024 * 1024, // 100MB
      audio: 50 * 1024 * 1024, // 50MB
      document: 25 * 1024 * 1024 // 25MB
    };
    
    const fileType = file.mimetype.split('/')[0];
    const limit = sizeLimits[fileType] || sizeLimits.document;
    
    if (file.size > limit) {
      throw new Error(`File size exceeds limit of ${limit / 1024 / 1024}MB`);
    }
  }
}
```

## Real-time Communication

### Socket Service Implementation

```javascript
class SocketService {
  constructor(io) {
    this.io = io;
    this.userSockets = new Map(); // userId -> Set of socket IDs
    this.chatRooms = new Map(); // chatId -> Set of user IDs
    this.typingUsers = new Map(); // chatId -> Set of user IDs
  }
  
  // Handle new socket connection
  handleConnection(socket) {
    console.log(`User connected: ${socket.userId}`);
    
    // Track user's sockets
    if (!this.userSockets.has(socket.userId)) {
      this.userSockets.set(socket.userId, new Set());
    }
    this.userSockets.get(socket.userId).add(socket.id);
    
    // Set up event handlers
    this.setupEventHandlers(socket);
    
    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });
  }
  
  setupEventHandlers(socket) {
    // Join chat room
    socket.on('join_chat', async (data) => {
      const { chatId } = data;
      
      // Verify user has access to chat
      const hasAccess = await this.verifyUserChatAccess(socket.userId, chatId);
      if (!hasAccess) {
        socket.emit('error', { message: 'Access denied to chat' });
        return;
      }
      
      // Join socket room
      socket.join(`chat_${chatId}`);
      
      // Track user in chat
      if (!this.chatRooms.has(chatId)) {
        this.chatRooms.set(chatId, new Set());
      }
      this.chatRooms.get(chatId).add(socket.userId);
      
      // Notify others of user joining
      socket.to(`chat_${chatId}`).emit('user_joined', {
        chatId,
        userId: socket.userId,
        userName: socket.userName
      });
      
      // Send current online users
      const onlineUsers = Array.from(this.chatRooms.get(chatId) || []);
      socket.emit('chat_users_online', { chatId, users: onlineUsers });
    });
    
    // Leave chat room
    socket.on('leave_chat', (data) => {
      const { chatId } = data;
      socket.leave(`chat_${chatId}`);
      
      if (this.chatRooms.has(chatId)) {
        this.chatRooms.get(chatId).delete(socket.userId);
      }
      
      socket.to(`chat_${chatId}`).emit('user_left', {
        chatId,
        userId: socket.userId
      });
    });
    
    // Handle message sending
    socket.on('send_message', async (data) => {
      try {
        const message = await this.messageService.sendMessage(
          data.chatId,
          socket.userId,
          {
            content: data.content,
            type: data.type,
            senderName: socket.userName,
            replyTo: data.replyToId ? await this.getReplyContext(data.replyToId) : null,
            attachments: data.attachments || []
          }
        );
        
        // Emit to all users in chat except sender
        socket.to(`chat_${data.chatId}`).emit('message_received', {
          chatId: data.chatId,
          message: await this.formatMessageForClient(message)
        });
        
        // Confirm to sender
        socket.emit('message_sent', {
          tempId: data.tempId,
          message: await this.formatMessageForClient(message)
        });
        
      } catch (error) {
        socket.emit('message_failed', {
          tempId: data.tempId,
          error: error.message
        });
      }
    });
    
    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { chatId } = data;
      
      if (!this.typingUsers.has(chatId)) {
        this.typingUsers.set(chatId, new Set());
      }
      this.typingUsers.get(chatId).add(socket.userId);
      
      socket.to(`chat_${chatId}`).emit('user_typing', {
        chatId,
        userId: socket.userId,
        userName: socket.userName
      });
      
      // Auto-stop typing after 3 seconds
      setTimeout(() => {
        if (this.typingUsers.get(chatId)?.has(socket.userId)) {
          this.handleTypingStop(socket, chatId);
        }
      }, 3000);
    });
    
    socket.on('typing_stop', (data) => {
      this.handleTypingStop(socket, data.chatId);
    });
    
    // Handle message reactions
    socket.on('react_to_message', async (data) => {
      try {
        const reactions = await this.messageService.addReaction(
          data.messageId,
          socket.userId,
          data.reactionType
        );
        
        // Get message to find chat ID
        const message = await Message.findById(data.messageId);
        
        this.io.to(`chat_${message.chatId}`).emit('reaction_updated', {
          messageId: data.messageId,
          reactions
        });
        
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });
    
    // Handle message read receipts
    socket.on('messages_read', async (data) => {
      try {
        await this.messageService.markMessagesAsRead(
          data.chatId,
          socket.userId,
          data.messageIds
        );
        
        socket.to(`chat_${data.chatId}`).emit('messages_read', {
          messageIds: data.messageIds,
          userId: socket.userId,
          readAt: new Date()
        });
        
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });
  }
  
  // Emit event to all users in a chat
  emitToChat(chatId, event, data) {
    this.io.to(`chat_${chatId}`).emit(event, data);
  }
  
  // Emit event to specific user across all their devices
  emitToUser(userId, event, data) {
    const userSockets = this.userSockets.get(userId);
    if (userSockets) {
      userSockets.forEach(socketId => {
        this.io.to(socketId).emit(event, data);
      });
    }
  }
  
  // Handle typing stop
  handleTypingStop(socket, chatId) {
    if (this.typingUsers.has(chatId)) {
      this.typingUsers.get(chatId).delete(socket.userId);
    }
    
    socket.to(`chat_${chatId}`).emit('user_stopped_typing', {
      chatId,
      userId: socket.userId
    });
  }
  
  // Verify user has access to chat
  async verifyUserChatAccess(userId, chatId) {
    const chat = await Chat.findOne({
      _id: chatId,
      memberIds: userId
    });
    
    return !!chat;
  }
}
```

### Push Notification Service

```javascript
class NotificationService {
  // Send push notification for new message
  async sendMessageNotification(chatId, message) {
    const chat = await Chat.findById(chatId).populate('memberIds', 'firstName lastName pushTokens notificationSettings');
    
    // Get recipients (exclude sender and muted users)
    const recipients = chat.memberIds.filter(member => 
      !member._id.equals(message.senderId) &&
      !this.isUserMuted(member, chatId)
    );
    
    for (const recipient of recipients) {
      // Check if user is online
      const isOnline = this.socketService.isUserOnline(recipient._id);
      
      // Skip if user is online and actively viewing the chat
      if (isOnline && this.socketService.isUserInChat(recipient._id, chatId)) {
        continue;
      }
      
      // Prepare notification payload
      const notification = {
        title: chat.type === 'group' ? chat.name : message.senderName,
        body: this.formatNotificationBody(message),
        icon: chat.avatar || '/default-chat-icon.png',
        badge: await this.getUserUnreadCount(recipient._id),
        data: {
          chatId: chatId.toString(),
          messageId: message._id.toString(),
          type: 'message'
        }
      };
      
      // Send web push notification
      if (recipient.pushTokens?.web) {
        await this.sendWebPush(recipient.pushTokens.web, notification);
      }
      
      // Send mobile push notification
      if (recipient.pushTokens?.mobile) {
        await this.sendMobilePush(recipient.pushTokens.mobile, notification);
      }
      
      // Send email notification if enabled and user is offline for > 30 minutes
      if (recipient.notificationSettings?.emailEnabled && 
          (!isOnline || this.getLastSeenTime(recipient._id) > 30 * 60 * 1000)) {
        await this.sendEmailNotification(recipient.email, notification, message);
      }
    }
  }
  
  formatNotificationBody(message) {
    switch (message.type) {
      case 'text':
        return message.content.length > 50 
          ? message.content.substring(0, 50) + '...'
          : message.content;
      case 'image':
        return '📷 Photo';
      case 'video':
        return '🎥 Video';
      case 'audio':
        return '🎵 Audio message';
      case 'document':
        return '📄 Document';
      case 'location':
        return '📍 Location';
      case 'contact':
        return '👤 Contact';
      default:
        return 'New message';
    }
  }
}
```

## Error Handling

### Message Delivery Failure

```javascript
const handleMessageFailure = (messageId, error) => {
  // Update message status to failed
  updateMessageStatus(messageId, 'failed');
  
  // Add to retry queue
  addToRetryQueue({
    messageId,
    retryCount: 0,
    maxRetries: 3,
    nextRetry: Date.now() + 5000
  });
  
  // Show user notification
  showToast({
    type: 'error',
    message: 'Message failed to send. Tap to retry.',
    action: {
      label: 'Retry',
      onClick: () => retryMessage(messageId)
    }
  });
};
```

### Attachment Upload Failure

```javascript
const handleAttachmentFailure = (attachmentId, error) => {
  // Update attachment status
  updateAttachmentStatus(attachmentId, 'failed');
  
  // Provide retry option
  showAttachmentError(attachmentId, {
    message: 'Upload failed',
    actions: ['retry', 'remove']
  });
};
```

### Network Connectivity

```javascript
const handleOfflineMode = () => {
  // Queue messages for later sending
  enableOfflineQueue();
  
  // Show offline indicator
  showNetworkStatus('offline');
  
  // Cache recent messages for offline viewing
  cacheRecentMessages();
};
```

## Testing Strategy

### Unit Testing

**Components to Test:**
- ChatList rendering and interaction
- MessageBubble display and status
- ReactionPicker functionality
- AttachmentPicker behavior
- MessageMenu actions

**Test Coverage:**
- Component rendering with different props
- User interaction handling
- State management
- Error scenarios
- Accessibility compliance

### Integration Testing

**Workflows to Test:**
- Complete message sending flow
- Attachment upload and display
- Reaction addition and removal
- Reply functionality
- Chat switching and state persistence

### End-to-End Testing

**User Scenarios:**
- Send message in group chat
- React to message in private chat
- Upload and share image
- Reply to message with attachment
- Switch between group and private chats
- Handle network disconnection/reconnection

## Performance Optimization

### Message Virtualization

```javascript
const MessageList = ({ messages }) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  
  // Only render visible messages plus buffer
  const visibleMessages = messages.slice(
    Math.max(0, visibleRange.start - 10),
    visibleRange.end + 10
  );
  
  return (
    <VirtualizedList
      items={visibleMessages}
      renderItem={MessageBubble}
      onRangeChange={setVisibleRange}
    />
  );
};
```

### Image Optimization

```javascript
const optimizeImage = async (file) => {
  // Compress image for upload
  const compressed = await compressImage(file, {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.8
  });
  
  // Generate thumbnail
  const thumbnail = await generateThumbnail(compressed, {
    width: 200,
    height: 200
  });
  
  return { compressed, thumbnail };
};
```

### Caching Strategy

```javascript
const MessageCache = {
  // Cache recent messages
  cacheMessages: (chatId, messages) => {
    const cacheKey = `messages_${chatId}`;
    localStorage.setItem(cacheKey, JSON.stringify({
      messages: messages.slice(-100), // Keep last 100 messages
      timestamp: Date.now()
    }));
  },
  
  // Retrieve cached messages
  getCachedMessages: (chatId) => {
    const cacheKey = `messages_${chatId}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      const { messages, timestamp } = JSON.parse(cached);
      
      // Return if cache is less than 1 hour old
      if (Date.now() - timestamp < 3600000) {
        return messages;
      }
    }
    
    return null;
  }
};
```

## Security Considerations

### Message Encryption

```javascript
const encryptMessage = async (content, chatId) => {
  // Use Web Crypto API for client-side encryption
  const key = await getChatEncryptionKey(chatId);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: generateIV() },
    key,
    new TextEncoder().encode(content)
  );
  
  return {
    encryptedContent: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(generateIV())
  };
};
```

### Input Sanitization

```javascript
const sanitizeMessageContent = (content) => {
  // Remove potentially harmful content
  const sanitized = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
    ALLOWED_ATTR: []
  });
  
  // Limit message length
  return sanitized.slice(0, 4000);
};
```

### File Upload Security

```javascript
const validateAttachment = (file) => {
  // Check file type
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif',
    'video/mp4', 'video/webm',
    'application/pdf', 'text/plain'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('File type not allowed');
  }
  
  // Check file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File too large');
  }
  
  return true;
};
```

## Implementation Phases

### Phase 1: Core Infrastructure (Weeks 1-2)
1. Create unified chat list component
2. Implement smart avatar system
3. Build message preview component
4. Set up chat context and state management

### Phase 2: Chat Window Redesign (Weeks 3-4)
1. Implement WhatsApp-style chat window
2. Create unified message bubble component
3. Add real-time typing indicators
4. Implement message status system

### Phase 3: Message Interactions (Weeks 5-6)
1. Build reaction picker and display
2. Implement reply functionality
3. Create message context menus
4. Add message forwarding

### Phase 4: Attachment System (Weeks 7-8)
1. Create unified attachment picker
2. Implement media upload and preview
3. Add document and location sharing
4. Build contact sharing functionality

### Phase 5: Advanced Features (Weeks 9-10)
1. Add in-chat search functionality
2. Implement message starring/pinning
3. Create auto-delete functionality
4. Add privacy and security features

### Phase 6: Testing and Polish (Weeks 11-12)
1. Comprehensive testing implementation
2. Performance optimization
3. Accessibility compliance
4. Cross-browser compatibility testing
5. Mobile responsiveness refinement

## Technical Considerations

### Browser Compatibility
- Modern browsers with ES6+ support
- Progressive Web App capabilities
- Service Worker for offline functionality
- Web Push API for notifications

### Mobile Optimization
- Touch-friendly interface elements
- Gesture support (swipe, long-press)
- Virtual keyboard handling
- Battery-efficient animations

### Accessibility
- ARIA labels for all interactive elements
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus management for modals and menus