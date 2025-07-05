/**
 * E2E Test Runner
 * 
 * This script orchestrates all the end-to-end tests and provides
 * a centralized way to run them individually or as a suite.
 */

const { testPasswordResetFlow } = require('./password-reset.test.js');
const { testOAuthSecurity } = require('./oauth-security.test.js');
const { testCompleteAuthFlows } = require('./auth-flows.test.js');

async function runAllTests() {
  console.log('🎯 ELIXR E2E TEST SUITE');
  console.log('======================\n');
  
  const startTime = Date.now();
  const results = [];
  
  const tests = [
    {
      name: 'Password Reset Flow',
      fn: testPasswordResetFlow,
      description: 'Tests the complete password reset flow to ensure no spinning issues'
    },
    {
      name: 'OAuth Security',
      fn: testOAuthSecurity,
      description: 'Validates OAuth security fixes and flow validation'
    },
    {
      name: 'Complete Auth Flows',
      fn: testCompleteAuthFlows,
      description: 'Comprehensive test of all authentication scenarios'
    }
  ];
  
  for (const test of tests) {
    console.log(`🚀 Running: ${test.name}`);
    console.log(`📝 ${test.description}\n`);
    
    try {
      const testStartTime = Date.now();
      await test.fn();
      const testDuration = Date.now() - testStartTime;
      
      results.push({
        name: test.name,
        status: 'PASSED',
        duration: testDuration
      });
      
      console.log(`✅ ${test.name} PASSED (${testDuration}ms)\n`);
      
    } catch (error) {
      const testDuration = Date.now() - testStartTime;
      
      results.push({
        name: test.name,
        status: 'FAILED',
        duration: testDuration,
        error: error.message
      });
      
      console.error(`❌ ${test.name} FAILED (${testDuration}ms)`);
      console.error(`   Error: ${error.message}\n`);
    }
  }
  
  // Generate final report
  const totalDuration = Date.now() - startTime;
  const passedTests = results.filter(r => r.status === 'PASSED').length;
  const failedTests = results.filter(r => r.status === 'FAILED').length;
  
  console.log('📊 FINAL TEST RESULTS');
  console.log('=====================');
  console.log(`Total Duration: ${totalDuration}ms`);
  console.log(`Tests Passed: ${passedTests}/${results.length}`);
  console.log(`Tests Failed: ${failedTests}/${results.length}`);
  console.log(`Success Rate: ${((passedTests / results.length) * 100).toFixed(1)}%\n`);
  
  results.forEach(result => {
    const icon = result.status === 'PASSED' ? '✅' : '❌';
    console.log(`${icon} ${result.name} - ${result.duration}ms`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    totalDuration,
    summary: {
      total: results.length,
      passed: passedTests,
      failed: failedTests,
      successRate: `${((passedTests / results.length) * 100).toFixed(1)}%`
    },
    tests: results
  };
  
  const fs = require('fs');
  fs.writeFileSync('tests/e2e/full-test-report.json', JSON.stringify(report, null, 2));
  
  console.log('\n📁 Detailed report saved to tests/e2e/full-test-report.json');
  
  if (failedTests > 0) {
    console.log('\n⚠️ Some tests failed. Please check the errors above.');
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed successfully!');
    process.exit(0);
  }
}

async function runSingleTest(testName) {
  const testMap = {
    'password-reset': testPasswordResetFlow,
    'oauth-security': testOAuthSecurity,
    'auth-flows': testCompleteAuthFlows
  };
  
  const testFn = testMap[testName];
  if (!testFn) {
    console.error(`❌ Unknown test: ${testName}`);
    console.log('Available tests:', Object.keys(testMap).join(', '));
    process.exit(1);
  }
  
  console.log(`🚀 Running single test: ${testName}\n`);
  
  try {
    await testFn();
    console.log(`✅ Test ${testName} completed successfully`);
    process.exit(0);
  } catch (error) {
    console.error(`❌ Test ${testName} failed:`, error.message);
    process.exit(1);
  }
}

// Command line interface
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('🎯 Running all E2E tests...\n');
  runAllTests();
} else if (args[0] === '--test' && args[1]) {
  runSingleTest(args[1]);
} else if (args[0] === '--help') {
  console.log('🚀 Elixr E2E Test Runner');
  console.log('========================\n');
  console.log('Usage:');
  console.log('  node run-tests.js                    # Run all tests');
  console.log('  node run-tests.js --test <name>      # Run specific test');
  console.log('  node run-tests.js --help             # Show this help\n');
  console.log('Available tests:');
  console.log('  password-reset    # Test password reset flow');
  console.log('  oauth-security    # Test OAuth security');
  console.log('  auth-flows        # Test complete auth flows');
  process.exit(0);
} else {
  console.error('❌ Invalid arguments. Use --help for usage information.');
  process.exit(1);
}
