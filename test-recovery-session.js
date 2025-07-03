const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('=== Test Recovery Session Flow ===');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRecoveryFlow() {
  try {
    console.log('\n--- Step 1: Send password reset email ---');
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(
      'anishchandragiri@gmail.com',
      {
        redirectTo: 'http://localhost:9002/reset-password'
      }
    );
    
    if (error) {
      console.log('❌ Failed to send reset email:', error.message);
      return;
    }
    
    console.log('✅ Password reset email sent successfully');
    console.log('📧 Check your email and click the reset link');
    console.log('📋 The link should redirect to: http://localhost:9002/reset-password');
    console.log('');
    console.log('🔗 When you click the link, Supabase will:');
    console.log('   1. Verify the token');
    console.log('   2. Create a recovery session');
    console.log('   3. Redirect to /reset-password with tokens in the URL hash');
    console.log('');
    console.log('⚠️  The key issue: Our frontend needs to properly handle the recovery session');
    console.log('    that Supabase creates from the email link');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the test
testRecoveryFlow().then(() => {
  console.log('\n=== Test Complete ===');
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
