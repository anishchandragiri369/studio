require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testReactivateEndpoint() {
  console.log('🧪 Testing reactivate endpoint via HTTP...');
  
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

    console.log('📋 Using admin pause record:', adminPause.id);

    // Test calling the reactivate endpoint
    const reactivatePayload = {
      adminPauseId: adminPause.id,
      reactivateType: 'all_paused',
      adminUserId: crypto.randomUUID()
    };

    console.log('📤 Calling reactivate endpoint...');

    const response = await fetch('http://localhost:9003/api/admin/subscriptions/reactivate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reactivatePayload)
    });

    const result = await response.json();
    console.log('📥 Response:', {
      status: response.status,
      success: result.success,
      message: result.message,
      data: result.data,
      debug: result.debug
    });

    if (result.success) {
      console.log('🎉 Reactivation successful!');
      
      // Check if the admin pause record was updated
      const { data: updatedPause } = await supabase
        .from('admin_subscription_pauses')
        .select('status')
        .eq('id', adminPause.id)
        .single();
        
      console.log('📋 Admin pause record status:', updatedPause?.status);
      
      // Check if subscriptions were updated
      const { data: subscriptions } = await supabase
        .from('user_subscriptions')
        .select('id, status, admin_pause_id')
        .in('user_id', adminPause.affected_user_ids);
        
      console.log('📋 Subscription statuses after reactivation:');
      subscriptions?.forEach(sub => {
        console.log(`  - ${sub.id}: status=${sub.status}, admin_pause_id=${sub.admin_pause_id}`);
      });
    } else {
      console.log('❌ Reactivation failed:', result.message);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testReactivateEndpoint();
