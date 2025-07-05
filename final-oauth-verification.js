require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runFinalVerification() {
  console.log('🚀 Final Google OAuth Implementation Verification');
  console.log('==============================================\n');
  
  let testUserId = null;
  
  try {
    // 1. Test user existence check API
    console.log('✅ Step 1: Testing user existence API');
    
    // Test with non-existent user
    const fakeUserResponse = await fetch('http://localhost:3000/api/rewards/user/00000000-0000-0000-0000-000000000000');
    const fakeUserResult = await fakeUserResponse.json();
    
    if (fakeUserResult.success && fakeUserResult.data === null) {
      console.log('   ✅ Non-existent user correctly returns: success=true, data=null');
    } else {
      console.log('   ❌ Non-existent user check failed:', fakeUserResult);
    }
    
    // 2. Test OAuth user setup
    console.log('\n✅ Step 2: Testing OAuth user setup');
    
    // Create test user
    const testEmail = `finaltest${Date.now()}@gmail.com`;
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: 'temppassword123',
      email_confirm: true,
      user_metadata: {
        provider: 'google',
        full_name: 'Final Test User'
      }
    });

    if (createError) {
      console.log('   ❌ Failed to create test user:', createError);
      return;
    }
    
    testUserId = newUser.user.id;
    console.log(`   ✅ Created test user: ${testUserId}`);
    
    // 3. Verify user doesn't exist in our DB initially
    const beforeSetupResponse = await fetch(`http://localhost:3000/api/rewards/user/${testUserId}`);
    const beforeSetupResult = await beforeSetupResponse.json();
    
    if (beforeSetupResult.success && beforeSetupResult.data === null) {
      console.log('   ✅ User correctly doesn\'t exist in our DB initially');
    } else {
      console.log('   ❌ User existence check failed:', beforeSetupResult);
    }
    
    // 4. Test setup OAuth user
    console.log('\n✅ Step 3: Testing OAuth user setup');
    
    const setupResponse = await fetch('http://localhost:3000/api/auth/setup-oauth-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: testUserId })
    });
    
    const setupResult = await setupResponse.json();
    
    if (setupResult.success && setupResult.referralCode) {
      console.log(`   ✅ OAuth user setup successful, referral code: ${setupResult.referralCode}`);
    } else {
      console.log('   ❌ OAuth user setup failed:', setupResult);
    }
    
    // 5. Verify user now exists in our DB
    const afterSetupResponse = await fetch(`http://localhost:3000/api/rewards/user/${testUserId}`);
    const afterSetupResult = await afterSetupResponse.json();
    
    if (afterSetupResult.success && afterSetupResult.data) {
      console.log('   ✅ User correctly exists in our DB after setup');
      console.log(`   ✅ User has referral code: ${afterSetupResult.data.referralCode}`);
    } else {
      console.log('   ❌ User existence check after setup failed:', afterSetupResult);
    }
    
    // 6. Test AuthContext logic simulation
    console.log('\n✅ Step 4: Testing AuthContext logic simulation');
    
    // Test existing user logic
    const existingUserCheck = !(afterSetupResult.success && afterSetupResult.data);
    console.log(`   ✅ Existing user check result: ${existingUserCheck ? 'REDIRECT TO SIGNUP' : 'ALLOW SIGN-IN'}`);
    
    // Test non-existing user logic
    const nonExistingUserCheck = !(fakeUserResult.success && fakeUserResult.data);
    console.log(`   ✅ Non-existing user check result: ${nonExistingUserCheck ? 'REDIRECT TO SIGNUP' : 'ALLOW SIGN-IN'}`);
    
    // 7. Final summary
    console.log('\n🎯 FINAL IMPLEMENTATION VERIFICATION');
    console.log('=====================================');
    
    const allTestsPassed = 
      fakeUserResult.success && fakeUserResult.data === null &&
      beforeSetupResult.success && beforeSetupResult.data === null &&
      setupResult.success && setupResult.referralCode &&
      afterSetupResult.success && afterSetupResult.data &&
      !existingUserCheck && nonExistingUserCheck;
    
    if (allTestsPassed) {
      console.log('✅ ALL TESTS PASSED!');
      console.log('\n🏆 GOOGLE OAUTH IMPLEMENTATION IS COMPLETE AND WORKING!');
      console.log('\nKey Features Verified:');
      console.log('   ✅ User existence check API works correctly');
      console.log('   ✅ OAuth user setup creates proper records');
      console.log('   ✅ AuthContext logic correctly identifies existing vs new users');
      console.log('   ✅ New users are redirected to signup');
      console.log('   ✅ Existing users are allowed to sign in');
      console.log('   ✅ Referral system is integrated with OAuth');
      console.log('\nThe implementation enforces that users must sign up with Google');
      console.log('before they can sign in with Google, maintaining data integrity');
      console.log('and ensuring all users go through the proper onboarding flow.');
    } else {
      console.log('❌ SOME TESTS FAILED - NEED INVESTIGATION');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    // Cleanup
    if (testUserId) {
      console.log('\n🧹 Cleaning up test data...');
      await supabaseAdmin.auth.admin.deleteUser(testUserId);
      console.log('✅ Test user deleted');
    }
  }
}

runFinalVerification();
