# Design Document

## Overview

This design addresses port configuration inconsistencies across Railway deployment files to ensure reliable server startup with proper port handling. The solution will standardize port configuration logic, improve error handling, and provide clear logging for deployment troubleshooting.

## Architecture

### Port Configuration Strategy

The system will implement a centralized port configuration approach that:
- Prioritizes Railway's dynamic PORT environment variable
- Falls back to a consistent default port (5001)
- Validates port values before binding
- Provides comprehensive logging for debugging

### File Structure

```
server/
├── config/
│   └── port.js          # Centralized port configuration utility
├── railway-debug.js     # Updated with standardized port logic
├── railway-minimal.js   # Updated with standardized port logic
├── railway-ultra-minimal.js # Updated with standardized port logic
└── index.js            # Main server file with standardized port logic
```

## Components and Interfaces

### Port Configuration Module (`server/config/port.js`)

```javascript
/**
 * Centralized port configuration utility
 * @returns {Object} Port configuration with validation
 */
function getPortConfig() {
  const envPort = process.env.PORT;
  const defaultPort = 5001;
  
  // Validation and fallback logic
  const port = validatePort(envPort) ? parseInt(envPort, 10) : defaultPort;
  
  return {
    port,
    source: envPort ? 'environment' : 'default',
    isRailwayManaged: !!envPort
  };
}
```

### Port Validation

```javascript
/**
 * Validates port number
 * @param {string|number} port - Port to validate
 * @returns {boolean} True if valid port
 */
function validatePort(port) {
  const portNum = parseInt(port, 10);
  return !isNaN(portNum) && portNum > 0 && portNum <= 65535;
}
```

### Enhanced Logging

```javascript
/**
 * Logs port configuration details
 * @param {Object} config - Port configuration object
 */
function logPortConfig(config) {
  console.log(`🚀 Server starting on port ${config.port}`);
  console.log(`📍 Port source: ${config.source}`);
  if (config.isRailwayManaged) {
    console.log(`🚂 Railway managed port detected`);
  }
}
```

## Data Models

### Port Configuration Object

```javascript
{
  port: number,           // The actual port to bind to
  source: string,         // 'environment' | 'default'
  isRailwayManaged: boolean // true if PORT env var is set
}
```

### Error Response Object

```javascript
{
  error: string,          // Error message
  attemptedPort: number,  // Port that failed to bind
  suggestion: string      // Suggested resolution
}
```

## Error Handling

### Port Binding Failures

1. **EADDRINUSE Error**: Port already in use
   - Log the specific port that failed
   - Suggest checking for other running processes
   - Exit with appropriate error code

2. **EACCES Error**: Permission denied
   - Log permission issue
   - Suggest running with appropriate permissions
   - Exit with appropriate error code

3. **Invalid Port Values**: Non-numeric or out-of-range ports
   - Log the invalid value received
   - Fall back to default port
   - Continue with warning

### Error Logging Format

```javascript
console.error(`❌ Failed to bind to port ${port}: ${error.message}`);
console.error(`💡 Suggestion: ${suggestion}`);
console.error(`🔍 Environment PORT: ${process.env.PORT || 'undefined'}`);
```

## Testing Strategy

### Unit Tests

1. **Port Configuration Tests**
   - Test with valid PORT environment variable
   - Test with invalid PORT environment variable
   - Test with undefined PORT environment variable
   - Test port validation function

2. **Error Handling Tests**
   - Test port binding failure scenarios
   - Test invalid port value handling
   - Test logging output format

### Integration Tests

1. **Railway Environment Simulation**
   - Mock Railway PORT environment variable
   - Test server startup with dynamic ports
   - Verify health check endpoints respond correctly

2. **Local Development Tests**
   - Test server startup without PORT environment variable
   - Verify default port usage
   - Test port conflict scenarios

### Manual Testing Checklist

1. Deploy to Railway and verify correct port binding
2. Test local development with default port
3. Test with invalid PORT environment values
4. Verify error messages are clear and actionable
5. Check health endpoint accessibility

## Implementation Files

### Files to Update

1. **server/railway-debug.js**
   - Replace current port logic with centralized configuration
   - Add enhanced error handling and logging

2. **server/railway-minimal.js**
   - Standardize port configuration
   - Improve error messages

3. **server/railway-ultra-minimal.js**
   - Apply consistent port handling
   - Add basic logging

4. **server/index.js**
   - Update main server file with new port logic
   - Ensure consistency across all entry points

### New Files to Create

1. **server/config/port.js**
   - Centralized port configuration utility
   - Validation and logging functions

## Deployment Considerations

### Railway Specific

- Railway automatically sets the PORT environment variable
- The application must bind to `0.0.0.0:${PORT}` for external access
- Health checks expect the service to respond on the assigned port

### Local Development

- Default to port 5001 when PORT is not set
- Provide clear startup messages indicating port source
- Handle port conflicts gracefully

### Environment Variables

- `PORT`: Railway-managed dynamic port (production)
- No additional environment variables required
- Backward compatible with existing configurations

## Security Considerations

1. **Port Validation**: Prevent binding to invalid or privileged ports
2. **Error Information**: Avoid exposing sensitive system information in error messages
3. **Logging**: Ensure logs don't contain sensitive environment data

## Performance Impact

- Minimal performance impact from port configuration logic
- Single validation check at startup
- No runtime performance degradation
- Improved startup reliability reduces deployment failures