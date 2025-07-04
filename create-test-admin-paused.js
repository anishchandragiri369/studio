require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function matchSubscriptionToExistingPause() {
  console.log('🔄 Matching a subscription to the existing admin pause record...');
  
  try {
    // Get the existing admin pause record
    const { data: adminPauses, error: pauseError } = await supabase
      .from('admin_subscription_pauses')
      .select('*')
      .eq('status', 'active')
      .limit(1);

    if (pauseError || !adminPauses || adminPauses.length === 0) {
      console.error('❌ No active admin pause records found:', pauseError);
      return;
    }

    const adminPause = adminPauses[0];
    console.log('📋 Found admin pause record:', {
      id: adminPause.id,
      pause_type: adminPause.pause_type,
      affected_user_ids: adminPause.affected_user_ids,
      reason: adminPause.reason
    });

    // Get an active subscription for one of the affected users
    let targetUserId;
    if (adminPause.pause_type === 'selected' && adminPause.affected_user_ids) {
      targetUserId = adminPause.affected_user_ids[0];
    } else {
      // Get any active subscription
      const { data: anySubscription } = await supabase
        .from('user_subscriptions')
        .select('user_id')
        .eq('status', 'active')
        .limit(1);
      targetUserId = anySubscription?.[0]?.user_id;
    }

    if (!targetUserId) {
      console.error('❌ No target user found');
      return;
    }

    console.log(`🎯 Target user: ${targetUserId}`);

    // Try using a raw SQL approach via RPC
    console.log('🔄 Attempting direct SQL update...');
    
    // Let's try using rpc with a custom function
    const { data, error } = await supabase.rpc('raw_sql', {
      query: `
        UPDATE user_subscriptions 
        SET 
          status = 'admin_paused',
          admin_pause_id = '${adminPause.id}',
          pause_date = '${adminPause.start_date}',
          pause_reason = 'Admin pause: ${adminPause.reason}',
          admin_pause_start = '${adminPause.start_date}',
          admin_pause_end = ${adminPause.end_date ? `'${adminPause.end_date}'` : 'NULL'},
          updated_at = NOW()
        WHERE user_id = '${targetUserId}' 
        AND status = 'active'
        LIMIT 1
        RETURNING id, status;
      `
    });

    if (error && error.message.includes('function raw_sql')) {
      console.log('⚠️  Raw SQL RPC not available, trying alternative approach...');
      
      // Instead, let's create a new subscription record with admin_paused status
      // First, get an existing subscription to copy
      const { data: templateSub } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('status', 'active')
        .limit(1)
        .single();

      if (templateSub) {
        console.log('📋 Creating a test admin_paused subscription...');
        
        const newSubscription = {
          ...templateSub,
          id: crypto.randomUUID(),
          status: 'admin_paused',
          admin_pause_id: adminPause.id,
          pause_date: adminPause.start_date,
          pause_reason: `Admin pause: ${adminPause.reason}`,
          admin_pause_start: adminPause.start_date,
          admin_pause_end: adminPause.end_date,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: insertData, error: insertError } = await supabase
          .from('user_subscriptions')
          .insert(newSubscription)
          .select();

        if (insertError) {
          console.error('❌ Error inserting new subscription:', insertError);
        } else {
          console.log('✅ Created test admin_paused subscription:', insertData[0]);
          console.log('🎉 Now you can test the reactivate endpoint!');
        }
      }
    } else if (error) {
      console.error('❌ SQL error:', error);
    } else {
      console.log('✅ Direct SQL update successful:', data);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

matchSubscriptionToExistingPause();
