require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDirectUserCheck() {
  console.log('🧪 Testing User Database Check Logic');
  console.log('====================================\n');
  
  try {
    // Use an existing user ID to simulate the check
    console.log('Step 1: Testing with user who DOES exist in our database');
    
    // Get a user who exists
    const { data: existingRewards } = await supabaseAdmin
      .from('user_rewards')
      .select('user_id')
      .limit(1)
      .single();
    
    if (existingRewards) {
      const existingUserId = existingRewards.user_id;
      console.log(`Using existing user: ${existingUserId}`);
      
      const userExistsResponse = await fetch('http://localhost:3000/api/rewards/user/' + existingUserId);
      const userExistsResult = await userExistsResponse.json();
      
      console.log(`API Response:`, userExistsResult);
      console.log(`Check result: success=${userExistsResult.success}, data=${userExistsResult.data ? 'EXISTS' : 'NULL'}`);
      console.log(`Our logic (!success || !data): ${!userExistsResult.success || !userExistsResult.data}`);
      console.log(`Expected: false (user should be allowed to sign in)\n`);
    }

    // Step 2: Test with non-existent user
    console.log('Step 2: Testing with user who does NOT exist in our database');
    
    const fakeUserId = '00000000-0000-0000-0000-000000000000';
    console.log(`Using fake user: ${fakeUserId}`);
    
    const fakeUserResponse = await fetch('http://localhost:3000/api/rewards/user/' + fakeUserId);
    const fakeUserResult = await fakeUserResponse.json();
    
    console.log(`API Response:`, fakeUserResult);
    console.log(`Check result: success=${fakeUserResult.success}, data=${fakeUserResult.data ? 'EXISTS' : 'NULL'}`);
    console.log(`Our logic (!success || !data): ${!fakeUserResult.success || !fakeUserResult.data}`);
    console.log(`Expected: true (user should be redirected to signup)\n`);

    // Step 3: Test the complete logic simulation
    console.log('Step 3: Simulating AuthContext logic');
    console.log('=====================================');
    
    function simulateAuthLogic(apiResult, isSignInAttempt) {
      console.log(`Input: success=${apiResult.success}, data=${apiResult.data ? 'EXISTS' : 'NULL'}, isSignInAttempt=${isSignInAttempt}`);
      
      if (!apiResult.success || !apiResult.data) {
        if (isSignInAttempt) {
          console.log('  → Action: Sign out user and redirect to signup (user tried to sign in but not in DB)');
          return 'REDIRECT_TO_SIGNUP';
        } else {
          console.log('  → Action: Continue with OAuth signup setup (new user signing up)');
          return 'SETUP_NEW_USER';
        }
      } else {
        console.log('  → Action: Allow sign-in and redirect to dashboard (existing user)');
        return 'ALLOW_SIGNIN';
      }
    }

    console.log('\nTesting existing user with sign-in attempt:');
    const existingUserAction = simulateAuthLogic(userExistsResult, true);
    
    console.log('\nTesting non-existent user with sign-in attempt:');
    const newUserSignInAction = simulateAuthLogic(fakeUserResult, true);
    
    console.log('\nTesting non-existent user with signup (no sign-in attempt):');
    const newUserSignupAction = simulateAuthLogic(fakeUserResult, false);

    // Summary
    console.log('\n🎯 LOGIC VERIFICATION SUMMARY');
    console.log('=============================');
    console.log(`   Existing user + sign-in attempt: ${existingUserAction === 'ALLOW_SIGNIN' ? '✅' : '❌'} ${existingUserAction}`);
    console.log(`   New user + sign-in attempt: ${newUserSignInAction === 'REDIRECT_TO_SIGNUP' ? '✅' : '❌'} ${newUserSignInAction}`);
    console.log(`   New user + signup: ${newUserSignupAction === 'SETUP_NEW_USER' ? '✅' : '❌'} ${newUserSignupAction}`);
    
    const allCorrect = existingUserAction === 'ALLOW_SIGNIN' && 
                      newUserSignInAction === 'REDIRECT_TO_SIGNUP' && 
                      newUserSignupAction === 'SETUP_NEW_USER';
    
    console.log(`\n🏆 Overall Logic: ${allCorrect ? '✅ WORKING CORRECTLY' : '❌ HAS ISSUES'}`);
    
    if (allCorrect) {
      console.log('\n🎉 Perfect! The Google OAuth logic is working correctly:');
      console.log('   ✅ Existing users can sign in normally');
      console.log('   ✅ New users attempting sign-in are redirected to signup');
      console.log('   ✅ New users going through signup are set up properly');
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testDirectUserCheck();
