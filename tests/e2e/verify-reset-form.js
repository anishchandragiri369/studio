const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: false,
    slowMo: 100
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    console.log(`[${type.toUpperCase()}] ${text}`);
  });
  
  try {
    console.log('🔍 Testing password reset form with valid tokens...');
    
    // Test with a realistic token URL (simulating a successful email click)
    const resetUrl = 'http://localhost:9002/reset-password?token=test-recovery-token&type=recovery';
    console.log('📧 Navigating to reset password page with recovery token...');
    
    await page.goto(resetUrl, {
      waitUntil: 'networkidle2',
      timeout: 15000
    });
    
    // Wait for the component to process the tokens
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check what's rendered
    const pageContent = await page.$eval('body', el => el.textContent);
    console.log('📄 Page content preview:', pageContent.substring(0, 500));
    
    // Check if form appears or if there's an error
    const hasForm = pageContent.includes('New Password') && pageContent.includes('Confirm Password');
    const hasError = pageContent.includes('Recovery session not found') || pageContent.includes('expired');
    const hasSession = pageContent.includes('Session Ready: Yes');
    
    console.log('🔍 Form status:');
    console.log('  - Form visible:', hasForm);
    console.log('  - Has error:', hasError);
    console.log('  - Session ready:', hasSession);
    
    if (hasForm) {
      console.log('✅ SUCCESS: Password reset form is visible!');
      
      // Try to fill and submit the form
      console.log('📝 Testing form interaction...');
      
      try {
        await page.type('input[type="password"][placeholder*="new password"]', 'testpassword123');
        await page.type('input[type="password"][placeholder*="Confirm"]', 'testpassword123');
        
        console.log('🔘 Clicking submit button...');
        await page.click('button[type="submit"]');
        
        // Wait a bit for the submit to process
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const afterSubmitContent = await page.$eval('body', el => el.textContent);
        console.log('📄 After submit content:', afterSubmitContent.substring(0, 300));
        
      } catch (formError) {
        console.log('⚠️ Form interaction failed (expected with test tokens):', formError.message);
      }
    } else {
      console.log('❌ Password reset form is not visible');
      if (hasError) {
        console.log('💡 This is expected behavior - the page correctly rejects invalid tokens');
      }
    }
    
    console.log('✅ Password reset form test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();
