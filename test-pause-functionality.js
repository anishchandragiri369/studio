require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPauseEndpoint() {
  console.log('🧪 Testing pause endpoint functionality...');
  
  try {
    // First, get active subscriptions
    const { data: activeSubscriptions, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('status', 'active')
      .limit(1);

    if (fetchError) {
      console.error('❌ Error fetching subscriptions:', fetchError);
      return;
    }

    if (!activeSubscriptions || activeSubscriptions.length === 0) {
      console.log('⚠️  No active subscriptions found to pause');
      return;
    }

    const subscription = activeSubscriptions[0];
    console.log(`📋 Found active subscription: ${subscription.id} (User: ${subscription.user_id})`);

    // Test pause functionality locally
    const pauseData = {
      pauseType: 'selected',
      userIds: [subscription.user_id],
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      reason: 'Test pause',
      adminUserId: crypto.randomUUID() // Use a proper UUID for admin user
    };

    console.log('🔄 Attempting to pause subscription...');

    // Create admin pause record
    const adminPauseRecord = {
      id: crypto.randomUUID(),
      pause_type: pauseData.pauseType,
      affected_user_ids: pauseData.userIds,
      start_date: pauseData.startDate,
      end_date: pauseData.endDate,
      reason: pauseData.reason,
      admin_user_id: pauseData.adminUserId,
      status: 'active',
      affected_subscription_count: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: adminPauseError } = await supabase
      .from('admin_subscription_pauses')
      .insert(adminPauseRecord);

    if (adminPauseError) {
      console.error('❌ Error creating admin pause record:', adminPauseError);
      return;
    }

    console.log('✅ Admin pause record created');

    // Update subscription status
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'admin_paused',
        admin_pause_id: adminPauseRecord.id,
        pause_date: pauseData.startDate,
        pause_reason: `Admin pause: ${pauseData.reason}`,
        admin_pause_start: pauseData.startDate,
        admin_pause_end: pauseData.endDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('❌ Error updating subscription:', updateError);
      return;
    }

    console.log('✅ Subscription status updated to admin_paused');

    // Verify the update
    const { data: updatedSubscription, error: verifyError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('id', subscription.id)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError);
      return;
    }

    console.log('📋 Updated subscription:', {
      id: updatedSubscription.id,
      status: updatedSubscription.status,
      admin_pause_id: updatedSubscription.admin_pause_id,
      pause_date: updatedSubscription.pause_date,
      admin_pause_start: updatedSubscription.admin_pause_start,
      admin_pause_end: updatedSubscription.admin_pause_end
    });

    console.log('🎉 Pause test completed successfully!');

  } catch (error) {
    console.error('❌ Error in pause test:', error);
  }
}

testPauseEndpoint();
