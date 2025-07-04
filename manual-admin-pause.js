require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function manuallyCreateAdminPausedSubscription() {
  console.log('🔧 Manually creating admin-paused subscription for testing...');
  
  try {
    // Get an active subscription
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
      console.log('⚠️  No active subscriptions found');
      return;
    }

    const subscription = activeSubscriptions[0];
    console.log(`📋 Found subscription: ${subscription.id}`);

    // Try a simple update without the problematic fields first
    console.log('🔄 Step 1: Update status only...');
    const { data: updateData, error: statusError } = await supabase
      .from('user_subscriptions')
      .update({ 
        status: 'admin_paused'
      })
      .eq('id', subscription.id)
      .select('id, status');

    if (statusError) {
      console.error('❌ Error updating status:', statusError);
      
      // Let's try to see if we can at least read the table structure
      console.log('🔍 Checking table permissions...');
      const { data: testSelect, error: selectError } = await supabase
        .from('user_subscriptions')
        .select('id, status')
        .eq('id', subscription.id)
        .single();
        
      if (selectError) {
        console.error('❌ Error reading subscription:', selectError);
      } else {
        console.log('✅ Can read subscription:', testSelect);
      }
      
      return;
    }

    console.log('✅ Status updated successfully:', updateData);

    // Now add the admin pause ID and other fields
    console.log('🔄 Step 2: Adding admin pause fields...');
    const adminPauseId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const { data: fullUpdateData, error: fullUpdateError } = await supabase
      .from('user_subscriptions')
      .update({
        admin_pause_id: adminPauseId,
        pause_date: now,
        pause_reason: 'Manual test pause',
        admin_pause_start: now,
        admin_pause_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: now
      })
      .eq('id', subscription.id)
      .select();

    if (fullUpdateError) {
      console.error('❌ Error with full update:', fullUpdateError);
    } else {
      console.log('✅ Full update successful:', fullUpdateData);

      // Create corresponding admin pause record
      const adminPauseRecord = {
        id: adminPauseId,
        pause_type: 'selected',
        affected_user_ids: [subscription.user_id],
        start_date: now,
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        reason: 'Manual test pause',
        admin_user_id: crypto.randomUUID(),
        status: 'active',
        affected_subscription_count: 1,
        created_at: now,
        updated_at: now
      };

      const { error: pauseRecordError } = await supabase
        .from('admin_subscription_pauses')
        .insert(adminPauseRecord);

      if (pauseRecordError) {
        console.error('❌ Error creating pause record:', pauseRecordError);
      } else {
        console.log('✅ Admin pause record created successfully');
        console.log('🎉 Test setup complete! Now you can test the reactivate endpoint.');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

manuallyCreateAdminPausedSubscription();
