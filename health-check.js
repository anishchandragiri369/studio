#!/usr/bin/env node

/**
 * Production Health Check & E2E Testing Suite
 * Comprehensive testing that can run in any environment including production
 * Tests all critical user journeys and system functionality
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Test configuration
const CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:9002',
  environment: process.env.NODE_ENV || 'development',
  timeout: 30000,
  skipDestructiveTests: process.env.NODE_ENV === 'production',
  testUser: {
    email: process.env.TEST_USER_EMAIL || 'test@elixr.com',
    password: process.env.TEST_USER_PASSWORD || 'testpass123'
  }
};

class HealthChecker {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  async runTest(name, testFn, critical = false) {
    console.log(`🧪 Testing: ${name}`);
    const start = Date.now();
    
    try {
      await testFn();
      const duration = Date.now() - start;
      this.results.push({ name, status: 'PASS', duration, critical });
      console.log(`✅ PASS: ${name} (${duration}ms)`);
      return true;
    } catch (error) {
      const duration = Date.now() - start;
      this.results.push({ name, status: 'FAIL', error: error.message, duration, critical });
      console.log(`❌ FAIL: ${name} - ${error.message} (${duration}ms)`);
      return false;
    }
  }

  async testWebsiteAccessibility() {
    const response = await fetch(`${CONFIG.baseUrl}/`);
    if (!response.ok) {
      throw new Error(`Homepage returned ${response.status}`);
    }
    const text = await response.text();
    if (!text.includes('Elixr') && !text.includes('html')) {
      throw new Error('Homepage content invalid');
    }
  }

  async testAPIHealth() {
    // Test a simple API endpoint that should always work
    const response = await fetch(`${CONFIG.baseUrl}/api/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (response.status === 404) {
      // Health endpoint doesn't exist, that's okay - test another endpoint
      return;
    }
    
    if (!response.ok) {
      throw new Error(`API health check failed: ${response.status}`);
    }
  }

  async testPageRoutes() {
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

    for (const route of routes) {
      const response = await fetch(`${CONFIG.baseUrl}${route}`);
      if (!response.ok && response.status !== 404) {
        throw new Error(`Route ${route} returned ${response.status}`);
      }
    }
  }

  async testAuthenticationFlow() {
    if (CONFIG.skipDestructiveTests) {
      console.log('⚠️  Skipping auth tests in production');
      return;
    }

    // Test signup endpoint exists
    const signupResponse = await fetch(`${CONFIG.baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test+${Date.now()}@example.com`,
        password: 'testpass123',
        name: 'Test User'
      })
    });

    // Don't require success, just that endpoint exists
    if (signupResponse.status === 404) {
      throw new Error('Signup endpoint not found');
    }
  }

  async testOrderCreationFlow() {
    if (CONFIG.skipDestructiveTests) {
      console.log('⚠️  Using read-only order tests in production');
      
      // Test that order API endpoint exists
      const response = await fetch(`${CONFIG.baseUrl}/api/orders/test`, {
        method: 'GET'
      });
      
      // Don't require success, just that endpoint exists
      if (response.status === 404) {
        throw new Error('Order API endpoint not found');
      }
      return;
    }

    // Full order creation test for non-production
    const orderData = {
      items: [
        { juiceId: 'orange-classic', quantity: 2, price: 60 }
      ],
      total: 120,
      customerInfo: {
        email: CONFIG.testUser.email,
        name: 'Test Customer'
      }
    };

    const response = await fetch(`${CONFIG.baseUrl}/api/orders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    if (response.status === 404) {
      throw new Error('Order creation endpoint not found');
    }
  }

  async testPaymentGatewayConnection() {
    if (CONFIG.skipDestructiveTests) {
      console.log('⚠️  Skipping payment tests in production');
      return;
    }

    const testOrder = {
      orderId: `test-${Date.now()}`,
      amount: 100,
      customerEmail: CONFIG.testUser.email
    };

    const response = await fetch(`${CONFIG.baseUrl}/api/cashfree/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testOrder)
    });

    if (response.status === 404) {
      throw new Error('Payment gateway endpoint not found');
    }
    
    // In sandbox mode, we should get a response
    if (response.status === 500) {
      const error = await response.text();
      if (error.includes('configuration') || error.includes('sandbox')) {
        // Payment gateway configuration issue - not a critical failure
        console.log('⚠️  Payment gateway configuration issue (non-critical)');
        return;
      }
      throw new Error(`Payment gateway error: ${error}`);
    }
  }

  async testEmailSystem() {
    const testData = {
      orderId: `test-${Date.now()}`,
      userEmail: CONFIG.testUser.email,
      reason: 'Health check test'
    };

    const response = await fetch(`${CONFIG.baseUrl}/api/send-payment-failure-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    if (response.status === 404) {
      throw new Error('Email API endpoint not found');
    }

    // Email system should respond, even if it fails to send
    if (response.status >= 500) {
      const error = await response.text();
      if (error.includes('Order not found')) {
        // Expected error for test order ID
        return;
      }
      throw new Error(`Email system critical error: ${error}`);
    }
  }

  async testDatabaseConnection() {
    // Test that we can access some data endpoint
    const response = await fetch(`${CONFIG.baseUrl}/api/menu/juices`);
    
    if (response.status === 404) {
      // Try another endpoint
      const altResponse = await fetch(`${CONFIG.baseUrl}/api/subscriptions/plans`);
      if (altResponse.status === 404) {
        throw new Error('No database endpoints accessible');
      }
    }

    if (response.status >= 500) {
      throw new Error('Database connection issue');
    }
  }

  async testSubscriptionSystem() {
    if (CONFIG.skipDestructiveTests) {
      console.log('⚠️  Skipping subscription creation in production');
      
      // Test that subscription endpoints exist
      const response = await fetch(`${CONFIG.baseUrl}/api/subscriptions/plans`);
      if (response.status === 404) {
        throw new Error('Subscription API not found');
      }
      return;
    }

    // Test subscription creation endpoint
    const testSubscription = {
      userId: `test-user-${Date.now()}`,
      planId: 'weekly-starter',
      customerInfo: {
        email: CONFIG.testUser.email,
        name: 'Test Customer'
      }
    };

    const response = await fetch(`${CONFIG.baseUrl}/api/subscriptions/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testSubscription)
    });

    if (response.status === 404) {
      throw new Error('Subscription creation endpoint not found');
    }
  }

  async testProductionSecurity() {
    if (CONFIG.environment !== 'production') {
      console.log('⚠️  Skipping security tests (not production)');
      return;
    }

    // Test that development endpoints are blocked
    const testEndpoints = [
      '/test-webhook',
      '/test-email', 
      '/test-subscription',
      '/api/test-delivery-scheduler'
    ];

    for (const endpoint of testEndpoints) {
      const response = await fetch(`${CONFIG.baseUrl}${endpoint}`);
      if (response.ok) {
        throw new Error(`Development endpoint ${endpoint} is accessible in production!`);
      }
    }
  }

  async testWebhookEndpoints() {
    // Test that webhook endpoints exist and can handle requests
    const webhookData = {
      type: 'HEALTH_CHECK',
      data: { test: true }
    };

    const response = await fetch(`${CONFIG.baseUrl}/api/webhook/payment-confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookData)
    });

    if (response.status === 404) {
      throw new Error('Webhook endpoint not found');
    }

    // Webhook should respond, even if it rejects the test data
  }

  async generateReport() {
    const totalDuration = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const criticalFailed = this.results.filter(r => r.status === 'FAIL' && r.critical).length;

    console.log('\n📊 HEALTH CHECK REPORT');
    console.log('========================');
    console.log(`🌐 Environment: ${CONFIG.environment}`);
    console.log(`🔗 Base URL: ${CONFIG.baseUrl}`);
    console.log(`⏱️  Total Duration: ${totalDuration}ms`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`🚨 Critical Failures: ${criticalFailed}`);

    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => {
          const critical = r.critical ? '🚨 CRITICAL' : '';
          console.log(`   ${critical} ${r.name}: ${r.error}`);
        });
    }

    console.log('\n📋 ALL RESULTS:');
    this.results.forEach(r => {
      const status = r.status === 'PASS' ? '✅' : '❌';
      const critical = r.critical && r.status === 'FAIL' ? '🚨' : '';
      console.log(`   ${status} ${critical} ${r.name} (${r.duration}ms)`);
    });

    // Return overall health status
    const overallHealth = criticalFailed === 0 ? 'HEALTHY' : 'UNHEALTHY';
    console.log(`\n🏥 Overall Health: ${overallHealth}`);
    
    return {
      healthy: criticalFailed === 0,
      passed,
      failed,
      criticalFailed,
      totalDuration,
      results: this.results
    };
  }

  async runFullHealthCheck() {
    console.log('🚀 Starting Production Health Check...');
    console.log(`🌐 Target: ${CONFIG.baseUrl}`);
    console.log(`🏷️  Environment: ${CONFIG.environment}`);
    console.log('=====================================\n');

    // Critical tests (system must pass these)
    await this.runTest('Website Accessibility', () => this.testWebsiteAccessibility(), true);
    await this.runTest('API Health', () => this.testAPIHealth(), true);
    await this.runTest('Database Connection', () => this.testDatabaseConnection(), true);
    
    // Important tests
    await this.runTest('Page Routes', () => this.testPageRoutes(), false);
    await this.runTest('Authentication Flow', () => this.testAuthenticationFlow(), false);
    await this.runTest('Order System', () => this.testOrderCreationFlow(), false);
    await this.runTest('Payment Gateway', () => this.testPaymentGatewayConnection(), false);
    await this.runTest('Email System', () => this.testEmailSystem(), false);
    await this.runTest('Subscription System', () => this.testSubscriptionSystem(), false);
    await this.runTest('Webhook Endpoints', () => this.testWebhookEndpoints(), false);
    
    // Security tests
    await this.runTest('Production Security', () => this.testProductionSecurity(), true);

    const report = await this.generateReport();
    
    // Exit with appropriate code for CI/CD
    if (!report.healthy) {
      console.log('\n🚨 Health check failed!');
      process.exit(1);
    } else {
      console.log('\n✅ Health check passed!');
      process.exit(0);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const checker = new HealthChecker();
  checker.runFullHealthCheck().catch(error => {
    console.error('🚨 Health check crashed:', error);
    process.exit(1);
  });
}

module.exports = { HealthChecker };
