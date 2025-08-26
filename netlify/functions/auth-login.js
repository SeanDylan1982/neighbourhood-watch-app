// Netlify Function: Authentication Login
const bcrypt = require('bcryptjs');
const { connectToDatabase } = require('./utils/database');
const { handleCors, createResponse } = require('./utils/cors');
const { generateTokens } = require('./utils/auth');

// Import User model (we'll need to copy this from server)
let User;

const initializeModels = async () => {
  if (!User) {
    const mongoose = require('mongoose');
    
    // Define User schema inline for now
    const userSchema = new mongoose.Schema({
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      role: { type: String, default: 'user' },
      isActive: { type: Boolean, default: true },
      neighbourhood: { type: mongoose.Schema.Types.ObjectId, ref: 'Neighbourhood' },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    });

    User = mongoose.models.User || mongoose.model('User', userSchema);
  }
};

exports.handler = async (event, context) => {
  // Handle CORS preflight
  const corsResponse = handleCors(event);
  if (corsResponse) return corsResponse;

  // Only allow POST method
  if (event.httpMethod !== 'POST') {
    return createResponse(405, { error: 'Method not allowed' });
  }

  try {
    // Connect to database
    await connectToDatabase();
    await initializeModels();

    // Parse request body
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (error) {
      return createResponse(400, { error: 'Invalid JSON in request body' });
    }

    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return createResponse(400, { 
        error: 'Email and password are required' 
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return createResponse(401, { 
        error: 'Invalid email or password' 
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return createResponse(401, { 
        error: 'Account is deactivated. Please contact support.' 
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return createResponse(401, { 
        error: 'Invalid email or password' 
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Return success response
    return createResponse(200, {
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        neighbourhood: user.neighbourhood,
      },
      token: accessToken,
      refreshToken: refreshToken,
    });

  } catch (error) {
    console.error('Login function error:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      return createResponse(503, { 
        error: 'Database connection error. Please try again later.' 
      });
    }

    return createResponse(500, { 
      error: 'Internal server error' 
    });
  }
};