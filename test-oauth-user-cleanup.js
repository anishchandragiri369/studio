const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testOAuthUserCleanup() {
  console.log('=== Testing OAuth User Cleanup ===\n');
  
  try {
    // Get the problematic Google OAuth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return;
    }
    
    const googleUsers = authUsers.users.filter(user => 
      user.app_metadata?.provider === 'google' || 
      user.user_metadata?.iss?.includes('accounts.google.com')
    );
    
    console.log(`Found ${googleUsers.length} Google OAuth users`);
    
    // Check each user and see if they should be cleaned up
    for (const user of googleUsers) {
      console.log(`\nGoogle User: ${user.email} (ID: ${user.id})`);
      
      // Check if they exist in user_rewards (our app database)
      const { data: rewardData, error: rewardError } = await supabase
        .from('user_rewards')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (rewardError && rewardError.code !== 'PGRST116') {
        console.log(`  ❌ Error checking rewards: ${rewardError.message}`);
        continue;
      }
      
      if (!rewardData) {
        console.log(`  ❌ NOT in app database - needs cleanup`);
        
        // Check if they have any orders (this would be bad)
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id);
        
        if (!ordersError && orders && orders.length > 0) {
          console.log(`     ⚠️  WARNING: Has ${orders.length} orders - cannot safely delete`);
          
          // In this case, we should create a user_rewards record instead
          console.log(`     Creating user_rewards record for this user...`);
          
          const { error: createError } = await supabase
            .from('user_rewards')
            .insert({
              user_id: user.id,
              points: 0,
              referral_code: `USER${user.id.substr(0, 8).toUpperCase()}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          
          if (createError) {
            console.log(`     ❌ Error creating user_rewards: ${createError.message}`);
          } else {
            console.log(`     ✅ Created user_rewards record`);
          }
        } else {
          console.log(`     ✅ No orders - safe to delete from Supabase Auth`);
          console.log(`     Deleting user from Supabase Auth...`);
          
          const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
          
          if (deleteError) {
            console.log(`     ❌ Error deleting user: ${deleteError.message}`);
          } else {
            console.log(`     ✅ User deleted successfully`);
          }
        }
      } else {
        console.log(`  ✅ EXISTS in app database - all good`);
      }
    }
    
    console.log('\n=== Cleanup Complete ===');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testOAuthUserCleanup();
