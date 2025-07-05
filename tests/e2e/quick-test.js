/**
 * Quick Password Reset Test
 * 
 * A simplified test to quickly verify the password reset spinning issue is fixed
 */

const puppeteer = require('puppeteer');

async function quickPasswordResetTest() {
  console.log('🔄 Quick Password Reset Test\n');
  
  let browser;
  let page;
  
  try {
    browser = await puppeteer.launch({
      headless: false,
      devtools: false,
      slowMo: 100
    });
    
    page = await browser.newPage();
    
    console.log('1️⃣ Testing reset password page loading...');
    
    // Navigate to reset password page with mock tokens (simulating OAuth redirect)
    const resetUrl = 'http://localhost:9002/reset-password#access_token=mock_token&refresh_token=mock_refresh&type=recovery';
    await page.goto(resetUrl, { waitUntil: 'networkidle0' });
    
    console.log('2️⃣ Waiting for form to load (checking for spinning)...');
    
    // Wait for password inputs to appear - this is where spinning would occur
    try {
      await page.waitForSelector('input[type="password"]', { timeout: 10000 });
      console.log('✅ SUCCESS: Password reset form loaded without spinning!');
      
      // Check if we can actually interact with the form
      const passwordInputs = await page.$$('input[type="password"]');
      console.log(`📝 Found ${passwordInputs.length} password inputs`);
      
      if (passwordInputs.length >= 2) {
        console.log('✅ Both password and confirm password inputs present');
      }
      
      // Check for submit button
      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        console.log('✅ Submit button present');
      }
      
    } catch (error) {
      console.error('❌ FAILED: Password reset form did not load properly');
      console.error('This indicates the spinning issue is still present!');
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'quick-test-failure.png' });
      console.log('📸 Screenshot saved as quick-test-failure.png');
      
      throw new Error('Password reset form spinning issue detected');
    }
    
    console.log('\n🎉 QUICK TEST PASSED!');
    console.log('The password reset spinning issue appears to be fixed.');
    
  } catch (error) {
    console.error('\n❌ QUICK TEST FAILED:', error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
if (require.main === module) {
  quickPasswordResetTest()
    .then(() => {
      console.log('\n✅ Quick test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Quick test failed:', error);
      process.exit(1);
    });
}

module.exports = { quickPasswordResetTest };
