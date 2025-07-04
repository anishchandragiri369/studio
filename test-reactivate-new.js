require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testReactivateLogic() {
  console.log('🧪 Testing reactivate endpoint logic...');
  
  try {
    // Get existing admin pause record
    const { data: adminPause, error: pauseError } = await supabase
      .from('admin_subscription_pauses')
      .select('*')
      .eq('status', 'active')
      .limit(1)
      .single();

    if (pauseError || !adminPause) {
      console.error('❌ No active admin pause records found:', pauseError);
      return;
    }

    console.log('📋 Found admin pause record:', {
      id: adminPause.id,
      pause_type: adminPause.pause_type,
      affected_user_ids: adminPause.affected_user_ids,
      reason: adminPause.reason
    });

    // Test the reactivate endpoint logic
    const affectedUserIds = adminPause.pause_type === 'all' 
      ? null 
      : adminPause.affected_user_ids;

    console.log('👥 Affected user IDs:', affectedUserIds);

    // Query subscriptions like the updated reactivate endpoint does
    let subscriptionQuery = supabase
      .from('user_subscriptions')
      .select('*');

    if (affectedUserIds && affectedUserIds.length > 0) {
      // For affected users, get their active subscriptions (since status update may have failed)
      subscriptionQuery = subscriptionQuery.in('user_id', affectedUserIds);
    } else {
      // If no specific user IDs, look for admin_paused status or admin_pause_id
      subscriptionQuery = subscriptionQuery.or(`status.eq.admin_paused,admin_pause_id.eq.${adminPause.id}`);
    }

    const { data: subscriptions, error: subscriptionError } = await subscriptionQuery;
    
    console.log('📋 Query result:', {
      subscriptions: subscriptions?.length || 0,
      error: subscriptionError
    });

    if (subscriptions && subscriptions.length > 0) {
      console.log('✅ Found subscriptions that can be reactivated:');
      subscriptions.forEach(sub => {
        console.log(`  - ${sub.id}: status=${sub.status}, admin_pause_id=${sub.admin_pause_id}, user=${sub.user_id}`);
      });
    } else {
      console.log('⚠️  No subscriptions found for reactivation');
      
      // Let's check what subscriptions exist for the affected users
      if (affectedUserIds && affectedUserIds.length > 0) {
        const { data: allUserSubs } = await supabase
          .from('user_subscriptions')
          .select('id, status, admin_pause_id, user_id')
          .in('user_id', affectedUserIds);
          
        console.log('📋 All subscriptions for affected users:');
        allUserSubs?.forEach(sub => {
          console.log(`  - ${sub.id}: status=${sub.status}, admin_pause_id=${sub.admin_pause_id}, user=${sub.user_id}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testReactivateLogic();
