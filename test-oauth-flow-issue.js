const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testOAuthFlowIssue() {
  console.log('=== Testing OAuth Flow Issue ===\n');
  
  try {
    // 1. Check if there are any Google OAuth users that shouldn't exist in the database
    console.log('1. Checking Supabase Auth users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return;
    }
    
    const googleUsers = authUsers.users.filter(user => 
      user.app_metadata?.provider === 'google' || 
      user.user_metadata?.iss?.includes('accounts.google.com')
    );
    
    console.log(`Found ${googleUsers.length} Google OAuth users in Supabase Auth`);
    
    // 2. Check which ones exist in our app database
    console.log('\n2. Checking which Google users exist in our app database...');
    
    for (const user of googleUsers) {
      console.log(`\nGoogle User: ${user.email} (ID: ${user.id})`);
      console.log(`Created: ${new Date(user.created_at).toISOString()}`);
      console.log(`Last sign in: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toISOString() : 'Never'}`);
      
      // Check if they exist in user_rewards (our app database)
      const { data: rewardData, error: rewardError } = await supabase
        .from('user_rewards')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (rewardError && rewardError.code !== 'PGRST116') {
        console.log(`  ❌ Error checking rewards: ${rewardError.message}`);
      } else if (rewardData) {
        console.log(`  ✅ EXISTS in app database`);
        console.log(`     Referral code: ${rewardData.referral_code || 'None'}`);
        console.log(`     Points: ${rewardData.points || 0}`);
      } else {
        console.log(`  ❌ NOT in app database - This is the issue!`);
        
        // Check if they have any orders
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id);
        
        if (!ordersError && orders && orders.length > 0) {
          console.log(`     ⚠️  WARNING: Has ${orders.length} orders but no rewards record!`);
        }
      }
    }
    
    // 3. Check sessionStorage simulation for sign-in vs sign-up
    console.log('\n3. Testing sessionStorage behavior...');
    console.log('When user clicks "Sign in with Google" on login page:');
    console.log('  - sessionStorage should set oauth-signin-attempt = "true"');
    console.log('  - If user not in DB, should sign out and redirect to signup');
    
    console.log('\nWhen user clicks "Continue with Google" on signup page:');
    console.log('  - sessionStorage should set oauth-signin-attempt = "false"');
    console.log('  - Should proceed with user setup if not in DB');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testOAuthFlowIssue();
