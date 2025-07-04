require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Use service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAdminPauseReactivateScenario() {
  console.log('🧪 Testing Admin Pause UI Scenario');
  console.log('==================================');

  const testUserId = '8967ff0e-2f67-47fa-8b2f-4fa7e945c14b';
  const testAdminUserId = crypto.randomUUID();
  
  try {
    // Step 1: Create a test subscription
    console.log('\n1️⃣ Creating test subscription...');
    
    const testSubscription = {
      id: crypto.randomUUID(),
      user_id: testUserId,
      plan_id: 'ui-test-plan',
      status: 'active',
      delivery_frequency: 'monthly',
      next_delivery_date: '2025-07-10T10:00:00+00:00',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      subscription_start_date: new Date().toISOString(),
      subscription_end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      total_amount: 100,
      subscription_duration: 2,
      original_price: 100,
      discount_percentage: 0,
      discount_amount: 0,
      final_price: 100,
      renewal_notification_sent: false,
      selected_juices: [{ name: 'Test Juice', quantity: 1 }],
      delivery_address: [{ 
        street: '123 Test Street', 
        city: 'Test City', 
        state: 'Test State', 
        zip: '12345' 
      }]
    };

    const { error: createError } = await supabase
      .from('user_subscriptions')
      .insert(testSubscription);

    if (createError) {
      console.error('❌ Error creating test subscription:', createError);
      return;
    }

    console.log('✅ Test subscription created');

    // Step 2: Create admin pause (simulating API call)
    console.log('\n2️⃣ Creating admin pause...');
    
    const pausePayload = {
      pauseType: 'selected',
      userIds: [testUserId],
      startDate: new Date(Date.now() + 5000).toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      reason: 'UI Test Pause',
      adminUserId: testAdminUserId
    };

    const pauseResponse = await fetch('http://localhost:9002/api/admin/subscriptions/pause', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pausePayload)
    });

    const pauseResult = await pauseResponse.json();

    if (!pauseResult.success) {
      console.error('❌ Failed to create admin pause:', pauseResult.message);
      return;
    }

    console.log('✅ Admin pause created');
    console.log(`📊 Admin pause ID: ${pauseResult.data.adminPauseId}`);

    // Step 3: Simulate UI reactivate (exactly what the UI does)
    console.log('\n3️⃣ Testing UI reactivate scenario...');
    
    const uiReactivatePayload = {
      reactivateType: 'selected',
      subscriptionIds: [], // Empty like the UI sends
      adminPauseId: pauseResult.data.adminPauseId,
      adminUserId: testAdminUserId
    };

    console.log('📝 Sending reactivate request:', JSON.stringify(uiReactivatePayload, null, 2));

    const reactivateResponse = await fetch('http://localhost:9002/api/admin/subscriptions/reactivate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(uiReactivatePayload)
    });

    const reactivateResult = await reactivateResponse.json();

    if (reactivateResult.success) {
      console.log('✅ UI reactivate scenario succeeded!');
      console.log(`📊 Reactivated ${reactivateResult.data.processedCount} subscriptions`);
      
      // Verify subscription is active
      const { data: activeSub, error: activeError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('id', testSubscription.id)
        .single();

      if (activeError) {
        console.error('❌ Error checking reactivated subscription:', activeError);
      } else if (activeSub.status === 'active') {
        console.log('🎉 SUCCESS! Subscription is properly reactivated via UI flow');
      } else {
        console.log('❌ Subscription is not active:', activeSub.status);
      }
    } else {
      console.error('❌ UI reactivate scenario failed:', reactivateResult.message);
    }

    // Step 4: Cleanup
    console.log('\n4️⃣ Cleaning up...');
    
    await supabase
      .from('user_subscriptions')
      .delete()
      .eq('id', testSubscription.id);

    await supabase
      .from('admin_subscription_pauses')
      .delete()
      .eq('id', pauseResult.data.adminPauseId);

    console.log('✅ Cleanup completed');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

async function checkServer() {
  try {
    const response = await fetch('http://localhost:9002/api/health');
    return response.ok;
  } catch (error) {
    console.log('❌ Server not running on port 9002');
    return false;
  }
}

async function main() {
  if (await checkServer()) {
    await testAdminPauseReactivateScenario();
  } else {
    console.log('💡 Start the server first: npm run dev');
  }
}

main();
