/**
 * Test to verify SessionValidator fix for password reset page
 * This simulates the real-world scenario where clicking a reset password link
 * should not trigger an unwanted redirect to the home page
 */

const puppeteer = require('puppeteer');

async function testSessionValidatorFix() {
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      const type = msg.type();
      if (type === 'log' || type === 'warn' || type === 'error') {
        console.log(`[BROWSER ${type.toUpperCase()}]`, msg.text());
      }
    });

    console.log('🧪 Testing SessionValidator fix for password reset page...');

    // Navigate to home page first
    console.log('📱 Navigating to home page...');
    await page.goto('http://localhost:9002/', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate clicking a password reset link with tokens (similar to what Supabase sends)
    const resetUrl = 'http://localhost:9002/reset-password#access_token=fake-access-token&refresh_token=fake-refresh-token&expires_in=3600&token_type=bearer&type=recovery';
    
    console.log('🔗 Navigating to reset password page with tokens (simulating email link click)...');
    await page.goto(resetUrl, { waitUntil: 'networkidle0' });
    
    // Wait a bit for any potential redirects or session validation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if we're still on the reset password page
    const currentUrl = page.url();
    console.log('📍 Current URL after 3 seconds:', currentUrl);
    
    if (currentUrl.includes('/reset-password')) {
      console.log('✅ SUCCESS: Stayed on reset password page - SessionValidator fix is working!');
      
      // Check for debug info to confirm the page loaded properly
      try {
        await page.waitForSelector('[data-testid="debug-info"], .space-y-1', { timeout: 2000 });
        console.log('✅ Reset password form appears to be loaded');
      } catch (e) {
        console.log('⚠️  Could not find debug info, but still on correct page');
      }
      
      // Look for SessionValidator log messages
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('📋 Check browser console above for SessionValidator skip messages');
      
    } else {
      console.log('❌ FAILED: Was redirected away from reset password page');
      console.log('   Expected: URL containing /reset-password');
      console.log('   Actual:', currentUrl);
      
      if (currentUrl.includes('localhost:9002') && !currentUrl.includes('/reset-password')) {
        console.log('   This suggests SessionValidator redirected to home page');
      }
    }

    // Test focus validation skip as well
    console.log('\n🔄 Testing focus validation skip...');
    await page.evaluate(() => {
      window.blur();
      setTimeout(() => window.focus(), 500);
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    const finalUrl = page.url();
    
    if (finalUrl.includes('/reset-password')) {
      console.log('✅ SUCCESS: Focus validation also skipped - no redirect on window focus');
    } else {
      console.log('❌ FAILED: Focus validation caused redirect:', finalUrl);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    console.log('\n🏁 Test completed. Check console output above for SessionValidator messages.');
    console.log('   Press Ctrl+C to close browser and exit.');
    
    // Keep browser open for manual inspection
    await new Promise(resolve => {
      process.on('SIGINT', () => {
        browser.close();
        resolve();
      });
    });
  }
}

testSessionValidatorFix().catch(console.error);
