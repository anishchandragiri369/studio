require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function freshOAuthTest() {
  console.log('🧪 Fresh OAuth referral test...');
  
  try {
    // 1. Create fresh test user with referral code
    const newUserEmail = `freshoauth${Date.now()}@gmail.com`;
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: newUserEmail,
      password: 'temppassword123',
      email_confirm: true,
      user_metadata: {
        referral_code: 'TESTXV004U',
        provider: 'google',
        full_name: 'Fresh OAuth Test User'
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return;
    }

    console.log('Created fresh user:', newUser.user.id);
    console.log('User metadata:', newUser.user.user_metadata);

    // 2. Call setup API (no existing rewards record)
    console.log('\n2. Calling setup API...');
    
    const setupResponse = await fetch('http://localhost:3000/api/auth/setup-oauth-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: newUser.user.id })
    });
    
    const setupResult = await setupResponse.json();
    console.log('Setup result:', setupResult);

    // 3. Check results
    console.log('\n3. Checking results...');
    
    // Check user rewards
    const { data: userRewards } = await supabaseAdmin
      .from('user_rewards')
      .select('*')
      .eq('user_id', newUser.user.id)
      .single();
    
    console.log('User rewards:', userRewards);

    // Check referral rewards
    const { data: referralRewards } = await supabaseAdmin
      .from('referral_rewards')
      .select('*')
      .eq('referred_user_id', newUser.user.id);
    
    console.log('Referral rewards:', referralRewards);

    // 4. Cleanup
    console.log('\n4. Cleaning up...');
    await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
    console.log('User cleaned up');

  } catch (error) {
    console.error('Test error:', error);
  }
}

freshOAuthTest();
