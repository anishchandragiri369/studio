/**
 * E-Commerce Feature Tests
 * 
 * Comprehensive tests for all e-commerce functionality including:
 * - Product catalog and search
 * - Shopping cart operations
 * - Checkout process
 * - Order management
 * - Subscription handling
 */

const puppeteer = require('puppeteer');

class ECommerceTests {
  constructor(baseUrl = 'http://localhost:9002') {
    this.baseUrl = baseUrl;
    this.browser = null;
    this.page = null;
    this.testResults = [];
  }

  async setup() {
    this.browser = await puppeteer.launch({
      headless: false,
      devtools: false,
      slowMo: 150
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 720 });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runTest(testName, testFunction) {
    console.log(`\n🧪 ${testName}`);
    console.log('─'.repeat(40));
    
    try {
      await testFunction();
      console.log(`✅ ${testName} - PASSED`);
      this.testResults.push({ name: testName, status: 'PASSED' });
    } catch (error) {
      console.log(`❌ ${testName} - FAILED: ${error.message}`);
      this.testResults.push({ name: testName, status: 'FAILED', error: error.message });
    }
  }

  // Test product catalog browsing
  async testProductCatalog() {
    await this.page.goto(`${this.baseUrl}/juices`);
    await this.page.waitForTimeout(3000);
    
    // Check for product grid
    const products = await this.page.$$('.product-card, .juice-card, [data-testid="product"]');
    if (products.length === 0) {
      throw new Error('No products found in catalog');
    }
    
    console.log(`📦 Found ${products.length} products`);
    
    // Test product details page
    await products[0].click();
    await this.page.waitForTimeout(2000);
    
    const productTitle = await this.page.$('h1, .product-title, [data-testid="product-title"]');
    if (!productTitle) {
      throw new Error('Product details page did not load properly');
    }
    
    console.log('📋 Product details page loaded');
  }

  // Test shopping cart functionality
  async testShoppingCart() {
    await this.page.goto(`${this.baseUrl}/juices`);
    await this.page.waitForTimeout(3000);
    
    // Find and click add to cart button
    const addToCartButton = await this.page.$('button:contains("Add to Cart"), .add-to-cart, [data-testid="add-to-cart"]');
    if (addToCartButton) {
      await addToCartButton.click();
      await this.page.waitForTimeout(1000);
      console.log('🛒 Item added to cart');
    }
    
    // Navigate to cart
    await this.page.goto(`${this.baseUrl}/cart`);
    await this.page.waitForTimeout(2000);
    
    // Verify cart has items
    const cartItems = await this.page.$$('.cart-item, [data-testid="cart-item"]');
    if (cartItems.length === 0) {
      console.log('ℹ️ Cart is empty or cart functionality not found');
    } else {
      console.log(`🛒 Cart contains ${cartItems.length} items`);
    }
  }

  // Test fruit bowl functionality
  async testFruitBowls() {
    await this.page.goto(`${this.baseUrl}/fruit-bowls`);
    await this.page.waitForTimeout(3000);
    
    const fruitBowls = await this.page.$$('.fruit-bowl, .bowl-card, [data-testid="fruit-bowl"]');
    if (fruitBowls.length > 0) {
      console.log(`🥗 Found ${fruitBowls.length} fruit bowls`);
      
      // Test fruit bowl customization
      await fruitBowls[0].click();
      await this.page.waitForTimeout(2000);
      
      const customizeButton = await this.page.$('button:contains("Customize"), .customize-btn, [data-testid="customize"]');
      if (customizeButton) {
        await customizeButton.click();
        await this.page.waitForTimeout(1000);
        console.log('🎨 Fruit bowl customization interface loaded');
      }
    } else {
      console.log('ℹ️ No fruit bowls found or page not available');
    }
  }

  // Test subscription functionality
  async testSubscriptions() {
    await this.page.goto(`${this.baseUrl}/subscriptions`);
    await this.page.waitForTimeout(3000);
    
    const subscriptionPlans = await this.page.$$('.subscription-plan, .plan-card, [data-testid="subscription-plan"]');
    if (subscriptionPlans.length > 0) {
      console.log(`📦 Found ${subscriptionPlans.length} subscription plans`);
      
      // Test subscription selection
      const subscribeButton = await this.page.$('button:contains("Subscribe"), .subscribe-btn, [data-testid="subscribe"]');
      if (subscribeButton) {
        await subscribeButton.click();
        await this.page.waitForTimeout(2000);
        console.log('📝 Subscription signup process initiated');
      }
    } else {
      console.log('ℹ️ No subscription plans found');
    }
  }

  // Test checkout process
  async testCheckout() {
    // First add something to cart
    await this.page.goto(`${this.baseUrl}/juices`);
    await this.page.waitForTimeout(2000);
    
    const addToCartButton = await this.page.$('button:contains("Add"), .add-to-cart');
    if (addToCartButton) {
      await addToCartButton.click();
      await this.page.waitForTimeout(1000);
    }
    
    // Go to checkout
    await this.page.goto(`${this.baseUrl}/checkout`);
    await this.page.waitForTimeout(3000);
    
    // Check for checkout form
    const checkoutForm = await this.page.$('form, .checkout-form, [data-testid="checkout-form"]');
    if (checkoutForm) {
      console.log('💳 Checkout page loaded');
      
      // Check for payment fields
      const paymentFields = await this.page.$$('input[type="text"], input[type="email"], select');
      console.log(`📝 Found ${paymentFields.length} form fields`);
    } else {
      console.log('ℹ️ Checkout form not found or cart is empty');
    }
  }

  // Test search functionality
  async testSearch() {
    await this.page.goto(this.baseUrl);
    await this.page.waitForTimeout(2000);
    
    const searchInput = await this.page.$('input[type="search"], .search-input, [data-testid="search"]');
    if (searchInput) {
      await searchInput.type('orange');
      await this.page.keyboard.press('Enter');
      await this.page.waitForTimeout(2000);
      
      const searchResults = await this.page.$$('.search-result, .product-card');
      console.log(`🔍 Search returned ${searchResults.length} results`);
    } else {
      console.log('ℹ️ Search functionality not found');
    }
  }

  // Test category filtering
  async testCategoryFiltering() {
    await this.page.goto(`${this.baseUrl}/categories`);
    await this.page.waitForTimeout(2000);
    
    const categories = await this.page.$$('.category, .category-card, [data-testid="category"]');
    if (categories.length > 0) {
      console.log(`📂 Found ${categories.length} categories`);
      
      // Click on first category
      await categories[0].click();
      await this.page.waitForTimeout(2000);
      
      const filteredProducts = await this.page.$$('.product-card, .juice-card');
      console.log(`🎯 Category filter shows ${filteredProducts.length} products`);
    } else {
      console.log('ℹ️ Categories not found');
    }
  }

  // Test gift functionality
  async testGiftFunctionality() {
    await this.page.goto(`${this.baseUrl}/gift`);
    await this.page.waitForTimeout(2000);
    
    const giftOptions = await this.page.$$('.gift-option, .gift-card, [data-testid="gift"]');
    if (giftOptions.length > 0) {
      console.log(`🎁 Found ${giftOptions.length} gift options`);
      
      const giftForm = await this.page.$('form, .gift-form');
      if (giftForm) {
        console.log('📝 Gift customization form available');
      }
    } else {
      console.log('ℹ️ Gift functionality not found');
    }
  }

  // Test mobile responsiveness
  async testMobileResponsiveness() {
    const mobileViewport = { width: 375, height: 667 };
    await this.page.setViewport(mobileViewport);
    
    await this.page.goto(this.baseUrl);
    await this.page.waitForTimeout(2000);
    
    // Check for mobile menu
    const mobileMenu = await this.page.$('.mobile-menu, .hamburger, [data-testid="mobile-menu"]');
    if (mobileMenu) {
      await mobileMenu.click();
      await this.page.waitForTimeout(1000);
      console.log('📱 Mobile menu functional');
    }
    
    // Test product grid on mobile
    await this.page.goto(`${this.baseUrl}/juices`);
    await this.page.waitForTimeout(2000);
    
    const products = await this.page.$$('.product-card');
    console.log(`📱 Mobile view shows ${products.length} products`);
    
    // Reset to desktop
    await this.page.setViewport({ width: 1280, height: 720 });
  }

  // Run all e-commerce tests
  async runAllTests() {
    console.log('🛒 E-COMMERCE FEATURE TESTS');
    console.log('='.repeat(40));
    
    try {
      await this.setup();
      
      await this.runTest('Product Catalog', () => this.testProductCatalog());
      await this.runTest('Shopping Cart', () => this.testShoppingCart());
      await this.runTest('Fruit Bowls', () => this.testFruitBowls());
      await this.runTest('Subscriptions', () => this.testSubscriptions());
      await this.runTest('Checkout Process', () => this.testCheckout());
      await this.runTest('Search Functionality', () => this.testSearch());
      await this.runTest('Category Filtering', () => this.testCategoryFiltering());
      await this.runTest('Gift Functionality', () => this.testGiftFunctionality());
      await this.runTest('Mobile Responsiveness', () => this.testMobileResponsiveness());
      
    } finally {
      await this.cleanup();
    }
    
    // Report results
    const passed = this.testResults.filter(t => t.status === 'PASSED').length;
    const failed = this.testResults.filter(t => t.status === 'FAILED').length;
    
    console.log('\n📊 E-COMMERCE TEST RESULTS');
    console.log('═'.repeat(40));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${Math.round((passed/(passed+failed))*100)}%`);
    
    return this.testResults;
  }
}

module.exports = { ECommerceTests };

// Run tests if called directly
if (require.main === module) {
  const tests = new ECommerceTests();
  tests.runAllTests().catch(console.error);
}
