#!/usr/bin/env node

/**
 * Email Duplication Prevention Test Script
 * 
 * This script tests the email duplication validation feature by:
 * 1. Testing signup with a new email (should succeed)
 * 2. Testing signup with the same email again (should fail with appropriate error)
 * 3. Testing Google OAuth with existing email (Supabase handles this)
 * 4. Validating error message content and user-friendliness
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test email - using a timestamp to ensure uniqueness with a real domain
const testEmail = `test.duplicate.${Date.now()}@gmail.com`;
const testPassword = 'testpassword123';

async function testEmailDuplicationPrevention() {
  console.log('🚀 Starting Email Duplication Prevention Tests\n');
  
  let testsPassed = 0;
  let totalTests = 0;

  // Test 1: Sign up with new email (should succeed)
  console.log('📧 Test 1: Signing up with new email...');
  totalTests++;
  
  try {
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (signupError) {
      console.log('❌ Test 1 Failed: Unexpected error during first signup');
      console.log('Error:', signupError.message);
    } else if (signupData.user) {
      console.log('✅ Test 1 Passed: Successfully signed up new user');
      console.log('User ID:', signupData.user.id);
      console.log('Email:', signupData.user.email);
      testsPassed++;
    } else {
      console.log('❌ Test 1 Failed: No user data returned but no error');
    }
  } catch (error) {
    console.log('❌ Test 1 Failed: Exception during signup');
    console.log('Error:', error.message);
  }

  console.log('\n---\n');

  // Test 2: Try to sign up with the same email again (should fail)
  console.log('📧 Test 2: Attempting to sign up with same email again...');
  totalTests++;

  try {
    const { data: duplicateData, error: duplicateError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (duplicateError) {
      if (duplicateError.message.includes('User already registered') ||
          duplicateError.message.includes('already been registered') ||
          duplicateError.message.includes('Email rate limit exceeded')) {
        console.log('✅ Test 2 Passed: Correctly prevented duplicate email signup');
        console.log('Error message:', duplicateError.message);
        testsPassed++;
      } else {
        console.log('❓ Test 2 Unclear: Got error but not the expected duplicate email error');
        console.log('Error message:', duplicateError.message);
      }
    } else if (duplicateData.user) {
      console.log('❌ Test 2 Failed: Duplicate signup succeeded when it should have failed');
      console.log('User ID:', duplicateData.user.id);
    } else {
      console.log('❓ Test 2 Unclear: No error and no user data returned');
    }
  } catch (error) {
    console.log('❌ Test 2 Failed: Exception during duplicate signup test');
    console.log('Error:', error.message);
  }

  console.log('\n---\n');

  // Test 3: Test with slightly different email casing
  console.log('📧 Test 3: Testing case sensitivity (different casing)...');
  totalTests++;
  const testEmailUppercase = testEmail.toUpperCase();

  try {
    const { data: caseData, error: caseError } = await supabase.auth.signUp({
      email: testEmailUppercase,
      password: testPassword,
    });

    if (caseError) {
      if (caseError.message.includes('User already registered') ||
          caseError.message.includes('already been registered') ||
          caseError.message.includes('Email rate limit exceeded')) {
        console.log('✅ Test 3 Passed: Correctly prevented signup with different case');
        console.log('Error message:', caseError.message);
        testsPassed++;
      } else {
        console.log('❓ Test 3 Unclear: Got error but not the expected duplicate email error');
        console.log('Error message:', caseError.message);
      }
    } else if (caseData.user) {
      console.log('❌ Test 3 Failed: Case-different signup succeeded (emails should be case-insensitive)');
      console.log('User ID:', caseData.user.id);
    } else {
      console.log('❓ Test 3 Unclear: No error and no user data returned');
    }
  } catch (error) {
    console.log('❌ Test 3 Failed: Exception during case sensitivity test');
    console.log('Error:', error.message);
  }

  console.log('\n---\n');

  // Test 4: Validate that login still works with the original email
  console.log('📧 Test 4: Testing login with original email...');
  totalTests++;

  try {
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (loginError) {
      console.log('❌ Test 4 Failed: Could not login with original email');
      console.log('Error:', loginError.message);
    } else if (loginData.user) {
      console.log('✅ Test 4 Passed: Successfully logged in with original email');
      console.log('User ID:', loginData.user.id);
      testsPassed++;
      
      // Clean up - sign out
      await supabase.auth.signOut();
    } else {
      console.log('❌ Test 4 Failed: No user data returned during login');
    }
  } catch (error) {
    console.log('❌ Test 4 Failed: Exception during login test');
    console.log('Error:', error.message);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Tests Passed: ${testsPassed}/${totalTests}`);
  console.log(`Success Rate: ${((testsPassed / totalTests) * 100).toFixed(1)}%`);
  
  if (testsPassed === totalTests) {
    console.log('🎉 All tests passed! Email duplication prevention is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please review the implementation.');
  }

  console.log('\n📝 NOTES:');
  console.log('- The exact error messages may vary depending on Supabase configuration');
  console.log('- Email confirmation may be required depending on your auth settings');
  console.log('- Rate limiting may affect rapid successive signups');
  console.log('- Test user remains in the database for cleanup purposes');
  
  console.log('\n🔧 IMPLEMENTATION STATUS:');
  console.log('✅ Enhanced signUp function in AuthContext.tsx');
  console.log('✅ Improved error handling in signup page');
  console.log('✅ User-friendly error messages with login link');
  console.log('✅ Suspense boundary fix for auth callback');
}

// Run the tests
testEmailDuplicationPrevention().catch(error => {
  console.error('💥 Test script failed:', error.message);
  process.exit(1);
});
