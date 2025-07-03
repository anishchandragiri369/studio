/**
 * Test to verify password reset session management fix
 * This test specifically checks that sessions are preserved for password reset
 */

require('dotenv').config({ path: '.env.local' });
const puppeteer = require('puppeteer');

async function testPasswordResetSessionFix() {
  console.log('🧪 Testing Password Reset Session Management Fix...');
  
  let browser;
  
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Enhanced console logging to track session management
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('session') || text.includes('token') || text.includes('auth') || text.includes('HandleRecovery') || text.includes('password') || text.includes('AuthSessionMissingError')) {
        console.log(`🖥️  [${msg.type().toUpperCase()}] ${text}`);
      }
    });

    page.on('pageerror', (err) => {
      console.error(`🖥️  [ERROR] ${err.message}`);
    });
    
    // Simulate clicking a reset password link with tokens (Supabase format)
    const resetUrl = 'http://localhost:9002/reset-password#access_token=fake-access-token&refresh_token=fake-refresh-token&expires_in=3600&token_type=bearer&type=recovery';
    
    console.log('🔗 Navigating to reset password page with tokens...');
    await page.goto(resetUrl, { waitUntil: 'networkidle0' });
    
    // Wait for component to mount and process tokens
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    console.log('📍 Current URL:', page.url());
    
    // Check if page stayed on reset password (not redirected)
    if (page.url().includes('/reset-password')) {
      console.log('✅ Page stayed on reset password (SessionValidator fix working)');
    } else {
      console.log('❌ Page was redirected away from reset password');
      return;
    }
    
    // Check if form is ready for input
    console.log('🔍 Checking if password reset form is ready...');
    
    try {
      await page.waitForSelector('#password', { timeout: 3000 });
      await page.waitForSelector('#confirmPassword', { timeout: 3000 });
      await page.waitForSelector('button[type="submit"]', { timeout: 3000 });
      console.log('✅ Password reset form elements found');
    } catch (e) {
      console.log('❌ Password reset form elements not found:', e.message);
      return;
    }
    
    // Check if submit button is enabled
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      const isDisabled = await page.evaluate(el => el.disabled, submitButton);
      const buttonText = await page.evaluate(el => el.textContent, submitButton);
      
      console.log('Button text:', buttonText);
      console.log('Button disabled:', isDisabled);
      
      if (!isDisabled && buttonText.includes('Reset Password')) {
        console.log('✅ Reset button is enabled and ready');
      } else {
        console.log('⚠️  Reset button not ready:', { disabled: isDisabled, text: buttonText });
      }
    }
    
    // Test the password reset process
    console.log('🔐 Testing password reset form submission...');
    
    // Clear any existing values and fill in passwords
    await page.evaluate(() => {
      const passwordInput = document.querySelector('#password');
      const confirmPasswordInput = document.querySelector('#confirmPassword');
      if (passwordInput) passwordInput.value = '';
      if (confirmPasswordInput) confirmPasswordInput.value = '';
    });
    
    await page.type('#password', 'newpassword123');
    await page.type('#confirmPassword', 'newpassword123');
    
    console.log('✅ Password fields filled');
    
    // Try to submit the form
    const finalSubmitButton = await page.$('button[type="submit"]');
    if (finalSubmitButton) {
      const isFinalDisabled = await page.evaluate(el => el.disabled, finalSubmitButton);
      if (!isFinalDisabled) {
        console.log('🚀 Submitting password reset form...');
        
        // Click the submit button
        await finalSubmitButton.click();
        
        // Wait for response and check for errors
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check for any error messages
        const errorElement = await page.$('.text-destructive-foreground, [role="alert"]');
        if (errorElement) {
          const errorText = await page.evaluate(el => el.textContent, errorElement);
          console.log('❌ Password reset error:', errorText);
          
          if (errorText.includes('AuthSessionMissingError') || errorText.includes('Auth session missing')) {
            console.log('❌ CONFIRMED BUG: Auth session missing error occurred');
          } else if (errorText.includes('Invalid or expired reset link')) {
            console.log('⚠️  Expected error: Invalid/expired tokens (test tokens are fake)');
            console.log('✅ But no "Auth session missing" error - session was preserved!');
          }
        } else {
          // Check for success message
          const successElement = await page.$('.text-green-700, .border-green-200');
          if (successElement) {
            console.log('✅ Password reset appears successful');
          } else {
            console.log('⚠️  No clear success or error message found');
          }
        }
      } else {
        console.log('❌ Submit button is still disabled');
      }
    }
    
    // Wait a bit more to observe any additional console logs
    await new Promise(resolve => setTimeout(resolve, 2000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      console.log('🏁 Test completed. Check console output above for session management details.');
      console.log('   Press Ctrl+C to close browser.');
      
      // Keep browser open for manual inspection
      await new Promise(() => {}); // Keep running
    }
  }
}

testPasswordResetSessionFix().catch(console.error);
