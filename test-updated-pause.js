require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testUpdatedPauseEndpoint() {
  console.log('🧪 Testing updated pause endpoint...');
  
  try {
    // Get a user with active subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('user_subscriptions')
      .select('user_id')
      .eq('status', 'active')
      .limit(1);

    if (subError || !subscriptions || subscriptions.length === 0) {
      console.error('❌ No active subscriptions found:', subError);
      return;
    }

    const userId = subscriptions[0].user_id;
    console.log('👤 Testing with user:', userId);

    // Test calling the pause endpoint
    const pausePayload = {
      pauseType: 'selected',
      userIds: [userId],
      startDate: new Date(Date.now() + 60 * 1000).toISOString(), // 1 minute from now
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      reason: 'Test pause - no DB errors',
      adminUserId: crypto.randomUUID()
    };

    console.log('📤 Calling pause endpoint...');

    const response = await fetch('http://localhost:9003/api/admin/subscriptions/pause', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pausePayload)
    });

    const result = await response.json();
    console.log('📥 Response:', {
      status: response.status,
      success: result.success,
      message: result.message,
      data: result.data
    });

    if (result.success) {
      console.log('🎉 Pause endpoint worked without database errors!');
      
      // Check the admin pause record
      const { data: adminPause } = await supabase
        .from('admin_subscription_pauses')
        .select('*')
        .eq('id', result.data.adminPauseId)
        .single();
        
      console.log('📋 Created admin pause record:', {
        id: adminPause?.id,
        status: adminPause?.status,
        affected_user_ids: adminPause?.affected_user_ids,
        reason: adminPause?.reason
      });
      
      // Check subscription status (should still be active but tracked via admin pause)
      const { data: userSubs } = await supabase
        .from('user_subscriptions')
        .select('id, status, admin_pause_id')
        .eq('user_id', userId);
        
      console.log('📋 Subscription statuses (should remain active):');
      userSubs?.forEach(sub => {
        console.log(`  - ${sub.id}: status=${sub.status}, admin_pause_id=${sub.admin_pause_id}`);
      });
    } else {
      console.log('❌ Pause endpoint failed:', result.message);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testUpdatedPauseEndpoint();
