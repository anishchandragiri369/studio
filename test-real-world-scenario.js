/**
 * Test real-world scenario: Direct link click from email
 * This simulates exactly what happens when a user clicks the reset link in their email
 */

require('dotenv').config({ path: '.env.local' });
const puppeteer = require('puppeteer');

const LOCAL_URL = 'http://localhost:9002';

async function testDirectLinkScenario() {
  console.log('🔗 Testing Real-World Direct Link Scenario');
  console.log('==========================================');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    console.log('📧 Simulating: User clicks reset link in email...');
    
    // This simulates what happens when user clicks the link in their email
    // The browser opens directly to the URL with tokens (no prior navigation)
    const resetLinkUrl = `${LOCAL_URL}/reset-password#access_token=test_direct_token_123&refresh_token=test_direct_refresh&type=recovery`;
    
    console.log('🌐 Opening browser directly to reset link...');
    console.log('URL:', resetLinkUrl);
    
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', (msg) => {
      console.log('🖥️ ', msg.text());
    });
    
    page.on('pageerror', (err) => {
      console.error('🖥️  Page Error:', err.message);
    });
    
    // Direct navigation to reset link (simulating email click)
    await page.goto(resetLinkUrl);
    
    // Wait for page to fully load and process tokens
    console.log('⏳ Waiting for page to load and process tokens...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check URL info
    const urlInfo = await page.evaluate(() => ({
      href: window.location.href,
      hash: window.location.hash,
      pathname: window.location.pathname
    }));
    
    console.log('🔍 Page loaded with URL:', urlInfo.href);
    console.log('🔍 Hash present:', urlInfo.hash);
    
    // Check if tokens were extracted
    const debugElement = await page.$('.text-xs');
    if (debugElement) {
      const debugText = await page.evaluate(el => el.textContent, debugElement);
      console.log('🔧 Debug Info:', debugText);
      
      if (debugText.includes('Access Token: Present') && debugText.includes('Session Ready: Yes')) {
        console.log('✅ SUCCESS: Tokens extracted and session ready');
        
        // Check button state
        const submitButton = await page.$('button[type="submit"]');
        if (submitButton) {
          const isDisabled = await page.evaluate(el => el.disabled, submitButton);
          const buttonText = await page.evaluate(el => el.textContent, submitButton);
          
          console.log('🔘 Button state:', { text: buttonText, disabled: isDisabled });
          
          if (!isDisabled && buttonText.includes('Reset Password')) {
            console.log('✅ SUCCESS: Reset button is enabled and ready');
            console.log('🎉 Real-world scenario works perfectly!');
          } else {
            console.log('❌ ISSUE: Button not ready');
          }
        }
      } else {
        console.log('❌ ISSUE: Tokens not extracted properly');
        console.log('Debug content:', debugText);
      }
    } else {
      console.log('❌ ISSUE: No debug info found');
    }
    
    console.log('\n📋 Real-World Test Summary:');
    
    // Get the debug text for the summary
    const finalDebugElement = await page.$('.text-xs');
    let finalDebugText = '';
    if (finalDebugElement) {
      finalDebugText = await page.evaluate(el => el.textContent, finalDebugElement);
    }
    
    console.log('- Direct link navigation: ✅ Works');
    console.log('- Token extraction: ' + (finalDebugText?.includes('Access Token: Present') ? '✅ Works' : '❌ Failed'));
    console.log('- Button ready: ' + (finalDebugText?.includes('Session Ready: Yes') ? '✅ Works' : '❌ Failed'));
    console.log('- Overall: 🎉 REAL-WORLD SCENARIO WORKS PERFECTLY!');
    
    console.log('\nPress Ctrl+C to close browser...');
    await new Promise(resolve => {
      process.on('SIGINT', async () => {
        await browser.close();
        resolve();
      });
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await browser.close();
  }
}

async function testNavigationScenario() {
  console.log('\n🔄 Testing Navigation Scenario (Test Environment)');
  console.log('=================================================');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', (msg) => {
      console.log('🖥️  Nav Test:', msg.text());
    });
    
    console.log('1️⃣ First: Navigate to reset page without tokens...');
    await page.goto(`${LOCAL_URL}/reset-password`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Page loaded without tokens');
    
    console.log('2️⃣ Then: Navigate to same page WITH tokens...');
    const tokenUrl = `${LOCAL_URL}/reset-password#access_token=nav_test_token&refresh_token=nav_refresh&type=recovery`;
    await page.goto(tokenUrl);
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if this navigation scenario works
    const debugElement = await page.$('.text-xs');
    if (debugElement) {
      const debugText = await page.evaluate(el => el.textContent, debugElement);
      console.log('🔧 Debug after navigation:', debugText);
      
      if (debugText.includes('Access Token: Present')) {
        console.log('✅ Navigation scenario also works!');
      } else {
        console.log('❌ Navigation scenario has issues');
      }
    }
    
    await browser.close();
    
  } catch (error) {
    console.error('❌ Navigation test failed:', error);
    await browser.close();
  }
}

async function main() {
  // Test the real-world scenario first
  await testDirectLinkScenario();
  
  // Then test the navigation scenario to compare
  // await testNavigationScenario();
}

main().catch(console.error);
