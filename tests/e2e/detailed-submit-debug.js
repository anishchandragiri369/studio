/**
 * Detailed Password Reset Submit Debug Test
 * Captures all network calls and form state changes
 */

const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function detailedSubmitDebug() {
  console.log('🔍 Detailed Password Reset Submit Debug Test\n');
  
  let browser;
  let page;
  let testUser;
  
  try {
    console.log('🚀 Launching browser...');
    browser = await puppeteer.launch({
      headless: false,
      devtools: true,
      slowMo: 200
    });
    
    console.log('📄 Creating new page...');
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    console.log('🎯 Setting up event listeners...');
    // Capture ALL console output
    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();
      console.log(`🌐 [${type.toUpperCase()}]`, text);
    });
    
    // Capture ALL network activity
    const networkEvents = [];
    page.on('response', response => {
      const request = response.request();
      const event = {
        method: request.method(),
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        timestamp: Date.now()
      };
      networkEvents.push(event);
      console.log(`🌐 [NETWORK] ${event.method} ${event.url} - ${event.status} ${event.statusText}`);
    });
    
    // Capture page errors
    page.on('pageerror', error => {
      console.log(`🚨 [PAGE ERROR]`, error.message);
    });
    
    // Setup test user
    const testEmail = 'detailed.debug@example.com';
    const testPassword = 'OriginalPassword123';
    const newPassword = 'NewDetailedPassword456';
    
    console.log('👤 Creating test user...');
    console.log('📧 Using email:', testEmail);
    
    // Clean up any existing user
    console.log('🧹 Cleaning up existing user...');
    try {
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers.users.find(u => u.email === testEmail);
      if (existingUser) {
        console.log('🗑️ Found existing user, deleting...');
        await supabase.from('user_rewards').delete().eq('user_id', existingUser.id);
        await supabase.auth.admin.deleteUser(existingUser.id);
        console.log('✅ Existing user deleted');
      } else {
        console.log('ℹ️ No existing user found');
      }
    } catch (e) {
      console.log('ℹ️ No existing user to clean up:', e.message);
    }
    
    // Create test user
    console.log('🔨 Creating new test user...');
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });
    
    if (createError) {
      throw new Error(`Failed to create test user: ${createError.message}`);
    }
    
    testUser = userData.user;
    console.log('✅ Test user created');
    console.log('📧 User ID:', testUser.id);
    
    // Generate reset link with localhost redirect
    console.log('🔗 Generating reset link...');
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: testEmail,
      options: {
        redirectTo: 'http://localhost:9002/reset-password'
      }
    });
    
    if (resetError) {
      throw new Error(`Failed to generate reset link: ${resetError.message}`);
    }
    
    const resetUrl = resetData.properties.action_link;
    console.log('🔗 Reset URL generated:', resetUrl.substring(0, 100) + '...');
    
    // Navigate to reset link
    console.log('\n🌐 Following reset link...');
    await page.goto(resetUrl, { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('📍 Current URL:', page.url());
    
    // Wait for form to fully load
    await page.waitForSelector('input[type="password"]', { timeout: 20000 });
    console.log('✅ Password form found');
    
    // Clear network events to focus on form submission
    networkEvents.length = 0;
    
    // Fill form
    const passwordInputs = await page.$$('input[type="password"]');
    console.log(`📝 Found ${passwordInputs.length} password inputs`);
    
    await passwordInputs[0].click();
    await passwordInputs[0].type(newPassword);
    await passwordInputs[1].click();
    await passwordInputs[1].type(newPassword);
    
    console.log('✅ Form filled with new password');
    
    // Check button state before submit
    const submitButton = await page.$('button[type="submit"]');
    const buttonTextBefore = await page.$eval('button[type="submit"]', btn => btn.textContent);
    const buttonDisabledBefore = await page.$eval('button[type="submit"]', btn => btn.disabled);
    
    console.log(`\n🔘 Button before submit: "${buttonTextBefore}" (disabled: ${buttonDisabledBefore})`);
    
    // Submit form and monitor everything
    console.log('\n🚀 Submitting form...');
    await submitButton.click();
    
    // Monitor form state immediately after click
    let checkCount = 0;
    const maxChecks = 30; // 15 seconds
    let redirectDetected = false;
    
    while (checkCount < maxChecks && !redirectDetected) {
      await new Promise(resolve => setTimeout(resolve, 500));
      checkCount++;
      
      try {
        // Check if page has redirected
        const currentUrl = page.url();
        if (currentUrl.includes('/login')) {
          console.log('🔄 Redirect to login page detected - password reset successful!');
          redirectDetected = true;
          break;
        }
        
        // Check button state (only if still on reset page)
        const buttonText = await page.$eval('button[type="submit"]', btn => btn.textContent);
        const buttonDisabled = await page.$eval('button[type="submit"]', btn => btn.disabled);
        
        // Check for alerts
        const alerts = await page.$$('.alert');
        const successElements = await page.$$('.alert .text-green-800, .alert .text-green-700');
        const errorElements = await page.$$('.alert .text-red-800, .alert .text-red-700');
        
        console.log(`⏱️  Check ${checkCount}: Button "${buttonText}" (disabled: ${buttonDisabled}), Alerts: ${alerts.length}, Success: ${successElements.length}, Error: ${errorElements.length}`);
        
        // If we found success or error, get the message
        if (successElements.length > 0) {
          const successMsg = await successElements[0].evaluate(el => el.textContent);
          console.log('✅ SUCCESS MESSAGE FOUND:', successMsg);
          // Continue monitoring for redirect after success message
        }
        
        if (errorElements.length > 0) {
          const errorMsg = await errorElements[0].evaluate(el => el.textContent);
          console.log('❌ ERROR MESSAGE FOUND:', errorMsg);
          break;
        }
        
        // Also check for any alert with any color (sometimes errors might have different styling)
        if (alerts.length > 0) {
          for (let i = 0; i < alerts.length; i++) {
            const alertText = await alerts[i].evaluate(el => el.textContent);
            console.log(`📢 ALERT ${i + 1} TEXT:`, alertText);
          }
        }
        
        // Check if button text changed back (indicating completion)
        if (buttonText === 'Reset Password' && checkCount > 2) {
          console.log('🔄 Button returned to original state - submission completed');
          break;
        }
        
      } catch (e) {
        // Check if we're on a different page (redirect happened)
        const currentUrl = page.url();
        if (currentUrl.includes('/login')) {
          console.log('🔄 Redirect to login page detected - password reset successful!');
          redirectDetected = true;
          break;
        } else {
          // Only show errors after a few checks to avoid noise during form transitions
          if (checkCount > 3) {
            console.log(`⚠️  Error checking state: ${e.message}`);
          }
        }
      }
    }
    
    // Final state check
    console.log('\n📊 FINAL RESULTS:');
    console.log('==================');
    
    try {
      const finalUrl = page.url();
      console.log(`Final URL: ${finalUrl}`);
      
      // Check if we're on the login page (successful redirect)
      if (finalUrl.includes('/login')) {
        console.log('✅ SUCCESS: Redirected to login page');
        
        // Check for success message parameter
        if (finalUrl.includes('password-reset-success')) {
          console.log('✅ SUCCESS: Password reset success message detected in URL');
        }
        
        // Try to find login form instead of submit button
        try {
          const loginForm = await page.$('form');
          if (loginForm) {
            console.log('✅ SUCCESS: Login form found on redirect page');
          }
        } catch (loginFormError) {
          console.log('⚠️  Login form not found, but redirect successful');
        }
        
      } else {
        // Still on reset password page, check button state
        try {
          const finalButtonText = await page.$eval('button[type="submit"]', btn => btn.textContent);
          const finalButtonDisabled = await page.$eval('button[type="submit"]', btn => btn.disabled);
          
          console.log(`Button: "${finalButtonText}" (disabled: ${finalButtonDisabled})`);
          
          // Check for success/error messages on the reset page
          const successElements = await page.$$('[class*="green"], [class*="success"]');
          const errorElements = await page.$$('[class*="destructive"], [class*="error"], [class*="red"]');
          
          if (successElements.length > 0) {
            console.log('✅ SUCCESS: Success message found on reset page');
          } else if (errorElements.length > 0) {
            console.log('❌ ERROR: Error message found on reset page');
          }
          
        } catch (buttonError) {
          console.log('⚠️  Submit button not found (page may have changed state)');
        }
      }
      
      console.log(`Network events during submit: ${networkEvents.length}`);
      
      // Show all network events during submission
      if (networkEvents.length > 0) {
        console.log('\n🌐 Network Events During Submit:');
        networkEvents.forEach((event, index) => {
          console.log(`  ${index + 1}. ${event.method} ${event.url} - ${event.status} ${event.statusText}`);
        });
      }
      
    } catch (e) {
      console.log('Error getting final state:', e.message);
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'tests/e2e/screenshots/detailed-debug-final.png' });
    console.log('📸 Final screenshot saved');
    
  } catch (error) {
    console.error('\n💥 TEST FAILED:', error.message);
    
    if (page) {
      await page.screenshot({ path: 'tests/e2e/screenshots/detailed-debug-error.png' });
      console.log('📸 Error screenshot saved');
    }
    
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    
    if (testUser) {
      try {
        await supabase.from('user_rewards').delete().eq('user_id', testUser.id);
        await supabase.auth.admin.deleteUser(testUser.id);
        console.log('✅ Test user cleaned up');
      } catch (e) {
        console.warn('⚠️ Cleanup warning:', e.message);
      }
    }
    
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
if (require.main === module) {
  detailedSubmitDebug()
    .then(() => {
      console.log('\n🎉 Detailed submit debug test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Detailed submit debug test failed:', error);
      process.exit(1);
    });
}

module.exports = { detailedSubmitDebug };
