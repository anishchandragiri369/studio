/**
 * Comprehensive test for the forgot password flow
 * This script tests the entire flow from requesting a reset to updating the password
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const puppeteer = require('puppeteer');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rvdrtpyssyqardgxtdie.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TEST_EMAIL = 'anishchandragiri@gmail.com'; // Using the email from .env.local
const TEST_PASSWORD = 'oldpassword123';
const NEW_PASSWORD = 'newpassword123';
const LOCAL_URL = 'http://localhost:9002';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testForgotPasswordFlow() {
  console.log('🚀 Starting Forgot Password Flow Test\n');
  
  let browser;
  let testResults = {
    requestReset: false,
    emailLinkFormat: false,
    resetPageLoad: false,
    tokenExtraction: false,
    sessionHandling: false,
    passwordUpdate: false,
    redirectToLogin: false
  };

  try {
    // Step 1: Test forgot password request
    console.log('📧 Step 1: Testing forgot password request...');
    const { data, error } = await supabase.auth.resetPasswordForEmail(TEST_EMAIL, {
      redirectTo: `${LOCAL_URL}/reset-password`
    });

    if (error) {
      console.error('❌ Failed to send reset email:', error.message);
      return testResults;
    }
    
    console.log('✅ Reset email request sent successfully');
    testResults.requestReset = true;

    // Step 2: Launch browser for UI testing
    console.log('\n🌐 Step 2: Launching browser for UI tests...');
    browser = await puppeteer.launch({ 
      headless: false, // Set to true for headless testing
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Enable console logging from the browser
    page.on('console', (msg) => {
      console.log(`🖥️  Browser Console: ${msg.text()}`);
    });

    // Enable error logging
    page.on('pageerror', (err) => {
      console.error(`🖥️  Browser Error: ${err.message}`);
    });

    // Step 3: Test reset password page load
    console.log('\n📄 Step 3: Testing reset password page load...');
    
    // First, test loading the page without any tokens (should show error)
    await page.goto(`${LOCAL_URL}/reset-password`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const hasErrorWithoutToken = await page.$('.text-destructive-foreground, [role="alert"]');
    if (hasErrorWithoutToken) {
      console.log('✅ Page correctly shows error when no reset token is provided');
    }

    // Step 4: Simulate clicking a reset link with proper tokens
    console.log('\n🔗 Step 4: Simulating direct reset link click (real-world scenario)...');
    
    // Create a fresh page to simulate clicking email link (real-world scenario)
    const resetPage = await browser.newPage();
    
    // Enable console logging for the reset page
    resetPage.on('console', (msg) => {
      console.log(`🖥️  Reset Page: ${msg.text()}`);
    });

    resetPage.on('pageerror', (err) => {
      console.error(`🖥️  Reset Page Error: ${err.message}`);
    });
    
    // Simulate the URL structure that Supabase would create
    // Note: In a real test, you'd extract this from an actual email
    const simulatedToken = '3221f14e1d124f71a50c4afb26e67e317596211c52fbcd488d99e154';
    const resetUrlWithToken = `${LOCAL_URL}/reset-password?token=${simulatedToken}&type=recovery`;
    
    console.log(`📋 Testing with URL: ${resetUrlWithToken}`);
    
    // Direct navigation to reset link (simulating real email click)
    await resetPage.goto(resetUrlWithToken);
    await new Promise(resolve => setTimeout(resolve, 4000)); // Wait for component to mount and process tokens
    
    testResults.resetPageLoad = true;
    console.log('✅ Reset password page loaded with tokens');

    // Step 5: Check token extraction and debug info
    console.log('\n🔍 Step 5: Checking token extraction and debug info...');
    
    // Look for debug info (only visible in development)
    const debugInfo = await resetPage.$('[data-testid="debug-info"], .text-xs');
    if (debugInfo) {
      const debugText = await resetPage.evaluate(el => el.textContent, debugInfo);
      console.log('🔧 Debug Info Found:', debugText);
      
      if (debugText.includes('Recovery Token: Present') || debugText.includes('Access Token: Present')) {
        testResults.tokenExtraction = true;
        console.log('✅ Tokens extracted successfully');
      }
    }

    // Step 6: Check if session is ready
    console.log('\n⏳ Step 6: Checking session readiness...');
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for handleRecovery to complete
    
    // Look for the specific reset password button
    const resetButton = await resetPage.$('button[type="submit"]');
    if (resetButton) {
      const isDisabled = await resetPage.evaluate(el => el.disabled, resetButton);
      const buttonText = await resetPage.evaluate(el => el.textContent, resetButton);
      
      console.log('Button found:', buttonText);
      console.log('Button disabled:', isDisabled);
      
      if (!isDisabled && buttonText.includes('Reset Password')) {
        testResults.sessionHandling = true;
        console.log('✅ Session is ready for password reset');
      } else {
        console.log('⚠️  Session not ready or button still disabled');
        console.log('Button text:', buttonText);
        
        // Check if there's an error message
        const errorElement = await resetPage.$('[role="alert"]');
        if (errorElement) {
          const errorText = await resetPage.evaluate(el => el.textContent, errorElement);
          console.log('Error on page:', errorText);
        }
      }
    } else {
      console.log('⚠️  No submit button found');
    }

    // Step 7: Test password reset form
    console.log('\n🔐 Step 7: Testing password reset form...');
    
    // Fill in the password fields
    await resetPage.type('#password', NEW_PASSWORD);
    await resetPage.type('#confirmPassword', NEW_PASSWORD);
    
    console.log('✅ Password fields filled');

    // Submit the form
    const submitButton = await resetPage.$('button[type="submit"]');
    if (submitButton) {
      const isDisabled = await resetPage.evaluate(el => el.disabled, submitButton);
      if (!isDisabled) {
        console.log('🚀 Submitting password reset form...');
        await submitButton.click();
        
        // Wait for the response
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check for success message
        const successMessage = await resetPage.$('.text-green-700, .border-green-200');
        if (successMessage) {
          testResults.passwordUpdate = true;
          console.log('✅ Password reset successful');
          
          // Wait for redirect
          console.log('⏳ Waiting for redirect to login...');
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          if (resetPage.url().includes('/login')) {
            testResults.redirectToLogin = true;
            console.log('✅ Successfully redirected to login page');
          }
        } else {
          // Check for error messages
          const errorMessage = await resetPage.$('.text-destructive-foreground');
          if (errorMessage) {
            const errorText = await resetPage.evaluate(el => el.textContent, errorMessage);
            console.log('❌ Password reset failed:', errorText);
          }
        }
      } else {
        console.log('⚠️  Submit button is disabled');
      }
    }

    // Step 8: Test login with new password (if redirected)
    console.log('\n🔑 Step 8: Testing login with new password...');
    
    if (resetPage.url().includes('/login')) {
      await resetPage.type('#email', TEST_EMAIL);
      await resetPage.type('#password', NEW_PASSWORD);
      
      const loginButton = await resetPage.$('button[type="submit"]');
      if (loginButton) {
        await loginButton.click();
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check if login was successful (redirected away from login page)
        if (!resetPage.url().includes('/login')) {
          console.log('✅ Login with new password successful');
        } else {
          console.log('⚠️  Login may have failed or is still processing');
        }
      }
    }
    
    // Close the reset page
    await resetPage.close();

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Print test results
  console.log('\n📊 Test Results Summary:');
  console.log('=======================');
  Object.entries(testResults).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });

  const passedCount = Object.values(testResults).filter(Boolean).length;
  const totalCount = Object.keys(testResults).length;
  console.log(`\n📈 Overall: ${passedCount}/${totalCount} tests passed (${Math.round(passedCount/totalCount*100)}%)`);

  return testResults;
}

// Manual token parsing test
async function testTokenParsing() {
  console.log('\n🔧 Testing Token Parsing Logic:');
  console.log('================================');
  
  const testCases = [
    {
      name: 'Query Parameters',
      url: 'http://localhost:9002/reset-password?token=abc123&type=recovery',
      expectedToken: 'abc123',
      expectedType: 'recovery'
    },
    {
      name: 'Hash Parameters (Supabase redirect)',
      url: 'http://localhost:9002/reset-password#access_token=xyz789&refresh_token=refresh123&type=recovery',
      expectedAccessToken: 'xyz789',
      expectedRefreshToken: 'refresh123',
      expectedType: 'recovery'
    },
    {
      name: 'Mixed Parameters',
      url: 'http://localhost:9002/reset-password?token=abc123&type=recovery#access_token=xyz789',
      expectedToken: 'abc123',
      expectedAccessToken: 'xyz789',
      expectedType: 'recovery'
    }
  ];

  testCases.forEach((testCase, index) => {
    console.log(`\n${index + 1}. ${testCase.name}:`);
    console.log(`   URL: ${testCase.url}`);
    
    const url = new URL(testCase.url);
    const searchParams = new URLSearchParams(url.search);
    const hashParams = new URLSearchParams(url.hash.substring(1));
    
    const token = searchParams.get('token') || hashParams.get('token');
    const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
    const type = searchParams.get('type') || hashParams.get('type') || (accessToken ? 'recovery' : null);
    
    console.log(`   Extracted token: ${token || 'null'}`);
    console.log(`   Extracted accessToken: ${accessToken || 'null'}`);
    console.log(`   Extracted refreshToken: ${refreshToken || 'null'}`);
    console.log(`   Extracted type: ${type || 'null'}`);
    
    let passed = true;
    if (testCase.expectedToken && token !== testCase.expectedToken) passed = false;
    if (testCase.expectedAccessToken && accessToken !== testCase.expectedAccessToken) passed = false;
    if (testCase.expectedRefreshToken && refreshToken !== testCase.expectedRefreshToken) passed = false;
    if (testCase.expectedType && type !== testCase.expectedType) passed = false;
    
    console.log(`   Result: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
  });
}

// Run the tests
async function runAllTests() {
  console.log('🎯 Forgot Password Flow - Comprehensive Test Suite');
  console.log('==================================================\n');
  
  // Check if server is running
  try {
    const response = await fetch(`${LOCAL_URL}/api/health`);
    if (!response.ok) {
      throw new Error('Server not responding');
    }
    console.log('✅ Server is running at', LOCAL_URL);
  } catch (error) {
    console.log('⚠️  Server may not be running at', LOCAL_URL);
    console.log('   Please start the development server with: npm run dev');
    console.log('   Then run this test again.\n');
  }
  
  // Run token parsing tests first
  await testTokenParsing();
  
  // Run the full flow test
  await testForgotPasswordFlow();
  
  console.log('\n🏁 All tests completed!');
}

// Export for use in other tests
module.exports = {
  testForgotPasswordFlow,
  testTokenParsing,
  runAllTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}
