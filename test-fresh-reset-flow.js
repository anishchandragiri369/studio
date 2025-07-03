/**
 * Generate a fresh password reset link and test the complete flow
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const puppeteer = require('puppeteer');

async function testFreshPasswordResetFlow() {
  console.log('🆕 Testing Fresh Password Reset Flow');
  console.log('====================================\n');
  
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const TEST_EMAIL = 'anishchandragiri@gmail.com';
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase credentials');
    return;
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  console.log('📧 Step 1: Requesting fresh password reset email...');
  
  try {
    // Request a fresh password reset
    const { data, error } = await supabase.auth.resetPasswordForEmail(TEST_EMAIL, {
      redirectTo: 'http://localhost:9002/reset-password'
    });

    if (error) {
      console.error('❌ Failed to send reset email:', error.message);
      return;
    }
    
    console.log('✅ Fresh password reset email requested successfully');
    console.log('📮 Check your email for the fresh reset link');
    console.log('\n🔗 Instructions:');
    console.log('   1. Check the email inbox for', TEST_EMAIL);
    console.log('   2. Copy the reset link from the email');
    console.log('   3. Run the link testing script with the fresh link');
    console.log('\n💡 The link should look like:');
    console.log('   https://rvdrtpyssyqardgxtdie.supabase.co/auth/v1/verify?token=NEW_TOKEN&type=recovery&redirect_to=...');
    
    console.log('\n⏰ Password reset links typically expire in:');
    console.log('   - 60 minutes for most Supabase projects');
    console.log('   - Check your Supabase Auth settings for the exact expiry time');
    
    // Also test our page with a mock fresh token scenario
    console.log('\n🧪 Testing with simulated fresh token...');
    await testWithMockFreshToken();
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
  }
}

async function testWithMockFreshToken() {
  console.log('\n🎭 Simulating Fresh Token Scenario');
  console.log('==================================');
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Mock a fresh token in the URL hash (simulating Supabase redirect)
    const mockUrl = 'http://localhost:9002/reset-password#access_token=mock_fresh_access_token&refresh_token=mock_refresh_token&type=recovery&expires_in=3600';
    
    console.log('🔗 Mock URL with fresh tokens:', mockUrl);
    
    page.on('console', (msg) => {
      console.log(`🖥️  Browser: ${msg.text()}`);
    });

    await page.goto(mockUrl);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🎯 Final URL:', page.url());
    
    // Check UI state
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      const buttonText = await page.evaluate(el => el.textContent, submitButton);
      const isDisabled = await page.evaluate(el => el.disabled, submitButton);
      console.log(`🔲 Submit Button: "${buttonText}" (${isDisabled ? 'Disabled' : 'Enabled'})`);
      
      if (buttonText.includes('Reset Password') && !isDisabled) {
        console.log('✅ Mock fresh token scenario: Button is enabled for password reset');
      } else {
        console.log('⚠️  Mock fresh token scenario: Button not ready');
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('❌ Mock test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testFreshPasswordResetFlow().catch(console.error);
