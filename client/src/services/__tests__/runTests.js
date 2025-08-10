/**
 * Test Runner for Service Tests
 * Runs all service tests and provides comprehensive reporting
 */

const { execSync } = require('child_process');
const path = require('path');

// Test configuration
const testConfig = {
  testMatch: [
    '<rootDir>/src/services/__tests__/**/*.test.js'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/src/services/__tests__/setup.js'
  ],
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'src/services/**/*.js',
    '!src/services/__tests__/**',
    '!src/services/**/index.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  verbose: true,
  testTimeout: 10000
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printHeader() {
  console.log(colorize('\n🧪 Frontend Deployment Fixes - Test Suite', 'cyan'));
  console.log(colorize('=' .repeat(50), 'cyan'));
  console.log('Running comprehensive tests for:');
  console.log('• ServiceWorkerManager');
  console.log('• AudioManager');
  console.log('• ManifestValidator');
  console.log('• ProductionErrorHandler');
  console.log('• Production Deployment Integration');
  console.log(colorize('=' .repeat(50), 'cyan'));
}

function runTests() {
  try {
    printHeader();
    
    console.log(colorize('\n📋 Test Configuration:', 'yellow'));
    console.log(`• Test Environment: ${testConfig.testEnvironment}`);
    console.log(`• Test Timeout: ${testConfig.testTimeout}ms`);
    console.log(`• Coverage Threshold: ${testConfig.coverageThreshold.global.lines}%`);
    
    console.log(colorize('\n🚀 Starting Tests...', 'green'));
    
    // Build Jest command
    const jestConfig = JSON.stringify(testConfig);
    const command = `npx jest --config='${jestConfig}' --coverage --watchAll=false`;
    
    // Run tests
    const result = execSync(command, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log(colorize('\n✅ All tests completed successfully!', 'green'));
    
    return true;
    
  } catch (error) {
    console.error(colorize('\n❌ Tests failed!', 'red'));
    console.error('Error:', error.message);
    
    if (error.status) {
      console.error(`Exit code: ${error.status}`);
    }
    
    return false;
  }
}

function runSpecificTest(testName) {
  try {
    console.log(colorize(`\n🎯 Running specific test: ${testName}`, 'yellow'));
    
    const jestConfig = JSON.stringify(testConfig);
    const command = `npx jest --config='${jestConfig}' --testNamePattern="${testName}" --verbose`;
    
    execSync(command, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log(colorize(`\n✅ Test "${testName}" completed!`, 'green'));
    return true;
    
  } catch (error) {
    console.error(colorize(`\n❌ Test "${testName}" failed!`, 'red'));
    console.error('Error:', error.message);
    return false;
  }
}

function runTestFile(fileName) {
  try {
    console.log(colorize(`\n📁 Running test file: ${fileName}`, 'yellow'));
    
    const jestConfig = JSON.stringify(testConfig);
    const command = `npx jest --config='${jestConfig}' ${fileName} --verbose`;
    
    execSync(command, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log(colorize(`\n✅ Test file "${fileName}" completed!`, 'green'));
    return true;
    
  } catch (error) {
    console.error(colorize(`\n❌ Test file "${fileName}" failed!`, 'red'));
    console.error('Error:', error.message);
    return false;
  }
}

function showHelp() {
  console.log(colorize('\n📖 Test Runner Help', 'cyan'));
  console.log('Usage: node runTests.js [options]');
  console.log('\nOptions:');
  console.log('  --all                 Run all tests (default)');
  console.log('  --file <filename>     Run specific test file');
  console.log('  --test <testname>     Run specific test by name');
  console.log('  --watch              Run tests in watch mode');
  console.log('  --coverage           Run with coverage report');
  console.log('  --help               Show this help message');
  console.log('\nExamples:');
  console.log('  node runTests.js');
  console.log('  node runTests.js --file ServiceWorkerManager.test.js');
  console.log('  node runTests.js --test "should register service worker"');
  console.log('  node runTests.js --watch');
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--help')) {
  showHelp();
  process.exit(0);
}

if (args.includes('--file')) {
  const fileIndex = args.indexOf('--file');
  const fileName = args[fileIndex + 1];
  
  if (!fileName) {
    console.error(colorize('❌ Please specify a test file name', 'red'));
    process.exit(1);
  }
  
  const success = runTestFile(fileName);
  process.exit(success ? 0 : 1);
}

if (args.includes('--test')) {
  const testIndex = args.indexOf('--test');
  const testName = args[testIndex + 1];
  
  if (!testName) {
    console.error(colorize('❌ Please specify a test name', 'red'));
    process.exit(1);
  }
  
  const success = runSpecificTest(testName);
  process.exit(success ? 0 : 1);
}

if (args.includes('--watch')) {
  try {
    printHeader();
    console.log(colorize('\n👀 Running tests in watch mode...', 'yellow'));
    
    const jestConfig = JSON.stringify({
      ...testConfig,
      watchAll: true
    });
    const command = `npx jest --config='${jestConfig}' --coverage=false`;
    
    execSync(command, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
  } catch (error) {
    console.error(colorize('\n❌ Watch mode failed!', 'red'));
    process.exit(1);
  }
}

// Default: run all tests
const success = runTests();
process.exit(success ? 0 : 1);