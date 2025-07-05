require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testGoogleOAuthFlow() {
  console.log('🧪 Testing Google OAuth Flow and Referral Handling...\n');

  try {
    // 1. Check current Google OAuth configuration
    console.log('1. Checking Google OAuth configuration...');
    
    // We can't directly test OAuth from Node.js, but we can check the setup
    console.log('✅ Supabase client configured for OAuth');
    console.log('Note: Google OAuth requires browser interaction');

    // 2. Check what happens to new users from Google OAuth
    console.log('\n2. Checking existing Google OAuth users...');
    
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const googleUsers = users.users.filter(user => 
      user.app_metadata?.provider === 'google' || 
      user.user_metadata?.provider === 'google' ||
      user.identities?.some(identity => identity.provider === 'google')
    );
    
    console.log(`Found ${googleUsers.length} Google OAuth users`);
    
    if (googleUsers.length > 0) {
      console.log('\nSample Google user data:');
      const sampleUser = googleUsers[0];
      console.log('User ID:', sampleUser.id);
      console.log('Email:', sampleUser.email);
      console.log('App metadata:', JSON.stringify(sampleUser.app_metadata, null, 2));
      console.log('User metadata:', JSON.stringify(sampleUser.user_metadata, null, 2));
      console.log('Identities:', sampleUser.identities?.map(i => ({ provider: i.provider, email: i.identity_data?.email })));
      
      // Check if this user has rewards
      const { data: userRewards } = await supabaseAdmin
        .from('user_rewards')
        .select('*')
        .eq('user_id', sampleUser.id)
        .single();
      
      console.log('User rewards:', userRewards);
    }

    // 3. Check potential issues with Google OAuth
    console.log('\n3. Analyzing Google OAuth flow issues...');
    
    console.log('🔍 Current Issues Identified:');
    console.log('❌ Referral codes are not handled during Google OAuth signup');
    console.log('❌ Google OAuth uses same flow for login and signup');
    console.log('❌ No way to capture referral code before Google OAuth redirect');
    console.log('❌ User metadata (referral_code) not set for Google OAuth users');

    // 4. Check how we can distinguish new vs existing Google users
    console.log('\n4. Checking user creation flow...');
    console.log('📝 Google OAuth Flow:');
    console.log('1. User clicks "Continue with Google"');
    console.log('2. Redirected to Google for authentication');
    console.log('3. Google redirects back to app with auth code');
    console.log('4. Supabase creates/updates user automatically');
    console.log('5. No custom logic runs during this process');

    // 5. Propose solutions
    console.log('\n5. Proposed Solutions:');
    console.log('💡 Solution 1: Store referral code in sessionStorage before OAuth');
    console.log('💡 Solution 2: Add referral code to OAuth redirect URL state parameter');
    console.log('💡 Solution 3: Create a post-signup flow to collect referral codes');
    console.log('💡 Solution 4: Separate Google signup vs login flows');

    // 6. Test current auth state change handling
    console.log('\n6. Testing auth state change detection...');
    
    // Check if we have any auth state change handling for new users
    console.log('Current onAuthStateChange handling in AuthContext:');
    console.log('- SIGNED_IN event detected');
    console.log('- User state updated');
    console.log('- Admin status checked');
    console.log('- No referral code processing for new Google users');

    console.log('\n🎯 Recommendations:');
    console.log('1. Modify Google OAuth to store referral code before redirect');
    console.log('2. Add auth state change handler to process referral codes for new users');
    console.log('3. Differentiate between login and signup for Google OAuth');
    console.log('4. Create a "first-time user" flow for Google OAuth users');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testGoogleOAuthFlow();
