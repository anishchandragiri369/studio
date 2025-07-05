require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCompleteOAuthRestrictionFlow() {
  console.log('🚀 TESTING COMPLETE OAUTH RESTRICTION FLOW');
  console.log('==========================================\n');
  
  try {
    // 1. Create a fresh OAuth user (simulating first-time Google sign-in)
    const testUserEmail = `completetest${Date.now()}@gmail.com`;
    const { data: newOAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: testUserEmail,
      email_confirm: true,
      user_metadata: {
        provider: 'google',
        full_name: 'Complete Test User',
        referral_code: 'TESTXV004U' // Simulating referral code from signup page
      }
    });

    if (createError) {
      console.error('❌ Error creating test user:', createError);
      return;
    }

    console.log('✅ Step 1: Simulated OAuth sign-in');
    console.log(`   User ID: ${newOAuthUser.user.id}`);
    console.log(`   Email: ${newOAuthUser.user.email}`);
    console.log(`   Referral Code in Metadata: ${newOAuthUser.user.user_metadata.referral_code}`);
    console.log(`   Created: ${newOAuthUser.user.created_at}\n`);

    // 2. Check user creation time (should be within 2 minutes for "new user" detection)
    const userCreated = new Date(newOAuthUser.user.created_at).getTime();
    const now = Date.now();
    const isNewUser = (now - userCreated) < 2 * 60 * 1000; // 2 minutes
    
    console.log('✅ Step 2: Checking new user detection logic');
    console.log(`   User created: ${new Date(userCreated).toISOString()}`);
    console.log(`   Current time: ${new Date(now).toISOString()}`);
    console.log(`   Time difference: ${Math.round((now - userCreated) / 1000)} seconds`);
    console.log(`   Is new user (< 2 min): ${isNewUser ? '✅ YES' : '❌ NO'}\n`);

    // 3. Test the rewards API check (what AuthContext does)
    console.log('✅ Step 3: Testing AuthContext signup completion check');
    
    const rewardsResponse = await fetch(`http://localhost:3000/api/rewards/user/${newOAuthUser.user.id}`);
    const rewardsResult = await rewardsResponse.json();
    
    console.log(`   API Success: ${rewardsResult.success}`);
    console.log(`   Has Data: ${rewardsResult.data ? 'YES' : 'NO'}`);
    
    if (!rewardsResult.success || !rewardsResult.data) {
      console.log('   ✅ EXPECTED: User needs to complete signup');
      console.log('   📋 AuthContext Action: Redirect to /signup?oauth=true');
    } else {
      console.log('   ❌ UNEXPECTED: User appears to have completed signup');
    }
    console.log('');

    // 4. Get referrer state before
    const { data: referrerBefore } = await supabaseAdmin
      .from('user_rewards')
      .select('*')
      .eq('referral_code', 'TESTXV004U')
      .single();
    
    console.log('✅ Step 4: Referrer state BEFORE signup completion');
    console.log(`   Referrer ID: ${referrerBefore.user_id}`);
    console.log(`   Total points: ${referrerBefore.total_points}`);
    console.log(`   Referrals count: ${referrerBefore.referrals_count}\n`);

    // 5. Simulate the setup-oauth-user API call (what happens on signup page)
    console.log('🔧 Step 5: Simulating OAuth user signup completion...');
    
    const setupResponse = await fetch('http://localhost:3000/api/auth/setup-oauth-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: newOAuthUser.user.id })
    });
    
    const setupResult = await setupResponse.json();
    console.log(`   Setup Success: ${setupResult.success ? '✅' : '❌'}`);
    console.log(`   Setup Message: ${setupResult.message}`);
    console.log(`   New Referral Code: ${setupResult.referralCode}`);
    console.log('');

    // 6. Check if referral reward was created
    const { data: referralRewards } = await supabaseAdmin
      .from('referral_rewards')
      .select('*')
      .eq('referred_user_id', newOAuthUser.user.id);
    
    console.log('✅ Step 6: Checking referral reward creation');
    if (referralRewards.length > 0) {
      const reward = referralRewards[0];
      console.log(`   Referral reward created: ✅ YES`);
      console.log(`   Reward points: ${reward.reward_points}`);
      console.log(`   Reward amount: ₹${reward.reward_amount}`);
      console.log(`   Status: ${reward.status}`);
    } else {
      console.log(`   Referral reward created: ❌ NO`);
    }
    console.log('');

    // 7. Check referrer state after
    const { data: referrerAfter } = await supabaseAdmin
      .from('user_rewards')
      .select('*')
      .eq('referral_code', 'TESTXV004U')
      .single();
    
    console.log('✅ Step 7: Referrer state AFTER signup completion');
    console.log(`   Referrer ID: ${referrerAfter.user_id}`);
    console.log(`   Total points: ${referrerAfter.total_points}`);
    console.log(`   Referrals count: ${referrerAfter.referrals_count}\n`);

    // 8. Test rewards API again (should now succeed)
    console.log('✅ Step 8: Testing signup completion check after setup');
    
    const rewardsResponse2 = await fetch(`http://localhost:3000/api/rewards/user/${newOAuthUser.user.id}`);
    const rewardsResult2 = await rewardsResponse2.json();
    
    console.log(`   API Success: ${rewardsResult2.success}`);
    console.log(`   Has Data: ${rewardsResult2.data ? 'YES' : 'NO'}`);
    
    if (rewardsResult2.success && rewardsResult2.data) {
      console.log('   ✅ EXPECTED: User has completed signup');
      console.log('   📋 AuthContext Action: Allow normal sign-in');
    } else {
      console.log('   ❌ UNEXPECTED: User still needs to complete signup');
    }
    console.log('');

    // 9. Final verification
    const rewardCreated = referralRewards.length > 0;
    const pointsIncreased = referrerAfter.total_points > referrerBefore.total_points;
    const referralsIncreased = referrerAfter.referrals_count > referrerBefore.referrals_count;
    const signupCompleted = rewardsResult2.success && rewardsResult2.data;
    
    console.log('🎯 COMPLETE OAUTH FLOW TEST SUMMARY');
    console.log('===================================');
    console.log(`   Initial restriction enforced: ${!rewardsResult.data ? '✅' : '❌'}`);
    console.log(`   Signup completion successful: ${setupResult.success ? '✅' : '❌'}`);
    console.log(`   Referral reward created: ${rewardCreated ? '✅' : '❌'}`);
    console.log(`   Referrer points increased: ${pointsIncreased ? '✅' : '❌'} (${referrerBefore.total_points} → ${referrerAfter.total_points})`);
    console.log(`   Referrer count increased: ${referralsIncreased ? '✅' : '❌'} (${referrerBefore.referrals_count} → ${referrerAfter.referrals_count})`);
    console.log(`   Post-signup access granted: ${signupCompleted ? '✅' : '❌'}`);
    
    const allTestsPassed = !rewardsResult.data && setupResult.success && rewardCreated && 
                          pointsIncreased && referralsIncreased && signupCompleted;
    
    console.log(`\n🏆 Overall Result: ${allTestsPassed ? '✅ ALL TESTS PASSED!' : '❌ Some tests failed'}\n`);

    if (allTestsPassed) {
      console.log('🎉 COMPLETE OAUTH FLOW WITH REFERRALS WORKING PERFECTLY!');
      console.log('   ✨ OAuth users must complete signup before signing in');
      console.log('   ✨ Referral codes work correctly for OAuth signups');
      console.log('   ✨ Referral rewards are created and processed');
      console.log('   ✨ Post-signup OAuth users can sign in normally');
    }

    // 10. Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await supabaseAdmin.auth.admin.deleteUser(newOAuthUser.user.id);
    console.log('✅ Test user deleted successfully');

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testCompleteOAuthRestrictionFlow();
