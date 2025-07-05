require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function finalComprehensiveTest() {
  console.log('🎯 FINAL COMPREHENSIVE OAUTH REFERRAL TEST');
  console.log('==========================================\n');
  
  try {
    // 1. Create fresh test user with valid referral code
    const newUserEmail = `finaltest${Date.now()}@gmail.com`;
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: newUserEmail,
      password: 'temppassword123',
      email_confirm: true,
      user_metadata: {
        referral_code: 'TESTXV004U',
        provider: 'google',
        full_name: 'Final Test User'
      }
    });

    if (createError) {
      console.error('❌ Error creating user:', createError);
      return;
    }

    console.log('✅ Step 1: Created test user');
    console.log(`   User ID: ${newUser.user.id}`);
    console.log(`   Email: ${newUser.user.email}`);
    console.log(`   Referral code in metadata: ${newUser.user.user_metadata.referral_code}\n`);

    // 2. Get referrer state before
    const { data: referrerBefore } = await supabaseAdmin
      .from('user_rewards')
      .select('*')
      .eq('referral_code', 'TESTXV004U')
      .single();
    
    console.log('✅ Step 2: Referrer state BEFORE OAuth setup');
    console.log(`   Referrer ID: ${referrerBefore.user_id}`);
    console.log(`   Total points: ${referrerBefore.total_points}`);
    console.log(`   Total earned: ${referrerBefore.total_earned}`);
    console.log(`   Referrals count: ${referrerBefore.referrals_count}\n`);

    // 3. Call OAuth setup API
    console.log('🔧 Step 3: Calling OAuth setup API...');
    
    const setupResponse = await fetch('http://localhost:3000/api/auth/setup-oauth-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: newUser.user.id })
    });
    
    const setupResult = await setupResponse.json();
    console.log('   API Response:', setupResult);
    console.log(`   Success: ${setupResult.success ? '✅' : '❌'}`);
    console.log(`   New user referral code: ${setupResult.referralCode}\n`);

    // 4. Verify new user setup
    const { data: newUserRewards } = await supabaseAdmin
      .from('user_rewards')
      .select('*')
      .eq('user_id', newUser.user.id)
      .single();
    
    console.log('✅ Step 4: New user rewards record');
    console.log(`   User ID: ${newUserRewards.user_id}`);
    console.log(`   Referral code: ${newUserRewards.referral_code}`);
    console.log(`   Points: ${newUserRewards.total_points}\n`);

    // 5. Check referral reward creation
    const { data: referralRewards } = await supabaseAdmin
      .from('referral_rewards')
      .select('*')
      .eq('referred_user_id', newUser.user.id);
    
    console.log('✅ Step 5: Referral reward records');
    if (referralRewards.length > 0) {
      const reward = referralRewards[0];
      console.log(`   Reward ID: ${reward.id}`);
      console.log(`   Referrer ID: ${reward.referrer_id}`);
      console.log(`   Referred user ID: ${reward.referred_user_id}`);
      console.log(`   Referral code: ${reward.referral_code}`);
      console.log(`   Points: ${reward.reward_points}`);
      console.log(`   Amount: ₹${reward.reward_amount}`);
      console.log(`   Status: ${reward.status}`);
      console.log(`   Order ID: ${reward.order_id || 'null (OAuth signup)'}`);
    } else {
      console.log('   ❌ No referral reward found');
    }
    console.log('');

    // 6. Check referrer state after
    const { data: referrerAfter } = await supabaseAdmin
      .from('user_rewards')
      .select('*')
      .eq('referral_code', 'TESTXV004U')
      .single();
    
    console.log('✅ Step 6: Referrer state AFTER OAuth setup');
    console.log(`   Referrer ID: ${referrerAfter.user_id}`);
    console.log(`   Total points: ${referrerAfter.total_points}`);
    console.log(`   Total earned: ${referrerAfter.total_earned}`);
    console.log(`   Referrals count: ${referrerAfter.referrals_count}\n`);

    // 7. Check reward transaction
    const { data: transactions } = await supabaseAdmin
      .from('reward_transactions')
      .select('*')
      .eq('user_id', referrerBefore.user_id)
      .order('created_at', { ascending: false })
      .limit(1);
    
    console.log('✅ Step 7: Latest reward transaction');
    if (transactions.length > 0) {
      const transaction = transactions[0];
      console.log(`   Transaction ID: ${transaction.id}`);
      console.log(`   User ID: ${transaction.user_id}`);
      console.log(`   Type: ${transaction.type}`);
      console.log(`   Points: ${transaction.points}`);
      console.log(`   Amount: ₹${transaction.amount}`);
      console.log(`   Description: ${transaction.description}`);
      console.log(`   Order ID: ${transaction.order_id || 'null (OAuth signup)'}`);
      console.log(`   Referral ID: ${transaction.referral_id}`);
    } else {
      console.log('   ❌ No transactions found');
    }
    console.log('');

    // 8. Verification summary
    const pointsIncreased = referrerAfter.total_points > referrerBefore.total_points;
    const earnedIncreased = referrerAfter.total_earned > referrerBefore.total_earned;
    const referralsIncreased = referrerAfter.referrals_count > referrerBefore.referrals_count;
    const rewardCreated = referralRewards.length > 0;
    const transactionCreated = transactions.length > 0;
    
    console.log('🎯 FINAL VERIFICATION SUMMARY');
    console.log('=============================');
    console.log(`   OAuth user setup: ${setupResult.success ? '✅' : '❌'}`);
    console.log(`   User rewards record created: ${newUserRewards ? '✅' : '❌'}`);
    console.log(`   Referral reward record created: ${rewardCreated ? '✅' : '❌'}`);
    console.log(`   Referrer points increased: ${pointsIncreased ? '✅' : '❌'} (${referrerBefore.total_points} → ${referrerAfter.total_points})`);
    console.log(`   Referrer earned increased: ${earnedIncreased ? '✅' : '❌'} (₹${referrerBefore.total_earned} → ₹${referrerAfter.total_earned})`);
    console.log(`   Referrer count increased: ${referralsIncreased ? '✅' : '❌'} (${referrerBefore.referrals_count} → ${referrerAfter.referrals_count})`);
    console.log(`   Reward transaction created: ${transactionCreated ? '✅' : '❌'}`);
    
    const allTestsPassed = setupResult.success && newUserRewards && rewardCreated && 
                          pointsIncreased && earnedIncreased && referralsIncreased && transactionCreated;
    
    console.log(`\n🏆 Overall Result: ${allTestsPassed ? '✅ ALL TESTS PASSED!' : '❌ Some tests failed'}\n`);

    // 9. Cleanup
    console.log('🧹 Step 9: Cleaning up test data...');
    await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
    console.log('✅ Test user deleted successfully');

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

finalComprehensiveTest();
