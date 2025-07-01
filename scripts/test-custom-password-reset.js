#!/usr/bin/env node

/**
 * Test script for the complete custom password reset flow
 * Run this with: node scripts/test-custom-password-reset.js <email>
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const testEmail = process.argv[2];
if (!testEmail) {
  console.error('❌ Please provide an email address to test with:');
  console.error('   node scripts/test-custom-password-reset.js test@example.com');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testCustomPasswordReset() {
  console.log('🧪 Testing custom password reset flow...');
  console.log(`📧 Test email: ${testEmail}`);

  try {
    // Step 1: Check if user exists
    console.log('\n1️⃣ Checking if user exists...');
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('❌ Error fetching users:', userError);
      return;
    }

    const user = users.users.find(u => u.email === testEmail);
    if (!user) {
      console.log('❌ User not found. Please create a user with this email first.');
      return;
    }
    
    console.log('✅ User found:', user.id);

    // Step 2: Test sending reset email
    console.log('\n2️⃣ Testing send reset email API...');
    
    const sendResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/send-reset-password-email-smtp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
      }),
    });

    const sendResult = await sendResponse.json();
    
    if (!sendResponse.ok) {
      console.error('❌ Failed to send reset email:', sendResult);
      return;
    }

    console.log('✅ Reset email sent successfully');
    console.log('📧 Email details:', sendResult);

    // Step 3: Check if token was created in database
    console.log('\n3️⃣ Checking if reset token was created...');
    
    const { data: tokens, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('user_id', user.id)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1);

    if (tokenError) {
      console.error('❌ Error fetching tokens:', tokenError);
      return;
    }

    if (!tokens || tokens.length === 0) {
      console.log('❌ No reset token found in database');
      return;
    }

    const token = tokens[0];
    console.log('✅ Reset token found:', {
      id: token.id,
      token: token.token.substring(0, 10) + '...',
      expires_at: token.expires_at,
      used: token.used
    });

    // Step 4: Test password reset with token
    console.log('\n4️⃣ Testing password reset with token...');
    
    const newPassword = 'test-password-' + Date.now();
    const resetResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/reset-password-with-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token.token,
        newPassword: newPassword,
      }),
    });

    const resetResult = await resetResponse.json();
    
    if (!resetResponse.ok) {
      console.error('❌ Failed to reset password:', resetResult);
      return;
    }

    console.log('✅ Password reset successful');

    // Step 5: Verify token was marked as used
    console.log('\n5️⃣ Verifying token was marked as used...');
    
    const { data: usedTokens, error: usedTokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('id', token.id);

    if (usedTokenError) {
      console.error('❌ Error checking used token:', usedTokenError);
      return;
    }

    const usedToken = usedTokens[0];
    if (usedToken.used) {
      console.log('✅ Token marked as used correctly');
    } else {
      console.log('❌ Token not marked as used');
    }

    // Step 6: Test login with new password
    console.log('\n6️⃣ Testing login with new password...');
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: newPassword,
    });

    if (loginError) {
      console.error('❌ Failed to login with new password:', loginError);
      return;
    }

    console.log('✅ Login with new password successful');

    // Clean up: sign out
    await supabase.auth.signOut();

    console.log('\n🎉 All tests passed! Custom password reset flow is working correctly.');

    console.log('\n📋 Test Summary:');
    console.log('✅ User exists');
    console.log('✅ Reset email sent via SMTP');
    console.log('✅ Reset token created in database');
    console.log('✅ Password reset with token successful');
    console.log('✅ Token marked as used');
    console.log('✅ Login with new password works');

  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
  }
}

// Run the test
testCustomPasswordReset();
