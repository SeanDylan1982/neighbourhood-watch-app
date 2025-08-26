// Netlify Function for user profile retrieval and updates
// Handles GET and PUT requests for /api/users/me

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

// Input validation helper
const validateUserInput = (data) => {
  const errors = [];
  
  if (data.firstName !== undefined) {
    if (!data.firstName || data.firstName.trim().length === 0) {
      errors.push({ field: 'firstName', message: 'First name is required' });
    }
  }
  
  if (data.lastName !== undefined) {
    if (!data.lastName || data.lastName.trim().length === 0) {
      errors.push({ field: 'lastName', message: 'Last name is required' });
    }
  }
  
  if (data.phone !== undefined && data.phone) {
    // Basic phone validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(data.phone.replace(/[\s\-\(\)]/g, ''))) {
      errors.push({ field: 'phone', message: 'Invalid phone number format' });
    }
  }
  
  return errors;
};

// GET handler - Get current user profile
const handleGetMe = async (userId) => {
  try {
    const user = await User.findById(userId)
      .populate('neighbourhoodId', 'name')
      .select('-password')
      .lean();

    if (!user) {
      return createResponse(404, { message: 'User not found' });
    }

    return createResponse(200, {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      address: user.address,
      profileImageUrl: user.profileImageUrl,
      role: user.role,
      isVerified: user.isVerified,
      neighbourhoodId: user.neighbourhoodId?._id,
      neighbourhoodName: user.neighbourhoodId?.name,
      createdAt: user.createdAt,
      settings: user.settings
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return createResponse(500, { 
      message: 'Failed to retrieve user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// PUT handler - Update current user profile
const handleUpdateMe = async (userId, updateData) => {
  try {
    // Validate input
    const validationErrors = validateUserInput(updateData);
    if (validationErrors.length > 0) {
      return createResponse(400, { 
        message: 'Validation failed',
        errors: validationErrors 
      });
    }

    // Build update object with only allowed fields
    const allowedFields = ['firstName', 'lastName', 'phone', 'address'];
    const updateFields = {};
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updateFields[field] = updateData[field];
      }
    });

    if (Object.keys(updateFields).length === 0) {
      return createResponse(400, { message: 'No fields to update' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return createResponse(404, { message: 'User not found' });
    }

    return createResponse(200, {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      address: user.address,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    
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
      message: 'Failed to update user profile',
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
        return await handleGetMe(userId);
        
      case 'PUT':
        if (!event.body) {
          return createResponse(400, { message: 'Request body is required' });
        }
        
        let updateData;
        try {
          updateData = JSON.parse(event.body);
        } catch (error) {
          return createResponse(400, { message: 'Invalid JSON in request body' });
        }
        
        return await handleUpdateMe(userId, updateData);
        
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