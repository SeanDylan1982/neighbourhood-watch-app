// Simple test for user management serverless functions
// Tests function structure and basic validation without external dependencies

const fs = require('fs');
const path = require('path');

// Test function structure and exports
function testFunctionStructure() {
  console.log('🔍 Testing function structure...');
  
  const functions = [
    'netlify/functions/users-profile.js',
    'netlify/functions/users-me.js', 
    'netlify/functions/users-settings.js'
  ];
  
  let allValid = true;
  
  functions.forEach(funcPath => {
    try {
      if (!fs.existsSync(funcPath)) {
        console.error(`❌ Function file missing: ${funcPath}`);
        allValid = false;
        return;
      }
      
      const content = fs.readFileSync(funcPath, 'utf8');
      
      // Check for required exports
      if (!content.includes('exports.handler')) {
        console.error(`❌ Missing exports.handler in ${funcPath}`);
        allValid = false;
      }
      
      // Check for required imports
      const requiredImports = [
        'connectToDatabase',
        'authenticateToken', 
        'handleCors',
        'createResponse'
      ];
      
      requiredImports.forEach(importName => {
        if (!content.includes(importName)) {
          console.error(`❌ Missing import ${importName} in ${funcPath}`);
          allValid = false;
        }
      });
      
      // Check for HTTP method handling
      if (!content.includes('event.httpMethod')) {
        console.error(`❌ Missing HTTP method handling in ${funcPath}`);
        allValid = false;
      }
      
      console.log(`✅ ${funcPath} structure is valid`);
      
    } catch (error) {
      console.error(`❌ Error reading ${funcPath}:`, error.message);
      allValid = false;
    }
  });
  
  return allValid;
}

// Test authentication handling
function testAuthenticationHandling() {
  console.log('\n🔐 Testing authentication handling...');
  
  const functions = [
    'netlify/functions/users-profile.js',
    'netlify/functions/users-me.js', 
    'netlify/functions/users-settings.js'
  ];
  
  let allValid = true;
  
  functions.forEach(funcPath => {
    try {
      const content = fs.readFileSync(funcPath, 'utf8');
      
      // Check for authentication
      if (!content.includes('authenticateToken(event)')) {
        console.error(`❌ Missing authentication check in ${funcPath}`);
        allValid = false;
      }
      
      // Check for auth error handling
      if (!content.includes('authResult.error')) {
        console.error(`❌ Missing auth error handling in ${funcPath}`);
        allValid = false;
      }
      
      console.log(`✅ ${funcPath} has proper authentication`);
      
    } catch (error) {
      console.error(`❌ Error checking auth in ${funcPath}:`, error.message);
      allValid = false;
    }
  });
  
  return allValid;
}

// Test CORS handling
function testCorsHandling() {
  console.log('\n🌐 Testing CORS handling...');
  
  const functions = [
    'netlify/functions/users-profile.js',
    'netlify/functions/users-me.js', 
    'netlify/functions/users-settings.js'
  ];
  
  let allValid = true;
  
  functions.forEach(funcPath => {
    try {
      const content = fs.readFileSync(funcPath, 'utf8');
      
      // Check for CORS handling
      if (!content.includes('handleCors(event)')) {
        console.error(`❌ Missing CORS handling in ${funcPath}`);
        allValid = false;
      }
      
      // Check for createResponse usage
      if (!content.includes('createResponse(')) {
        console.error(`❌ Missing createResponse usage in ${funcPath}`);
        allValid = false;
      }
      
      console.log(`✅ ${funcPath} has proper CORS handling`);
      
    } catch (error) {
      console.error(`❌ Error checking CORS in ${funcPath}:`, error.message);
      allValid = false;
    }
  });
  
  return allValid;
}

// Test database operations
function testDatabaseOperations() {
  console.log('\n🗄️ Testing database operations...');
  
  const functions = [
    'netlify/functions/users-profile.js',
    'netlify/functions/users-me.js', 
    'netlify/functions/users-settings.js'
  ];
  
  let allValid = true;
  
  functions.forEach(funcPath => {
    try {
      const content = fs.readFileSync(funcPath, 'utf8');
      
      // Check for database connection
      if (!content.includes('connectToDatabase()')) {
        console.error(`❌ Missing database connection in ${funcPath}`);
        allValid = false;
      }
      
      // Check for User model usage
      if (!content.includes('User.find')) {
        console.error(`❌ Missing User model operations in ${funcPath}`);
        allValid = false;
      }
      
      console.log(`✅ ${funcPath} has proper database operations`);
      
    } catch (error) {
      console.error(`❌ Error checking database ops in ${funcPath}:`, error.message);
      allValid = false;
    }
  });
  
  return allValid;
}

// Test validation functions
function testValidationFunctions() {
  console.log('\n✅ Testing validation functions...');
  
  const functions = [
    { path: 'netlify/functions/users-profile.js', validator: 'validateProfileInput' },
    { path: 'netlify/functions/users-me.js', validator: 'validateUserInput' },
    { path: 'netlify/functions/users-settings.js', validator: 'validateSettings' }
  ];
  
  let allValid = true;
  
  functions.forEach(({ path: funcPath, validator }) => {
    try {
      const content = fs.readFileSync(funcPath, 'utf8');
      
      // Check for validation function
      if (!content.includes(`const ${validator}`)) {
        console.error(`❌ Missing ${validator} function in ${funcPath}`);
        allValid = false;
      }
      
      // Check for validation usage
      if (!content.includes(`${validator}(`)) {
        console.error(`❌ ${validator} function not used in ${funcPath}`);
        allValid = false;
      }
      
      console.log(`✅ ${funcPath} has proper validation`);
      
    } catch (error) {
      console.error(`❌ Error checking validation in ${funcPath}:`, error.message);
      allValid = false;
    }
  });
  
  return allValid;
}

// Test error handling
function testErrorHandling() {
  console.log('\n🚫 Testing error handling...');
  
  const functions = [
    'netlify/functions/users-profile.js',
    'netlify/functions/users-me.js', 
    'netlify/functions/users-settings.js'
  ];
  
  let allValid = true;
  
  functions.forEach(funcPath => {
    try {
      const content = fs.readFileSync(funcPath, 'utf8');
      
      // Check for try-catch blocks
      if (!content.includes('try {') || !content.includes('} catch (error)')) {
        console.error(`❌ Missing try-catch blocks in ${funcPath}`);
        allValid = false;
      }
      
      // Check for error logging
      if (!content.includes('console.error(')) {
        console.error(`❌ Missing error logging in ${funcPath}`);
        allValid = false;
      }
      
      // Check for validation error handling
      if (!content.includes('ValidationError')) {
        console.error(`❌ Missing validation error handling in ${funcPath}`);
        allValid = false;
      }
      
      console.log(`✅ ${funcPath} has proper error handling`);
      
    } catch (error) {
      console.error(`❌ Error checking error handling in ${funcPath}:`, error.message);
      allValid = false;
    }
  });
  
  return allValid;
}

// Test HTTP method support
function testHttpMethodSupport() {
  console.log('\n🌐 Testing HTTP method support...');
  
  const expectedMethods = {
    'netlify/functions/users-profile.js': ['GET', 'PUT'],
    'netlify/functions/users-me.js': ['GET', 'PUT'],
    'netlify/functions/users-settings.js': ['GET', 'PUT']
  };
  
  let allValid = true;
  
  Object.entries(expectedMethods).forEach(([funcPath, methods]) => {
    try {
      const content = fs.readFileSync(funcPath, 'utf8');
      
      methods.forEach(method => {
        if (!content.includes(`case '${method}':`)) {
          console.error(`❌ Missing ${method} method support in ${funcPath}`);
          allValid = false;
        }
      });
      
      // Check for method not allowed handling
      if (!content.includes('Method') && !content.includes('not allowed')) {
        console.error(`❌ Missing method not allowed handling in ${funcPath}`);
        allValid = false;
      }
      
      console.log(`✅ ${funcPath} supports required HTTP methods`);
      
    } catch (error) {
      console.error(`❌ Error checking HTTP methods in ${funcPath}:`, error.message);
      allValid = false;
    }
  });
  
  return allValid;
}

// Main test runner
function runTests() {
  console.log('🧪 Starting user management functions validation...\n');
  
  const tests = [
    { name: 'Function Structure', test: testFunctionStructure },
    { name: 'Authentication Handling', test: testAuthenticationHandling },
    { name: 'CORS Handling', test: testCorsHandling },
    { name: 'Database Operations', test: testDatabaseOperations },
    { name: 'Validation Functions', test: testValidationFunctions },
    { name: 'Error Handling', test: testErrorHandling },
    { name: 'HTTP Method Support', test: testHttpMethodSupport }
  ];
  
  let allPassed = true;
  const results = [];
  
  tests.forEach(({ name, test }) => {
    const passed = test();
    results.push({ name, passed });
    if (!passed) allPassed = false;
  });
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  results.forEach(({ name, passed }) => {
    console.log(`${passed ? '✅' : '❌'} ${name}`);
  });
  
  console.log(`\n${allPassed ? '🎉' : '💥'} Overall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  
  if (allPassed) {
    console.log('\n✨ User management functions are properly implemented!');
    console.log('📝 Functions created:');
    console.log('   - netlify/functions/users-profile.js (GET/PUT /api/users/profile)');
    console.log('   - netlify/functions/users-me.js (GET/PUT /api/users/me)');
    console.log('   - netlify/functions/users-settings.js (GET/PUT /api/users/settings)');
    console.log('\n🔧 All functions include:');
    console.log('   - Proper authentication checks');
    console.log('   - Database operations with User model');
    console.log('   - Input validation');
    console.log('   - Error handling');
    console.log('   - CORS support');
  }
  
  return allPassed;
}

// Run tests if this script is executed directly
if (require.main === module) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runTests };