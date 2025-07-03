/**
 * Test the actual email link flow
 * This simulates clicking the exact email link provided by the user
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const puppeteer = require('puppeteer');

async function testActualEmailLink() {
  console.log('🔗 Testing Actual Email Link Flow');
  console.log('=================================\n');
  
  // The actual email link provided by the user
  const emailLink = 'https://rvdrtpyssyqardgxtdie.supabase.co/auth/v1/verify?token=3221f14e1d124f71a50c4afb26e67e317596211c52fbcd488d99e154&type=recovery&redirect_to=http://localhost:9002/reset-password';
  
  console.log('📧 Email Link:', emailLink);
  console.log('🎯 Expected Flow:');
  console.log('   1. Click email link → Supabase /auth/v1/verify');
  console.log('   2. Supabase validates token and redirects to reset-password page');
  console.log('   3. Tokens should be in URL hash or query params');
  console.log('   4. Reset password form should be shown and functional\n');
  
  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({ 
      headless: false,  // Keep visible to see what happens
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', (msg) => {
      console.log(`🖥️  Browser: ${msg.text()}`);
    });

    page.on('pageerror', (err) => {
      console.error(`🖥️  Browser Error: ${err.message}`);
    });

    console.log('🌐 Step 1: Clicking the email link...');
    console.log('   This simulates the user clicking the link from their email\n');
    
    // Navigate to the email link (this simulates clicking the link)
    await page.goto(emailLink);
    
    console.log('⏳ Waiting for Supabase to process and redirect...');
    
    // Wait for potential redirects
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const finalUrl = page.url();
    console.log(`🎯 Final URL: ${finalUrl}`);
    
    // Check if we landed on the reset password page
    if (finalUrl.includes('/reset-password')) {
      console.log('✅ Successfully redirected to reset password page');
      
      // Check what tokens are in the URL
      const url = new URL(finalUrl);
      const queryParams = url.searchParams;
      const hashParams = new URLSearchParams(url.hash.substring(1));
      
      console.log('\n📋 URL Analysis:');
      console.log(`   Query Params: ${url.search || 'None'}`);
      console.log(`   Hash Params: ${url.hash || 'None'}`);
      
      // Check for tokens
      const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');
      const recoveryToken = queryParams.get('token') || hashParams.get('token');
      const type = queryParams.get('type') || hashParams.get('type');
      
      console.log('\n🔑 Token Analysis:');
      console.log(`   Access Token: ${accessToken ? 'Present' : 'Missing'}`);
      console.log(`   Refresh Token: ${refreshToken ? 'Present' : 'Missing'}`);
      console.log(`   Recovery Token: ${recoveryToken ? 'Present' : 'Missing'}`);
      console.log(`   Type: ${type || 'Missing'}`);
      
      // Wait for the page to fully load and process tokens
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check the UI state
      console.log('\n🎮 UI State Analysis:');
      
      // Look for debug info
      const debugElement = await page.$('[data-testid="debug-info"]');
      if (!debugElement) {
        // Try to find any alert with debug info
        const debugAlerts = await page.$$('div[role="alert"]');
        for (let alert of debugAlerts) {
          const text = await page.evaluate(el => el.textContent, alert);
          if (text.includes('Debug Info')) {
            console.log('🔧 Debug Info Found:', text);
            break;
          }
        }
      }
      
      // Check for error messages
      const errorElements = await page.$$('.text-destructive-foreground, [role="alert"]');
      for (let errorEl of errorElements) {
        const errorText = await page.evaluate(el => el.textContent, errorEl);
        if (errorText.includes('Error') || errorText.includes('Invalid')) {
          console.log('❌ Error Found:', errorText);
        }
      }
      
      // Check button state
      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        const buttonText = await page.evaluate(el => el.textContent, submitButton);
        const isDisabled = await page.evaluate(el => el.disabled, submitButton);
        console.log(`🔲 Submit Button: "${buttonText}" (${isDisabled ? 'Disabled' : 'Enabled'})`);
      }
      
      // Check if password fields are present
      const passwordField = await page.$('#password');
      const confirmPasswordField = await page.$('#confirmPassword');
      console.log(`📝 Password Fields: ${passwordField && confirmPasswordField ? 'Present' : 'Missing'}`);
      
    } else {
      console.log('❌ Did not redirect to reset password page');
      console.log('   Current page might be showing an error or different content');
      
      // Try to get page content for debugging
      const title = await page.title();
      console.log(`   Page Title: ${title}`);
    }
    
    console.log('\n📊 Summary:');
    console.log('===========');
    if (finalUrl.includes('/reset-password')) {
      console.log('✅ Email link → Supabase → Reset page flow working');
    } else {
      console.log('❌ Email link flow failed');
    }
    
    // Keep browser open for manual inspection
    console.log('\n🔍 Browser will stay open for 30 seconds for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testActualEmailLink().catch(console.error);
