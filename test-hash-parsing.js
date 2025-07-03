/**
 * Simple test to debug hash parsing on reset password page
 */

require('dotenv').config({ path: '.env.local' });
const puppeteer = require('puppeteer');

async function testHashParsing() {
  console.log('🔍 Testing Hash Parsing on Reset Password Page');
  console.log('===============================================');

  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', (msg) => {
    console.log('🖥️ ', msg.text());
  });

  // Test URL with hash tokens
  const testUrl = 'http://localhost:9002/reset-password#access_token=test_token_123&refresh_token=test_refresh_456&type=recovery';
  
  console.log('Navigating to:', testUrl);
  await page.goto(testUrl);
  
  // Wait for page to load
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Check what's in the browser
  const urlInfo = await page.evaluate(() => {
    return {
      href: window.location.href,
      hash: window.location.hash,
      pathname: window.location.pathname,
      search: window.location.search
    };
  });
  
  console.log('URL Info:', urlInfo);
  
  // Check if tokens are in debug info
  const debugElement = await page.$('.text-xs');
  if (debugElement) {
    const debugText = await page.evaluate(el => el.textContent, debugElement);
    console.log('Debug Text:', debugText);
  } else {
    console.log('No debug element found');
  }
  
  // Manual hash parsing test
  const manualParsing = await page.evaluate(() => {
    const hash = window.location.hash.substring(1);
    if (!hash) return { error: 'No hash found' };
    
    const params = new URLSearchParams(hash);
    return {
      access_token: params.get('access_token'),
      refresh_token: params.get('refresh_token'),
      type: params.get('type'),
      hash: hash
    };
  });
  
  console.log('Manual Hash Parsing Result:', manualParsing);
  
  console.log('\nPress Ctrl+C to close browser...');
  await new Promise(resolve => {
    process.on('SIGINT', async () => {
      await browser.close();
      resolve();
    });
  });
}

testHashParsing().catch(console.error);
