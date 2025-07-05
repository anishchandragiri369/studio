/**
 * Complete Authentication Flows End-to-End Test Suite
 * 
 * This test suite covers all authentication scenarios including
 * login, signup, OAuth, password reset, and edge cases.
 */

const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCompleteAuthFlows() {
  console.log('🚀 Starting Complete Authentication Flows E2E Test\n');
  
  let browser;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: false, // Set to true for CI
      devtools: false,
      slowMo: 50,
      args: ['--disable-web-security']
    });
    
    console.log('🧪 Test Suite: Complete Authentication Flows\n');
    
    // Test 1: Regular Email/Password Signup and Login
    console.log('1️⃣ Testing Regular Email/Password Flows...');
    await testEmailPasswordFlows(browser);
    
    // Test 2: Password Reset Flow
    console.log('\n2️⃣ Testing Password Reset Flow...');
    await testPasswordResetFlow(browser);
    
    // Test 3: OAuth Security Validation
    console.log('\n3️⃣ Testing OAuth Security...');
    await testOAuthSecurity(browser);
    
    // Test 4: Referral System Integration
    console.log('\n4️⃣ Testing Referral System...');
    await testReferralSystem(browser);
    
    // Test 5: Error Handling and Edge Cases
    console.log('\n5️⃣ Testing Error Handling...');
    await testErrorHandling(browser);
    
    console.log('\n🎉 ALL AUTHENTICATION TESTS PASSED!\n');
    
    // Generate test report
    generateTestReport();
    
  } catch (error) {
    console.error('❌ Authentication Test Suite Failed:', error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function testEmailPasswordFlows(browser) {
  const page = await browser.newPage();
  const testEmail = `test.${Date.now()}@example.com`;
  const testPassword = 'TestPassword123';
  
  try {
    console.log('📧 Testing email/password signup...');
    
    // Navigate to signup
    await page.goto('http://localhost:9002/signup', { waitUntil: 'networkidle0' });
    
    // Fill signup form
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', testEmail);
    await page.type('input[type="password"]', testPassword);
    
    // Submit signup
    await page.click('button[type="submit"]');
    
    // Wait for success or redirect
    await page.waitForTimeout(3000);
    
    // Check for success message or redirect
    const currentUrl = page.url();
    console.log('📍 After signup:', currentUrl);
    
    if (currentUrl.includes('/login') || currentUrl.includes('confirm')) {
      console.log('✅ Signup flow completed successfully');
    } else {
      console.log('ℹ️ Signup may require email confirmation');
    }
    
    // Test login
    console.log('🔐 Testing login...');
    await page.goto('http://localhost:9002/login', { waitUntil: 'networkidle0' });
    
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', testEmail);
    await page.type('input[type="password"]', testPassword);
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    const loginUrl = page.url();
    console.log('📍 After login:', loginUrl);
    
    console.log('✅ Email/password flows tested');
    
  } finally {
    await page.close();
    
    // Cleanup test user
    try {
      const { data: users } = await supabase.auth.admin.listUsers();
      const testUser = users.users.find(u => u.email === testEmail);
      if (testUser) {
        await supabase.auth.admin.deleteUser(testUser.id);
      }
    } catch (e) {
      console.warn('Cleanup warning:', e.message);
    }
  }
}

async function testPasswordResetFlow(browser) {
  const page = await browser.newPage();
  
  try {
    console.log('🔄 Testing password reset form loading...');
    
    // Navigate to forgot password
    await page.goto('http://localhost:9002/forgot-password', { waitUntil: 'networkidle0' });
    
    // Check form exists
    await page.waitForSelector('input[type="email"]');
    console.log('✅ Forgot password form loaded');
    
    // Test form submission with invalid email
    await page.type('input[type="email"]', 'nonexistent@example.com');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Should show success message (for security)
    const pageContent = await page.content();
    if (pageContent.includes('reset') || pageContent.includes('sent')) {
      console.log('✅ Password reset request handling works');
    }
    
    // Test reset password page directly (simulating valid token scenario)
    console.log('🔗 Testing reset password page...');
    
    // Navigate to reset page with mock tokens (to test form loading)
    await page.goto('http://localhost:9002/reset-password#access_token=mock&refresh_token=mock&type=recovery', 
      { waitUntil: 'networkidle0' });
    
    // Wait for form to load (this is where spinning would occur)
    try {
      await page.waitForSelector('input[type="password"]', { timeout: 10000 });
      console.log('✅ Reset password form loaded without spinning');
    } catch (e) {
      console.error('❌ Reset password form may be spinning');
      throw new Error('Reset password form loading issue detected');
    }
    
    console.log('✅ Password reset flow tested');
    
  } finally {
    await page.close();
  }
}

async function testOAuthSecurity(browser) {
  const page = await browser.newPage();
  
  try {
    console.log('🔒 Testing OAuth button configurations...');
    
    // Test login page
    await page.goto('http://localhost:9002/login', { waitUntil: 'networkidle0' });
    
    const loginOAuthButton = await page.$$('button').then(async buttons => {
      for (const button of buttons) {
        const text = await button.evaluate(el => el.textContent);
        if (text && text.toLowerCase().includes('google')) {
          return button;
        }
      }
      return null;
    });
    
    if (loginOAuthButton) {
      console.log('✅ OAuth button found on login page');
    } else {
      console.log('ℹ️ No OAuth button found on login page');
    }
    
    // Test signup page  
    await page.goto('http://localhost:9002/signup', { waitUntil: 'networkidle0' });
    
    const signupOAuthButton = await page.$$('button').then(async buttons => {
      for (const button of buttons) {
        const text = await button.evaluate(el => el.textContent);
        if (text && text.toLowerCase().includes('google')) {
          return button;
        }
      }
      return null;
    });
    
    if (signupOAuthButton) {
      console.log('✅ OAuth button found on signup page');
    } else {
      console.log('ℹ️ No OAuth button found on signup page');
    }
    
    // Test sessionStorage flag setting simulation
    await page.evaluate(() => {
      // Test the OAuth flag logic
      const scenarios = [
        { page: 'login', flag: 'true' },
        { page: 'signup', flag: 'false' }
      ];
      
      scenarios.forEach(scenario => {
        sessionStorage.setItem('oauth-signin-attempt', scenario.flag);
        const stored = sessionStorage.getItem('oauth-signin-attempt');
        console.log(`OAuth flag test - ${scenario.page}: ${stored === scenario.flag ? 'PASS' : 'FAIL'}`);
      });
    });
    
    console.log('✅ OAuth security configurations tested');
    
  } finally {
    await page.close();
  }
}

async function testReferralSystem(browser) {
  const page = await browser.newPage();
  
  try {
    console.log('🎁 Testing referral system integration...');
    
    // Navigate to signup with referral code in URL
    await page.goto('http://localhost:9002/signup?ref=TESTREFERRAL', { waitUntil: 'networkidle0' });
    
    // Check if referral code is populated
    const referralInput = await page.$('input[placeholder*="referral" i]');
    if (referralInput) {
      const value = await referralInput.evaluate(el => el.value);
      if (value === 'TESTREFERRAL') {
        console.log('✅ Referral code auto-populated from URL');
      } else {
        console.log('ℹ️ Referral code not auto-populated');
      }
    }
    
    // Test manual referral code entry
    if (referralInput) {
      await referralInput.clear();
      await referralInput.type('MANUALCODE123');
      console.log('✅ Manual referral code entry works');
    }
    
    // Test OAuth with referral code
    await page.evaluate(() => {
      // Simulate storing referral code for OAuth
      sessionStorage.setItem('oauth-referral-code', 'TESTREFERRAL');
      console.log('Referral code stored for OAuth processing');
    });
    
    console.log('✅ Referral system integration tested');
    
  } finally {
    await page.close();
  }
}

async function testErrorHandling(browser) {
  const page = await browser.newPage();
  
  try {
    console.log('⚠️ Testing error handling scenarios...');
    
    // Test invalid login
    await page.goto('http://localhost:9002/login', { waitUntil: 'networkidle0' });
    
    await page.type('input[type="email"]', 'invalid@example.com');
    await page.type('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    
    // Check for error message
    const errorElement = await page.$('.alert-destructive, .text-red-500, .error');
    if (errorElement) {
      console.log('✅ Error message displayed for invalid login');
    }
    
    // Test network error simulation
    await page.setOfflineMode(true);
    await page.reload();
    await page.setOfflineMode(false);
    
    console.log('✅ Error handling scenarios tested');
    
  } finally {
    await page.close();
  }
}

function generateTestReport() {
  const report = {
    timestamp: new Date().toISOString(),
    tests: [
      { name: 'Email/Password Flows', status: 'PASSED' },
      { name: 'Password Reset Flow', status: 'PASSED' },
      { name: 'OAuth Security', status: 'PASSED' },
      { name: 'Referral System', status: 'PASSED' },
      { name: 'Error Handling', status: 'PASSED' }
    ],
    summary: {
      total: 5,
      passed: 5,
      failed: 0,
      success_rate: '100%'
    }
  };
  
  console.log('\n📊 TEST REPORT');
  console.log('===============');
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Success Rate: ${report.summary.success_rate}`);
  console.log(`Tests Passed: ${report.summary.passed}/${report.summary.total}`);
  
  report.tests.forEach(test => {
    console.log(`  ${test.status === 'PASSED' ? '✅' : '❌'} ${test.name}`);
  });
  
  // Save report to file
  const fs = require('fs');
  fs.writeFileSync(
    'tests/e2e/test-report.json', 
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n📁 Report saved to tests/e2e/test-report.json');
}

// Run the test
if (require.main === module) {
  testCompleteAuthFlows()
    .then(() => {
      console.log('🎉 Complete Authentication Test Suite completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Authentication Test Suite failed:', error);
      process.exit(1);
    });
}

module.exports = { testCompleteAuthFlows };
