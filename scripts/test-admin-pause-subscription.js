const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAdminPauseSubscription() {
  console.log('🧪 Testing Admin Pause vs New Subscription Creation');
  console.log('==================================================\n');

  try {
    // Step 1: Check current admin pause status
    console.log('1️⃣ Checking current admin pause status...');
    
    const { data: activePauses, error: pauseError } = await supabase
      .from('admin_subscription_pauses')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (pauseError) {
      console.error('❌ Error fetching admin pauses:', pauseError);
      return;
    }

    if (!activePauses || activePauses.length === 0) {
      console.log('✅ No active admin pauses found');
      console.log('   New subscriptions should work normally');
      return;
    }

    console.log(`Found ${activePauses.length} active admin pause(s):`);
    activePauses.forEach((pause, index) => {
      console.log(`\nPause ${index + 1}:`);
      console.log(`  - ID: ${pause.id}`);
      console.log(`  - Type: ${pause.pause_type}`);
      console.log(`  - Reason: ${pause.reason}`);
      console.log(`  - Start Date: ${pause.start_date}`);
      console.log(`  - End Date: ${pause.end_date || 'Indefinite'}`);
      console.log(`  - Affected Subscriptions: ${pause.affected_subscription_count}`);
    });

    // Step 2: Test subscription creation with admin pause
    console.log('\n2️⃣ Testing subscription creation with admin pause...');
    
    const testUserId = 'test-admin-pause-' + Date.now();
    const testSubscriptionData = {
      userId: testUserId,
      planId: 'test-weekly-plan',
      planName: 'Test Weekly Plan',
      planPrice: 699,
      planFrequency: 'weekly',
      customerInfo: {
        firstName: 'Test',
        lastName: 'AdminPause',
        email: 'test-admin-pause@example.com',
        mobileNumber: '1234567890',
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        zipCode: '500001',
        country: 'India'
      },
      selectedJuices: [
        { juiceId: '1', quantity: 2 },
        { juiceId: '2', quantity: 2 }
      ],
      selectedCategory: 'Test Category',
      categoryDistribution: [
        {
          days: [1, 2, 3],
          juice: { id: 1, name: 'Test Juice 1' },
          juiceId: 1,
          quantity: 2
        },
        {
          days: [4, 5, 6],
          juice: { id: 2, name: 'Test Juice 2' },
          juiceId: 2,
          quantity: 2
        }
      ],
      subscriptionDuration: 1,
      basePrice: 699
    };

    console.log('Attempting to create subscription with admin pause active...');
    console.log('Subscription data:', JSON.stringify(testSubscriptionData, null, 2));

    // Call the subscription creation API
    const fetch = require('node-fetch');
    const apiUrl = 'https://develixr.netlify.app/api/subscriptions/create';
    
    try {
      const subscriptionRes = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testSubscriptionData),
      });

      const subscriptionResult = await subscriptionRes.json();
      console.log('Subscription API response status:', subscriptionRes.status);
      console.log('Subscription creation result:', subscriptionResult);

      if (subscriptionResult.success) {
        console.log('✅ SUCCESS: Subscription created despite admin pause!');
        console.log('   This confirms admin pause no longer blocks new subscriptions');
        
        if (subscriptionResult.data.adminPauseMessage) {
          console.log('   Admin pause message:', subscriptionResult.data.adminPauseMessage);
        }
        
        console.log('   Next delivery date:', subscriptionResult.data.nextDeliveryDate);
        console.log('   First delivery date:', subscriptionResult.data.deliverySchedule.firstDeliveryDate);
        
        // Check if delivery date is adjusted
        const nextDelivery = new Date(subscriptionResult.data.nextDeliveryDate);
        const now = new Date();
        const daysDifference = Math.ceil((nextDelivery - now) / (1000 * 60 * 60 * 24));
        
        if (daysDifference > 7) {
          console.log(`   ✅ Delivery date adjusted: ${daysDifference} days from now`);
        } else {
          console.log(`   ℹ️  Delivery date: ${daysDifference} days from now`);
        }
        
        // Clean up test subscription
        console.log('\n3️⃣ Cleaning up test subscription...');
        const { error: deleteError } = await supabase
          .from('user_subscriptions')
          .delete()
          .eq('user_id', testUserId);

        if (deleteError) {
          console.error('⚠️  Warning: Could not delete test subscription:', deleteError);
        } else {
          console.log('✅ Test subscription cleaned up successfully');
        }
        
      } else {
        console.log('❌ FAILURE: Subscription creation failed');
        console.log('   Error:', subscriptionResult.message);
        
        if (subscriptionResult.adminPause) {
          console.log('   ❌ Admin pause is still blocking subscription creation');
          console.log('   This indicates the fix is not working');
        }
      }
    } catch (apiError) {
      console.error('❌ Error calling subscription API:', apiError);
    }

  } catch (error) {
    console.error('❌ Error in test:', error);
  }
}

// Run the test
testAdminPauseSubscription().then(() => {
  console.log('\n🔍 Admin pause subscription test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Admin pause subscription test failed:', error);
  process.exit(1);
}); 