require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testReferralReward() {
  console.log('🧪 Testing OAuth referral reward...');
  
  try {
    // 1. Create fresh test user with valid referral code
    const newUserEmail = `testoauth${Date.now()}@gmail.com`;
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: newUserEmail,
      password: 'temppassword123',
      email_confirm: true,
      user_metadata: {
        referral_code: 'TESTXV004U', // This referral code exists in the DB
        provider: 'google',
        full_name: 'Test OAuth User'
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return;
    }

    console.log('✅ Created fresh user:', newUser.user.id);
    console.log('   Referral code from metadata:', newUser.user.user_metadata.referral_code);

    // 2. Get referrer info before
    const { data: referrerBefore } = await supabaseAdmin
      .from('user_rewards')
      .select('*')
      .eq('referral_code', 'TESTXV004U')
      .single();
    
    console.log('✅ Referrer before:', {
      id: referrerBefore.user_id,
      points: referrerBefore.total_points,
      earned: referrerBefore.total_earned,
      referrals: referrerBefore.referrals_count
    });

    // 3. Call setup API
    console.log('\n🔧 Calling setup API...');
    
    const setupResponse = await fetch('http://localhost:3000/api/auth/setup-oauth-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: newUser.user.id })
    });
    
    const setupResult = await setupResponse.json();
    console.log('✅ Setup result:', setupResult);

    // 4. Check results
    console.log('\n📊 Checking results...');
    
    // Check new user rewards
    const { data: newUserRewards } = await supabaseAdmin
      .from('user_rewards')
      .select('*')
      .eq('user_id', newUser.user.id)
      .single();
    
    console.log('✅ New user rewards:', {
      id: newUserRewards.user_id,
      referralCode: newUserRewards.referral_code,
      points: newUserRewards.total_points
    });

    // Check referral rewards table
    const { data: referralRewards } = await supabaseAdmin
      .from('referral_rewards')
      .select('*')
      .eq('referred_user_id', newUser.user.id);
    
    console.log('✅ Referral rewards:', referralRewards.length > 0 ? {
      referrer: referralRewards[0].referrer_id,
      points: referralRewards[0].reward_points,
      amount: referralRewards[0].reward_amount,
      status: referralRewards[0].status
    } : 'None found');

    // Check referrer after
    const { data: referrerAfter } = await supabaseAdmin
      .from('user_rewards')
      .select('*')
      .eq('referral_code', 'TESTXV004U')
      .single();
    
    console.log('✅ Referrer after:', {
      id: referrerAfter.user_id,
      points: referrerAfter.total_points,
      earned: referrerAfter.total_earned,
      referrals: referrerAfter.referrals_count
    });

    // Check if points increased
    const pointsIncreased = referrerAfter.total_points > referrerBefore.total_points;
    const earnedIncreased = referrerAfter.total_earned > referrerBefore.total_earned;
    const referralsIncreased = referrerAfter.referrals_count > referrerBefore.referrals_count;
    
    console.log('\n✨ Result Summary:');
    console.log(`   Referral reward created: ${referralRewards.length > 0 ? '✅' : '❌'}`);
    console.log(`   Referrer points increased: ${pointsIncreased ? '✅' : '❌'}`);
    console.log(`   Referrer earned increased: ${earnedIncreased ? '✅' : '❌'}`);
    console.log(`   Referrer count increased: ${referralsIncreased ? '✅' : '❌'}`);

    // 5. Cleanup
    console.log('\n🧹 Cleaning up...');
    await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
    console.log('✅ Test user cleaned up');

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testReferralReward();
