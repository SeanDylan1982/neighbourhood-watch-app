const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Message = require('./models/Message');
const ChatGroup = require('./models/ChatGroup');
const User = require('./models/User');

// Import the formatMessageResponse function (we'll need to extract it)
const formatMessageResponse = (msg) => {
  // Ensure proper attachment field mapping - use attachments from schema, not media
  const attachments = msg.attachments || [];
  
  // Standardize attachment format for consistent frontend consumption
  const formattedAttachments = attachments.map(attachment => ({
    id: attachment.id || attachment._id,
    type: attachment.type,
    url: attachment.url || null,
    filename: attachment.filename || null,
    size: attachment.size || null,
    thumbnail: attachment.thumbnail || null,
    metadata: attachment.metadata || {}
  }));
  
  // Handle sender information with proper null safety
  const senderId = msg.senderId?._id || msg.senderId;
  const senderFirstName = msg.senderId?.firstName || '';
  const senderLastName = msg.senderId?.lastName || '';
  const senderName = (senderFirstName || senderLastName) 
    ? `${senderFirstName} ${senderLastName}`.trim() 
    : (msg.senderName || 'Unknown');
  const senderAvatar = msg.senderId?.profileImageUrl || null;
  
  // Handle replyTo with proper null handling and field mapping
  let replyToFormatted = null;
  if (msg.replyTo && (msg.replyTo.messageId || msg.replyTo.content)) {
    replyToFormatted = {
      id: msg.replyTo.messageId?._id || msg.replyTo.messageId || null,
      content: msg.replyTo.messageId?.content || msg.replyTo.content || '',
      senderId: msg.replyTo.messageId?.senderId || null,
      senderName: msg.replyTo.senderName || 'Unknown',
      type: msg.replyTo.type || 'text'
    };
  }
  
  // Handle reactions with proper null handling and consistent format
  const formattedReactions = (msg.reactions || []).map(reaction => ({
    type: reaction.type,
    count: Math.max(0, reaction.count || 0), // Ensure non-negative count
    users: reaction.users || [],
    createdAt: reaction.createdAt || null
  }));
  
  // Handle forwardedFrom with comprehensive null handling
  let forwardedFromFormatted = null;
  if (msg.forwardedFrom && msg.isForwarded) {
    forwardedFromFormatted = {
      messageId: msg.forwardedFrom.messageId || null,
      originalSenderId: msg.forwardedFrom.originalSenderId || null,
      originalSenderName: msg.forwardedFrom.originalSenderName || 'Unknown',
      originalChatId: msg.forwardedFrom.originalChatId || null,
      originalChatName: msg.forwardedFrom.originalChatName || 'Unknown Chat',
      forwardedBy: msg.forwardedFrom.forwardedBy || null,
      forwardedByName: msg.forwardedFrom.forwardedByName || 'Unknown',
      forwardedAt: msg.forwardedFrom.forwardedAt || null
    };
  }
  
  // Create standardized response with consistent field mapping
  return {
    // Core message fields
    id: msg._id,
    content: msg.content || '', // Ensure string for content
    type: msg.messageType || 'text', // Primary field - use messageType from schema
    messageType: msg.messageType || 'text', // Legacy support - maintain backward compatibility
    
    // Attachment fields - both legacy and standard for backward compatibility
    media: formattedAttachments, // Legacy support - map attachments to media
    attachments: formattedAttachments, // Standard field - consistent with schema
    
    // Sender information with proper null handling
    senderId: senderId,
    senderName: senderName,
    senderAvatar: senderAvatar, // Proper null handling with optional chaining
    
    // Reply information with comprehensive null handling
    replyTo: replyToFormatted,
    
    // Reactions with proper formatting
    reactions: formattedReactions,
    
    // Boolean fields with explicit conversion
    isEdited: Boolean(msg.isEdited),
    isForwarded: Boolean(msg.isForwarded),
    isDeleted: Boolean(msg.isDeleted),
    isStarred: Boolean(msg.isStarred),
    
    // Forwarding information with null handling
    forwardedFrom: forwardedFromFormatted,
    
    // Status and moderation
    status: msg.status || 'sent', // Default to 'sent' if no status
    moderationStatus: msg.moderationStatus || 'active',
    
    // Timestamps - both standard and legacy for frontend compatibility
    createdAt: msg.createdAt,
    updatedAt: msg.updatedAt,
    timestamp: msg.createdAt, // Frontend compatibility field
    
    // Additional metadata fields
    deliveredTo: msg.deliveredTo || [],
    readBy: msg.readBy || [],
    
    // Enhanced fields for future functionality
    encryption: msg.encryption ? {
      isEncrypted: Boolean(msg.encryption.isEncrypted),
      encryptionVersion: msg.encryption.encryptionVersion || null
    } : null,
    
    autoDelete: msg.autoDelete ? {
      enabled: Boolean(msg.autoDelete.enabled),
      expiresAt: msg.autoDelete.expiresAt || null
    } : null
  };
};

async function testMessageFormatting() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/neighbourhood-app');
    console.log('Connected to MongoDB');

    // Find a test message with populated fields
    const message = await Message.findOne({
      moderationStatus: 'active'
    })
    .populate('senderId', 'firstName lastName profileImageUrl')
    .populate('replyTo.messageId', 'content senderId');

    if (!message) {
      console.log('No messages found for testing');
      return;
    }

    console.log('\n=== ORIGINAL MESSAGE DATA ===');
    console.log('ID:', message._id);
    console.log('Content:', message.content);
    console.log('MessageType:', message.messageType);
    console.log('Sender:', message.senderId);
    console.log('Attachments:', message.attachments);
    console.log('ReplyTo:', message.replyTo);
    console.log('Reactions:', message.reactions);
    console.log('IsForwarded:', message.isForwarded);
    console.log('ForwardedFrom:', message.forwardedFrom);

    console.log('\n=== FORMATTED MESSAGE RESPONSE ===');
    const formatted = formatMessageResponse(message);
    console.log(JSON.stringify(formatted, null, 2));

    console.log('\n=== FIELD MAPPING VERIFICATION ===');
    console.log('✓ ID mapped correctly:', formatted.id === message._id.toString());
    console.log('✓ Content handled:', typeof formatted.content === 'string');
    console.log('✓ Type field present:', formatted.type !== undefined);
    console.log('✓ MessageType (legacy) present:', formatted.messageType !== undefined);
    console.log('✓ Media field (legacy) present:', Array.isArray(formatted.media));
    console.log('✓ Attachments field present:', Array.isArray(formatted.attachments));
    console.log('✓ Media === Attachments:', JSON.stringify(formatted.media) === JSON.stringify(formatted.attachments));
    console.log('✓ SenderName handled:', typeof formatted.senderName === 'string');
    console.log('✓ SenderAvatar null-safe:', formatted.senderAvatar === null || typeof formatted.senderAvatar === 'string');
    console.log('✓ ReplyTo null-safe:', formatted.replyTo === null || typeof formatted.replyTo === 'object');
    console.log('✓ Reactions array:', Array.isArray(formatted.reactions));
    console.log('✓ Boolean fields converted:', typeof formatted.isEdited === 'boolean');
    console.log('✓ Timestamp field present:', formatted.timestamp !== undefined);
    console.log('✓ CreatedAt === Timestamp:', formatted.createdAt === formatted.timestamp);

    // Test with a message that has null/undefined fields
    console.log('\n=== TESTING NULL HANDLING ===');
    const mockMessage = {
      _id: new mongoose.Types.ObjectId(),
      content: null,
      messageType: undefined,
      senderId: null,
      attachments: undefined,
      replyTo: null,
      reactions: undefined,
      isEdited: undefined,
      isForwarded: null,
      forwardedFrom: undefined,
      status: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const formattedMock = formatMessageResponse(mockMessage);
    console.log('Mock formatted:', JSON.stringify(formattedMock, null, 2));

    console.log('\n=== NULL HANDLING VERIFICATION ===');
    console.log('✓ Content defaults to empty string:', formattedMock.content === '');
    console.log('✓ Type defaults to text:', formattedMock.type === 'text');
    console.log('✓ SenderName defaults to Unknown:', formattedMock.senderName === 'Unknown');
    console.log('✓ SenderAvatar is null:', formattedMock.senderAvatar === null);
    console.log('✓ ReplyTo is null:', formattedMock.replyTo === null);
    console.log('✓ Reactions is empty array:', Array.isArray(formattedMock.reactions) && formattedMock.reactions.length === 0);
    console.log('✓ Boolean fields are false:', formattedMock.isEdited === false && formattedMock.isForwarded === false);
    console.log('✓ Status defaults to sent:', formattedMock.status === 'sent');

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the test
testMessageFormatting();