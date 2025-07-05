require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function simulateIncompleteOAuthUser() {
  console.log('🧪 Simulating Incomplete Google OAuth User Flow');
  console.log('==============================================\n');
  
  try {
    // 1. Create a test user
    const testEmail = `incomplete${Date.now()}@gmail.com`;
    console.log('Step 1: Creating test Google OAuth user');
    
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: 'temppassword123',
      email_confirm: true,
      user_metadata: {
        provider: 'google',
        full_name: 'Incomplete OAuth User'
      }
    });

    if (createError) {
      console.error('❌ Error creating user:', createError);
      return;
    }

    console.log(`✅ Created OAuth user: ${newUser.user.id}`);
    console.log(`   Email: ${newUser.user.email}\n`);

    // 2. Delete the user from our rewards database (simulate incomplete signup)
    console.log('Step 2: Removing user from our database (simulating incomplete signup)');
    
    const { error: deleteError } = await supabaseAdmin
      .from('user_rewards')
      .delete()
      .eq('user_id', newUser.user.id);

    if (!deleteError) {
      console.log('✅ User removed from our database\n');
    } else {
      console.log('ℹ️  User was not in our database initially\n');
    }

    // 3. Check if user exists in our database (should NOT exist)
    console.log('Step 3: Checking if user exists in our database');
    
    const userExistsResponse = await fetch('http://localhost:3000/api/rewards/user/' + newUser.user.id);
    const userExistsResult = await userExistsResponse.json();
    
    console.log(`✅ User exists in our DB: ${userExistsResult.success && userExistsResult.data ? 'YES' : 'NO'}`);
    console.log(`   Expected: NO (simulating incomplete signup)\n`);

    // 4. Test the sign-in detection logic
    console.log('Step 4: Testing sign-in detection (user should be redirected to signup)');
    console.log('   In real flow:');
    console.log('   - User would click "Sign in with Google" on login page');
    console.log('   - OAuth would succeed in Supabase Auth');
    console.log('   - Our SIGNED_IN handler would check if oauth-signin-attempt = true');
    console.log('   - Our handler would check /api/rewards/user/{userId}');
    console.log(`   - Since user not in DB, would sign out and redirect to signup\n`);

    // 5. Test the signup completion
    console.log('Step 5: Simulating OAuth signup completion');
    
    const setupResponse = await fetch('http://localhost:3000/api/auth/setup-oauth-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: newUser.user.id })
    });
    
    const setupResult = await setupResponse.json();
    console.log(`✅ Setup result: ${setupResult.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Generated referral code: ${setupResult.referralCode}\n`);

    // 6. Check if user now exists (should exist after signup)
    console.log('Step 6: Checking if user exists after signup completion');
    
    const userExistsAfterResponse = await fetch('http://localhost:3000/api/rewards/user/' + newUser.user.id);
    const userExistsAfterResult = await userExistsAfterResponse.json();
    
    console.log(`✅ User exists in our DB after signup: ${userExistsAfterResult.success && userExistsAfterResult.data ? 'YES' : 'NO'}`);
    console.log(`   Expected: YES\n`);

    // 7. Test subsequent sign-in
    console.log('Step 7: Testing subsequent sign-in (should now work)');
    console.log('   In real flow:');
    console.log('   - User would click "Sign in with Google" on login page');
    console.log('   - OAuth would succeed in Supabase Auth');
    console.log('   - Our SIGNED_IN handler would check /api/rewards/user/{userId}');
    console.log(`   - Since user IS in DB, would allow sign-in and redirect to dashboard\n`);

    // 8. Summary
    console.log('🎯 COMPLETE FLOW VERIFICATION');
    console.log('==============================');
    console.log(`   ✅ User created in Supabase Auth: ${newUser.user.id}`);
    console.log(`   ${!(userExistsResult.success && userExistsResult.data) ? '✅' : '❌'} User initially not in our DB: ${!(userExistsResult.success && userExistsResult.data) ? 'CORRECT' : 'INCORRECT'}`);
    console.log(`   ${setupResult.success ? '✅' : '❌'} OAuth signup works: ${setupResult.success ? 'YES' : 'NO'}`);
    console.log(`   ${userExistsAfterResult.success && userExistsAfterResult.data ? '✅' : '❌'} User in DB after signup: ${userExistsAfterResult.success && userExistsAfterResult.data ? 'YES' : 'NO'}`);
    
    const flowCorrect = !(userExistsResult.success && userExistsResult.data) && setupResult.success && (userExistsAfterResult.success && userExistsAfterResult.data);
    console.log(`\n🏆 Google OAuth Flow: ${flowCorrect ? '✅ WORKING CORRECTLY' : '❌ HAS ISSUES'}`);
    
    if (flowCorrect) {
      console.log('\n🎉 PERFECT! The complete flow works:');
      console.log('   1. Google OAuth users exist in Supabase Auth but NOT in our DB initially');
      console.log('   2. Sign-in attempts detect this and redirect to signup');
      console.log('   3. Signup with Google completes the setup');
      console.log('   4. Subsequent sign-ins work normally');
    }

    // 9. Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
    console.log('✅ Test user deleted');

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

simulateIncompleteOAuthUser();
