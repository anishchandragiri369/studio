#!/usr/bin/env node

/**
 * Netlify Production Health Check
 * Optimized for running on Netlify Functions or build environment
 * Tests deployed application functionality
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Netlify-specific configuration
const NETLIFY_CONFIG = {
  baseUrl: process.env.URL || process.env.DEPLOY_URL || process.env.TEST_BASE_URL || 'http://localhost:9002',
  environment: process.env.NODE_ENV || (process.env.CONTEXT === 'production' ? 'production' : 'development'),
  deployContext: process.env.CONTEXT || 'development',
  branch: process.env.HEAD || process.env.BRANCH || 'main',
  isNetlify: !!(process.env.NETLIFY || process.env.DEPLOY_URL),
  skipDestructive: process.env.NODE_ENV === 'production' || process.env.CONTEXT === 'production',
  timeout: 30000
};

class NetlifyHealthChecker {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
    this.baseUrl = NETLIFY_CONFIG.baseUrl;
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '🔵',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }[level] || '🔵';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runTest(name, testFn, critical = false) {
    this.log(`🧪 Testing: ${name}`);
    const start = Date.now();
    
    try {
      await testFn();
      const duration = Date.now() - start;
      this.results.push({ name, status: 'PASS', duration, critical });
      this.log(`✅ PASS: ${name} (${duration}ms)`, 'success');
      return true;
    } catch (error) {
      const duration = Date.now() - start;
      this.results.push({ name, status: 'FAIL', error: error.message, duration, critical });
      this.log(`❌ FAIL: ${name} - ${error.message} (${duration}ms)`, 'error');
      return false;
    }
  }

  async testDeploymentStatus() {
    // Test that the deployment is accessible
    const response = await fetch(`${this.baseUrl}/`);
    if (!response.ok) {
      throw new Error(`Deployment not accessible: ${response.status}`);
    }
    
    const text = await response.text();
    if (!text.includes('Elixr') && !text.includes('html')) {
      throw new Error('Deployment content invalid');
    }
  }

  async testStaticAssets() {
    // Test that critical static assets are loading
    const assets = [
      '/favicon.ico',
      '/images/elixr-logo.png'
    ];

    for (const asset of assets) {
      const response = await fetch(`${this.baseUrl}${asset}`);
      if (!response.ok && response.status !== 404) {
        throw new Error(`Asset ${asset} failed to load: ${response.status}`);
      }
    }
  }

  async testAPIRoutes() {
    // Test critical API routes
    const routes = [
      '/api/juices',
      '/api/health'
    ];

    for (const route of routes) {
      const response = await fetch(`${this.baseUrl}${route}`);
      if (response.status === 404) {
        continue; // Route might not exist, that's okay
      }
      if (!response.ok && response.status !== 405) { // 405 = Method Not Allowed is okay
        throw new Error(`API route ${route} failed: ${response.status}`);
      }
    }
  }

  async testPageRoutes() {
    // Test that main pages are accessible
    const routes = [
      '/',
      '/menu',
      '/juices',
      '/subscriptions',
      '/cart',
      '/login',
      '/signup',
      '/contact',
      '/privacy-policy'
    ];

    let failures = 0;
    for (const route of routes) {
      try {
        const response = await fetch(`${this.baseUrl}${route}`);
        if (!response.ok && response.status !== 404) {
          failures++;
          this.log(`⚠️ Route ${route} returned ${response.status}`, 'warning');
        }
      } catch (error) {
        failures++;
        this.log(`⚠️ Route ${route} failed: ${error.message}`, 'warning');
      }
    }

    if (failures > routes.length / 2) { // If more than half fail
      throw new Error(`Too many route failures: ${failures}/${routes.length}`);
    }
  }

  async testEnvironmentVariables() {
    // Test that critical environment variables are present
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ];

    const missing = [];
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        missing.push(varName);
      }
    }

    if (missing.length > 0) {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }
  }

  async testNetlifyFunctions() {
    if (!NETLIFY_CONFIG.isNetlify) {
      this.log('⏭️ Skipping Netlify functions test (not Netlify environment)', 'warning');
      return;
    }

    // Test Netlify functions
    const functions = [
      '/.netlify/functions/payment-confirm',
      '/.netlify/functions/delivery-scheduler-cron'
    ];

    for (const func of functions) {
      try {
        const response = await fetch(`${this.baseUrl}${func}`, {
          method: 'GET',
          timeout: 10000
        });
        // Functions might return 405 (Method Not Allowed) for GET, that's okay
        if (response.status !== 405 && response.status !== 200) {
          this.log(`⚠️ Function ${func} returned ${response.status}`, 'warning');
        }
      } catch (error) {
        // Function might not exist or be accessible, that's okay for this test
        this.log(`⚠️ Function ${func} not accessible: ${error.message}`, 'warning');
      }
    }
  }

  async testSecurityHeaders() {
    const response = await fetch(`${this.baseUrl}/`);
    
    // Check for basic security headers
    const securityHeaders = [
      'x-frame-options',
      'x-content-type-options'
    ];

    const missing = [];
    for (const header of securityHeaders) {
      if (!response.headers.get(header)) {
        missing.push(header);
      }
    }

    if (missing.length > 0) {
      this.log(`⚠️ Missing security headers: ${missing.join(', ')}`, 'warning');
      // Don't fail for missing headers, just warn
    }
  }

  async testProductionSecurity() {
    if (!NETLIFY_CONFIG.skipDestructive) {
      this.log('⏭️ Skipping production security tests (not production)', 'warning');
      return;
    }

    // Test that test pages are not accessible in production
    const testPages = [
      '/test-webhook',
      '/test-email',
      '/test-subscription'
    ];

    for (const page of testPages) {
      const response = await fetch(`${this.baseUrl}${page}`);
      if (response.ok) {
        throw new Error(`Test page ${page} is accessible in production!`);
      }
    }
  }

  async generateReport() {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const criticalFailures = this.results.filter(r => r.status === 'FAIL' && r.critical).length;

    this.log('\n📊 NETLIFY HEALTH CHECK REPORT', 'info');
    this.log('='.repeat(40), 'info');
    this.log(`🏷️  Environment: ${NETLIFY_CONFIG.environment}`, 'info');
    this.log(`🌐 Deploy Context: ${NETLIFY_CONFIG.deployContext}`, 'info');
    this.log(`🌿 Branch: ${NETLIFY_CONFIG.branch}`, 'info');
    this.log(`🔗 Base URL: ${this.baseUrl}`, 'info');
    this.log(`⏱️  Total Duration: ${totalDuration}ms`, 'info');
    this.log(`✅ Passed: ${passed}`, 'success');
    this.log(`❌ Failed: ${failed}`, failed > 0 ? 'error' : 'info');
    this.log(`🚨 Critical Failures: ${criticalFailures}`, criticalFailures > 0 ? 'error' : 'info');

    if (failed > 0) {
      this.log('\n❌ FAILED TESTS:', 'error');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => {
          const prefix = r.critical ? '🚨 CRITICAL' : '';
          this.log(`   ${prefix} ${r.name}: ${r.error}`, 'error');
        });
    }

    this.log('\n📋 ALL RESULTS:', 'info');
    this.results.forEach(r => {
      const status = r.status === 'PASS' ? '✅' : '❌';
      const critical = r.critical && r.status === 'FAIL' ? '🚨' : '';
      this.log(`   ${status} ${critical} ${r.name} (${r.duration}ms)`, 'info');
    });

    // Create summary for Netlify deploy notifications
    const summary = {
      timestamp: new Date().toISOString(),
      environment: NETLIFY_CONFIG.environment,
      deployContext: NETLIFY_CONFIG.deployContext,
      branch: NETLIFY_CONFIG.branch,
      baseUrl: this.baseUrl,
      duration: totalDuration,
      results: { passed, failed, criticalFailures, total: this.results.length },
      success: criticalFailures === 0,
      healthy: failed === 0
    };

    // Log summary for Netlify build logs
    this.log(`\n📊 SUMMARY: ${summary.success ? 'SUCCESS' : 'FAILURE'}`, summary.success ? 'success' : 'error');
    this.log(`Health: ${summary.healthy ? 'HEALTHY' : 'UNHEALTHY'}`, summary.healthy ? 'success' : 'warning');

    return summary;
  }

  async run() {
    try {
      this.log('🚀 Starting Netlify Health Check...', 'info');
      this.log(`🌐 Target: ${this.baseUrl}`, 'info');
      this.log(`🏷️  Environment: ${NETLIFY_CONFIG.environment}`, 'info');
      this.log(`🌿 Branch: ${NETLIFY_CONFIG.branch}`, 'info');
      this.log('='.repeat(40), 'info');

      // Run health checks
      await this.runTest('Deployment Status', () => this.testDeploymentStatus(), true);
      await this.runTest('Static Assets', () => this.testStaticAssets(), false);
      await this.runTest('API Routes', () => this.testAPIRoutes(), false);
      await this.runTest('Page Routes', () => this.testPageRoutes(), true);
      await this.runTest('Environment Variables', () => this.testEnvironmentVariables(), true);
      await this.runTest('Netlify Functions', () => this.testNetlifyFunctions(), false);
      await this.runTest('Security Headers', () => this.testSecurityHeaders(), false);
      await this.runTest('Production Security', () => this.testProductionSecurity(), true);

      const summary = await this.generateReport();

      if (!summary.success) {
        this.log('🚨 Health check failed due to critical issues!', 'error');
        process.exit(1);
      } else if (!summary.healthy) {
        this.log('⚠️ Health check passed but some non-critical issues found', 'warning');
        process.exit(0);
      } else {
        this.log('🎉 Health check passed completely!', 'success');
        process.exit(0);
      }

    } catch (error) {
      this.log(`💥 Health check crashed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const checker = new NetlifyHealthChecker();
  checker.run();
}

module.exports = NetlifyHealthChecker;
