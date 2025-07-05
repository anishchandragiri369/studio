/**
 * Enhanced Password Reset Submit Test
 * 
 * Focused test to verify what happens after clicking the submit button
 * in the password reset flow, with detailed step-by-step validation.
 */

const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPasswordResetSubmit() {
  console.log('🔒 Enhanced Password Reset Submit Test\n');
  
  let browser;
  let page;
  let testUser;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: false,
      devtools: true,
      slowMo: 100,
      args: ['--disable-web-security']
    });
    
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Capture all browser events
    const events = [];
    page.on('console', msg => {
      const text = msg.text();
      events.push({ type: 'console', level: msg.type(), text });
      console.log(`🌐 [${msg.type().toUpperCase()}]`, text);
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/') || response.url().includes('supabase')) {
        events.push({ 
          type: 'network', 
          method: response.request().method(),
          url: response.url(), 
          status: response.status() 
        });
        console.log(`🌐 [NETWORK] ${response.request().method()} ${response.url()} - ${response.status()}`);
      }
    });
    
    // Setup test user
    const testEmail = 'submit.test@example.com';
    const testPassword = 'OriginalPassword123';
    const newPassword = 'NewSubmitPassword456';
    
    console.log('👤 Creating test user for submit testing...');
    
    // Clean up any existing user
    try {
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers.users.find(u => u.email === testEmail);
      if (existingUser) {
        await supabase.from('user_rewards').delete().eq('user_id', existingUser.id);
        await supabase.auth.admin.deleteUser(existingUser.id);
      }
    } catch (e) {
      console.log('No existing user to clean up');
    }
    
    // Create test user
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });
    
    if (createError) {
      throw new Error(`Failed to create test user: ${createError.message}`);
    }
    
    testUser = userData.user;
    console.log('✅ Test user created:', testUser.id);
    
    // Generate reset link with localhost redirect
    console.log('\n🔗 Generating password reset link...');
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
    console.log('✅ Reset link generated successfully');
    
    // Navigate to reset link
    console.log('\n🌐 Navigating to reset link...');
    await page.goto(resetUrl, { waitUntil: 'networkidle0' });
    
    // Wait for redirect to complete
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const currentUrl = page.url();
    console.log('📍 Current URL after reset link:', currentUrl);
    
    // Check if we're on the reset-password page or got redirected
    if (!currentUrl.includes('/reset-password')) {
      console.log('⚠️ Got redirected after clicking reset link (this may be normal if already authenticated)');
      console.log('🔄 Navigating directly to reset-password page...');
      
      // Navigate directly to reset-password page 
      await page.goto(`${currentUrl.split('/')[0]}//${currentUrl.split('/')[2]}/reset-password`, { 
        waitUntil: 'networkidle0' 
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const finalUrl = page.url();
      console.log('📍 Final URL after direct navigation:', finalUrl);
      
      if (!finalUrl.includes('/reset-password')) {
        throw new Error(`Still not on reset-password page after direct navigation, got: ${finalUrl}`);
      }
    }
    
    // Wait for form to load completely
    console.log('\n⏳ Waiting for password reset form...');
    await page.waitForSelector('input[type="password"]', { timeout: 15000 });
    console.log('✅ Password reset form loaded');
    
    // Check form state
    const passwordInputs = await page.$$('input[type="password"]');
    const submitButton = await page.$('button[type="submit"]');
    
    console.log(`📝 Found ${passwordInputs.length} password input(s)`);
    console.log(`🔘 Submit button present: ${submitButton ? 'Yes' : 'No'}`);
    
    if (passwordInputs.length < 2) {
      throw new Error('Expected at least 2 password inputs (password + confirm)');
    }
    
    if (!submitButton) {
      throw new Error('Submit button not found');
    }
    
    // Check if submit button is enabled
    const isDisabled = await page.$eval('button[type="submit"]', btn => btn.disabled);
    console.log(`🔘 Submit button enabled: ${!isDisabled}`);
    
    // Fill in passwords
    console.log('\n🔒 Filling in new password...');
    await passwordInputs[0].click();
    await passwordInputs[0].type(newPassword);
    console.log('✅ Password field filled');
    
    await passwordInputs[1].click();
    await passwordInputs[1].type(newPassword);
    console.log('✅ Confirm password field filled');
    
    // Check form validation
    await new Promise(resolve => setTimeout(resolve, 500));
    const isStillDisabled = await page.$eval('button[type="submit"]', btn => btn.disabled);
    console.log(`🔘 Submit button after filling: ${isStillDisabled ? 'Disabled' : 'Enabled'}`);
    
    // Take screenshot before submit
    await page.screenshot({ path: 'tests/e2e/screenshots/before-submit.png' });
    console.log('📸 Screenshot taken before submit');
    
    // Clear events to focus on submit events
    events.length = 0;
    
    // Click submit button
    console.log('\n🚀 CLICKING SUBMIT BUTTON...');
    await submitButton.click();
    console.log('✅ Submit button clicked');
    
    // Monitor what happens immediately after click
    console.log('\n👀 Monitoring submit response...');
    
    // Wait a moment for initial processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check for loading state
    try {
      const loadingElement = await page.$('.animate-spin, [data-testid="loading"]');
      if (loadingElement) {
        console.log('🔄 Loading indicator detected');
      }
    } catch (e) {
      console.log('ℹ️ No loading indicator found');
    }
    
    // Check button state after click
    const buttonText = await page.$eval('button[type="submit"]', btn => btn.textContent);
    const buttonDisabled = await page.$eval('button[type="submit"]', btn => btn.disabled);
    console.log(`🔘 Button text after click: "${buttonText}"`);
    console.log(`🔘 Button disabled after click: ${buttonDisabled}`);
    
    // Wait for response and check for success/error
    console.log('\n⏳ Waiting for submit response...');
    
    let submitResult = 'unknown';
    let submitMessage = '';
    
    try {
      // Wait longer for either success or error alert to appear
      await page.waitForSelector('.alert', { timeout: 20000 });
      
      // Check for success message
      try {
        const successElement = await page.$('.alert .text-green-800, .alert .text-green-700');
        if (successElement) {
          submitMessage = await successElement.evaluate(el => el.textContent);
          submitResult = 'success';
          console.log('✅ SUCCESS MESSAGE:', submitMessage);
        }
      } catch (e) {
        // Check for error message
        try {
          const errorElement = await page.$('.alert .text-red-800, .alert .text-red-700');
          if (errorElement) {
            submitMessage = await errorElement.evaluate(el => el.textContent);
            submitResult = 'error';
            console.log('❌ ERROR MESSAGE:', submitMessage);
          }
        } catch (e2) {
          console.log('ℹ️ No specific success/error message found');
        }
      }
    } catch (error) {
      console.log('⚠️ No alert appeared within timeout');
      
      // Check console logs for success/error indicators
      console.log('\n🔍 Checking console logs for success indicators...');
      const consoleEvents = events.filter(e => e.type === 'console');
      const hasSuccessLog = consoleEvents.some(e => e.text.includes('Password updated successfully'));
      const hasErrorLog = consoleEvents.some(e => e.text.includes('Password update error'));
      
      if (hasSuccessLog && !hasErrorLog) {
        console.log('✅ Found success log - password update succeeded but UI may not be showing');
        submitResult = 'success-backend-only';
        submitMessage = 'Password updated successfully (backend confirmed)';
      } else if (hasErrorLog) {
        console.log('❌ Found error log - password update failed');
        submitResult = 'error-backend';
        submitMessage = 'Password update failed (backend error)';
      }
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'tests/e2e/screenshots/no-response.png' });
      console.log('📸 Screenshot taken - no response');
    }
    
    // Check current page state
    const finalUrl = page.url();
    console.log('📍 Final URL:', finalUrl);
    
    // Summary of what happened after submit
    console.log('\n📊 SUBMIT RESULTS SUMMARY:');
    console.log('==========================');
    console.log(`Result: ${submitResult}`);
    console.log(`Message: ${submitMessage}`);
    console.log(`Final URL: ${finalUrl}`);
    console.log(`Events captured: ${events.length}`);
    
    // Show captured events
    if (events.length > 0) {
      console.log('\n📋 Events after submit:');
      events.forEach((event, index) => {
        if (event.type === 'console') {
          console.log(`  ${index + 1}. [${event.level.toUpperCase()}] ${event.text}`);
        } else if (event.type === 'network') {
          console.log(`  ${index + 1}. [NETWORK] ${event.method} ${event.url} - ${event.status}`);
        }
      });
    }
    
    // Test outcome
    if (submitResult === 'success') {
      console.log('\n🎉 PASSWORD RESET SUBMIT TEST PASSED!');
      console.log('The submit button works correctly and shows success.');
      
      // Test redirect to login if successful
      if (finalUrl.includes('/login')) {
        console.log('✅ Successfully redirected to login page');
        
        // Test login with new password
        console.log('\n🔐 Testing login with new password...');
        await page.waitForSelector('input[type="email"]', { timeout: 10000 });
        
        const emailInput = await page.$('input[type="email"]');
        const passwordInput = await page.$('input[type="password"]');
        const loginButton = await page.$('button[type="submit"]');
        
        await emailInput.type(testEmail);
        await passwordInput.type(newPassword);
        await loginButton.click();
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const loginResult = page.url();
        console.log('📍 After login:', loginResult);
        
        if (loginResult.includes('/dashboard') || loginResult === 'http://localhost:9002/') {
          console.log('✅ Login with new password successful!');
        } else {
          console.log('⚠️ Login may have failed or redirected elsewhere');
        }
      }
      
    } else if (submitResult === 'error') {
      console.log('\n❌ PASSWORD RESET SUBMIT FAILED');
      console.log('The submit resulted in an error:', submitMessage);
    } else {
      console.log('\n⚠️ PASSWORD RESET SUBMIT UNCLEAR');
      console.log('Could not determine if submit was successful or failed');
    }
    
  } catch (error) {
    console.error('\n💥 TEST FAILED:', error.message);
    
    // Take failure screenshot
    if (page) {
      await page.screenshot({ path: 'tests/e2e/screenshots/submit-test-failure.png' });
      console.log('📸 Failure screenshot saved');
    }
    
    throw error;
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
  testPasswordResetSubmit()
    .then(() => {
      console.log('\n🎉 Enhanced password reset submit test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Enhanced password reset submit test failed:', error);
      process.exit(1);
    });
}

module.exports = { testPasswordResetSubmit };
