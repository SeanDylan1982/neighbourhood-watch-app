// Netlify Function: Health Check
const { handleCors, createResponse } = require('./utils/cors');

exports.handler = async (event, context) => {
  // Handle CORS preflight
  const corsResponse = handleCors(event);
  if (corsResponse) return corsResponse;

  // Only allow GET method
  if (event.httpMethod !== 'GET') {
    return createResponse(405, { error: 'Method not allowed' });
  }

  try {
    return createResponse(200, {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      platform: 'netlify-functions',
      version: '1.0.0',
    });

  } catch (error) {
    console.error('Health check error:', error);
    return createResponse(500, { 
      error: 'Internal server error' 
    });
  }
};