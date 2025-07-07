const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testPuppeteer() {
  console.log('Testing Puppeteer functionality...');
  
  // Check if we can import puppeteer
  console.log('✅ Puppeteer imported successfully');
  
  // List possible Chrome paths
  const chromePaths = [
    process.env.CHROME_BIN,
    '/opt/google/chrome/chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium'
  ].filter(Boolean);
  
  console.log('Possible Chrome paths:', chromePaths);
  
  // Check if any of these paths exist
  for (const chromePath of chromePaths) {
    try {
      if (fs.existsSync(chromePath)) {
        console.log(`✅ Chrome found at: ${chromePath}`);
      } else {
        console.log(`❌ Chrome not found at: ${chromePath}`);
      }
    } catch (error) {
      console.log(`❌ Error checking path ${chromePath}:`, error.message);
    }
  }
  
  // Try to launch browser
  let browser = null;
  try {
    console.log('Attempting to launch browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
    console.log('✅ Browser launched successfully');
    
    const page = await browser.newPage();
    await page.setContent('<html><body><h1>Test</h1></body></html>');
    const pdf = await page.pdf({ format: 'A4' });
    console.log('✅ PDF generation successful, size:', pdf.length, 'bytes');
    
    await browser.close();
    console.log('✅ Browser closed successfully');
    
  } catch (error) {
    console.error('❌ Browser launch failed:', error.message);
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
  }
}

testPuppeteer().catch(console.error); 