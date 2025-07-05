require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupUserReferences(userId) {
  console.log(`🧹 Cleaning up references for user: ${userId}`);
  
  try {
    // 1. Check what references exist
    console.log('Step 1: Checking existing references...');
    
    // Check orders where user is referrer
    const { data: ordersAsReferrer, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('id, user_id, referrer_id, referral_code')
      .eq('referrer_id', userId);

    if (ordersError) {
      console.error('Error checking orders:', ordersError);
      return;
    }

    console.log(`Found ${ordersAsReferrer.length} orders where user is referrer`);

    // Check referral_rewards where user is referrer
    const { data: referralRewards, error: rewardsError } = await supabaseAdmin
      .from('referral_rewards')
      .select('id, referrer_id, referred_user_id')
      .eq('referrer_id', userId);

    if (rewardsError) {
      console.error('Error checking referral rewards:', rewardsError);
      return;
    }

    console.log(`Found ${referralRewards.length} referral rewards where user is referrer`);

    // Check user_rewards
    const { data: userRewards, error: userRewardsError } = await supabaseAdmin
      .from('user_rewards')
      .select('user_id, referral_code')
      .eq('user_id', userId);

    if (userRewardsError) {
      console.error('Error checking user rewards:', userRewardsError);
      return;
    }

    console.log(`Found user_rewards record: ${userRewards.length > 0 ? 'YES' : 'NO'}`);

    // 2. Update orders to remove referrer reference
    if (ordersAsReferrer.length > 0) {
      console.log('\nStep 2: Updating orders to remove referrer reference...');
      
      const { error: updateOrdersError } = await supabaseAdmin
        .from('orders')
        .update({ 
          referrer_id: null,
          // Keep referral_code for historical reference but remove the foreign key
        })
        .eq('referrer_id', userId);

      if (updateOrdersError) {
        console.error('Error updating orders:', updateOrdersError);
        return;
      }

      console.log(`✅ Updated ${ordersAsReferrer.length} orders`);
    }

    // 3. Delete referral_rewards records
    if (referralRewards.length > 0) {
      console.log('\nStep 3: Deleting referral rewards...');
      
      const { error: deleteRewardsError } = await supabaseAdmin
        .from('referral_rewards')
        .delete()
        .eq('referrer_id', userId);

      if (deleteRewardsError) {
        console.error('Error deleting referral rewards:', deleteRewardsError);
        return;
      }

      console.log(`✅ Deleted ${referralRewards.length} referral rewards`);
    }

    // 4. Delete user_rewards record
    if (userRewards.length > 0) {
      console.log('\nStep 4: Deleting user rewards...');
      
      const { error: deleteUserRewardsError } = await supabaseAdmin
        .from('user_rewards')
        .delete()
        .eq('user_id', userId);

      if (deleteUserRewardsError) {
        console.error('Error deleting user rewards:', deleteUserRewardsError);
        return;
      }

      console.log(`✅ Deleted user_rewards record`);
    }

    console.log('\n🎉 Cleanup complete! User can now be safely deleted from Supabase Auth.');
    console.log('\nTo delete the user from Supabase Auth:');
    console.log('1. Go to Supabase Dashboard > Authentication > Users');
    console.log(`2. Find user ${userId}`);
    console.log('3. Click delete - it should work now');

  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
}

// Usage: node cleanup-user-references.js
const userIdToCleanup = 'f482a298-0cc3-495a-aff7-c657ed645631';
cleanupUserReferences(userIdToCleanup);
