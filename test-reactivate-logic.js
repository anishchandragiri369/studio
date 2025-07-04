require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testReactivateLogic() {
  console.log('🧪 Testing reactivate logic with existing admin pause record...');
  
  try {
    // First, get the existing admin pause record
    const { data: adminPauses, error: pausesError } = await supabase
      .from('admin_subscription_pauses')
      .select('*')
      .eq('status', 'active')
      .limit(1);

    if (pausesError) {
      console.error('❌ Error fetching admin pauses:', pausesError);
      return;
    }

    if (!adminPauses || adminPauses.length === 0) {
      console.log('⚠️  No active admin pause records found');
      return;
    }

    const adminPause = adminPauses[0];
    console.log(`📋 Found admin pause record: ${adminPause.id}`);
    console.log(`   - Reason: ${adminPause.reason}`);
    console.log(`   - Start: ${adminPause.start_date}`);
    console.log(`   - End: ${adminPause.end_date}`);
    console.log(`   - Affected user IDs: ${adminPause.affected_user_ids}`);

    // Now test the new reactivate logic - look for subscriptions with admin_pause_id
    const { data: subscriptionsWithPauseId, error: pauseIdError } = await supabase
      .from('user_subscriptions')
      .select('id, status, admin_pause_id, user_id')
      .eq('admin_pause_id', adminPause.id);

    console.log('\n🔍 Subscriptions with this admin_pause_id:', subscriptionsWithPauseId);

    // Also check for subscriptions with admin_paused status
    const { data: adminPausedSubs, error: statusError } = await supabase
      .from('user_subscriptions')
      .select('id, status, admin_pause_id, user_id')
      .eq('status', 'admin_paused');

    console.log('🔍 Subscriptions with admin_paused status:', adminPausedSubs);

    // Test the new query logic that looks for either condition
    const { data: combinedQuery, error: combinedError } = await supabase
      .from('user_subscriptions')
      .select('id, status, admin_pause_id, user_id')
      .or('status.eq.admin_paused,admin_pause_id.not.is.null');

    console.log('🔍 Combined query (admin_paused OR has admin_pause_id):', combinedQuery);

    // If we have affected user IDs, let's manually link a subscription to this pause
    if (adminPause.affected_user_ids && adminPause.affected_user_ids.length > 0) {
      const userId = adminPause.affected_user_ids[0];
      console.log(`\n🔗 Attempting to link subscription for user ${userId} to admin pause...`);

      // Find active subscription for this user
      const { data: userSubs, error: userSubsError } = await supabase
        .from('user_subscriptions')
        .select('id, status, admin_pause_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1);

      if (userSubsError) {
        console.error('❌ Error finding user subscriptions:', userSubsError);
      } else if (userSubs && userSubs.length > 0) {
        const subscription = userSubs[0];
        console.log(`📋 Found active subscription: ${subscription.id}`);

        // Try to link it to the admin pause
        const { error: linkError } = await supabase
          .from('user_subscriptions')
          .update({
            admin_pause_id: adminPause.id
          })
          .eq('id', subscription.id);

        if (linkError) {
          console.error('❌ Error linking subscription to admin pause:', linkError);
        } else {
          console.log('✅ Successfully linked subscription to admin pause');
          
          // Verify the link
          const { data: linkedSub } = await supabase
            .from('user_subscriptions')
            .select('id, status, admin_pause_id')
            .eq('id', subscription.id)
            .single();
            
          console.log('📋 Linked subscription:', linkedSub);
        }
      } else {
        console.log('⚠️  No active subscriptions found for this user');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testReactivateLogic();
