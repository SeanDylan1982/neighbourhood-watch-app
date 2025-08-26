// Netlify Function for user settings management
// Handles PUT requests for /api/users/settings

const { connectToDatabase } = require('./utils/database');
const { authenticateToken } = require('./utils/auth');
const { handleCors, createResponse } = require('./utils/cors');

// Import models and utilities
const mongoose = require('mongoose');

// User model schema (inline for serverless)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  address: { type: String, trim: true },
  profileImageUrl: { type: String },
  role: { type: String, enum: ['admin', 'moderator', 'user'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  neighbourhoodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Neighbourhood' },
  bio: { type: String, trim: true, maxlength: 500 },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['active', 'suspended', 'banned'], default: 'active' },
  settings: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      friendRequests: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      chatNotifications: { type: Boolean, default: true },
      reportNotifications: { type: Boolean, default: true }
    },
    privacy: {
      profileVisibility: { 
        type: String, 
        enum: ['public', 'neighbours', 'friends', 'private'],
        default: 'neighbours'
      },
      messagePermissions: {
        type: String,
        enum: ['everyone', 'neighbours', 'friends', 'none'],
        default: 'friends'
      }
    },
    locationSharing: { type: Boolean, default: false },
    dismissedWelcomeMessages: {
      chat: { type: Boolean, default: false },
      noticeBoard: { type: Boolean, default: false },
      reports: { type: Boolean, default: false }
    },
    welcomeMessageStates: {
      chat: {
        dismissed: { type: Boolean, default: false },
        collapsed: { type: Boolean, default: false }
      },
      noticeBoard: {
        dismissed: { type: Boolean, default: false },
        collapsed: { type: Boolean, default: false }
      },
      reports: {
        dismissed: { type: Boolean, default: false },
        collapsed: { type: Boolean, default: false }
      }
    },
    interface: {
      sidebarExpanded: { type: Boolean, default: false },
      darkMode: { type: Boolean, default: false },
      language: { type: String, default: 'en' }
    }
  }
}, { timestamps: true });

// Get or create User model
const User = mongoose.models.User || mongoose.model('User', userSchema);

// Settings validation helper
const validateSettings = (settingsData) => {
  const errors = [];
  
  // Validate boolean fields
  const booleanFields = [
    'notificationsEnabled', 'emailNotifications', 'pushNotifications',
    'chatNotifications', 'reportNotifications', 'locationSharing'
  ];
  
  booleanFields.forEach(field => {
    if (settingsData[field] !== undefined && typeof settingsData[field] !== 'boolean') {
      errors.push({ field, message: `${field} must be a boolean value` });
    }
  });
  
  // Validate privacy level
  if (settingsData.privacyLevel !== undefined) {
    const validPrivacyLevels = ['public', 'neighbours', 'contacts', 'private'];
    if (!validPrivacyLevels.includes(settingsData.privacyLevel)) {
      errors.push({ 
        field: 'privacyLevel', 
        message: `Privacy level must be one of: ${validPrivacyLevels.join(', ')}` 
      });
    }
  }
  
  // Validate nested objects
  if (settingsData.dismissedWelcomeMessages !== undefined) {
    if (typeof settingsData.dismissedWelcomeMessages !== 'object') {
      errors.push({ 
        field: 'dismissedWelcomeMessages', 
        message: 'dismissedWelcomeMessages must be an object' 
      });
    } else {
      const validKeys = ['chat', 'noticeBoard', 'reports'];
      Object.keys(settingsData.dismissedWelcomeMessages).forEach(key => {
        if (!validKeys.includes(key)) {
          errors.push({ 
            field: `dismissedWelcomeMessages.${key}`, 
            message: `Invalid key in dismissedWelcomeMessages: ${key}` 
          });
        } else if (typeof settingsData.dismissedWelcomeMessages[key] !== 'boolean') {
          errors.push({ 
            field: `dismissedWelcomeMessages.${key}`, 
            message: `dismissedWelcomeMessages.${key} must be a boolean` 
          });
        }
      });
    }
  }
  
  // Validate welcomeMessageStates
  if (settingsData.welcomeMessageStates !== undefined) {
    if (typeof settingsData.welcomeMessageStates !== 'object') {
      errors.push({ 
        field: 'welcomeMessageStates', 
        message: 'welcomeMessageStates must be an object' 
      });
    } else {
      const validMessageTypes = ['chat', 'noticeBoard', 'reports'];
      Object.keys(settingsData.welcomeMessageStates).forEach(messageType => {
        if (!validMessageTypes.includes(messageType)) {
          errors.push({ 
            field: `welcomeMessageStates.${messageType}`, 
            message: `Invalid message type: ${messageType}` 
          });
        } else {
          const stateObj = settingsData.welcomeMessageStates[messageType];
          if (typeof stateObj !== 'object') {
            errors.push({ 
              field: `welcomeMessageStates.${messageType}`, 
              message: `welcomeMessageStates.${messageType} must be an object` 
            });
          } else {
            const validStateKeys = ['dismissed', 'collapsed'];
            Object.keys(stateObj).forEach(stateKey => {
              if (!validStateKeys.includes(stateKey)) {
                errors.push({ 
                  field: `welcomeMessageStates.${messageType}.${stateKey}`, 
                  message: `Invalid state key: ${stateKey}` 
                });
              } else if (typeof stateObj[stateKey] !== 'boolean') {
                errors.push({ 
                  field: `welcomeMessageStates.${messageType}.${stateKey}`, 
                  message: `welcomeMessageStates.${messageType}.${stateKey} must be a boolean` 
                });
              }
            });
          }
        }
      });
    }
  }
  
  return errors;
};

// PUT handler - Update user settings
const handleUpdateSettings = async (userId, settingsUpdate) => {
  try {
    // Validate settings input
    const validationErrors = validateSettings(settingsUpdate);
    if (validationErrors.length > 0) {
      return createResponse(400, { 
        message: 'Validation failed',
        errors: validationErrors 
      });
    }

    // Build the settings update object using dot notation for nested fields
    const updateData = {};
    
    // Handle simple boolean settings
    const simpleBooleanFields = [
      'notificationsEnabled', 'emailNotifications', 'pushNotifications',
      'chatNotifications', 'reportNotifications', 'locationSharing'
    ];
    
    simpleBooleanFields.forEach(field => {
      if (settingsUpdate[field] !== undefined) {
        // Map to the correct nested structure
        switch (field) {
          case 'emailNotifications':
            updateData['settings.notifications.email'] = settingsUpdate[field];
            break;
          case 'pushNotifications':
            updateData['settings.notifications.push'] = settingsUpdate[field];
            break;
          case 'chatNotifications':
            updateData['settings.notifications.chatNotifications'] = settingsUpdate[field];
            break;
          case 'reportNotifications':
            updateData['settings.notifications.reportNotifications'] = settingsUpdate[field];
            break;
          case 'locationSharing':
            updateData['settings.locationSharing'] = settingsUpdate[field];
            break;
          default:
            updateData[`settings.${field}`] = settingsUpdate[field];
        }
      }
    });
    
    // Handle privacy level
    if (settingsUpdate.privacyLevel !== undefined) {
      updateData['settings.privacy.profileVisibility'] = settingsUpdate.privacyLevel;
    }
    
    // Handle dismissedWelcomeMessages
    if (settingsUpdate.dismissedWelcomeMessages !== undefined) {
      Object.keys(settingsUpdate.dismissedWelcomeMessages).forEach(key => {
        if (settingsUpdate.dismissedWelcomeMessages[key] !== undefined) {
          updateData[`settings.dismissedWelcomeMessages.${key}`] = settingsUpdate.dismissedWelcomeMessages[key];
        }
      });
    }
    
    // Handle welcomeMessageStates
    if (settingsUpdate.welcomeMessageStates !== undefined) {
      Object.keys(settingsUpdate.welcomeMessageStates).forEach(messageType => {
        if (settingsUpdate.welcomeMessageStates[messageType] !== undefined) {
          Object.keys(settingsUpdate.welcomeMessageStates[messageType]).forEach(stateKey => {
            if (settingsUpdate.welcomeMessageStates[messageType][stateKey] !== undefined) {
              updateData[`settings.welcomeMessageStates.${messageType}.${stateKey}`] = 
                settingsUpdate.welcomeMessageStates[messageType][stateKey];
            }
          });
        }
      });
    }

    if (Object.keys(updateData).length === 0) {
      return createResponse(400, { message: 'No settings to update' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('settings');

    if (!user) {
      return createResponse(404, { message: 'User not found' });
    }

    return createResponse(200, { 
      message: 'Settings updated successfully', 
      settings: user.settings 
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return createResponse(400, { 
        message: 'Validation failed',
        errors: validationErrors 
      });
    }
    
    return createResponse(500, { 
      message: 'Failed to update user settings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET handler - Get user settings
const handleGetSettings = async (userId) => {
  try {
    const user = await User.findById(userId)
      .select('settings')
      .lean();

    if (!user) {
      return createResponse(404, { message: 'User not found' });
    }

    return createResponse(200, { 
      settings: user.settings || {} 
    });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return createResponse(500, { 
      message: 'Failed to retrieve user settings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Main handler
exports.handler = async (event, context) => {
  // Handle CORS preflight
  const corsResponse = handleCors(event);
  if (corsResponse) return corsResponse;

  try {
    // Connect to database
    await connectToDatabase();

    // Authenticate user
    const authResult = authenticateToken(event);
    if (authResult.error) {
      return createResponse(authResult.status, { message: authResult.error });
    }

    const userId = authResult.user.id;
    const method = event.httpMethod;

    switch (method) {
      case 'GET':
        return await handleGetSettings(userId);
        
      case 'PUT':
        if (!event.body) {
          return createResponse(400, { message: 'Request body is required' });
        }
        
        let settingsData;
        try {
          settingsData = JSON.parse(event.body);
        } catch (error) {
          return createResponse(400, { message: 'Invalid JSON in request body' });
        }
        
        return await handleUpdateSettings(userId, settingsData);
        
      default:
        return createResponse(405, { message: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Function error:', error);
    return createResponse(500, { 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};