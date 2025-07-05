const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    slowMo: 100
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    console.log(`[${type.toUpperCase()}] ${text}`);
  });
  
  // Listen for errors
  page.on('error', (err) => {
    console.error('Page error:', err);
  });
  
  page.on('pageerror', (err) => {
    console.error('Page error:', err);
  });
  
  try {
    console.log('🔍 Testing password reset page compilation and loading...');
    
    // Test 1: Check if the page loads without compilation errors
    console.log('1. Loading reset password page...');
    await page.goto('http://localhost:9002/reset-password', {
      waitUntil: 'networkidle2',
      timeout: 10000
    });
    
    // Check if the page title is correct
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check if the card header is present
    try {
      const header = await page.$eval('[data-testid="card-title"], h1, h2, [class*="CardTitle"]', el => el.textContent);
      console.log('Page header:', header);
    } catch (e) {
      console.log('Header not found with standard selectors, checking page content...');
      const pageContent = await page.$eval('body', el => el.textContent);
      console.log('Page content preview:', pageContent.substring(0, 300));
    }
    
    // Check if there are any React error boundaries or obvious errors
    const errorText = await page.evaluate(() => {
      const bodyText = document.body.textContent;
      return bodyText.includes('Error:') || bodyText.includes('Something went wrong') ? bodyText : null;
    });
    
    if (errorText) {
      console.error('❌ Page contains error text:', errorText);
    } else {
      console.log('✅ Page loaded without obvious errors');
    }
    
    // Test 2: Check if the page shows the expected loading state
    console.log('2. Checking for loading state...');
    const loadingText = await page.$eval('body', el => el.textContent);
    
    if (loadingText.includes('Establishing Recovery Session') || 
        loadingText.includes('Please wait while we verify') ||
        loadingText.includes('No valid recovery session found')) {
      console.log('✅ Page shows expected loading/error state without valid tokens');
    } else {
      console.log('📝 Page content:', loadingText.substring(0, 200) + '...');
    }
    
    // Test 3: Check with simulated reset tokens
    console.log('3. Testing with simulated reset tokens...');
    
    // Simulate a reset link with tokens
    const resetUrl = 'http://localhost:9002/reset-password#access_token=test-token&refresh_token=test-refresh&type=recovery';
    await page.goto(resetUrl, {
      waitUntil: 'networkidle2',
      timeout: 10000
    });
    
    // Wait a bit for the component to process tokens
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const tokenProcessingText = await page.$eval('body', el => el.textContent);
    console.log('Token processing result:', tokenProcessingText.includes('Recovery session') ? 'Recovery session handling active' : 'No recovery session text');
    
    console.log('✅ Password reset page test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();
