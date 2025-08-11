/**
 * Centralized port configuration utility for Railway deployment
 * Handles Railway's dynamic PORT environment variable with fallback to default port
 */

/**
 * Validates if a port number is valid
 * @param {string|number} port - Port to validate
 * @returns {boolean} True if valid port
 */
function validatePort(port) {
  if (port === null || port === undefined || port === '') {
    return false;
  }
  
  // Convert to string to check for exact numeric match
  const portStr = String(port).trim();
  
  // Check if it's a valid number string (no non-numeric characters)
  if (!/^\d+$/.test(portStr)) {
    return false;
  }
  
  const portNum = parseInt(portStr, 10);
  return !isNaN(portNum) && portNum > 0 && portNum <= 65535;
}

/**
 * Gets port configuration with Railway environment variable handling
 * @returns {Object} Port configuration object
 */
function getPortConfig() {
  const envPort = process.env.PORT;
  const defaultPort = 5001;
  
  // Validate and use environment port if available, otherwise use default
  const isValidEnvPort = validatePort(envPort);
  const port = isValidEnvPort ? parseInt(envPort, 10) : defaultPort;
  
  return {
    port,
    source: isValidEnvPort ? 'environment' : 'default',
    isRailwayManaged: isValidEnvPort
  };
}

/**
 * Logs port configuration details for debugging
 * @param {Object} config - Port configuration object
 */
function logPortConfig(config) {
  console.log(`🚀 Server starting on port ${config.port}`);
  console.log(`📍 Port source: ${config.source}`);
  
  if (config.isRailwayManaged) {
    console.log(`🚂 Railway managed port detected`);
  } else {
    console.log(`🏠 Using default port for local development`);
  }
}

/**
 * Logs port binding error with helpful information
 * @param {Error} error - The error that occurred
 * @param {number} port - The port that failed to bind
 */
function logPortError(error, port) {
  console.error(`❌ Failed to bind to port ${port}: ${error.message}`);
  
  if (error.code === 'EADDRINUSE') {
    console.error(`💡 Suggestion: Port ${port} is already in use. Check for other running processes.`);
  } else if (error.code === 'EACCES') {
    console.error(`💡 Suggestion: Permission denied for port ${port}. Try running with appropriate permissions.`);
  }
  
  console.error(`🔍 Environment PORT: ${process.env.PORT || 'undefined'}`);
}

export {
  getPortConfig,
  validatePort,
  logPortConfig,
  logPortError
};