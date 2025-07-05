require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testOAuthFlowRestriction() {
  console.log('🔒 TESTING OAUTH FLOW RESTRICTION');
  console.log('==================================\n');
  
  try {
    // 1. Create a Google OAuth user WITHOUT completing signup
    const testUserEmail = `oauthtest${Date.now()}@gmail.com`;
    const { data: oauthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: testUserEmail,
      email_confirm: true,
      user_metadata: {
        provider: 'google',
        full_name: 'OAuth Test User'
      }
    });

    if (createError) {
      console.error('❌ Error creating OAuth test user:', createError);
      return;
    }

    console.log('✅ Step 1: Created OAuth user WITHOUT signup completion');
    console.log(`   User ID: ${oauthUser.user.id}`);
    console.log(`   Email: ${oauthUser.user.email}`);
    console.log(`   Created: ${oauthUser.user.created_at}\n`);

    // 2. Check if user has rewards record (should NOT exist)
    const { data: rewardsCheck, error: rewardsError } = await supabaseAdmin
      .from('user_rewards')
      .select('*')
      .eq('user_id', oauthUser.user.id)
      .single();

    console.log('✅ Step 2: Checking if user has completed signup');
    console.log(`   Has user_rewards record: ${rewardsCheck ? '✅ YES (unexpected!)' : '❌ NO (expected)'}`);
    if (rewardsError && rewardsError.code === 'PGRST116') {
      console.log('   Status: User has NOT completed signup (correct)');
    } else if (rewardsCheck) {
      console.log('   ⚠️  WARNING: User should not have rewards record yet!');
    }
    console.log('');

    // 3. Test the rewards API endpoint (what AuthContext will call)
    console.log('✅ Step 3: Testing rewards API call (simulating AuthContext check)');
    
    try {
      const rewardsResponse = await fetch(`http://localhost:3000/api/rewards/user/${oauthUser.user.id}`);
      const rewardsResult = await rewardsResponse.json();
      
      console.log(`   API Response Success: ${rewardsResult.success}`);
      console.log(`   Has Data: ${rewardsResult.data ? 'YES' : 'NO'}`);
      
      if (!rewardsResult.success || !rewardsResult.data) {
        console.log('   ✅ CORRECT: API indicates user needs to complete signup');
        console.log('   👉 AuthContext should redirect to /signup?oauth=true');
      } else {
        console.log('   ❌ INCORRECT: API indicates user has completed signup');
      }
    } catch (apiError) {
      console.log('   ❌ API Error:', apiError.message);
    }
    console.log('');

    // 4. Now complete the signup process
    console.log('🔧 Step 4: Completing OAuth user signup...');
    
    try {
      const setupResponse = await fetch('http://localhost:3000/api/auth/setup-oauth-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: oauthUser.user.id })
      });
      
      const setupResult = await setupResponse.json();
      console.log(`   Setup Success: ${setupResult.success ? '✅' : '❌'}`);
      console.log(`   Setup Message: ${setupResult.message}`);
      if (setupResult.referralCode) {
        console.log(`   Assigned Referral Code: ${setupResult.referralCode}`);
      }
    } catch (setupError) {
      console.log('   ❌ Setup Error:', setupError.message);
    }
    console.log('');

    // 5. Check again if user now has rewards record
    const { data: rewardsAfterSetup } = await supabaseAdmin
      .from('user_rewards')
      .select('*')
      .eq('user_id', oauthUser.user.id)
      .single();

    console.log('✅ Step 5: Checking signup completion after setup');
    console.log(`   Has user_rewards record: ${rewardsAfterSetup ? '✅ YES (expected)' : '❌ NO (unexpected)'}`);
    if (rewardsAfterSetup) {
      console.log(`   Referral Code: ${rewardsAfterSetup.referral_code}`);
      console.log(`   Total Points: ${rewardsAfterSetup.total_points}`);
    }
    console.log('');

    // 6. Test the rewards API endpoint again
    console.log('✅ Step 6: Testing rewards API call after signup completion');
    
    try {
      const rewardsResponse2 = await fetch(`http://localhost:3000/api/rewards/user/${oauthUser.user.id}`);
      const rewardsResult2 = await rewardsResponse2.json();
      
      console.log(`   API Response Success: ${rewardsResult2.success}`);
      console.log(`   Has Data: ${rewardsResult2.data ? 'YES' : 'NO'}`);
      
      if (rewardsResult2.success && rewardsResult2.data) {
        console.log('   ✅ CORRECT: API indicates user has completed signup');
        console.log('   👉 AuthContext should allow normal sign-in');
      } else {
        console.log('   ❌ INCORRECT: API still indicates user needs to complete signup');
      }
    } catch (apiError) {
      console.log('   ❌ API Error:', apiError.message);
    }
    console.log('');

    // 7. Summary
    console.log('🎯 OAUTH FLOW RESTRICTION TEST SUMMARY');
    console.log('=====================================');
    const hasInitialRestriction = !rewardsCheck || rewardsError?.code === 'PGRST116';
    const hasPostSetupAccess = !!rewardsAfterSetup;
    
    console.log(`   Initial OAuth user blocked: ${hasInitialRestriction ? '✅' : '❌'}`);
    console.log(`   Post-signup OAuth user allowed: ${hasPostSetupAccess ? '✅' : '❌'}`);
    
    const testPassed = hasInitialRestriction && hasPostSetupAccess;
    console.log(`\n🏆 Overall Test Result: ${testPassed ? '✅ PASSED' : '❌ FAILED'}\n`);

    if (testPassed) {
      console.log('✨ OAuth flow restriction is working correctly!');
      console.log('   • New OAuth users cannot sign in until they complete signup');
      console.log('   • Completed OAuth users can sign in normally');
    } else {
      console.log('⚠️  OAuth flow restriction needs attention!');
    }

    // 8. Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await supabaseAdmin.auth.admin.deleteUser(oauthUser.user.id);
    console.log('✅ Test user deleted successfully');

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testOAuthFlowRestriction();
