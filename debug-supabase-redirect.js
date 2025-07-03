/**
 * Debug the actual URL structure after Supabase /auth/v1/verify redirect
 * This will help us understand what tokens are available
 */

require('dotenv').config({ path: '.env.local' });
const puppeteer = require('puppeteer');

async function debugSupabaseRedirect() {
  console.log('🔍 Debugging Supabase /auth/v1/verify redirect...');
  
  let browser;
  
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Enhanced console logging
    page.on('console', (msg) => {
      const text = msg.text();
      console.log(`🖥️  [${msg.type().toUpperCase()}] ${text}`);
    });

    page.on('pageerror', (err) => {
      console.error(`🖥️  [ERROR] ${err.message}`);
    });
    
    // Navigate to the EXACT URL from your email
    const emailUrl = 'https://rvdrtpyssyqardgxtdie.supabase.co/auth/v1/verify?token=e4255604c82bd518b799d46492890c466c777d1ec2db367c80ae54d5&type=recovery&redirect_to=http://localhost:9002/reset-password';
    
    console.log('🔗 Navigating to actual Supabase verification URL...');
    console.log('URL:', emailUrl);
    
    await page.goto(emailUrl, { waitUntil: 'networkidle0' });
    
    // Wait for any redirects to complete
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('📍 Final URL after redirect:', page.url());
    
    // Log the current URL structure
    const currentUrl = page.url();
    const url = new URL(currentUrl);
    
    console.log('🔍 URL Analysis:');
    console.log('- Pathname:', url.pathname);
    console.log('- Search params:', url.search);
    console.log('- Hash:', url.hash);
    
    // Parse search parameters
    const searchParams = new URLSearchParams(url.search);
    console.log('\n📋 Search Parameters:');
    for (const [key, value] of searchParams.entries()) {
      console.log(`- ${key}:`, value);
    }
    
    // Parse hash parameters
    if (url.hash) {
      const hashParams = new URLSearchParams(url.hash.substring(1));
      console.log('\n🔗 Hash Parameters:');
      for (const [key, value] of hashParams.entries()) {
        console.log(`- ${key}:`, value);
      }
    }
    
    // Check what tokens are available in our component logic
    await page.evaluate(() => {
      console.log('=== COMPONENT TOKEN DETECTION ===');
      
      const url = new URL(window.location.href);
      const searchParams = new URLSearchParams(url.search);
      const hashParams = new URLSearchParams(url.hash.substring(1));
      
      const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
      const recoveryToken = searchParams.get('token') || hashParams.get('token');
      const type = searchParams.get('type') || hashParams.get('type') || (accessToken ? 'recovery' : null);
      
      console.log('Detected tokens:');
      console.log('- accessToken:', accessToken ? 'Present' : 'Missing');
      console.log('- refreshToken:', refreshToken ? 'Present' : 'Missing');
      console.log('- recoveryToken:', recoveryToken ? 'Present' : 'Missing');
      console.log('- type:', type);
    });
    
    // Wait for component to process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if user is actually logged in
    const userLoggedIn = await page.evaluate(async () => {
      // Try to access Supabase session
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        return !!data.user;
      } catch {
        return false;
      }
    });
    
    console.log('\n👤 User session status:', userLoggedIn ? 'LOGGED IN' : 'NOT LOGGED IN');
    
    // Check form state
    try {
      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        const isDisabled = await page.evaluate(el => el.disabled, submitButton);
        const buttonText = await page.evaluate(el => el.textContent, submitButton);
        console.log('\n🔘 Form state:');
        console.log('- Button text:', buttonText);
        console.log('- Button disabled:', isDisabled);
      }
    } catch (e) {
      console.log('\n🔘 Form not found or not ready');
    }
    
    console.log('\n🏁 Debug completed. Press Ctrl+C to close browser.');
    
    // Keep browser open for manual inspection
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    if (browser) {
      // Don't close automatically
    }
  }
}

debugSupabaseRedirect().catch(console.error);
