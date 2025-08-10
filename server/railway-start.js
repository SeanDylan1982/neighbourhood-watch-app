#!/usr/bin/env node

/**
 * Railway-optimized startup script
 * Starts the server as quickly as possible to pass health checks
 */

console.log('🚀 Starting Railway deployment...');

// Set production environment
process.env.NODE_ENV = 'production';

// Reduce startup logging
process.env.SUPPRESS_NO_CONFIG_WARNING = 'true';

// Start the main server
require('./index.js');