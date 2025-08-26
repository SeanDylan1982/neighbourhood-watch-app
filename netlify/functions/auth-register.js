const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectToDatabase } = require('./utils/database');
const { corsHeaders, handleCors } = require('./utils/cors');

// User Schema (inline for serverless)
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  profileImageUrl: {
    type: String
  },
  role: {
    type: String,
    enum: ['admin', 'moderator', 'user'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  neighbourhoodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Neighbourhood'
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 500
  },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['active', 'suspended', 'banned'],
    default: 'active'
  },
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
  },
  legalAcceptance: {
    termsOfService: {
      accepted: { type: Boolean, default: false },
      version: { type: String },
      timestamp: { type: Date }
    },
    privacyPolicy: {
      accepted: { type: Boolean, default: false },
      version: { type: String },
      timestamp: { type: Date }
    },
    noticeBoardTerms: {
      accepted: { type: Boolean, default: false },
      timestamp: { type: Date }
    },
    reportTerms: {
      accepted: { type: Boolean, default: false },
      timestamp: { type: Date }
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Transform output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Create text index for search functionality
userSchema.index({ 
  firstName: 'text', 
  lastName: 'text', 
  email: 'text',
  bio: 'text'
}, {
  weights: {
    firstName: 10,
    lastName: 10,
    email: 5,
    bio: 1
  },
  name: 'user_search_index'
});

// Create index for neighbourhood lookup
userSchema.index({ neighbourhoodId: 1, isActive: 1 });

// Get or create User model
const User = mongoose.models.User || mongoose.model('User', userSchema);

// Validation helper functions
const isEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPassword = (password) => {
  return password && password.length >= 6;
};

const isValidName = (name) => {
  return name && name.trim().length >= 1;
};

const isValidPhone = (phone) => {
  if (!phone) return true; // Optional field
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

const isMongoId = (id) => {
  if (!id) return true; // Optional field
  return mongoose.Types.ObjectId.isValid(id);
};

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  // Only allow POST method
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  }

  try {
    // Connect to database
    await connectToDatabase();

    // Parse request body
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (error) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Invalid JSON in request body' })
      };
    }

    console.log('Registration attempt:', body);

    // Validate required fields
    const { email, password, firstName, lastName, phone, address, neighbourhoodId, acceptedTerms } = body;

    const errors = [];

    // Email validation
    if (!email) {
      errors.push({ field: 'email', message: 'Email is required' });
    } else if (!isEmail(email)) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }

    // Password validation
    if (!password) {
      errors.push({ field: 'password', message: 'Password is required' });
    } else if (!isValidPassword(password)) {
      errors.push({ field: 'password', message: 'Password must be at least 6 characters long' });
    }

    // Name validation
    if (!firstName || !isValidName(firstName)) {
      errors.push({ field: 'firstName', message: 'First name is required' });
    }

    if (!lastName || !isValidName(lastName)) {
      errors.push({ field: 'lastName', message: 'Last name is required' });
    }

    // Optional field validation
    if (phone && !isValidPhone(phone)) {
      errors.push({ field: 'phone', message: 'Invalid phone number format' });
    }

    if (neighbourhoodId && !isMongoId(neighbourhoodId)) {
      errors.push({ field: 'neighbourhoodId', message: 'Invalid neighbourhood ID' });
    }

    if (errors.length > 0) {
      console.log('Registration validation errors:', errors);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ errors })
      };
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'User already exists' })
      };
    }

    // Validate terms acceptance
    if (!acceptedTerms || !acceptedTerms.termsOfService || !acceptedTerms.privacyPolicy) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          message: 'You must accept the Terms of Service and Privacy Policy to create an account' 
        })
      };
    }

    // Create user with terms acceptance
    const user = new User({
      email: normalizedEmail,
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone ? phone.trim() : undefined,
      address: address ? address.trim() : undefined,
      neighbourhoodId: neighbourhoodId || undefined,
      legalAcceptance: {
        termsOfService: {
          accepted: true,
          version: '1.0.0', // Default version
          timestamp: new Date()
        },
        privacyPolicy: {
          accepted: true,
          version: '1.0.0', // Default version
          timestamp: new Date()
        }
      }
    });

    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'User registered successfully',
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          address: user.address,
          role: user.role,
          isVerified: user.isVerified,
          neighbourhoodId: user.neighbourhoodId,
          createdAt: user.createdAt
        }
      })
    };
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'User already exists' })
      };
    }

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Server error during registration' })
    };
  }
};