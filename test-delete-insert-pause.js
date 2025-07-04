require('dotenv').config();

async function testUpdatedPauseEndpoint() {
  console.log('🧪 Testing updated pause endpoint with delete/insert approach...');
  
  try {
    // Test the pause endpoint with a future date
    const pausePayload = {
      pauseType: 'selected',
      userIds: ['8967ff0e-2f67-47fa-8b2f-4fa7e945c14b'], // Use the user ID from our tests
      startDate: new Date(Date.now() + 60 * 1000).toISOString(), // 1 minute from now
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      reason: 'Testing delete/insert approach for constraint fix',
      adminUserId: crypto.randomUUID()
    };

    console.log('📤 Sending pause request...');
    console.log('Payload:', {
      pauseType: pausePayload.pauseType,
      userIds: pausePayload.userIds,
      reason: pausePayload.reason
    });

    const response = await fetch('http://localhost:9003/api/admin/subscriptions/pause', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pausePayload)
    });

    const result = await response.json();
    
    console.log('📥 Response Status:', response.status);
    console.log('📥 Response:', {
      success: result.success,
      message: result.message,
      data: result.data
    });

    if (result.success) {
      console.log('✅ Pause request succeeded!');
      console.log(`✅ Processed ${result.data?.processedCount || 0} subscriptions`);
      
      if (result.data?.errors && result.data.errors.length > 0) {
        console.log('⚠️  Some errors occurred:', result.data.errors);
      } else {
        console.log('🎉 No errors! The delete/insert approach worked!');
      }
    } else {
      console.log('❌ Pause request failed:', result.message);
    }

    // Check if subscriptions were actually updated
    console.log('\n🔍 Checking if subscriptions were updated...');
    
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: updatedSubscriptions } = await supabase
      .from('user_subscriptions')
      .select('id, status, admin_pause_id, pause_reason')
      .in('user_id', pausePayload.userIds);

    console.log('📋 Updated subscriptions:');
    updatedSubscriptions?.forEach(sub => {
      console.log(`  - ${sub.id}: status=${sub.status}, admin_pause_id=${sub.admin_pause_id ? 'SET' : 'NULL'}, pause_reason=${sub.pause_reason || 'NULL'}`);
    });

  } catch (error) {
    console.error('❌ Error testing pause endpoint:', error);
  }
}

testUpdatedPauseEndpoint();
