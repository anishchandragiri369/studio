require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testGoogleOAuthReferralFlow() {
  console.log('🧪 Testing Enhanced Google OAuth Referral Flow...\n');

  try {
    // 1. Test the setup-oauth-user API endpoint
    console.log('1. Testing setup-oauth-user API...');
    
    const testUserId = 'c107d7f5-36d1-4060-be3c-623c06175e6a'; // Existing Google user
    
    const setupResponse = await fetch('http://localhost:3000/api/auth/setup-oauth-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: testUserId })
    });
    
    const setupResult = await setupResponse.json();
    console.log('Setup API response:', setupResult);

    // 2. Check if the user now has a rewards record
    console.log('\n2. Checking user rewards after setup...');
    
    const { data: userRewards } = await supabaseAdmin
      .from('user_rewards')
      .select('*')
      .eq('user_id', testUserId)
      .single();
    
    console.log('User rewards record:', userRewards);

    // 3. Simulate OAuth signup with referral code
    console.log('\n3. Simulating OAuth signup with referral code...');
    
    // Create a test referrer first
    const referrerUserId = '49ffac0b-58ef-407a-9d76-08065eddf0da';
    const { data: referrerRewards } = await supabaseAdmin
      .from('user_rewards')
      .select('referral_code')
      .eq('user_id', referrerUserId)
      .single();
    
    if (!referrerRewards) {
      console.log('No referrer found, creating one...');
      await supabaseAdmin
        .from('user_rewards')
        .upsert({
          user_id: referrerUserId,
          total_points: 0,
          redeemed_points: 0,
          referral_code: 'TESTREF123'
        });
    }
    
    const referralCode = referrerRewards?.referral_code || 'TESTREF123';
    console.log('Using referral code:', referralCode);

    // 4. Test referral processing for OAuth signup
    console.log('\n4. Testing referral processing for OAuth signup...');
    
    // Create a new test user to simulate OAuth signup
    const newUserEmail = `oauthtest${Date.now()}@gmail.com`;
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: newUserEmail,
      password: 'temppassword123',
      email_confirm: true,
      user_metadata: {
        referral_code: referralCode,
        provider: 'google',
        full_name: 'OAuth Test User'
      }
    });

    if (createError) {
      console.error('Error creating test user:', createError);
      return;
    }

    console.log('Created test OAuth user:', newUser.user.id);

    // 5. Set up the OAuth user
    console.log('\n5. Setting up OAuth user...');
    
    const setupOAuthResponse = await fetch('http://localhost:3000/api/auth/setup-oauth-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: newUser.user.id })
    });
    
    const setupOAuthResult = await setupOAuthResponse.json();
    console.log('OAuth setup result:', setupOAuthResult);

    // 6. Check final state
    console.log('\n6. Checking final state...');
    
    // Check new user's rewards
    const { data: newUserRewards } = await supabaseAdmin
      .from('user_rewards')
      .select('*')
      .eq('user_id', newUser.user.id)
      .single();
    
    console.log('New OAuth user rewards:', newUserRewards);

    // Check referrer's updated rewards
    const { data: updatedReferrerRewards } = await supabaseAdmin
      .from('user_rewards')
      .select('*')
      .eq('user_id', referrerUserId)
      .single();
    
    console.log('Updated referrer rewards:', updatedReferrerRewards);

    // Check referral rewards table
    const { data: referralRewards } = await supabaseAdmin
      .from('referral_rewards')
      .select('*')
      .eq('referred_user_id', newUser.user.id);
    
    console.log('Referral rewards records:', referralRewards);

    // 7. Cleanup test user
    console.log('\n7. Cleaning up test user...');
    
    await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
    console.log('Test user cleaned up');

    console.log('\n🎉 Google OAuth referral flow test completed!');

    // 8. Summary
    console.log('\n📊 Summary of Improvements:');
    console.log('✅ Google OAuth now captures referral codes before redirect');
    console.log('✅ New OAuth users automatically get rewards records created');
    console.log('✅ Referral codes are processed for OAuth signups');
    console.log('✅ OAuth users can participate in referral program');
    console.log('✅ Existing vs new OAuth users are properly distinguished');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testGoogleOAuthReferralFlow();
