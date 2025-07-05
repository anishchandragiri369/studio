/**
 * E2E Test Helper Utilities
 * 
 * Common utilities and helper functions for all E2E tests
 */

const fs = require('fs').promises;
const path = require('path');

class TestHelpers {
  constructor(page, config = {}) {
    this.page = page;
    this.config = config;
    this.screenshotCounter = 0;
  }

  // Navigation helpers
  async navigateWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        await this.page.goto(url, { waitUntil: 'networkidle0' });
        return;
      } catch (error) {
        if (i === retries - 1) throw error;
        console.log(`Navigation attempt ${i + 1} failed, retrying...`);
        await this.wait(1000);
      }
    }
  }

  // Wait helpers
  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async waitForElement(selector, timeout = 10000) {
    return await this.page.waitForSelector(selector, { timeout });
  }

  async waitForText(text, timeout = 10000) {
    return await this.page.waitForFunction(
      text => document.body.innerText.includes(text),
      { timeout },
      text
    );
  }

  // Form helpers
  async fillForm(formData) {
    for (const [selector, value] of Object.entries(formData)) {
      await this.page.waitForSelector(selector);
      await this.page.type(selector, value);
    }
  }

  async submitFormAndWait(submitSelector, waitForSelector = null) {
    await this.page.click(submitSelector);
    if (waitForSelector) {
      await this.waitForElement(waitForSelector);
    } else {
      await this.wait(2000);
    }
  }

  // Verification helpers
  async verifyElementExists(selector) {
    const element = await this.page.$(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }
    return element;
  }

  async verifyElementNotExists(selector) {
    const element = await this.page.$(selector);
    if (element) {
      throw new Error(`Element should not exist: ${selector}`);
    }
  }

  async verifyText(selector, expectedText) {
    const element = await this.page.$(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }
    
    const actualText = await this.page.evaluate(el => el.textContent, element);
    if (!actualText.includes(expectedText)) {
      throw new Error(`Text mismatch. Expected: "${expectedText}", Actual: "${actualText}"`);
    }
  }

  async verifyUrl(expectedUrl, exact = false) {
    const currentUrl = this.page.url();
    if (exact) {
      if (currentUrl !== expectedUrl) {
        throw new Error(`URL mismatch. Expected: "${expectedUrl}", Actual: "${currentUrl}"`);
      }
    } else {
      if (!currentUrl.includes(expectedUrl)) {
        throw new Error(`URL should contain: "${expectedUrl}", Actual: "${currentUrl}"`);
      }
    }
  }

  // Screenshot helpers
  async takeScreenshot(name = null) {
    if (!this.config.saveScreenshots) return;
    
    const screenshotName = name || `screenshot-${++this.screenshotCounter}`;
    const screenshotPath = path.join(
      this.config.screenshotPath || 'tests/screenshots',
      `${screenshotName}-${Date.now()}.png`
    );
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
    
    await this.page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot saved: ${screenshotPath}`);
    return screenshotPath;
  }

  async takeScreenshotOnError(testName, error) {
    const screenshotPath = await this.takeScreenshot(`error-${testName}`);
    console.log(`❌ Test "${testName}" failed. Screenshot: ${screenshotPath}`);
    console.log(`Error: ${error.message}`);
  }

  // Authentication helpers
  async loginUser(email, password) {
    await this.navigateWithRetry(`${this.config.baseUrl}/login`);
    
    await this.fillForm({
      'input[type="email"]': email,
      'input[type="password"]': password
    });
    
    await this.submitFormAndWait('button[type="submit"]');
    
    // Verify login success
    await this.wait(2000);
    const currentUrl = this.page.url();
    if (currentUrl.includes('/login')) {
      throw new Error('Login failed - still on login page');
    }
  }

  async logoutUser() {
    const logoutSelectors = [
      '[data-testid="logout"]',
      '.logout-button',
      'button:contains("Logout")',
      'a:contains("Logout")',
      '[data-testid="user-menu"]'
    ];
    
    for (const selector of logoutSelectors) {
      try {
        const element = await this.page.$(selector);
        if (element) {
          await element.click();
          await this.wait(1000);
          
          // If it's a dropdown, look for actual logout option
          const logoutOption = await this.page.$('button:contains("Logout"), a:contains("Logout")');
          if (logoutOption) {
            await logoutOption.click();
          }
          
          await this.wait(2000);
          return;
        }
      } catch (error) {
        continue;
      }
    }
    
    console.log('⚠️ Logout button not found');
  }

  // Cart helpers
  async addToCart(productSelector = null) {
    if (productSelector) {
      await this.page.click(productSelector);
      await this.wait(1000);
    }
    
    const addToCartSelectors = [
      '[data-testid="add-to-cart"]',
      '.add-to-cart',
      'button:contains("Add to Cart")',
      'button:contains("Add to Bag")'
    ];
    
    for (const selector of addToCartSelectors) {
      try {
        const element = await this.page.$(selector);
        if (element) {
          await element.click();
          await this.wait(1000);
          return;
        }
      } catch (error) {
        continue;
      }
    }
    
    throw new Error('Add to cart button not found');
  }

  async goToCart() {
    const cartSelectors = [
      '[data-testid="cart-button"]',
      '.cart-button',
      'a[href*="/cart"]',
      'button:contains("Cart")'
    ];
    
    for (const selector of cartSelectors) {
      try {
        const element = await this.page.$(selector);
        if (element) {
          await element.click();
          await this.wait(2000);
          return;
        }
      } catch (error) {
        continue;
      }
    }
    
    // Fallback: navigate directly
    await this.navigateWithRetry(`${this.config.baseUrl}/cart`);
  }

  // Performance helpers
  async measurePageLoadTime(url) {
    const startTime = Date.now();
    await this.navigateWithRetry(url);
    await this.page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`📊 Page load time for ${url}: ${loadTime}ms`);
    return loadTime;
  }

  async getMemoryUsage() {
    const metrics = await this.page.metrics();
    return {
      usedJSHeapSize: Math.round(metrics.JSHeapUsedSize / 1024 / 1024),
      totalJSHeapSize: Math.round(metrics.JSHeapTotalSize / 1024 / 1024),
      usedJSHeapSizeMB: `${Math.round(metrics.JSHeapUsedSize / 1024 / 1024)}MB`
    };
  }

  // Error handling helpers
  async captureConsoleErrors() {
    const errors = [];
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    return errors;
  }

  async captureNetworkErrors() {
    const errors = [];
    this.page.on('response', response => {
      if (response.status() >= 400) {
        errors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    return errors;
  }

  // Mobile helpers
  async setMobileViewport() {
    await this.page.setViewport({ 
      width: this.config.mobileViewport?.width || 375, 
      height: this.config.mobileViewport?.height || 812 
    });
  }

  async setDesktopViewport() {
    await this.page.setViewport({ 
      width: this.config.viewport?.width || 1280, 
      height: this.config.viewport?.height || 720 
    });
  }

  // Security helpers
  async testXSSInput(inputSelector, xssPayload = '<script>alert("xss")</script>') {
    await this.page.type(inputSelector, xssPayload);
    await this.wait(1000);
    
    // Check if XSS was executed
    const alertExecuted = await this.page.evaluate(() => {
      return window.alertCalled || false;
    });
    
    if (alertExecuted) {
      throw new Error('XSS vulnerability detected');
    }
  }

  // Utility helpers
  async scrollToElement(selector) {
    await this.page.evaluate((selector) => {
      const element = document.querySelector(selector);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, selector);
    await this.wait(500);
  }

  async hover(selector) {
    await this.page.hover(selector);
    await this.wait(300);
  }

  async doubleClick(selector) {
    await this.page.click(selector, { clickCount: 2 });
    await this.wait(300);
  }

  async selectOption(selector, value) {
    await this.page.select(selector, value);
    await this.wait(300);
  }

  async uploadFile(inputSelector, filePath) {
    const input = await this.page.$(inputSelector);
    await input.uploadFile(filePath);
    await this.wait(1000);
  }

  // Database helpers (for cleanup)
  async cleanupTestData(supabase, testEmail) {
    if (!supabase) return;
    
    try {
      // Delete test user and related data
      await supabase.auth.admin.deleteUser(testEmail);
      console.log(`🗑️ Cleaned up test user: ${testEmail}`);
    } catch (error) {
      console.log(`⚠️ Cleanup warning: ${error.message}`);
    }
  }

  // Report generation helpers
  generateTestReport(testResults) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: testResults.length,
        passed: testResults.filter(r => r.status === 'PASSED').length,
        failed: testResults.filter(r => r.status === 'FAILED').length,
        skipped: testResults.filter(r => r.status === 'SKIPPED').length
      },
      results: testResults,
      environment: {
        baseUrl: this.config.baseUrl,
        userAgent: this.page.evaluate(() => navigator.userAgent)
      }
    };
    
    return report;
  }

  async saveReport(report, filename = 'test-report.json') {
    const reportPath = path.join(
      this.config.reportPath || 'tests/reports',
      filename
    );
    
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 Test report saved: ${reportPath}`);
    return reportPath;
  }
}

// Common test data generators
class TestDataGenerator {
  static generateEmail() {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
  }

  static generatePassword() {
    return `TestPass${Date.now()}!`;
  }

  static generateUser() {
    return {
      email: this.generateEmail(),
      password: this.generatePassword(),
      name: `Test User ${Date.now()}`
    };
  }

  static generateProduct() {
    return {
      name: `Test Product ${Date.now()}`,
      price: Math.floor(Math.random() * 100) + 10,
      description: 'Test product description'
    };
  }
}

// Test assertions
class TestAssertions {
  static async assertElementExists(page, selector, message = null) {
    const element = await page.$(selector);
    if (!element) {
      throw new Error(message || `Element not found: ${selector}`);
    }
    return element;
  }

  static async assertElementNotExists(page, selector, message = null) {
    const element = await page.$(selector);
    if (element) {
      throw new Error(message || `Element should not exist: ${selector}`);
    }
  }

  static async assertTextContent(page, selector, expectedText, message = null) {
    const element = await page.$(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }
    
    const actualText = await page.evaluate(el => el.textContent, element);
    if (!actualText.includes(expectedText)) {
      throw new Error(
        message || 
        `Text assertion failed. Expected: "${expectedText}", Actual: "${actualText}"`
      );
    }
  }

  static async assertUrl(page, expectedUrl, exact = false, message = null) {
    const currentUrl = page.url();
    const matches = exact ? currentUrl === expectedUrl : currentUrl.includes(expectedUrl);
    
    if (!matches) {
      throw new Error(
        message || 
        `URL assertion failed. Expected: "${expectedUrl}", Actual: "${currentUrl}"`
      );
    }
  }

  static async assertPageTitle(page, expectedTitle, message = null) {
    const actualTitle = await page.title();
    if (!actualTitle.includes(expectedTitle)) {
      throw new Error(
        message || 
        `Title assertion failed. Expected: "${expectedTitle}", Actual: "${actualTitle}"`
      );
    }
  }
}

module.exports = {
  TestHelpers,
  TestDataGenerator,
  TestAssertions
};
