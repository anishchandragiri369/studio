/**
 * Password Reset End-to-End Test with Puppeteer
 * 
 * This test simulates the complete password reset flow to verify
 * the spinning issue has been resolved.
 */

const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPasswordResetFlow() {
  console.log('🚀 Starting Password Reset E2E Test\n');
  
  let browser;
  let page;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: false, // Set to true for CI
      devtools: true,
      slowMo: 50, // Slow down for debugging
      args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
    });
    
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Enable console logging from the browser
    page.on('console', msg => {
      if (msg.type() === 'log') {
        console.log('🌐 Browser:', msg.text());
      } else if (msg.type() === 'error') {
        console.error('❌ Browser Error:', msg.text());
      }
    });
    
    // Test setup - Create a test user if needed
    const testEmail = 'test.password.reset@example.com';
    const testPassword = 'TestPassword123';
    const newPassword = 'NewTestPassword456';
    
    console.log('📋 Setting up test user...');
    
    // Clean up any existing test user
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(u => u.email === testEmail);
    
    if (existingUser) {
      console.log('🧹 Cleaning up existing test user...');
      await supabase.from('user_rewards').delete().eq('user_id', existingUser.id);
      await supabase.auth.admin.deleteUser(existingUser.id);
    }
    
    // Create test user
    console.log('👤 Creating test user...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });
    
    if (createError) {
      throw new Error(`Failed to create test user: ${createError.message}`);
    }
    
    console.log('✅ Test user created:', newUser.user.id);
    
    // Step 1: Navigate to forgot password page
    console.log('\n🔥 Step 1: Navigate to forgot password page');
    await page.goto('http://localhost:9002/forgot-password', { waitUntil: 'networkidle0' });
    
    // Wait for page to load
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Step 2: Enter email and submit
    console.log('📧 Step 2: Enter email and submit reset request');
    await page.type('input[type="email"]', testEmail);
    await page.click('button[type="submit"]');
    
    // Wait for success message
    await page.waitForSelector('.alert', { timeout: 10000 });
    const successMessage = await page.$eval('.alert', el => el.textContent);
    console.log('✅ Reset request submitted:', successMessage);
    
    // Step 3: Get the reset link from Supabase directly (simulate email click)
    console.log('\n🔗 Step 3: Getting reset link...');
    
    // In a real test, you'd parse the email. For now, we'll generate the reset link manually
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: testEmail
    });
    
    if (resetError) {
      throw new Error(`Failed to generate reset link: ${resetError.message}`);
    }
    
    const resetUrl = resetData.properties.action_link;
    console.log('🔗 Reset link generated');
    
    // Step 4: Navigate to reset link (simulating email click)
    console.log('\n🌐 Step 4: Clicking reset link (simulating email)');
    await page.goto(resetUrl, { waitUntil: 'networkidle0' });
    
    // Wait for potential redirects to complete
    await page.waitForTimeout(2000);
    
    // Check if we're on the reset password page
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);
    
    if (!currentUrl.includes('/reset-password')) {
      throw new Error(`Expected to be on reset password page, but got: ${currentUrl}`);
    }
    
    // Step 5: Wait for the reset form to be ready (no spinning)
    console.log('\n⏳ Step 5: Waiting for reset form to load...');
    
    try {
      // Wait for password input to appear (should not be spinning)
      await page.waitForSelector('input[type="password"]', { timeout: 15000 });
      console.log('✅ Password reset form loaded successfully (no spinning detected)');
    } catch (error) {
      console.error('❌ Password reset form did not load - spinning issue detected!');
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'tests/e2e/screenshots/reset-form-spinning.png' });
      throw new Error('Password reset form spinning issue detected');
    }
    
    // Step 6: Check for debug info in development
    if (process.env.NODE_ENV === 'development') {
      try {
        const debugInfo = await page.$eval('.alert .text-xs', el => el.textContent);
        console.log('🐛 Debug info:', debugInfo);
      } catch (e) {
        console.log('ℹ️ No debug info found (normal in production)');
      }
    }
    
    // Step 7: Fill in new password
    console.log('\n🔒 Step 6: Entering new password');
    const passwordInputs = await page.$$('input[type="password"]');
    
    if (passwordInputs.length < 2) {
      throw new Error('Expected 2 password inputs (password and confirm)');
    }
    
    await passwordInputs[0].type(newPassword);
    await passwordInputs[1].type(newPassword);
    
    // Step 8: Submit password reset
    console.log('🚀 Step 7: Submitting password reset');
    await page.click('button[type="submit"]');
    
    // Wait for either success or error
    await page.waitForTimeout(3000);
    
    // Check for success message
    try {
      await page.waitForSelector('.alert .text-green-800', { timeout: 10000 });
      const successText = await page.$eval('.alert .text-green-800', el => el.textContent);
      console.log('✅ Password reset successful:', successText);
    } catch (error) {
      // Check for error message
      try {
        const errorText = await page.$eval('.alert .text-red-800', el => el.textContent);
        console.error('❌ Password reset failed:', errorText);
        throw new Error(`Password reset failed: ${errorText}`);
      } catch (e) {
        throw new Error('No success or error message found after submission');
      }
    }
    
    // Step 9: Wait for redirect to login
    console.log('\n🌐 Step 8: Waiting for redirect to login page');
    await page.waitForFunction(
      () => window.location.pathname === '/login',
      { timeout: 15000 }
    );
    
    // Check for success message on login page
    const loginUrl = page.url();
    console.log('📍 Redirected to:', loginUrl);
    
    if (loginUrl.includes('message=password-reset-success')) {
      console.log('✅ Successfully redirected to login with success message');
    }
    
    // Step 10: Test login with new password
    console.log('\n🔐 Step 9: Testing login with new password');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    await page.type('input[type="email"]', testEmail);
    await page.type('input[type="password"]', newPassword);
    await page.click('button[type="submit"]');
    
    // Wait for login completion
    await page.waitForTimeout(3000);
    
    // Check if we're redirected to dashboard or home
    const finalUrl = page.url();
    console.log('📍 Final URL after login:', finalUrl);
    
    if (finalUrl.includes('/dashboard') || finalUrl === 'http://localhost:9002/') {
      console.log('✅ Login with new password successful');
    } else {
      throw new Error(`Login failed, unexpected URL: ${finalUrl}`);
    }
    
    console.log('\n🎉 PASSWORD RESET E2E TEST PASSED!\n');
    console.log('✅ All steps completed successfully:');
    console.log('   1. Forgot password form submitted');
    console.log('   2. Reset link generated and clicked');
    console.log('   3. Reset form loaded without spinning');
    console.log('   4. New password entered and submitted');
    console.log('   5. Success message displayed');
    console.log('   6. Redirected to login page');
    console.log('   7. Login with new password works');
    
  } catch (error) {
    console.error('❌ Password Reset E2E Test Failed:', error.message);
    
    // Take screenshot for debugging
    if (page) {
      await page.screenshot({ path: 'tests/e2e/screenshots/test-failure.png' });
      console.log('📸 Screenshot saved to tests/e2e/screenshots/test-failure.png');
    }
    
    throw error;
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    
    try {
      // Delete test user
      const { data: users } = await supabase.auth.admin.listUsers();
      const testUser = users.users.find(u => u.email === testEmail);
      if (testUser) {
        await supabase.from('user_rewards').delete().eq('user_id', testUser.id);
        await supabase.auth.admin.deleteUser(testUser.id);
        console.log('✅ Test user cleaned up');
      }
    } catch (cleanupError) {
      console.warn('⚠️ Cleanup warning:', cleanupError.message);
    }
    
    if (browser) {
      await browser.close();
    }
  }
}

// Create screenshots directory
const fs = require('fs');
const path = require('path');
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Run the test
if (require.main === module) {
  testPasswordResetFlow()
    .then(() => {
      console.log('🎉 Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testPasswordResetFlow };
