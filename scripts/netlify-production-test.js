#!/usr/bin/env node

/**
 * Netlify Production Test Suite
 * Comprehensive testing specifically designed for Netlify environment
 * Can run as a Netlify function or build plugin
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Netlify-specific configuration
const NETLIFY_CONFIG = {
  baseUrl: process.env.URL || process.env.DEPLOY_URL || 'https://elixr-app.netlify.app',
  deployId: process.env.DEPLOY_ID || 'unknown',
  environment: process.env.CONTEXT || 'production', // production, deploy-preview, branch-deploy
  buildId: process.env.BUILD_ID || 'unknown',
  timeout: 30000,
  retries: 2,
  isProduction: process.env.CONTEXT === 'production',
  isPreview: process.env.CONTEXT === 'deploy-preview'
};

class NetlifyProductionTester {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
    this.buildReport = {
      deployId: NETLIFY_CONFIG.deployId,
      buildId: NETLIFY_CONFIG.buildId,
      environment: NETLIFY_CONFIG.environment,
      baseUrl: NETLIFY_CONFIG.baseUrl,
      timestamp: new Date().toISOString()
    };
  }

  async runTest(name, testFn, options = {}) {
    const { critical = false, skipInProduction = false } = options;
    
    if (skipInProduction && NETLIFY_CONFIG.isProduction) {
      this.log(`⏭️  SKIP: ${name} (skipped in production)`, 'info');
      this.results.push({ name, status: 'SKIP', reason: 'Production environment' });
      return true;
    }

    this.log(`🧪 Testing: ${name}`, 'info');
    const start = Date.now();
    
    for (let attempt = 1; attempt <= NETLIFY_CONFIG.retries; attempt++) {
      try {
        await Promise.race([
          testFn(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Test timeout')), NETLIFY_CONFIG.timeout)
          )
        ]);
        
        const duration = Date.now() - start;
        this.results.push({ name, status: 'PASS', duration, critical });
        this.log(`✅ PASS: ${name} (${duration}ms)`, 'success');
        return true;
      } catch (error) {
        if (attempt === NETLIFY_CONFIG.retries) {
          const duration = Date.now() - start;
          this.results.push({ name, status: 'FAIL', error: error.message, duration, critical });
          this.log(`❌ FAIL: ${name} - ${error.message} (${duration}ms)`, 'error');
          return false;
        } else {
          this.log(`⚠️  Retry ${attempt + 1}/${NETLIFY_CONFIG.retries}: ${name}`, 'warning');
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '[INFO]',
      success: '[SUCCESS]',
      warning: '[WARNING]', 
      error: '[ERROR]'
    }[level];
    
    console.log(`${prefix} ${timestamp} ${message}`);
  }

  async makeRequest(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${NETLIFY_CONFIG.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      timeout: NETLIFY_CONFIG.timeout,
      headers: {
        'User-Agent': 'Netlify-Production-Test/1.0',
        'Accept': 'application/json, text/html',
        ...options.headers
      }
    });

    return response;
  }

  // Test core site functionality
  async testSiteAccessibility() {
    const response = await this.makeRequest('/');
    if (!response.ok) {
      throw new Error(`Site inaccessible: ${response.status} ${response.statusText}`);
    }

    const content = await response.text();
    if (!content.includes('Elixr') && !content.includes('DOCTYPE')) {
      throw new Error('Site content appears corrupted or incomplete');
    }

    // Check for critical resources
    if (!content.includes('.css') && !content.includes('style')) {
      this.log('⚠️  Warning: No CSS detected in homepage', 'warning');
    }
  }

  // Test all critical pages
  async testCriticalPages() {
    const criticalPages = [
      { path: '/', name: 'Homepage', required: true },
      { path: '/menu', name: 'Menu Page', required: true },
      { path: '/juices', name: 'Juices Page', required: true },
      { path: '/subscriptions', name: 'Subscriptions Page', required: true },
      { path: '/contact', name: 'Contact Page', required: true },
      { path: '/login', name: 'Login Page', required: true },
      { path: '/signup', name: 'Signup Page', required: true },
      { path: '/cart', name: 'Cart Page', required: true },
      { path: '/checkout', name: 'Checkout Page', required: true },
      { path: '/privacy-policy', name: 'Privacy Policy', required: false }
    ];

    const failures = [];

    for (const page of criticalPages) {
      try {
        const response = await this.makeRequest(page.path);
        if (!response.ok) {
          const error = `${page.name} returned ${response.status}`;
          if (page.required) {
            failures.push(error);
          } else {
            this.log(`⚠️  Warning: ${error}`, 'warning');
          }
        }
      } catch (error) {
        const errorMsg = `${page.name} failed: ${error.message}`;
        if (page.required) {
          failures.push(errorMsg);
        } else {
          this.log(`⚠️  Warning: ${errorMsg}`, 'warning');
        }
      }
    }

    if (failures.length > 0) {
      throw new Error(`Critical pages failed: ${failures.join(', ')}`);
    }
  }

  // Test API endpoints
  async testAPIEndpoints() {
    const apiEndpoints = [
      { path: '/api/products', method: 'GET', critical: true },
      { path: '/api/categories', method: 'GET', critical: true },
      { path: '/api/contact', method: 'POST', critical: false, skipInProd: true },
      { path: '/api/health', method: 'GET', critical: false }
    ];

    const failures = [];

    for (const endpoint of apiEndpoints) {
      if (endpoint.skipInProd && NETLIFY_CONFIG.isProduction) continue;

      try {
        const options = { method: endpoint.method };
        if (endpoint.method === 'POST') {
          options.headers = { 'Content-Type': 'application/json' };
          options.body = JSON.stringify({ test: 'netlify-health-check' });
        }

        const response = await this.makeRequest(endpoint.path, options);
        
        // Allow 400-level errors for POST endpoints (expected for invalid test data)
        if (response.status >= 500) {
          const error = `API ${endpoint.path} server error: ${response.status}`;
          if (endpoint.critical) {
            failures.push(error);
          } else {
            this.log(`⚠️  Warning: ${error}`, 'warning');
          }
        }
      } catch (error) {
        const errorMsg = `API ${endpoint.path} failed: ${error.message}`;
        if (endpoint.critical) {
          failures.push(errorMsg);
        } else {
          this.log(`⚠️  Warning: ${errorMsg}`, 'warning');
        }
      }
    }

    if (failures.length > 0) {
      throw new Error(`Critical APIs failed: ${failures.join(', ')}`);
    }
  }

  // Test static assets
  async testStaticAssets() {
    const assets = [
      '/favicon.ico',
      '/images/elixr-logo.png',
      '/_next/static/css/', // Next.js CSS (partial path)
    ];

    let assetFailures = 0;

    for (const asset of assets) {
      try {
        const response = await this.makeRequest(asset);
        if (!response.ok && response.status !== 404) {
          this.log(`⚠️  Asset issue: ${asset} returned ${response.status}`, 'warning');
          assetFailures++;
        }
      } catch (error) {
        this.log(`⚠️  Asset error: ${asset} - ${error.message}`, 'warning');
        assetFailures++;
      }
    }

    // Only fail if all assets are broken (indicates serious issue)
    if (assetFailures === assets.length) {
      throw new Error('All static assets appear to be broken');
    }
  }

  // Test security measures
  async testSecurityMeasures() {
    const securityTests = [
      { path: '/admin', expectBlocked: true, name: 'Admin route protection' },
      { path: '/api/admin', expectBlocked: true, name: 'Admin API protection' }
    ];

    // In production, test routes should be blocked
    if (NETLIFY_CONFIG.isProduction) {
      securityTests.push(
        { path: '/test-webhook', expectBlocked: true, name: 'Test webhook protection' },
        { path: '/test-email', expectBlocked: true, name: 'Test email protection' },
        { path: '/api/test-delivery-scheduler', expectBlocked: true, name: 'Test API protection' }
      );
    }

    const securityFailures = [];

    for (const test of securityTests) {
      try {
        const response = await this.makeRequest(test.path);
        
        if (test.expectBlocked && response.ok) {
          securityFailures.push(`${test.name}: Route ${test.path} should be blocked but is accessible`);
        } else if (!test.expectBlocked && !response.ok) {
          securityFailures.push(`${test.name}: Route ${test.path} should be accessible but is blocked`);
        }
      } catch (error) {
        // Network errors are acceptable for blocked routes
        if (!test.expectBlocked) {
          securityFailures.push(`${test.name}: ${error.message}`);
        }
      }
    }

    if (securityFailures.length > 0) {
      throw new Error(`Security issues detected: ${securityFailures.join('; ')}`);
    }
  }

  // Test performance basics
  async testPerformance() {
    const start = Date.now();
    const response = await this.makeRequest('/');
    const loadTime = Date.now() - start;

    this.buildReport.performanceMetrics = {
      homepageLoadTime: loadTime,
      timestamp: new Date().toISOString()
    };

    if (loadTime > 10000) {
      throw new Error(`Homepage load time too slow: ${loadTime}ms`);
    }

    if (loadTime > 3000) {
      this.log(`⚠️  Warning: Slow homepage load time: ${loadTime}ms`, 'warning');
    }

    // Check response headers for optimization
    const headers = response.headers;
    const compressionUsed = headers.get('content-encoding');
    const cacheControl = headers.get('cache-control');

    this.buildReport.performanceMetrics.compression = !!compressionUsed;
    this.buildReport.performanceMetrics.caching = !!cacheControl;

    if (!compressionUsed) {
      this.log('ℹ️  Note: Response compression not detected', 'info');
    }
  }

  // Test form submissions (safe in production)
  async testFormFunctionality() {
    // Test contact form submission with invalid data (should fail gracefully)
    try {
      const response = await this.makeRequest('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'netlify-validation-test' })
      });

      // We expect this to fail with 400 (validation error), not 500 (server error)
      if (response.status >= 500) {
        throw new Error(`Contact form API has server error: ${response.status}`);
      }

      this.log('ℹ️  Contact form API validation working correctly', 'info');
    } catch (error) {
      if (error.message.includes('server error')) {
        throw error;
      }
      // Other errors (network, validation) are acceptable
      this.log(`ℹ️  Contact form test result: ${error.message}`, 'info');
    }
  }

  // Generate comprehensive Netlify report
  generateNetlifyReport() {
    const totalTests = this.results.length;
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;
    const criticalFailed = this.results.filter(r => r.status === 'FAIL' && r.critical).length;
    const totalDuration = Date.now() - this.startTime;

    const report = {
      ...this.buildReport,
      summary: {
        status: criticalFailed === 0 ? 'HEALTHY' : 'UNHEALTHY',
        totalTests,
        passed,
        failed,
        skipped,
        criticalFailed,
        duration: totalDuration
      },
      results: this.results,
      recommendations: this.generateRecommendations()
    };

    // Console output
    this.log('='.repeat(80), 'info');
    this.log('🌐 NETLIFY PRODUCTION TEST REPORT', 'info');
    this.log('='.repeat(80), 'info');
    this.log(`Deploy ID: ${report.deployId}`, 'info');
    this.log(`Environment: ${report.environment}`, 'info');
    this.log(`Base URL: ${report.baseUrl}`, 'info');
    this.log(`Total Duration: ${totalDuration}ms`, 'info');
    this.log('', 'info');
    this.log(`📊 Results: ${passed}/${totalTests} passed`, report.summary.status === 'HEALTHY' ? 'success' : 'error');
    this.log(`   ✅ Passed: ${passed}`, 'success');
    this.log(`   ❌ Failed: ${failed}`, failed > 0 ? 'error' : 'info');
    this.log(`   ⏭️  Skipped: ${skipped}`, 'info');
    this.log(`   🚨 Critical Failures: ${criticalFailed}`, criticalFailed > 0 ? 'error' : 'success');
    this.log('', 'info');

    // List all test results
    this.results.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
      const duration = result.duration ? ` (${result.duration}ms)` : '';
      this.log(`${icon} ${result.name}${duration}`, result.status === 'FAIL' ? 'error' : 'info');
      if (result.error) {
        this.log(`   Error: ${result.error}`, 'error');
      }
    });

    this.log('', 'info');
    this.log(`🚀 Overall Status: ${report.summary.status}`, 
      report.summary.status === 'HEALTHY' ? 'success' : 'error');
    this.log('='.repeat(80), 'info');

    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    const failedTests = this.results.filter(r => r.status === 'FAIL');

    if (failedTests.length > 0) {
      recommendations.push('❗ Address failed tests before deploying to production');
    }

    if (this.buildReport.performanceMetrics?.homepageLoadTime > 3000) {
      recommendations.push('⚡ Consider optimizing homepage load time');
    }

    if (!this.buildReport.performanceMetrics?.compression) {
      recommendations.push('📦 Enable response compression for better performance');
    }

    if (NETLIFY_CONFIG.isProduction && failedTests.some(t => t.critical)) {
      recommendations.push('🚨 Critical failures detected - immediate attention required');
    }

    return recommendations;
  }

  // Main test execution
  async runAllTests() {
    this.log('🚀 Starting Netlify Production Test Suite...', 'info');
    this.log(`Environment: ${NETLIFY_CONFIG.environment}`, 'info');
    this.log(`Base URL: ${NETLIFY_CONFIG.baseUrl}`, 'info');
    this.log(`Deploy ID: ${NETLIFY_CONFIG.deployId}`, 'info');
    this.log('', 'info');

    // Core accessibility tests (critical)
    await this.runTest('Site Accessibility', () => this.testSiteAccessibility(), 
      { critical: true });

    await this.runTest('Critical Pages', () => this.testCriticalPages(), 
      { critical: true });

    // API functionality tests
    await this.runTest('API Endpoints', () => this.testAPIEndpoints(), 
      { critical: true });

    // Static resources
    await this.runTest('Static Assets', () => this.testStaticAssets(), 
      { critical: false });

    // Security measures (critical in production)
    await this.runTest('Security Measures', () => this.testSecurityMeasures(), 
      { critical: NETLIFY_CONFIG.isProduction });

    // Performance check
    await this.runTest('Performance Check', () => this.testPerformance(), 
      { critical: false });

    // Form functionality (safe tests only)
    await this.runTest('Form Functionality', () => this.testFormFunctionality(), 
      { critical: false });

    return this.generateNetlifyReport();
  }
}

// Export for use as Netlify function
exports.handler = async (event, context) => {
  try {
    const tester = new NetlifyProductionTester();
    const report = await tester.runAllTests();

    return {
      statusCode: report.summary.status === 'HEALTHY' ? 200 : 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(report, null, 2)
    };
  } catch (error) {
    console.error('Netlify test suite failed:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Test suite execution failed', 
        message: error.message 
      })
    };
  }
};

// CLI interface
async function main() {
  try {
    const tester = new NetlifyProductionTester();
    const report = await tester.runAllTests();

    // Write report to file if in build context
    if (process.env.NETLIFY && process.env.BUILD_ID) {
      const fs = require('fs').promises;
      const reportPath = '/tmp/netlify-test-report.json';
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      console.log(`📄 Report saved to: ${reportPath}`);
    }

    // Exit with appropriate code
    process.exit(report.summary.criticalFailed > 0 ? 1 : 0);

  } catch (error) {
    console.error('💥 Netlify test suite failed:', error.message);
    process.exit(1);
  }
}

// Export for programmatic use
module.exports = { NetlifyProductionTester, NETLIFY_CONFIG };

// Run if called directly
if (require.main === module) {
  main();
}
