const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult, query } = require('express-validator');
const ChatGroup = require('../models/ChatGroup');
const Message = require('../models/Message');
const User = require('../models/User');
const { requireRole } = require('../middleware/auth');
const { 
  enhanceError, 
  logClassifiedError, 
  createError, 
  ErrorCategory, 
  ErrorSeverity 
} = require('../utils/errorClassification');
const { executeQuery } = require('../utils/dbOperationWrapper');
const router = express.Router();

// Get user's chat groups
router.get('/groups', async (req, res) => {
  const startTime = Date.now();
  const requestContext = {
    userId: req.user?.userId,
    method: req.method,
    path: req.path,
    endpoint: '/groups',
    startTime,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  };

  try {
    const userId = req.user.userId;

    // Log operation start for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${new Date().toISOString()}] Fetching chat groups for user: ${userId}`);
    }

    // Find chat groups where the user is a member with enhanced error handling
    const groups = await executeQuery(
      () => ChatGroup.find({
        'members.userId': userId,
        isActive: true
      })
      .populate('createdBy', 'firstName lastName')
      .populate('members.userId', 'firstName lastName')
      .sort({ lastActivity: -1, createdAt: -1 }),
      {
        operationName: 'Fetch user chat groups',
        timeout: 15000,
        metadata: { userId, operation: 'get_groups' },
        retryOptions: {
          maxRetries: 2,
          initialDelayMs: 500
        }
      }
    );

    // Get additional data for each group with enhanced error handling
    const groupsWithData = await Promise.all(groups.map(async (group) => {
      try {
        // Find user's role in this group
        const userMember = group.members.find(member => member.userId._id.toString() === userId);
        
        // Get message count with error handling
        const messageCount = await executeQuery(
          () => Message.countDocuments({
            chatId: group._id,
            chatType: 'group',
            moderationStatus: 'active'
          }),
          {
            operationName: 'Count group messages',
            timeout: 5000,
            metadata: { groupId: group._id, userId, groupName: group.name },
            retryOptions: {
              maxRetries: 1,
              initialDelayMs: 200
            }
          }
        );

        // Get last message with error handling
        const lastMessage = await executeQuery(
          () => Message.findOne({
            chatId: group._id,
            chatType: 'group',
            moderationStatus: 'active'
          })
          .sort({ createdAt: -1 })
          .populate('senderId', 'firstName lastName'),
          {
            operationName: 'Fetch last group message',
            timeout: 5000,
            metadata: { groupId: group._id, userId, groupName: group.name },
            retryOptions: {
              maxRetries: 1,
              initialDelayMs: 200
            }
          }
        );

        return {
          id: group._id,
          name: group.name,
          description: group.description,
          type: group.type,
          memberRole: userMember?.role || 'member',
          memberCount: group.members.length,
          messageCount,
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            sender: lastMessage.senderId,
            createdAt: lastMessage.createdAt
          } : null,
          lastActivity: group.lastActivity,
          createdAt: group.createdAt
        };
      } catch (groupError) {
        // Log error for individual group but don't fail the entire request
        logChatError(groupError, {
          ...requestContext,
          groupId: group._id,
          groupName: group.name,
          operation: 'process_individual_group'
        }, 'Process individual group data');

        // Return basic group info if detailed processing fails
        return {
          id: group._id,
          name: group.name,
          description: group.description,
          type: group.type,
          memberRole: 'member',
          memberCount: group.members.length,
          messageCount: 0,
          lastMessage: null,
          lastActivity: group.lastActivity,
          createdAt: group.createdAt,
          hasError: true // Flag to indicate partial data
        };
      }
    }));

    // Log successful operation completion
    const totalDuration = Date.now() - startTime;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${new Date().toISOString()}] Chat groups fetched successfully: ${groupsWithData.length} groups in ${totalDuration}ms`);
    }

    // Log slow operations as warnings
    if (totalDuration > 3000) {
      console.warn(`[SLOW OPERATION] Get chat groups took ${totalDuration}ms for user ${userId} (${groupsWithData.length} groups)`);
    }

    res.json(groupsWithData);
  } catch (error) {
    // Use enhanced error handling and response creation
    const errorResponse = createChatErrorResponse(error, requestContext, 'Get user chat groups');
    
    // Determine appropriate HTTP status code based on error classification
    let statusCode = 500;
    if (error.classification) {
      switch (error.classification.category) {
        case ErrorCategory.AUTHENTICATION:
          statusCode = 401;
          break;
        case ErrorCategory.CONNECTION:
        case ErrorCategory.RESOURCE:
          statusCode = 503;
          break;
        default:
          statusCode = 500;
      }
    }
    
    res.status(statusCode).json(errorResponse);
  }
});

/**
 * Enhanced error logging utility for chat operations
 * Provides structured error logging with context information and classification
 * @param {Error} error - The error to log
 * @param {Object} context - Request and operation context
 * @param {string} operationName - Name of the operation that failed
 */
const logChatError = (error, context = {}, operationName = 'Chat operation') => {
  // Enhance error with classification if not already done
  const enhancedError = enhanceError(error);
  
  // Create comprehensive context for chat operations
  const chatContext = {
    operation: operationName,
    timestamp: new Date().toISOString(),
    source: 'chat_routes',
    ...context,
    // Add database connection state
    dbConnectionState: mongoose.connection.readyState,
    dbConnectionName: mongoose.connection.name || 'unknown',
    // Add memory usage for performance monitoring
    memoryUsage: process.memoryUsage(),
    // Add request timing if available
    requestDuration: context.startTime ? Date.now() - context.startTime : null
  };
  
  // Use the comprehensive error classification system
  logClassifiedError(enhancedError, chatContext);
  
  // Additional chat-specific logging for critical errors
  if (enhancedError.classification?.severity === ErrorSeverity.CRITICAL) {
    console.error('=== CRITICAL CHAT ERROR ALERT ===');
    console.error('Operation:', operationName);
    console.error('User ID:', context.userId || 'unknown');
    console.error('Group ID:', context.groupId || 'N/A');
    console.error('Error Category:', enhancedError.classification.category);
    console.error('Error Type:', enhancedError.classification.type);
    console.error('Retryable:', enhancedError.classification.retryable);
    console.error('User Impact:', enhancedError.classification.userImpact);
    console.error('Time:', chatContext.timestamp);
    console.error('================================');
  }
  
  return enhancedError;
};

/**
 * Validates request parameters and logs validation errors
 * @param {Object} req - Express request object
 * @param {Object} context - Additional context for logging
 * @returns {Object|null} - Validation errors or null if valid
 */
const validateAndLogRequest = (req, context = {}) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const validationError = createError('Request validation failed', {
      code: 'VALIDATION_ERROR',
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.MEDIUM,
      metadata: {
        validationErrors: errors.array(),
        requestBody: req.body,
        requestParams: req.params,
        requestQuery: req.query
      }
    });
    
    logChatError(validationError, {
      ...context,
      userId: req.user?.userId,
      method: req.method,
      path: req.path,
      validationErrors: errors.array()
    }, 'Request validation');
    
    return {
      errors: errors.array(),
      message: 'Invalid request parameters',
      code: 'VALIDATION_ERROR'
    };
  }
  
  return null;
};

/**
 * Creates standardized error response for chat operations
 * @param {Error} error - The error that occurred
 * @param {Object} context - Request context
 * @param {string} operationName - Name of the failed operation
 * @returns {Object} - Standardized error response
 */
const createChatErrorResponse = (error, context = {}, operationName = 'Chat operation') => {
  const enhancedError = logChatError(error, context, operationName);
  const classification = enhancedError.classification;
  
  // Base error response
  const errorResponse = {
    message: classification?.userFriendlyMessage || 'An error occurred while processing your request',
    code: classification?.code || 'CHAT_ERROR',
    timestamp: new Date().toISOString()
  };
  
  // Add retry information for transient errors
  if (classification?.retryable) {
    errorResponse.retryable = true;
    errorResponse.retryAfter = 1; // Seconds to wait before retry
  }
  
  // Add validation details if available
  if (classification?.category === ErrorCategory.VALIDATION && classification.validationErrors) {
    errorResponse.details = classification.validationErrors;
  }
  
  // In development, include debug information
  if (process.env.NODE_ENV === 'development') {
    errorResponse.debug = {
      originalMessage: error.message,
      stack: error.stack,
      classification: {
        type: classification?.type,
        category: classification?.category,
        severity: classification?.severity,
        reason: classification?.reason
      },
      context: {
        operation: operationName,
        userId: context.userId,
        groupId: context.groupId,
        method: context.method,
        path: context.path
      }
    };
  }
  
  return errorResponse;
};

// Utility function to format message response with consistent field mapping
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
  if (msg.isForwarded && msg.forwardedFrom) {
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

// Get messages for a group
router.get('/groups/:groupId/messages', [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
  query('before').optional().isISO8601().withMessage('Before parameter must be a valid ISO8601 date')
], async (req, res) => {
  const startTime = Date.now();
  const requestContext = {
    groupId: req.params.groupId,
    userId: req.user?.userId,
    query: req.query,
    method: req.method,
    path: req.path,
    endpoint: '/groups/:groupId/messages',
    startTime,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  };

  try {
    // Enhanced request validation with logging
    const validationError = validateAndLogRequest(req, requestContext);
    if (validationError) {
      return res.status(400).json(validationError);
    }

    const groupId = req.params.groupId;
    const { limit = 50, offset = 0, before } = req.query;
    const userId = req.user.userId;

    // Validate ObjectId format for groupId
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      const invalidIdError = createError('Invalid group ID format', {
        code: 'INVALID_GROUP_ID',
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.MEDIUM,
        metadata: { groupId, userId }
      });
      
      const errorResponse = createChatErrorResponse(invalidIdError, requestContext, 'Group ID validation');
      return res.status(400).json(errorResponse);
    }

    // Log operation start for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${new Date().toISOString()}] Fetching messages for group: ${groupId}, user: ${userId}`);
    }

    // Verify user is member of the group with enhanced error handling
    const group = await executeQuery(
      () => ChatGroup.findOne({
        _id: groupId,
        'members.userId': userId,
        isActive: true
      }),
      {
        operationName: 'Verify group membership',
        timeout: 10000,
        metadata: { groupId, userId },
        retryOptions: {
          maxRetries: 2,
          initialDelayMs: 500
        }
      }
    );

    if (!group) {
      const accessError = createError('Not a member of this group or group not found', {
        code: 'GROUP_ACCESS_DENIED',
        category: ErrorCategory.AUTHORIZATION,
        severity: ErrorSeverity.MEDIUM,
        metadata: { groupId, userId, operation: 'group_access_check' }
      });
      
      const errorResponse = createChatErrorResponse(accessError, requestContext, 'Group access verification');
      return res.status(403).json(errorResponse);
    }

    // Log successful group verification
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${new Date().toISOString()}] User verified as group member. Group: ${group.name}`);
    }

    // Build query with proper validation
    const messageQuery = {
      chatId: groupId,
      chatType: 'group',
      moderationStatus: 'active'
    };

    if (before) {
      try {
        messageQuery.createdAt = { $lt: new Date(before) };
      } catch (dateError) {
        const invalidDateError = createError('Invalid date format for before parameter', {
          code: 'INVALID_DATE_FORMAT',
          category: ErrorCategory.VALIDATION,
          severity: ErrorSeverity.MEDIUM,
          metadata: { before, groupId, userId }
        });
        
        const errorResponse = createChatErrorResponse(invalidDateError, requestContext, 'Date parameter validation');
        return res.status(400).json(errorResponse);
      }
    }

    // Log query details for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${new Date().toISOString()}] Message query:`, JSON.stringify(messageQuery, null, 2));
    }

    // Fetch messages with enhanced error handling and retry logic
    const messages = await executeQuery(
      () => Message.find(messageQuery)
        .populate('senderId', 'firstName lastName profileImageUrl')
        .populate('replyTo.messageId', 'content senderId') // Fixed: use replyTo.messageId instead of replyToId
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset)),
      {
        operationName: 'Fetch group messages',
        timeout: 15000,
        metadata: { 
          groupId, 
          userId, 
          limit: parseInt(limit), 
          offset: parseInt(offset),
          groupName: group.name,
          memberCount: group.members?.length || 0
        },
        retryOptions: {
          maxRetries: 3,
          initialDelayMs: 1000,
          shouldRetry: (error) => {
            // Retry on connection errors and timeouts, but not on validation errors
            const classification = error.classification;
            return classification?.retryable && 
                   classification?.category !== ErrorCategory.VALIDATION;
          }
        }
      }
    );

    // Log successful message fetch
    const fetchDuration = Date.now() - startTime;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${new Date().toISOString()}] Messages fetched successfully: ${messages.length} messages in ${fetchDuration}ms`);
    }

    // Format messages using standardized utility function with error handling
    let formattedMessages;
    try {
      formattedMessages = messages.map(formatMessageResponse).reverse(); // Reverse to show oldest first
    } catch (formatError) {
      const formattingError = createError('Failed to format message response', {
        code: 'MESSAGE_FORMAT_ERROR',
        category: ErrorCategory.BUSINESS_LOGIC,
        severity: ErrorSeverity.HIGH,
        cause: formatError,
        metadata: { 
          groupId, 
          userId, 
          messageCount: messages.length,
          groupName: group.name
        }
      });
      
      const errorResponse = createChatErrorResponse(formattingError, requestContext, 'Message formatting');
      return res.status(500).json(errorResponse);
    }

    // Log successful operation completion
    const totalDuration = Date.now() - startTime;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${new Date().toISOString()}] Operation completed successfully: ${formattedMessages.length} formatted messages in ${totalDuration}ms`);
    }

    // Log slow operations as warnings
    if (totalDuration > 2000) {
      console.warn(`[SLOW OPERATION] Group messages fetch took ${totalDuration}ms for group ${groupId} (${formattedMessages.length} messages)`);
    }

    res.json(formattedMessages);
  } catch (error) {
    // Use enhanced error handling and response creation
    const errorResponse = createChatErrorResponse(error, requestContext, 'Fetch group messages');
    
    // Determine appropriate HTTP status code based on error classification
    let statusCode = 500;
    if (error.classification) {
      switch (error.classification.category) {
        case ErrorCategory.VALIDATION:
        case ErrorCategory.INPUT:
          statusCode = 400;
          break;
        case ErrorCategory.AUTHENTICATION:
          statusCode = 401;
          break;
        case ErrorCategory.AUTHORIZATION:
          statusCode = 403;
          break;
        case ErrorCategory.CONNECTION:
        case ErrorCategory.RESOURCE:
          statusCode = 503;
          break;
        default:
          statusCode = 500;
      }
    }
    
    res.status(statusCode).json(errorResponse);
  }
});

// Send message
router.post('/groups/:groupId/messages', [
  body('content').trim().isLength({ min: 1, max: 10000 }).withMessage('Message content must be between 1 and 10000 characters'),
  body('type').optional().isIn(['text', 'image', 'audio', 'video', 'document', 'location', 'contact']).withMessage('Invalid message type'),
  body('messageType').optional().isIn(['text', 'image', 'video', 'file']).withMessage('Invalid legacy message type'), // Legacy support
  body('replyToId').optional().isMongoId().withMessage('Reply ID must be a valid MongoDB ObjectId'),
  body('isForwarded').optional().isBoolean().withMessage('isForwarded must be a boolean'),
  body('forwardedFrom').optional().isObject().withMessage('forwardedFrom must be an object'),
  body('attachments').optional().isArray().withMessage('Attachments must be an array')
], async (req, res) => {
  const startTime = Date.now();
  const requestContext = {
    groupId: req.params.groupId,
    userId: req.user?.userId,
    method: req.method,
    path: req.path,
    endpoint: '/groups/:groupId/messages',
    startTime,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    contentLength: req.body?.content?.length || 0,
    hasAttachments: req.body?.attachments?.length > 0
  };

  try {
    // Enhanced request validation with logging
    const validationError = validateAndLogRequest(req, requestContext);
    if (validationError) {
      return res.status(400).json(validationError);
    }

    const groupId = req.params.groupId;
    const { 
      content, 
      type, 
      messageType = 'text', 
      replyToId, 
      isForwarded = false, 
      forwardedFrom,
      attachments = []
    } = req.body;
    const userId = req.user.userId;

    // Validate ObjectId format for groupId
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      const invalidIdError = createError('Invalid group ID format', {
        code: 'INVALID_GROUP_ID',
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.MEDIUM,
        metadata: { groupId, userId }
      });
      
      const errorResponse = createChatErrorResponse(invalidIdError, requestContext, 'Group ID validation');
      return res.status(400).json(errorResponse);
    }

    // Validate replyToId if provided
    if (replyToId && !mongoose.Types.ObjectId.isValid(replyToId)) {
      const invalidReplyIdError = createError('Invalid reply message ID format', {
        code: 'INVALID_REPLY_ID',
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.MEDIUM,
        metadata: { replyToId, groupId, userId }
      });
      
      const errorResponse = createChatErrorResponse(invalidReplyIdError, requestContext, 'Reply ID validation');
      return res.status(400).json(errorResponse);
    }

    // Log operation start for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${new Date().toISOString()}] Sending message to group: ${groupId}, user: ${userId}, content length: ${content.length}`);
    }

    // Verify user is member of the group with enhanced error handling
    const group = await executeQuery(
      () => ChatGroup.findOne({
        _id: groupId,
        'members.userId': userId,
        isActive: true
      }),
      {
        operationName: 'Verify group membership for message send',
        timeout: 10000,
        metadata: { groupId, userId, operation: 'send_message' },
        retryOptions: {
          maxRetries: 2,
          initialDelayMs: 500
        }
      }
    );

    if (!group) {
      const accessError = createError('Not a member of this group or group not found', {
        code: 'GROUP_ACCESS_DENIED',
        category: ErrorCategory.AUTHORIZATION,
        severity: ErrorSeverity.MEDIUM,
        metadata: { groupId, userId, operation: 'send_message' }
      });
      
      const errorResponse = createChatErrorResponse(accessError, requestContext, 'Group access verification for message send');
      return res.status(403).json(errorResponse);
    }

    // Get user info for senderName with enhanced error handling
    const user = await executeQuery(
      () => User.findById(userId).select('firstName lastName'),
      {
        operationName: 'Fetch user info for message send',
        timeout: 5000,
        metadata: { userId, groupId, operation: 'send_message' },
        retryOptions: {
          maxRetries: 2,
          initialDelayMs: 300
        }
      }
    );

    const senderName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Unknown';

    // Validate reply message exists if replyToId is provided
    if (replyToId) {
      const replyMessage = await executeQuery(
        () => Message.findOne({
          _id: replyToId,
          chatId: groupId,
          chatType: 'group',
          moderationStatus: 'active'
        }),
        {
          operationName: 'Validate reply message',
          timeout: 5000,
          metadata: { replyToId, groupId, userId },
          retryOptions: {
            maxRetries: 1,
            initialDelayMs: 200
          }
        }
      );

      if (!replyMessage) {
        const invalidReplyError = createError('Reply message not found or not accessible', {
          code: 'REPLY_MESSAGE_NOT_FOUND',
          category: ErrorCategory.VALIDATION,
          severity: ErrorSeverity.MEDIUM,
          metadata: { replyToId, groupId, userId }
        });
        
        const errorResponse = createChatErrorResponse(invalidReplyError, requestContext, 'Reply message validation');
        return res.status(400).json(errorResponse);
      }
    }

    // Create message data with proper validation
    const messageData = {
      chatId: groupId,
      chatType: 'group',
      senderId: userId,
      senderName: senderName, // Required field in schema
      content,
      messageType: type || messageType, // Use new 'type' field or fallback to legacy 'messageType'
      status: 'sending', // Start with 'sending' status, will be updated to 'sent' after save
      moderationStatus: 'active'
    };

    // Validate required fields
    if (!content || content.trim().length === 0) {
      const emptyContentError = createError('Message content cannot be empty', {
        code: 'EMPTY_MESSAGE_CONTENT',
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.MEDIUM,
        metadata: { groupId, userId, contentLength: content?.length || 0 }
      });
      
      const errorResponse = createChatErrorResponse(emptyContentError, requestContext, 'Message content validation');
      return res.status(400).json(errorResponse);
    }

    // Handle replyTo with proper schema structure
    if (replyToId) {
      messageData.replyTo = {
        messageId: replyToId
        // Additional reply fields will be populated when the message is fetched
      };
    }

    // Add forwarding data if message is forwarded with validation
    if (isForwarded && forwardedFrom) {
      // Validate forwarded message data
      if (!forwardedFrom.messageId || !forwardedFrom.originalSenderId) {
        const invalidForwardError = createError('Invalid forwarded message data', {
          code: 'INVALID_FORWARD_DATA',
          category: ErrorCategory.VALIDATION,
          severity: ErrorSeverity.MEDIUM,
          metadata: { forwardedFrom, groupId, userId }
        });
        
        const errorResponse = createChatErrorResponse(invalidForwardError, requestContext, 'Forward data validation');
        return res.status(400).json(errorResponse);
      }

      messageData.isForwarded = true;
      messageData.forwardedFrom = {
        messageId: forwardedFrom.messageId,
        originalSenderId: forwardedFrom.originalSenderId,
        originalSenderName: forwardedFrom.originalSenderName || 'Unknown',
        originalChatId: forwardedFrom.originalChatId,
        originalChatName: forwardedFrom.originalChatName || 'Unknown Chat',
        forwardedBy: forwardedFrom.forwardedBy || userId,
        forwardedByName: forwardedFrom.forwardedByName || senderName,
        forwardedAt: forwardedFrom.forwardedAt || new Date()
      };
    }

    // Add attachments if provided with proper validation
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      // Validate attachment data
      const validatedAttachments = [];
      for (const attachment of attachments) {
        if (!attachment.url && !attachment.filename) {
          const invalidAttachmentError = createError('Invalid attachment data - missing URL or filename', {
            code: 'INVALID_ATTACHMENT_DATA',
            category: ErrorCategory.VALIDATION,
            severity: ErrorSeverity.MEDIUM,
            metadata: { attachment, groupId, userId }
          });
          
          const errorResponse = createChatErrorResponse(invalidAttachmentError, requestContext, 'Attachment validation');
          return res.status(400).json(errorResponse);
        }

        validatedAttachments.push({
          id: attachment.id || new mongoose.Types.ObjectId(),
          type: attachment.type || 'document', // Default type if not specified
          url: attachment.url || null,
          filename: attachment.filename || null,
          size: attachment.size || null,
          thumbnail: attachment.thumbnail || null,
          metadata: attachment.metadata || {}
        });
      }
      messageData.attachments = validatedAttachments;
    }

    // Create and save message with enhanced error handling
    const message = await executeQuery(
      async () => {
        const newMessage = new Message(messageData);
        const savedMessage = await newMessage.save();
        
        // Set status to 'sent' after successful save
        savedMessage.status = 'sent';
        await savedMessage.save();
        
        return savedMessage;
      },
      {
        operationName: 'Save new message',
        timeout: 10000,
        metadata: { 
          groupId, 
          userId, 
          messageType: messageData.messageType,
          hasReply: !!replyToId,
          hasAttachments: messageData.attachments?.length > 0,
          isForwarded,
          groupName: group.name
        },
        retryOptions: {
          maxRetries: 2,
          initialDelayMs: 500,
          shouldRetry: (error) => {
            // Don't retry validation errors
            return !error.name?.includes('Validation') && !error.code === 11000;
          }
        }
      }
    );

    // Update group's last activity with error handling
    await executeQuery(
      async () => {
        group.lastActivity = new Date();
        return await group.save();
      },
      {
        operationName: 'Update group last activity',
        timeout: 5000,
        metadata: { groupId, userId, messageId: message._id },
        retryOptions: {
          maxRetries: 1,
          initialDelayMs: 200
        }
      }
    );

    // Populate sender info and replyTo for response with error handling
    await executeQuery(
      () => message.populate('senderId', 'firstName lastName profileImageUrl'),
      {
        operationName: 'Populate message sender info',
        timeout: 5000,
        metadata: { messageId: message._id, senderId: userId },
        retryOptions: {
          maxRetries: 1,
          initialDelayMs: 200
        }
      }
    );

    if (message.replyTo && message.replyTo.messageId) {
      await executeQuery(
        () => message.populate('replyTo.messageId', 'content senderId'),
        {
          operationName: 'Populate reply message info',
          timeout: 5000,
          metadata: { messageId: message._id, replyToId: message.replyTo.messageId },
          retryOptions: {
            maxRetries: 1,
            initialDelayMs: 200
          }
        }
      );
    }

    // Format response using standardized utility function with error handling
    let formattedMessage;
    try {
      formattedMessage = formatMessageResponse(message);
    } catch (formatError) {
      const formattingError = createError('Failed to format message response', {
        code: 'MESSAGE_FORMAT_ERROR',
        category: ErrorCategory.BUSINESS_LOGIC,
        severity: ErrorSeverity.HIGH,
        cause: formatError,
        metadata: { 
          messageId: message._id,
          groupId, 
          userId,
          groupName: group.name
        }
      });
      
      const errorResponse = createChatErrorResponse(formattingError, requestContext, 'Message formatting after send');
      return res.status(500).json(errorResponse);
    }

    // Broadcast message to group members via socket.io for real-time updates
    try {
      const io = req.app.get('io'); // Get socket.io instance from app
      if (io) {
        // Broadcast to all group members except sender
        io.to(`group_${groupId}`).emit('new_message', formattedMessage);
        
        // Send confirmation to sender
        io.to(`user_${userId}`).emit('message_sent', formattedMessage);
        
        // Create notifications for group members (excluding sender)
        try {
          const NotificationService = require('../services/NotificationService');
          const groupMembers = group.members.filter(member => 
            member.userId.toString() !== userId.toString()
          );
          
          // Create notifications for each group member
          for (const member of groupMembers) {
            try {
              await NotificationService.createMessageNotification(
                userId,
                member.userId,
                message._id,
                'group',
                group.name
              );
              
              // Emit notification update to member
              io.to(`user_${member.userId}`).emit('notification_update', {
                type: 'new_message',
                chatId: groupId,
                chatType: 'group',
                chatName: group.name,
                senderId: userId,
                senderName: senderName,
                messageId: message._id,
                timestamp: message.createdAt
              });
            } catch (notificationError) {
              console.error(`Error creating notification for user ${member.userId}:`, notificationError);
            }
          }
        } catch (notificationServiceError) {
          console.error('Error with notification service:', notificationServiceError);
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`[${new Date().toISOString()}] Message broadcasted via socket to group: ${groupId}`);
        }
      } else {
        console.warn('Socket.io instance not available for real-time broadcasting');
      }
    } catch (socketError) {
      // Log socket error but don't fail the request since message was saved successfully
      const socketBroadcastError = createError('Failed to broadcast message via socket', {
        code: 'SOCKET_BROADCAST_ERROR',
        category: ErrorCategory.BUSINESS_LOGIC,
        severity: ErrorSeverity.MEDIUM,
        cause: socketError,
        metadata: { 
          messageId: message._id,
          groupId, 
          userId,
          groupName: group.name
        }
      });
      
      logChatError(socketBroadcastError, requestContext, 'Socket message broadcasting');
    }

    // Log successful operation completion
    const totalDuration = Date.now() - startTime;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${new Date().toISOString()}] Message sent successfully: ${message._id} in ${totalDuration}ms`);
    }

    // Log slow operations as warnings
    if (totalDuration > 3000) {
      console.warn(`[SLOW OPERATION] Message send took ${totalDuration}ms for group ${groupId} (message: ${message._id})`);
    }

    res.status(201).json(formattedMessage);
  } catch (error) {
    // Use enhanced error handling and response creation
    const errorResponse = createChatErrorResponse(error, requestContext, 'Send group message');
    
    // Determine appropriate HTTP status code based on error classification
    let statusCode = 500;
    if (error.classification) {
      switch (error.classification.category) {
        case ErrorCategory.VALIDATION:
        case ErrorCategory.INPUT:
          statusCode = 400;
          break;
        case ErrorCategory.AUTHENTICATION:
          statusCode = 401;
          break;
        case ErrorCategory.AUTHORIZATION:
          statusCode = 403;
          break;
        case ErrorCategory.CONNECTION:
        case ErrorCategory.RESOURCE:
          statusCode = 503;
          break;
        default:
          statusCode = 500;
      }
    }
    
    res.status(statusCode).json(errorResponse);
  }
});

// Create new chat group
router.post('/groups', [
  body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Group name must be between 1 and 255 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
  body('type').optional().isIn(['public', 'private', 'announcement']).withMessage('Invalid group type')
], async (req, res) => {
  const startTime = Date.now();
  const requestContext = {
    userId: req.user?.userId,
    method: req.method,
    path: req.path,
    endpoint: '/groups',
    startTime,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    groupName: req.body?.name,
    groupType: req.body?.type
  };

  try {
    // Enhanced request validation with logging
    const validationError = validateAndLogRequest(req, requestContext);
    if (validationError) {
      return res.status(400).json(validationError);
    }

    const { name, description, type = 'public' } = req.body;
    const userId = req.user.userId;

    // Log operation start for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${new Date().toISOString()}] Creating chat group: ${name}, type: ${type}, user: ${userId}`);
    }

    // Get user's neighbourhood with enhanced error handling
    const user = await executeQuery(
      () => User.findById(userId).select('neighbourhoodId firstName lastName'),
      {
        operationName: 'Fetch user neighbourhood info',
        timeout: 5000,
        metadata: { userId, operation: 'create_group' },
        retryOptions: {
          maxRetries: 2,
          initialDelayMs: 300
        }
      }
    );

    if (!user || !user.neighbourhoodId) {
      const neighbourhoodError = createError('User must be assigned to a neighbourhood to create groups', {
        code: 'USER_NO_NEIGHBOURHOOD',
        category: ErrorCategory.BUSINESS_LOGIC,
        severity: ErrorSeverity.MEDIUM,
        metadata: { userId, hasUser: !!user, hasNeighbourhood: !!user?.neighbourhoodId }
      });
      
      const errorResponse = createChatErrorResponse(neighbourhoodError, requestContext, 'User neighbourhood validation');
      return res.status(400).json(errorResponse);
    }

    // Check for duplicate group names in the same neighbourhood (optional business rule)
    const existingGroup = await executeQuery(
      () => ChatGroup.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') }, // Case-insensitive match
        neighbourhoodId: user.neighbourhoodId,
        isActive: true
      }),
      {
        operationName: 'Check for duplicate group name',
        timeout: 5000,
        metadata: { userId, groupName: name, neighbourhoodId: user.neighbourhoodId },
        retryOptions: {
          maxRetries: 1,
          initialDelayMs: 200
        }
      }
    );

    if (existingGroup) {
      const duplicateError = createError('A group with this name already exists in your neighbourhood', {
        code: 'DUPLICATE_GROUP_NAME',
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.MEDIUM,
        metadata: { 
          userId, 
          groupName: name, 
          neighbourhoodId: user.neighbourhoodId,
          existingGroupId: existingGroup._id
        }
      });
      
      const errorResponse = createChatErrorResponse(duplicateError, requestContext, 'Duplicate group name check');
      return res.status(400).json(errorResponse);
    }

    // Create chat group with enhanced error handling
    const chatGroup = await executeQuery(
      async () => {
        const newGroup = new ChatGroup({
          name,
          description,
          type,
          neighbourhoodId: user.neighbourhoodId,
          createdBy: userId,
          members: [{
            userId: userId,
            role: 'admin',
            joinedAt: new Date()
          }],
          isActive: true,
          lastActivity: new Date()
        });
        return await newGroup.save();
      },
      {
        operationName: 'Create new chat group',
        timeout: 10000,
        metadata: { 
          userId, 
          groupName: name, 
          groupType: type,
          neighbourhoodId: user.neighbourhoodId,
          creatorName: `${user.firstName} ${user.lastName}`.trim()
        },
        retryOptions: {
          maxRetries: 2,
          initialDelayMs: 500
        }
      }
    );

    // Populate group data with error handling
    await executeQuery(
      () => chatGroup.populate('createdBy', 'firstName lastName'),
      {
        operationName: 'Populate group creator info',
        timeout: 5000,
        metadata: { groupId: chatGroup._id, createdBy: userId },
        retryOptions: {
          maxRetries: 1,
          initialDelayMs: 200
        }
      }
    );

    await executeQuery(
      () => chatGroup.populate('members.userId', 'firstName lastName'),
      {
        operationName: 'Populate group members info',
        timeout: 5000,
        metadata: { groupId: chatGroup._id, memberCount: chatGroup.members.length },
        retryOptions: {
          maxRetries: 1,
          initialDelayMs: 200
        }
      }
    );

    // Log successful operation completion
    const totalDuration = Date.now() - startTime;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${new Date().toISOString()}] Chat group created successfully: ${chatGroup._id} (${name}) in ${totalDuration}ms`);
    }

    // Log slow operations as warnings
    if (totalDuration > 2000) {
      console.warn(`[SLOW OPERATION] Create chat group took ${totalDuration}ms for group ${name} (${chatGroup._id})`);
    }

    res.status(201).json({
      id: chatGroup._id,
      name: chatGroup.name,
      description: chatGroup.description,
      type: chatGroup.type,
      memberRole: 'admin',
      memberCount: chatGroup.members.length,
      messageCount: 0,
      lastMessage: null,
      lastActivity: chatGroup.lastActivity,
      createdAt: chatGroup.createdAt
    });
  } catch (error) {
    // Use enhanced error handling and response creation
    const errorResponse = createChatErrorResponse(error, requestContext, 'Create chat group');
    
    // Determine appropriate HTTP status code based on error classification
    let statusCode = 500;
    if (error.classification) {
      switch (error.classification.category) {
        case ErrorCategory.VALIDATION:
        case ErrorCategory.INPUT:
        case ErrorCategory.BUSINESS_LOGIC:
          statusCode = 400;
          break;
        case ErrorCategory.AUTHENTICATION:
          statusCode = 401;
          break;
        case ErrorCategory.AUTHORIZATION:
          statusCode = 403;
          break;
        case ErrorCategory.CONNECTION:
        case ErrorCategory.RESOURCE:
          statusCode = 503;
          break;
        default:
          statusCode = 500;
      }
    }
    
    res.status(statusCode).json(errorResponse);
  }
});

// Join a chat group
router.post('/groups/:groupId/join', async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const userId = req.user.userId;

    const group = await ChatGroup.findOne({
      _id: groupId,
      isActive: true,
      type: { $in: ['public'] } // Only allow joining public groups
    });

    if (!group) {
      return res.status(404).json({ message: 'Group not found or not joinable' });
    }

    // Check if user is already a member
    const existingMember = group.members.find(member => member.userId.toString() === userId);
    if (existingMember) {
      return res.status(400).json({ message: 'Already a member of this group' });
    }

    // Add user to group
    group.members.push({
      userId: userId,
      role: 'member',
      joinedAt: new Date()
    });

    await group.save();

    res.json({ message: 'Successfully joined the group' });
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Leave a chat group
router.post('/groups/:groupId/leave', async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const userId = req.user.userId;

    const group = await ChatGroup.findOne({
      _id: groupId,
      isActive: true
    });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Remove user from group
    group.members = group.members.filter(member => member.userId.toString() !== userId);

    // If no members left, deactivate the group
    if (group.members.length === 0) {
      group.isActive = false;
    }

    await group.save();

    res.json({ message: 'Successfully left the group' });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add or remove reaction to a message
router.post('/messages/:messageId/react', [
  body('reactionType').isIn(['thumbs_up', 'heart', 'smile', 'laugh', 'sad', 'angry'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const messageId = req.params.messageId;
    const { reactionType } = req.body;
    const userId = req.user.userId;

    // Find the message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Verify user has access to this message (either group member or private chat participant)
    let hasAccess = false;
    
    if (message.chatType === 'group') {
      const group = await ChatGroup.findOne({
        _id: message.chatId,
        'members.userId': userId,
        isActive: true
      });
      hasAccess = !!group;
    } else if (message.chatType === 'private') {
      const PrivateChat = require('../models/PrivateChat');
      const privateChat = await PrivateChat.findOne({
        _id: message.chatId,
        participants: userId,
        isActive: true
      });
      hasAccess = !!privateChat;
    }

    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to react to this message' });
    }

    // Find existing reaction of this type
    let reaction = message.reactions.find(r => r.type === reactionType);
    
    if (!reaction) {
      // Create new reaction
      reaction = {
        type: reactionType,
        users: [userId],
        count: 1
      };
      message.reactions.push(reaction);
    } else {
      // Check if user already reacted with this type
      const userIndex = reaction.users.indexOf(userId);
      
      if (userIndex > -1) {
        // Remove user's reaction
        reaction.users.splice(userIndex, 1);
        reaction.count = Math.max(0, reaction.count - 1);
        
        // Remove reaction if no users left
        if (reaction.count === 0) {
          message.reactions = message.reactions.filter(r => r.type !== reactionType);
        }
      } else {
        // Add user's reaction
        reaction.users.push(userId);
        reaction.count += 1;
      }
    }

    await message.save();

    // Format reactions for response
    const formattedReactions = message.reactions.map(r => ({
      type: r.type,
      count: r.count,
      users: r.users
    }));

    res.json({
      messageId: message._id,
      reactions: formattedReactions
    });
  } catch (error) {
    console.error('React to message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get group members
router.get('/groups/:groupId/members', async (req, res) => {
  const startTime = Date.now();
  const requestContext = {
    groupId: req.params.groupId,
    userId: req.user?.userId,
    method: req.method,
    path: req.path,
    endpoint: '/groups/:groupId/members',
    startTime,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  };

  try {
    const groupId = req.params.groupId;
    const userId = req.user.userId;

    // Validate ObjectId format for groupId
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      const invalidIdError = createError('Invalid group ID format', {
        code: 'INVALID_GROUP_ID',
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.MEDIUM,
        metadata: { groupId, userId }
      });
      
      const errorResponse = createChatErrorResponse(invalidIdError, requestContext, 'Group ID validation');
      return res.status(400).json(errorResponse);
    }

    // Log operation start for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${new Date().toISOString()}] Fetching group members for group: ${groupId}, user: ${userId}`);
    }

    // Verify user is member of the group with enhanced error handling
    const group = await executeQuery(
      () => ChatGroup.findOne({
        _id: groupId,
        'members.userId': userId,
        isActive: true
      }).populate('members.userId', 'firstName lastName profileImageUrl'),
      {
        operationName: 'Fetch group with members',
        timeout: 10000,
        metadata: { groupId, userId, operation: 'get_group_members' },
        retryOptions: {
          maxRetries: 2,
          initialDelayMs: 500
        }
      }
    );

    if (!group) {
      const accessError = createError('Not a member of this group or group not found', {
        code: 'GROUP_ACCESS_DENIED',
        category: ErrorCategory.AUTHORIZATION,
        severity: ErrorSeverity.MEDIUM,
        metadata: { groupId, userId, operation: 'get_group_members' }
      });
      
      const errorResponse = createChatErrorResponse(accessError, requestContext, 'Group access verification');
      return res.status(403).json(errorResponse);
    }

    // Log successful group verification
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${new Date().toISOString()}] User verified as group member. Group: ${group.name}, Members: ${group.members.length}`);
    }

    // Format members with proper null handling and validation
    const members = group.members.map(member => {
      // Validate member data
      if (!member.userId) {
        console.warn(`Member with missing userId in group ${groupId}:`, member);
        return null;
      }

      return {
        _id: member.userId._id,
        firstName: member.userId.firstName || '',
        lastName: member.userId.lastName || '',
        profileImageUrl: member.userId.profileImageUrl || null,
        role: member.role || 'member',
        joinedAt: member.joinedAt || null,
        // Additional fields for frontend compatibility
        id: member.userId._id, // Alternative ID field
        fullName: `${member.userId.firstName || ''} ${member.userId.lastName || ''}`.trim() || 'Unknown User'
      };
    }).filter(member => member !== null); // Remove any invalid members

    // Log successful operation completion
    const totalDuration = Date.now() - startTime;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${new Date().toISOString()}] Group members fetched successfully: ${members.length} members in ${totalDuration}ms`);
    }

    // Log slow operations as warnings
    if (totalDuration > 1000) {
      console.warn(`[SLOW OPERATION] Get group members took ${totalDuration}ms for group ${groupId} (${members.length} members)`);
    }

    res.json(members);
  } catch (error) {
    // Use enhanced error handling and response creation
    const errorResponse = createChatErrorResponse(error, requestContext, 'Get group members');
    
    // Determine appropriate HTTP status code based on error classification
    let statusCode = 500;
    if (error.classification) {
      switch (error.classification.category) {
        case ErrorCategory.VALIDATION:
        case ErrorCategory.INPUT:
          statusCode = 400;
          break;
        case ErrorCategory.AUTHENTICATION:
          statusCode = 401;
          break;
        case ErrorCategory.AUTHORIZATION:
          statusCode = 403;
          break;
        case ErrorCategory.CONNECTION:
        case ErrorCategory.RESOURCE:
          statusCode = 503;
          break;
        default:
          statusCode = 500;
      }
    }
    
    res.status(statusCode).json(errorResponse);
  }
});

module.exports = router;