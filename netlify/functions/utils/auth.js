// Authentication utility for Netlify Functions
const jwt = require('jsonwebtoken');

const authenticateToken = (event) => {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return { error: 'Access token required', status: 401 };
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    return { user };
  } catch (error) {
    console.error('Token verification error:', error);
    return { error: 'Invalid or expired token', status: 403 };
  }
};

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { 
      id: user._id || user.id,
      email: user.email,
      role: user.role || 'user'
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { 
      id: user._id || user.id,
      email: user.email 
    },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
  } catch (error) {
    console.error('Refresh token verification error:', error);
    return null;
  }
};

module.exports = {
  authenticateToken,
  generateTokens,
  verifyRefreshToken,
};