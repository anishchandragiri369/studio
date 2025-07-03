/**
 * Real-world password reset test with actual Supabase email
 * This test sends a real email and shows you the actual link to test
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TEST_EMAIL = 'anishchandragiri@gmail.com';
const LOCAL_URL = 'http://localhost:9002';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function sendRealPasswordResetEmail() {
  console.log('📧 Sending real password reset email...');
  console.log('Email:', TEST_EMAIL);
  console.log('Redirect URL:', `${LOCAL_URL}/reset-password`);
  
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(TEST_EMAIL, {
      redirectTo: `${LOCAL_URL}/reset-password`
    });

    if (error) {
      console.error('❌ Failed to send reset email:', error.message);
      return;
    }
    
    console.log('✅ Reset email sent successfully!');
    console.log('');
    console.log('📬 Instructions:');
    console.log('1. Check your email inbox for the password reset email');
    console.log('2. Click the "Reset Password" link in the email');
    console.log('3. This will take you to the actual reset page with real tokens');
    console.log('4. Try to enter a new password and submit the form');
    console.log('5. Check the browser console for any "AuthSessionMissingError" messages');
    console.log('');
    console.log('Expected behavior:');
    console.log('✅ Page should load and stay on /reset-password (not redirect to home)');
    console.log('✅ Form should be enabled for password entry');
    console.log('✅ Submitting the form should NOT show "Auth session missing" error');
    console.log('✅ Should either succeed or show a specific validation error');
    console.log('');
    console.log('🔧 Debug info to look for in browser console:');
    console.log('- [SessionValidator] Skipping validation on reset password page');
    console.log('- Found existing session with valid reset tokens - preserving session');
    console.log('- Using existing session for password update');
    console.log('');
    console.log('❌ Bad signs in browser console:');
    console.log('- AuthSessionMissingError: Auth session missing!');
    console.log('- Found existing session without reset tokens, signing out');
    console.log('- Creating temporary session with access token for password update');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

sendRealPasswordResetEmail().catch(console.error);
