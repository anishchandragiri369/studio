#!/usr/bin/env node

/**
 * Rating System Test Runner
 * Runs comprehensive tests for the customer rating and feedback system
 */

const { spawn } = require('child_process');
const path = require('path');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function runTests() {
  log(colors.bold + colors.blue, '🧪 Running Customer Rating System Tests');
  console.log('');

  const testSuites = [
    {
      name: 'Unit Tests - Rating Components',
      command: 'npx',
      args: ['jest', '__tests__/components/ratings.test.jsx', '--verbose'],
      description: 'Testing React components for rating forms and displays'
    },
    {
      name: 'API Tests - Rating Endpoints',
      command: 'npx',
      args: ['jest', '__tests__/api/ratings.test.js', '--verbose'],
      description: 'Testing rating API endpoints and data validation'
    },
    {
      name: 'Integration Tests - Complete Rating Flow',
      command: 'npx',
      args: ['jest', '__tests__/integration/rating-flow.test.js', '--verbose'],
      description: 'Testing end-to-end rating submission and retrieval flow'
    }
  ];

  let allPassed = true;
  const results = [];

  for (const suite of testSuites) {
    log(colors.yellow, `\n📋 ${suite.name}`);
    log(colors.reset, `   ${suite.description}`);
    console.log('');

    try {
      const startTime = Date.now();
      await runCommand(suite.command, suite.args);
      const duration = Date.now() - startTime;
      
      log(colors.green, `✅ ${suite.name} passed (${duration}ms)`);
      results.push({ name: suite.name, status: 'PASSED', duration });
    } catch (error) {
      log(colors.red, `❌ ${suite.name} failed`);
      console.error(error.message);
      results.push({ name: suite.name, status: 'FAILED', duration: 0 });
      allPassed = false;
    }
  }

  // Run coverage report
  log(colors.yellow, '\n📊 Generating Test Coverage Report');
  try {
    await runCommand('npx', [
      'jest',
      '__tests__/components/ratings.test.jsx',
      '__tests__/api/ratings.test.js',
      '--coverage',
      '--coverageDirectory=coverage/rating-system',
      '--collectCoverageFrom=src/components/ratings/**/*.{js,jsx,ts,tsx}',
      '--collectCoverageFrom=src/app/api/ratings/**/*.{js,ts}'
    ]);
    log(colors.green, '✅ Coverage report generated in coverage/rating-system/');
  } catch (error) {
    log(colors.red, '❌ Coverage report generation failed');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  log(colors.bold + colors.blue, '📋 Test Results Summary');
  console.log('='.repeat(60));

  results.forEach(result => {
    const status = result.status === 'PASSED' 
      ? colors.green + '✅ PASSED' 
      : colors.red + '❌ FAILED';
    console.log(`${status}${colors.reset} ${result.name}`);
  });

  console.log('');
  if (allPassed) {
    log(colors.green + colors.bold, '🎉 All rating system tests passed!');
    console.log('');
    log(colors.blue, '📋 Next steps:');
    log(colors.reset, '  • Review coverage report in coverage/rating-system/');
    log(colors.reset, '  • Run integration tests against staging environment');
    log(colors.reset, '  • Deploy rating system to production');
  } else {
    log(colors.red + colors.bold, '💥 Some tests failed. Please fix issues before deploying.');
    process.exit(1);
  }
}

// Health check for rating system
async function healthCheck() {
  log(colors.bold + colors.blue, '🏥 Rating System Health Check');
  console.log('');

  const healthChecks = [
    {
      name: 'Database Schema',
      check: async () => {
        // Check if rating tables exist
        const fs = require('fs');
        const schemaPath = path.join(__dirname, '..', 'sql', 'rating_feedback_schema.sql');
        return fs.existsSync(schemaPath);
      }
    },
    {
      name: 'API Endpoints',
      check: async () => {
        const fs = require('fs');
        const apiPaths = [
          'src/app/api/ratings/submit/route.ts',
          'src/app/api/ratings/list/route.ts',
          'src/app/api/ratings/helpful/route.ts',
          'src/app/api/ratings/request/route.ts'
        ];
        return apiPaths.every(p => fs.existsSync(path.join(__dirname, '..', p)));
      }
    },
    {
      name: 'React Components',
      check: async () => {
        const fs = require('fs');
        const componentPaths = [
          'src/components/ratings/RatingForm.tsx',
          'src/components/ratings/RatingDisplay.tsx',
          'src/components/ratings/OrderRating.tsx'
        ];
        return componentPaths.every(p => fs.existsSync(path.join(__dirname, '..', p)));
      }
    },
    {
      name: 'Test Coverage',
      check: async () => {
        const fs = require('fs');
        const testPaths = [
          '__tests__/components/ratings.test.jsx',
          '__tests__/api/ratings.test.js',
          '__tests__/integration/rating-flow.test.js'
        ];
        return testPaths.every(p => fs.existsSync(path.join(__dirname, '..', p)));
      }
    }
  ];

  let allHealthy = true;

  for (const healthCheck of healthChecks) {
    try {
      const isHealthy = await healthCheck.check();
      if (isHealthy) {
        log(colors.green, `✅ ${healthCheck.name}`);
      } else {
        log(colors.red, `❌ ${healthCheck.name}`);
        allHealthy = false;
      }
    } catch (error) {
      log(colors.red, `❌ ${healthCheck.name} - ${error.message}`);
      allHealthy = false;
    }
  }

  console.log('');
  if (allHealthy) {
    log(colors.green + colors.bold, '🎉 Rating system is healthy!');
  } else {
    log(colors.red + colors.bold, '💥 Rating system has issues. Please check above.');
    process.exit(1);
  }
}

// Main execution
async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'test':
      await runTests();
      break;
    case 'health':
      await healthCheck();
      break;
    case 'all':
      await healthCheck();
      await runTests();
      break;
    default:
      log(colors.blue, 'Rating System Test Runner');
      console.log('');
      console.log('Usage:');
      console.log('  node scripts/test-rating-system.js test   - Run all rating tests');
      console.log('  node scripts/test-rating-system.js health - Run health checks');
      console.log('  node scripts/test-rating-system.js all    - Run health checks and tests');
      break;
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests, healthCheck };
