/**
 * Simple Master E2E Test Runner for Elixr Studio
 * 
 * This script runs comprehensive E2E tests for all major features
 */

const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

class SimpleMasterTestRunner {
  constructor() {
    this.browser = null;
    this.testResults = [];
    this.config = {
      baseUrl: 'http://localhost:9002',
      headless: false,
      viewport: { width: 1280, height: 720 }
    };
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async initialize() {
    console.log('🎯 SIMPLE MASTER E2E TEST SUITE');
    console.log('================================');
    console.log(`🌐 Base URL: ${this.config.baseUrl}`);
    console.log('================================\n');

    this.browser = await puppeteer.launch({
      headless: this.config.headless,
      devtools: false,
      slowMo: 100,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    console.log('✅ Browser launched successfully\n');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('✅ Browser closed\n');
    }
  }

  async runTest(testName, testFunction) {
    console.log(`\n🧪 ${testName}`);
    console.log('─'.repeat(40));
    
    const startTime = Date.now();
    
    try {
      await testFunction();
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        name: testName,
        status: 'PASSED',
        duration,
        error: null
      });
      
      console.log(`✅ ${testName} - PASSED (${duration}ms)`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        name: testName,
        status: 'FAILED',
        duration,
        error: error.message
      });
      
      console.log(`❌ ${testName} - FAILED (${duration}ms)`);
      console.log(`   Error: ${error.message}`);
    }
  }

  async testHomePage() {
    const page = await this.browser.newPage();
    await page.setViewport(this.config.viewport);
    
    try {
      await page.goto(`${this.config.baseUrl}/`);
      await page.waitForSelector('body');
      
      const title = await page.title();
      console.log(`   📝 Page title: ${title}`);
      
      // Check for common elements
      const hasNavigation = await page.$('nav, .navbar, .navigation') !== null;
      const hasHeader = await page.$('header, .header') !== null;
      const hasFooter = await page.$('footer, .footer') !== null;
      
      console.log(`   📝 Navigation: ${hasNavigation ? '✓' : '✗'}`);
      console.log(`   📝 Header: ${hasHeader ? '✓' : '✗'}`);
      console.log(`   📝 Footer: ${hasFooter ? '✓' : '✗'}`);
      
    } finally {
      await page.close();
    }
  }

  async testLoginPage() {
    const page = await this.browser.newPage();
    await page.setViewport(this.config.viewport);
    
    try {
      await page.goto(`${this.config.baseUrl}/login`);
      await page.waitForSelector('body');
      
      // Look for login form elements
      const emailInput = await page.$('input[type="email"]') !== null;
      const passwordInput = await page.$('input[type="password"]') !== null;
      const submitButton = await page.$('button[type="submit"], input[type="submit"]') !== null;
      
      console.log(`   📝 Email input: ${emailInput ? '✓' : '✗'}`);
      console.log(`   📝 Password input: ${passwordInput ? '✓' : '✗'}`);
      console.log(`   📝 Submit button: ${submitButton ? '✓' : '✗'}`);
      
      if (!emailInput || !passwordInput || !submitButton) {
        throw new Error('Login form is incomplete');
      }
      
    } finally {
      await page.close();
    }
  }

  async testSignupPage() {
    const page = await this.browser.newPage();
    await page.setViewport(this.config.viewport);
    
    try {
      await page.goto(`${this.config.baseUrl}/signup`);
      await page.waitForSelector('body');
      
      // Look for signup form elements
      const hasForm = await page.$('form') !== null;
      const emailInput = await page.$('input[type="email"]') !== null;
      const passwordInput = await page.$('input[type="password"]') !== null;
      
      console.log(`   📝 Form present: ${hasForm ? '✓' : '✗'}`);
      console.log(`   📝 Email input: ${emailInput ? '✓' : '✗'}`);
      console.log(`   📝 Password input: ${passwordInput ? '✓' : '✗'}`);
      
    } finally {
      await page.close();
    }
  }

  async testPasswordResetFlow() {
    // Run the existing detailed password reset test
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);
      
      const { stdout, stderr } = await execPromise('node tests/e2e/detailed-submit-debug.js');
      if (stderr && !stderr.includes('Warning')) {
        throw new Error(`Password reset test failed: ${stderr}`);
      }
      console.log('   📝 Password reset E2E test passed');
    } catch (error) {
      throw new Error(`Failed to run password reset test: ${error.message}`);
    }
  }

  async testProductsPage() {
    const page = await this.browser.newPage();
    await page.setViewport(this.config.viewport);
    
    try {
      await page.goto(`${this.config.baseUrl}/products`);
      await page.waitForSelector('body');
      
      // Look for product-related elements
      const productElements = await page.$$('[data-testid="product"], .product, .product-card, .product-item');
      const hasSearchInput = await page.$('input[type="search"], input[placeholder*="search" i]') !== null;
      const hasFilterOptions = await page.$('.filter, .category, select') !== null;
      
      console.log(`   📝 Products found: ${productElements.length}`);
      console.log(`   📝 Search functionality: ${hasSearchInput ? '✓' : '✗'}`);
      console.log(`   📝 Filter options: ${hasFilterOptions ? '✓' : '✗'}`);
      
    } finally {
      await page.close();
    }
  }

  async testCartPage() {
    const page = await this.browser.newPage();
    await page.setViewport(this.config.viewport);
    
    try {
      await page.goto(`${this.config.baseUrl}/cart`);
      await page.waitForSelector('body');
      
      // Check if cart page is accessible
      const currentUrl = page.url();
      if (currentUrl.includes('/cart')) {
        console.log('   📝 Cart page accessible');
        
        const cartContainer = await page.$('.cart, .shopping-cart, [data-testid="cart"]') !== null;
        console.log(`   📝 Cart container: ${cartContainer ? '✓' : '✗'}`);
      } else {
        console.log('   📝 Cart page redirected (may require authentication)');
      }
      
    } finally {
      await page.close();
    }
  }

  async testCheckoutPage() {
    const page = await this.browser.newPage();
    await page.setViewport(this.config.viewport);
    
    try {
      await page.goto(`${this.config.baseUrl}/checkout`);
      await page.waitForSelector('body');
      
      const currentUrl = page.url();
      if (currentUrl.includes('/checkout')) {
        console.log('   📝 Checkout page accessible');
        
        const checkoutForm = await page.$('form, .checkout-form') !== null;
        console.log(`   📝 Checkout form: ${checkoutForm ? '✓' : '✗'}`);
      } else {
        console.log('   📝 Checkout requires items in cart or authentication');
      }
      
    } finally {
      await page.close();
    }
  }

  async testPageLoadPerformance() {
    const page = await this.browser.newPage();
    await page.setViewport(this.config.viewport);
    
    try {
      const pages = ['/', '/login', '/signup', '/products'];
      const results = {};
      
      for (const pagePath of pages) {
        const startTime = Date.now();
        await page.goto(`${this.config.baseUrl}${pagePath}`);
        await page.waitForSelector('body');
        const loadTime = Date.now() - startTime;
        
        results[pagePath] = loadTime;
        console.log(`   📝 ${pagePath}: ${loadTime}ms`);
        
        if (loadTime > 5000) {
          console.log(`   ⚠️ Slow page load detected: ${pagePath}`);
        }
      }
      
    } finally {
      await page.close();
    }
  }

  async testMobileResponsiveness() {
    const page = await this.browser.newPage();
    await page.setViewport({ width: 375, height: 812 }); // iPhone X dimensions
    
    try {
      await page.goto(`${this.config.baseUrl}/`);
      await page.waitForSelector('body');
      
      // Check for mobile navigation
      const mobileMenu = await page.$('.mobile-menu, .hamburger, .menu-toggle') !== null;
      console.log(`   📝 Mobile menu: ${mobileMenu ? '✓' : '✗'}`);
      
      // Check viewport meta tag
      const viewportMeta = await page.$('meta[name="viewport"]') !== null;
      console.log(`   📝 Viewport meta tag: ${viewportMeta ? '✓' : '✗'}`);
      
      // Test different pages on mobile
      const pages = ['/login', '/products'];
      for (const pagePath of pages) {
        await page.goto(`${this.config.baseUrl}${pagePath}`);
        await page.waitForSelector('body');
        console.log(`   📝 ${pagePath} mobile layout loaded`);
      }
      
    } finally {
      await page.close();
    }
  }

  async testSecurityHeaders() {
    const page = await this.browser.newPage();
    
    try {
      const response = await page.goto(`${this.config.baseUrl}/`);
      const headers = response.headers();
      
      const securityHeaders = {
        'x-frame-options': headers['x-frame-options'],
        'x-content-type-options': headers['x-content-type-options'],
        'x-xss-protection': headers['x-xss-protection'],
        'content-security-policy': headers['content-security-policy'],
        'strict-transport-security': headers['strict-transport-security']
      };
      
      Object.entries(securityHeaders).forEach(([header, value]) => {
        console.log(`   📝 ${header}: ${value ? '✓' : '✗'}`);
      });
      
    } finally {
      await page.close();
    }
  }

  async generateReport() {
    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.status === 'PASSED').length;
    const failed = this.testResults.filter(r => r.status === 'FAILED').length;
    const duration = this.testResults.reduce((sum, r) => sum + r.duration, 0);

    console.log('\n🎯 FINAL TEST REPORT');
    console.log('═'.repeat(40));
    console.log(`📊 Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️ Total Duration: ${Math.round(duration / 1000)}s`);
    console.log(`📈 Success Rate: ${Math.round((passed / total) * 100)}%`);
    
    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults.filter(r => r.status === 'FAILED').forEach(test => {
        console.log(`   - ${test.name}: ${test.error}`);
      });
    }

    return { total, passed, failed, duration };
  }

  async runAllTests() {
    try {
      await this.initialize();

      // Core functionality tests
      await this.runTest('Home Page Load', () => this.testHomePage());
      await this.runTest('Login Page Access', () => this.testLoginPage());
      await this.runTest('Signup Page Access', () => this.testSignupPage());
      await this.runTest('Password Reset Flow', () => this.testPasswordResetFlow());
      
      // E-commerce tests
      await this.runTest('Products Page', () => this.testProductsPage());
      await this.runTest('Cart Page Access', () => this.testCartPage());
      await this.runTest('Checkout Page Access', () => this.testCheckoutPage());
      
      // Performance tests
      await this.runTest('Page Load Performance', () => this.testPageLoadPerformance());
      
      // Mobile tests
      await this.runTest('Mobile Responsiveness', () => this.testMobileResponsiveness());
      
      // Security tests
      await this.runTest('Security Headers', () => this.testSecurityHeaders());

      return await this.generateReport();

    } finally {
      await this.cleanup();
    }
  }

  async runCategory(category) {
    try {
      await this.initialize();

      switch (category) {
        case 'auth':
          await this.runTest('Login Page Access', () => this.testLoginPage());
          await this.runTest('Signup Page Access', () => this.testSignupPage());
          await this.runTest('Password Reset Flow', () => this.testPasswordResetFlow());
          break;
          
        case 'ecommerce':
          await this.runTest('Products Page', () => this.testProductsPage());
          await this.runTest('Cart Page Access', () => this.testCartPage());
          await this.runTest('Checkout Page Access', () => this.testCheckoutPage());
          break;
          
        case 'performance':
          await this.runTest('Page Load Performance', () => this.testPageLoadPerformance());
          break;
          
        case 'mobile':
          await this.runTest('Mobile Responsiveness', () => this.testMobileResponsiveness());
          break;
          
        case 'security':
          await this.runTest('Security Headers', () => this.testSecurityHeaders());
          break;
          
        default:
          console.log(`⚠️ Unknown category: ${category}`);
          await this.runAllTests();
      }

      return await this.generateReport();

    } finally {
      await this.cleanup();
    }
  }
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2);
  const categoryArg = args.find(arg => arg.startsWith('--category='));
  
  const runner = new SimpleMasterTestRunner();
  
  let category = null;
  if (categoryArg) {
    category = categoryArg.split('=')[1];
  }

  const testPromise = category ? runner.runCategory(category) : runner.runAllTests();
  
  testPromise.then(results => {
    const exitCode = results.failed > 0 ? 1 : 0;
    process.exit(exitCode);
  }).catch(error => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { SimpleMasterTestRunner };
