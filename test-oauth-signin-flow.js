require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testGoogleOAuthFlow() {
  console.log('🧪 Testing Google OAuth Sign-in Flow');
  console.log('=====================================\n');
  
  try {
    // 1. Create a test user (simulating Google OAuth) without our database records
    const testEmail = `oauthtest${Date.now()}@gmail.com`;
    console.log('Step 1: Creating Google OAuth user (without our database records)');
    
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: 'temppassword123',
      email_confirm: true,
      user_metadata: {
        provider: 'google',
        full_name: 'OAuth Test User'
      }
    });

    if (createError) {
      console.error('❌ Error creating user:', createError);
      return;
    }

    console.log(`✅ Created OAuth user: ${newUser.user.id}`);
    console.log(`   Email: ${newUser.user.email}\n`);

    // 2. Check if user exists in our database (should NOT exist initially)
    console.log('Step 2: Checking if user exists in our database');
    
    const userExistsResponse = await fetch('http://localhost:3000/api/rewards/user/' + newUser.user.id);
    const userExistsResult = await userExistsResponse.json();
    
    console.log(`✅ User exists in our DB: ${userExistsResult.success ? 'YES' : 'NO'}`);
    console.log('   Expected: NO (user should not exist in our DB initially)\n');

    // 3. Simulate the OAuth signup flow by calling setup-oauth-user
    console.log('Step 3: Simulating OAuth signup (setup-oauth-user API)');
    
    const setupResponse = await fetch('http://localhost:3000/api/auth/setup-oauth-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: newUser.user.id })
    });
    
    const setupResult = await setupResponse.json();
    console.log(`✅ Setup result: ${setupResult.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Generated referral code: ${setupResult.referralCode}\n`);

    // 4. Check if user now exists in our database (should exist after signup)
    console.log('Step 4: Checking if user exists in our database after signup');
    
    const userExistsAfterResponse = await fetch('http://localhost:3000/api/rewards/user/' + newUser.user.id);
    const userExistsAfterResult = await userExistsAfterResponse.json();
    
    console.log(`✅ User exists in our DB after signup: ${userExistsAfterResult.success ? 'YES' : 'NO'}`);
    console.log('   Expected: YES (user should exist after signup)\n');

    // 5. Summary
    console.log('🎯 FLOW VERIFICATION SUMMARY');
    console.log('============================');
    console.log(`   ✅ Step 1: OAuth user created successfully`);
    console.log(`   ${!userExistsResult.success ? '✅' : '❌'} Step 2: User initially not in DB (${!userExistsResult.success ? 'CORRECT' : 'INCORRECT'})`);
    console.log(`   ${setupResult.success ? '✅' : '❌'} Step 3: OAuth signup setup (${setupResult.success ? 'SUCCESS' : 'FAILED'})`);
    console.log(`   ${userExistsAfterResult.success ? '✅' : '❌'} Step 4: User in DB after signup (${userExistsAfterResult.success ? 'CORRECT' : 'INCORRECT'})`);
    
    const allStepsCorrect = !userExistsResult.success && setupResult.success && userExistsAfterResult.success;
    console.log(`\n🏆 Overall Flow: ${allStepsCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
    
    if (allStepsCorrect) {
      console.log('\n✨ Perfect! The Google OAuth flow works correctly:');
      console.log('   1. Google OAuth users are NOT in our database initially');
      console.log('   2. Users must complete signup to be added to our database');
      console.log('   3. Only then can they sign in successfully');
    } else {
      console.log('\n❌ Issues detected in the OAuth flow');
    }

    // 6. Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
    console.log('✅ Test user deleted');

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testGoogleOAuthFlow();
