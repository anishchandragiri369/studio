require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Use service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAdminPause() {
  console.log('🧪 Testing Admin Pause System');
  console.log('============================');

  const testUserId = '8967ff0e-2f67-47fa-8b2f-4fa7e945c14b';
  const testAdminUserId = crypto.randomUUID(); // Use proper UUID for admin

  try {
    // Step 1: Check if we have any active subscriptions
    console.log('\n1️⃣ Checking existing subscriptions...');
    const { data: subscriptions, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', testUserId)
      .eq('status', 'active');

    if (fetchError) {
      console.error('❌ Error fetching subscriptions:', fetchError);
      return;
    }

    console.log(`📊 Found ${subscriptions?.length || 0} active subscriptions`);

    if (!subscriptions || subscriptions.length === 0) {
      console.log('⚠️  No active subscriptions found. Creating a test subscription...');
      
      // Create a test subscription
      const testSubscription = {
        id: crypto.randomUUID(),
        user_id: testUserId,
        plan_id: 'admin-pause-test',
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
      subscriptions.push(testSubscription);
    }

    // Step 2: Test admin pause (selected user)
    console.log('\n2️⃣ Testing admin pause for selected user...');
    
    const pausePayload = {
      pauseType: 'selected',
      userIds: [testUserId],
      startDate: new Date(Date.now() + 10000).toISOString(), // 10 seconds from now to avoid "past" error
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      reason: 'Testing admin pause system',
      adminUserId: testAdminUserId
    };

    const response = await fetch('http://localhost:9002/api/admin/subscriptions/pause', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pausePayload)
    });

    const pauseResult = await response.json();

    if (pauseResult.success) {
      console.log('✅ Admin pause request succeeded');
      console.log(`📊 Processed ${pauseResult.data.processedCount} subscriptions`);
      console.log(`🔗 Admin pause ID: ${pauseResult.data.adminPauseId}`);
      
      // Step 3: Verify subscriptions are paused
      console.log('\n3️⃣ Verifying subscriptions are paused...');
      
      const { data: pausedSubs, error: pausedError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', testUserId)
        .eq('status', 'admin_paused');

      if (pausedError) {
        console.error('❌ Error checking paused subscriptions:', pausedError);
      } else {
        console.log(`✅ Found ${pausedSubs?.length || 0} admin paused subscriptions`);
        
        if (pausedSubs && pausedSubs.length > 0) {
          console.log('🎉 ADMIN PAUSE IS WORKING! Subscriptions are properly paused.');
        } else {
          console.log('❌ Admin pause failed - subscriptions are not paused');
        }
      }

      // Step 4: Test reactivation
      console.log('\n4️⃣ Testing admin reactivation...');
      
      const reactivatePayload = {
        adminPauseId: pauseResult.data.adminPauseId,
        reactivateType: 'all_paused', // Use all_paused to bypass subscriptionIds validation
        adminUserId: testAdminUserId
      };

      const reactivateResponse = await fetch('http://localhost:9002/api/admin/subscriptions/reactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reactivatePayload)
      });

      const reactivateResult = await reactivateResponse.json();

      if (reactivateResult.success) {
        console.log('✅ Admin reactivation succeeded');
        console.log(`📊 Reactivated ${reactivateResult.data.processedCount} subscriptions`);
        
        // Verify subscriptions are active again
        const { data: activeSubs, error: activeError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', testUserId)
          .eq('status', 'active');

        if (activeError) {
          console.error('❌ Error checking active subscriptions:', activeError);
        } else {
          console.log(`✅ Found ${activeSubs?.length || 0} active subscriptions`);
          
          if (activeSubs && activeSubs.length > 0) {
            console.log('🎉 ADMIN REACTIVATION IS WORKING! Subscriptions are active again.');
          } else {
            console.log('❌ Admin reactivation failed - subscriptions are not active');
          }
        }
      } else {
        console.error('❌ Admin reactivation failed:', reactivateResult.message);
      }

    } else {
      console.error('❌ Admin pause failed:', pauseResult.message);
    }

    // Step 5: Cleanup
    console.log('\n5️⃣ Cleaning up test data...');
    
    // Remove test subscriptions
    await supabase
      .from('user_subscriptions')
      .delete()
      .eq('plan_id', 'admin-pause-test');

    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Also test the server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:9002/api/health');
    if (response.ok) {
      console.log('✅ Server is running');
      return true;
    } else {
      console.log('❌ Server is not responding properly');
      return false;
    }
  } catch (error) {
    console.log('❌ Cannot connect to server - make sure it\'s running on port 9002');
    console.log('Run: npm run dev');
    return false;
  }
}

async function main() {
  console.log('🔍 Admin Pause System End-to-End Test');
  console.log('=====================================');
  
  const serverRunning = await checkServer();
  
  if (serverRunning) {
    await testAdminPause();
  } else {
    console.log('\n💡 To run this test:');
    console.log('1. Start the server: npm run dev');
    console.log('2. Run this test again: node test-admin-pause-e2e.js');
  }
}

main();
