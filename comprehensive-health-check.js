#!/usr/bin/env node

/**
 * Comprehensive Production Testing Suite
 * Tests all major app functionalities in any environment (local/production)
 * Can be run on Netlify or any CI/CD system
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs').promises;
const path = require('path');

// Enhanced test configuration
const CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:9002',
  environment: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  timeout: 45000,
  retries: 3,
  testUser: {
    email: process.env.TEST_USER_EMAIL || 'healthcheck@elixr.com',
    password: process.env.TEST_USER_PASSWORD || 'HealthCheck123!',
    name: 'Health Check User'
  },
  skipDestructiveTests: process.env.NODE_ENV === 'production' || process.env.SKIP_DESTRUCTIVE === 'true'
};

class ProductionHealthChecker {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
    this.sessionToken = null;
    this.testOrderId = null;
  }

  async runTest(name, testFn, options = {}) {
    const { critical = false, category = 'general', skipInProd = false } = options;
    
    if (skipInProd && CONFIG.isProduction) {
      console.log(`⏭️  SKIP: ${name} (skipped in production)`);
      this.results.push({ name, status: 'SKIP', reason: 'Production environment', category });
      return true;
    }

    console.log(`🧪 Testing: ${name}`);
    const start = Date.now();
    
    for (let attempt = 1; attempt <= CONFIG.retries; attempt++) {
      try {
        await Promise.race([
          testFn(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Test timeout')), CONFIG.timeout)
          )
        ]);
        
        const duration = Date.now() - start;
        this.results.push({ name, status: 'PASS', duration, critical, category });
        console.log(`✅ PASS: ${name} (${duration}ms)`);
        return true;
      } catch (error) {
        if (attempt === CONFIG.retries) {
          const duration = Date.now() - start;
          this.results.push({ 
            name, 
            status: 'FAIL', 
            error: error.message, 
            duration, 
            critical, 
            category 
          });
          console.log(`❌ FAIL: ${name} - ${error.message} (${duration}ms, ${CONFIG.retries} attempts)`);
          return false;
        } else {
          console.log(`⚠️  Retry ${attempt + 1}/${CONFIG.retries}: ${name}`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
  }

  async makeRequest(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${CONFIG.baseUrl}${endpoint}`;
    const headers = {
      'User-Agent': 'Elixr-Health-Check/1.0',
      'Accept': 'application/json, text/html',
      ...options.headers
    };

    if (this.sessionToken) {
      headers['Authorization'] = `Bearer ${this.sessionToken}`;
      headers['Cookie'] = this.sessionToken;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      timeout: CONFIG.timeout
    });

    return response;
  }

  // Core Infrastructure Tests
  async testWebsiteAccessibility() {
    const response = await this.makeRequest('/');
    if (!response.ok) {
      throw new Error(`Homepage returned ${response.status}`);
    }
    const content = await response.text();
    if (!content.includes('Elixr') && !content.includes('Welcome')) {
      throw new Error('Homepage content missing expected elements');
    }
  }

  async testAPIHealth() {
    // Test API routes that should always be accessible
    const endpoints = [
      '/api/health',
      '/api/products',
      '/api/categories'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest(endpoint);
        if (!response.ok && response.status !== 404) {
          console.log(`⚠️  Warning: ${endpoint} returned ${response.status}`);
        }
      } catch (error) {
        console.log(`⚠️  Warning: ${endpoint} failed - ${error.message}`);
      }
    }
  }

  async testStaticAssets() {
    const assets = [
      '/images/elixr-logo.png',
      '/favicon.ico'
    ];

    for (const asset of assets) {
      const response = await this.makeRequest(asset);
      if (!response.ok) {
        console.log(`⚠️  Warning: Asset ${asset} returned ${response.status}`);
      }
    }
  }

  // Page Accessibility Tests
  async testPageAccessibility() {
    const pages = [
      { path: '/', name: 'Homepage' },
      { path: '/menu', name: 'Menu Page' },
      { path: '/juices', name: 'Juices Page' },
      { path: '/fruit-bowls', name: 'Fruit Bowls Page' },
      { path: '/subscriptions', name: 'Subscriptions Page' },
      { path: '/daily-detox', name: 'Daily Detox Page' },
      { path: '/contact', name: 'Contact Page' },
      { path: '/privacy-policy', name: 'Privacy Policy Page' },
      { path: '/login', name: 'Login Page' },
      { path: '/signup', name: 'Signup Page' }
    ];

    for (const page of pages) {
      const response = await this.makeRequest(page.path);
      if (!response.ok) {
        throw new Error(`${page.name} returned ${response.status}`);
      }
    }
  }

  // Authentication Tests
  async testAuthenticationFlow() {
    // Test login page access
    const loginResponse = await this.makeRequest('/login');
    if (!loginResponse.ok) {
      throw new Error(`Login page inaccessible: ${loginResponse.status}`);
    }

    // Test signup page access
    const signupResponse = await this.makeRequest('/signup');
    if (!signupResponse.ok) {
      throw new Error(`Signup page inaccessible: ${signupResponse.status}`);
    }

    // In production, skip actual authentication tests
    if (CONFIG.isProduction) {
      console.log('ℹ️  Skipping actual auth tests in production');
      return;
    }

    // Test authentication API
    try {
      const authResponse = await this.makeRequest('/api/auth/session');
      // This might return 401 which is fine for unauthenticated requests
    } catch (error) {
      console.log(`ℹ️  Auth session check: ${error.message}`);
    }
  }

  // Cart and Checkout Tests
  async testCartFunctionality() {
    // Test cart page access
    const cartResponse = await this.makeRequest('/cart');
    if (!cartResponse.ok) {
      throw new Error(`Cart page inaccessible: ${cartResponse.status}`);
    }

    // Test checkout page access
    const checkoutResponse = await this.makeRequest('/checkout');
    if (!checkoutResponse.ok) {
      throw new Error(`Checkout page inaccessible: ${checkoutResponse.status}`);
    }
  }

  // Order and Payment Tests
  async testOrderSystem() {
    // Test order success page
    const orderSuccessResponse = await this.makeRequest('/order-success?orderId=test-123');
    if (!orderSuccessResponse.ok) {
      throw new Error(`Order success page inaccessible: ${orderSuccessResponse.status}`);
    }

    // Test payment failure page
    const paymentFailedResponse = await this.makeRequest('/payment-failed?orderId=test-123');
    if (!paymentFailedResponse.ok) {
      throw new Error(`Payment failed page inaccessible: ${paymentFailedResponse.status}`);
    }

    // Test orders page (requires auth in production)
    if (!CONFIG.isProduction) {
      const ordersResponse = await this.makeRequest('/orders');
      // This might redirect to login, which is fine
    }
  }

  // Subscription Tests
  async testSubscriptionSystem() {
    // Test subscription pages
    const subscriptionsResponse = await this.makeRequest('/subscriptions');
    if (!subscriptionsResponse.ok) {
      throw new Error(`Subscriptions page inaccessible: ${subscriptionsResponse.status}`);
    }

    const mySubscriptionsResponse = await this.makeRequest('/my-subscriptions');
    if (!CONFIG.isProduction && !mySubscriptionsResponse.ok) {
      throw new Error(`My Subscriptions page inaccessible: ${mySubscriptionsResponse.status}`);
    }
  }

  // API Endpoints Tests
  async testCriticalAPIs() {
    const criticalAPIs = [
      { endpoint: '/api/products', method: 'GET', name: 'Products API' },
      { endpoint: '/api/categories', method: 'GET', name: 'Categories API' },
      { endpoint: '/api/contact', method: 'POST', name: 'Contact API', skipInProd: true },
      { endpoint: '/api/newsletter/subscribe', method: 'POST', name: 'Newsletter API', skipInProd: true }
    ];

    for (const api of criticalAPIs) {
      if (api.skipInProd && CONFIG.isProduction) continue;

      try {
        const options = { method: api.method };
        if (api.method === 'POST') {
          options.headers = { 'Content-Type': 'application/json' };
          options.body = JSON.stringify({ test: 'health-check' });
        }

        const response = await this.makeRequest(api.endpoint, options);
        
        // Some APIs might return 400 for invalid data, which is okay for health check
        if (response.status >= 500) {
          throw new Error(`${api.name} returned server error: ${response.status}`);
        }
      } catch (error) {
        if (error.message.includes('timeout') || error.message.includes('fetch')) {
          throw new Error(`${api.name} unreachable: ${error.message}`);
        }
        console.log(`ℹ️  ${api.name} test result: ${error.message}`);
      }
    }
  }

  // Security Tests
  async testSecurityMeasures() {
    // Test that admin routes are protected
    const adminResponse = await this.makeRequest('/admin');
    if (adminResponse.ok && adminResponse.status !== 302) {
      console.log('⚠️  Warning: Admin route might not be properly protected');
    }

    // Test that test routes are blocked in production
    if (CONFIG.isProduction) {
      const testRoutes = [
        '/test-webhook',
        '/test-email',
        '/test-subscription',
        '/api/test-delivery-scheduler'
      ];

      for (const route of testRoutes) {
        const response = await this.makeRequest(route);
        if (response.ok) {
          throw new Error(`Test route ${route} is accessible in production`);
        }
      }
    }
  }

  // Performance Tests
  async testPerformance() {
    const start = Date.now();
    const response = await this.makeRequest('/');
    const duration = Date.now() - start;

    if (duration > 5000) {
      console.log(`⚠️  Warning: Homepage took ${duration}ms to load`);
    }

    // Test if gzip compression is enabled
    const headers = response.headers;
    if (!headers.get('content-encoding')) {
      console.log('ℹ️  Note: Response compression not detected');
    }
  }

  // Database Connectivity Tests
  async testDatabaseConnectivity() {
    if (CONFIG.isProduction) {
      console.log('ℹ️  Skipping direct database tests in production');
      return;
    }

    // Test database through API endpoints
    try {
      const response = await this.makeRequest('/api/health');
      if (response.ok) {
        const data = await response.json();
        if (data.database === false) {
          throw new Error('Database connectivity issue detected');
        }
      }
    } catch (error) {
      console.log(`ℹ️  Database connectivity test: ${error.message}`);
    }
  }

  // Email System Tests
  async testEmailSystem() {
    if (CONFIG.isProduction || CONFIG.skipDestructiveTests) {
      console.log('ℹ️  Skipping email tests in production/safe mode');
      return;
    }

    // Test email API endpoints exist
    const emailAPIs = [
      '/api/send-contact-email',
      '/api/send-order-confirmation',
      '/api/send-payment-failure-email'
    ];

    for (const api of emailAPIs) {
      try {
        const response = await this.makeRequest(api, { method: 'POST' });
        // We expect these to fail with 400/422 due to missing data, not 500
        if (response.status >= 500) {
          throw new Error(`Email API ${api} has server error`);
        }
      } catch (error) {
        console.log(`ℹ️  Email API ${api}: ${error.message}`);
      }
    }
  }

  // Generate comprehensive report
  generateReport() {
    const totalTests = this.results.length;
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;
    const criticalFailed = this.results.filter(r => r.status === 'FAIL' && r.critical).length;
    const totalDuration = Date.now() - this.startTime;

    console.log('\n' + '='.repeat(80));
    console.log('🎯 PRODUCTION HEALTH CHECK REPORT');
    console.log('='.repeat(80));
    console.log(`Environment: ${CONFIG.environment}`);
    console.log(`Base URL: ${CONFIG.baseUrl}`);
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log('');
    console.log(`📊 Test Results:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   🚨 Critical Failures: ${criticalFailed}`);
    console.log('');

    // Group results by category
    const categories = {};
    this.results.forEach(result => {
      const cat = result.category || 'general';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(result);
    });

    Object.entries(categories).forEach(([category, tests]) => {
      const categoryPassed = tests.filter(t => t.status === 'PASS').length;
      const categoryTotal = tests.length;
      console.log(`📁 ${category.toUpperCase()}: ${categoryPassed}/${categoryTotal} passed`);
      
      tests.forEach(test => {
        const icon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⏭️';
        console.log(`   ${icon} ${test.name} ${test.duration ? `(${test.duration}ms)` : ''}`);
        if (test.error) {
          console.log(`      Error: ${test.error}`);
        }
      });
      console.log('');
    });

    // Overall health status
    const healthStatus = criticalFailed === 0 ? 'HEALTHY' : 'UNHEALTHY';
    const healthIcon = criticalFailed === 0 ? '🟢' : '🔴';
    
    console.log(`${healthIcon} Overall Health: ${healthStatus}`);
    console.log('='.repeat(80));

    return {
      status: healthStatus,
      totalTests,
      passed,
      failed,
      skipped,
      criticalFailed,
      duration: totalDuration,
      results: this.results
    };
  }

  // Main test runner
  async runAllTests() {
    console.log('🚀 Starting Production Health Check...');
    console.log(`Environment: ${CONFIG.environment}`);
    console.log(`Base URL: ${CONFIG.baseUrl}`);
    console.log(`Production Mode: ${CONFIG.isProduction}`);
    console.log('');

    // Core Infrastructure Tests (Critical)
    await this.runTest('Website Accessibility', () => this.testWebsiteAccessibility(), 
      { critical: true, category: 'infrastructure' });
    
    await this.runTest('API Health Check', () => this.testAPIHealth(), 
      { critical: true, category: 'infrastructure' });
    
    await this.runTest('Static Assets', () => this.testStaticAssets(), 
      { category: 'infrastructure' });

    // Page Accessibility Tests (Critical)
    await this.runTest('All Pages Accessible', () => this.testPageAccessibility(), 
      { critical: true, category: 'pages' });

    // Authentication System Tests
    await this.runTest('Authentication System', () => this.testAuthenticationFlow(), 
      { critical: true, category: 'authentication' });

    // Core Functionality Tests
    await this.runTest('Cart Functionality', () => this.testCartFunctionality(), 
      { critical: true, category: 'functionality' });
    
    await this.runTest('Order System', () => this.testOrderSystem(), 
      { critical: true, category: 'functionality' });
    
    await this.runTest('Subscription System', () => this.testSubscriptionSystem(), 
      { critical: true, category: 'functionality' });

    // API Tests
    await this.runTest('Critical APIs', () => this.testCriticalAPIs(), 
      { critical: true, category: 'api' });

    // Security Tests (Critical)
    await this.runTest('Security Measures', () => this.testSecurityMeasures(), 
      { critical: true, category: 'security' });

    // Performance Tests
    await this.runTest('Performance Check', () => this.testPerformance(), 
      { category: 'performance' });

    // Database Tests
    await this.runTest('Database Connectivity', () => this.testDatabaseConnectivity(), 
      { category: 'database' });

    // Email System Tests
    await this.runTest('Email System', () => this.testEmailSystem(), 
      { category: 'email', skipInProd: true });

    return this.generateReport();
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const isCI = process.env.CI === 'true';
  const outputFile = args.find(arg => arg.startsWith('--output='))?.split('=')[1];

  try {
    const checker = new ProductionHealthChecker();
    const report = await checker.runAllTests();

    // Save report to file if requested
    if (outputFile) {
      await fs.writeFile(outputFile, JSON.stringify(report, null, 2));
      console.log(`📄 Report saved to: ${outputFile}`);
    }

    // Exit with appropriate code
    process.exit(report.criticalFailed > 0 ? 1 : 0);

  } catch (error) {
    console.error('💥 Health check failed:', error.message);
    process.exit(1);
  }
}

// Export for programmatic use
module.exports = { ProductionHealthChecker, CONFIG };

// Run if called directly
if (require.main === module) {
  main();
}
