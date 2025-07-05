/**
 * Debug Password Reset Submit Test
 * Quick test to check page state after form submission
 */

const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugSubmit() {
  console.log('🔍 Debug Password Reset Submit Test\n');
  
  let browser;
  let page;
  let testUser;
  
  try {
    browser = await puppeteer.launch({
      headless: false,
      devtools: true,
      slowMo: 100
    });
    
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Capture ALL console output including success logs
    page.on('console', msg => {
      const text = msg.text();
      console.log(`🌐 [${msg.type().toUpperCase()}]`, text);
    });
    
    // Setup test user
    const testEmail = 'debug.submit@example.com';
    const testPassword = 'OriginalPassword123';
    const newPassword = 'NewDebugPassword456';
    
    console.log('👤 Creating test user...');
    
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
    console.log('✅ Test user created');
    
    // Generate reset link with localhost redirect
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
    
    // Navigate to reset link
    console.log('\n🔗 Following reset link...');
    await page.goto(resetUrl, { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Navigate to reset password page directly
    if (!page.url().includes('/reset-password')) {
      console.log('🔄 Navigating to reset-password page...');
      await page.goto('http://localhost:9002/reset-password', { waitUntil: 'networkidle0' });
    }
    
    // Wait for form
    await page.waitForSelector('input[type="password"]', { timeout: 15000 });
    
    // Fill form
    const passwordInputs = await page.$$('input[type="password"]');
    await passwordInputs[0].type(newPassword);
    await passwordInputs[1].type(newPassword);
    
    console.log('\n🚀 Submitting form...');
    
    // Submit form
    const submitButton = await page.$('button[type="submit"]');
    await submitButton.click();
    
    // Wait and observe
    console.log('\n⏳ Waiting 5 seconds to observe changes...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check page state
    console.log('\n📋 Page state after submit:');
    
    // Check for alerts
    const alerts = await page.$$('.alert');
    console.log(`Alerts found: ${alerts.length}`);
    
    for (let i = 0; i < alerts.length; i++) {
      const text = await alerts[i].evaluate(el => el.textContent);
      console.log(`Alert ${i + 1}: ${text}`);
    }
    
    // Check for success/error elements
    const successElements = await page.$$('.text-green-800, .text-green-700');
    const errorElements = await page.$$('.text-red-800, .text-red-700');
    
    console.log(`Success elements: ${successElements.length}`);
    console.log(`Error elements: ${errorElements.length}`);
    
    // Check current URL
    console.log(`Current URL: ${page.url()}`);
    
    // Check button state
    const buttonText = await page.$eval('button[type="submit"]', btn => btn.textContent || '');
    const buttonDisabled = await page.$eval('button[type="submit"]', btn => btn.disabled);
    console.log(`Button text: "${buttonText}"`);
    console.log(`Button disabled: ${buttonDisabled}`);
    
    // Wait longer for any delayed actions
    console.log('\n⏳ Waiting 5 more seconds for potential redirects...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log(`Final URL: ${page.url()}`);
    
  } catch (error) {
    console.error('\n💥 Debug test failed:', error.message);
  } finally {
    // Cleanup
    if (testUser) {
      try {
        await supabase.from('user_rewards').delete().eq('user_id', testUser.id);
        await supabase.auth.admin.deleteUser(testUser.id);
      } catch (e) {
        console.warn('Cleanup warning:', e.message);
      }
    }
    
    if (browser) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Keep browser open briefly
      await browser.close();
    }
  }
}

debugSubmit()
  .then(() => console.log('\n🎉 Debug test completed'))
  .catch(error => console.error('\n💥 Debug test failed:', error));
