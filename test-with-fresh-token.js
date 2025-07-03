const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWithFreshToken() {
  console.log('🚀 Testing with Fresh Reset Token');
  console.log('===================================');

  // Use a test email
  const testEmail = 'test+reset@anishpatel.dev';
  
  try {
    console.log('📧 Step 1: Requesting password reset for', testEmail);
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: 'http://localhost:9002/reset-password'
    });
    
    if (error) {
      console.error('❌ Error requesting reset:', error);
      return;
    }
    
    console.log('✅ Reset email request sent successfully');
    console.log('📋 Please check the email and manually test the reset link');
    console.log('   Or copy the link from the Supabase dashboard/logs');
    
    // Launch browser to test the page
    console.log('\n🌐 Launching browser to test reset page...');
    const browser = await puppeteer.launch({ 
      headless: false,
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Listen for console messages
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        console.log('🖥️  Browser Error:', text);
      } else if (type === 'log' || type === 'info') {
        console.log('🖥️  Browser Console:', text);
      }
    });
    
    // Go to reset page without tokens first
    await page.goto('http://localhost:9002/reset-password');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ Reset page loaded (without tokens)');
    console.log('📋 Page should show error about missing reset tokens');
    
    // Check if error is shown
    const errorElement = await page.$('[role="alert"]');
    if (errorElement) {
      const errorText = await page.evaluate(el => el.textContent, errorElement);
      console.log('✅ Error message displayed:', errorText.substring(0, 100) + '...');
    }
    
    console.log('\n📨 Manual Step Required:');
    console.log('1. Check your email for the reset link');
    console.log('2. Copy the reset link URL');
    console.log('3. Paste it in the browser tab that just opened');
    console.log('4. Test the password reset flow');
    console.log('\nBrowser will remain open for manual testing...');
    
    // Keep browser open for manual testing
    await new Promise(resolve => {
      console.log('Press Ctrl+C to close the browser and exit');
      process.on('SIGINT', () => {
        browser.close();
        resolve();
      });
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:9002');
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.error('❌ Server not running at http://localhost:9002');
    console.log('Please start the development server with: npm run dev');
    process.exit(1);
  }
  
  console.log('✅ Server is running at http://localhost:9002');
  await testWithFreshToken();
}

main().catch(console.error);
