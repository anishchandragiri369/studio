const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testLiveOrderCreation() {
  console.log('🧪 Testing Live Order Creation (No Subscription Creation)');
  console.log('========================================================\n');

  try {
    // Step 1: Get current subscription count
    console.log('1️⃣ Getting current subscription count...');
    const { data: beforeSubscriptions, error: beforeError } = await supabase
      .from('user_subscriptions')
      .select('id, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (beforeError) {
      console.error('❌ Error fetching subscriptions:', beforeError);
      return;
    }

    console.log(`Current subscriptions: ${beforeSubscriptions?.length || 0}`);
    const beforeCount = beforeSubscriptions?.length || 0;

    // Step 2: Create a test order with subscription data
    console.log('\n2️⃣ Creating test order with subscription data...');
    
    const testOrderData = {
      user_id: 'test-user-id-' + Date.now(), // Use a unique test user ID
      email: 'test@example.com',
      total_amount: 699,
      original_amount: 699,
      items: [
        {
          id: 'test-subscription-item',
          name: 'Test Weekly Juice Plan',
          type: 'subscription',
          price: 699,
          quantity: 1,
          subscriptionData: {
            planId: 'test-weekly-plan',
            planName: 'Test Weekly Juice Plan',
            basePrice: 699,
            planFrequency: 'weekly',
            selectedJuices: [
              { juiceId: '1', quantity: 2 },
              { juiceId: '2', quantity: 2 }
            ],
            selectedCategory: 'Test Category',
            subscriptionDuration: 1
          }
        }
      ],
      shipping_address: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        mobileNumber: '1234567890',
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        zipCode: '500001',
        country: 'India'
      },
      status: 'payment_pending',
      order_type: 'subscription',
      subscription_info: {
        planName: 'Test Weekly Juice Plan',
        basePrice: 699,
        planFrequency: 'weekly',
        selectedJuices: [
          { juiceId: '1', quantity: 2 },
          { juiceId: '2', quantity: 2 }
        ],
        selectedCategory: 'Test Category',
        subscriptionItems: [
          {
            id: 'test-subscription-item',
            name: 'Test Weekly Juice Plan',
            type: 'subscription',
            price: 699,
            subscriptionData: {
              planId: 'test-weekly-plan',
              planName: 'Test Weekly Juice Plan',
              basePrice: 699,
              planFrequency: 'weekly',
              selectedJuices: [
                { juiceId: '1', quantity: 2 },
                { juiceId: '2', quantity: 2 }
              ],
              selectedCategory: 'Test Category',
              subscriptionDuration: 1
            }
          }
        ]
      }
    };

    const { data: createdOrder, error: orderError } = await supabase
      .from('orders')
      .insert([testOrderData])
      .select('id, created_at')
      .single();

    if (orderError) {
      console.error('❌ Error creating test order:', orderError);
      return;
    }

    console.log(`✅ Test order created successfully:`);
    console.log(`   Order ID: ${createdOrder.id}`);
    console.log(`   Created at: ${createdOrder.created_at}`);

    // Step 3: Check if any subscriptions were created
    console.log('\n3️⃣ Checking if subscriptions were created...');
    
    // Wait a moment for any async operations
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { data: afterSubscriptions, error: afterError } = await supabase
      .from('user_subscriptions')
      .select('id, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(10);

    if (afterError) {
      console.error('❌ Error fetching subscriptions after order:', afterError);
      return;
    }

    console.log(`Subscriptions after order creation: ${afterSubscriptions?.length || 0}`);
    const afterCount = afterSubscriptions?.length || 0;

    // Step 4: Analyze results
    console.log('\n4️⃣ Analysis:');
    console.log('='.repeat(50));
    
    if (afterCount === beforeCount) {
      console.log('✅ SUCCESS: No new subscriptions were created!');
      console.log(`   Before: ${beforeCount} subscriptions`);
      console.log(`   After: ${afterCount} subscriptions`);
      console.log(`   Difference: ${afterCount - beforeCount}`);
    } else {
      console.log('❌ FAILURE: New subscriptions were created!');
      console.log(`   Before: ${beforeCount} subscriptions`);
      console.log(`   After: ${afterCount} subscriptions`);
      console.log(`   Difference: ${afterCount - beforeCount}`);
      
      // Check if any new subscriptions are for our test user
      const testUserSubs = afterSubscriptions?.filter(sub => 
        sub.user_id === testOrderData.user_id
      ) || [];
      
      if (testUserSubs.length > 0) {
        console.log(`   ⚠️  Found ${testUserSubs.length} subscription(s) for test user!`);
        testUserSubs.forEach((sub, index) => {
          console.log(`     Subscription ${index + 1}: ${sub.id} (created: ${sub.created_at})`);
        });
      }
    }

    // Step 5: Clean up test order
    console.log('\n5️⃣ Cleaning up test order...');
    const { error: deleteError } = await supabase
      .from('orders')
      .delete()
      .eq('id', createdOrder.id);

    if (deleteError) {
      console.error('⚠️  Warning: Could not delete test order:', deleteError);
    } else {
      console.log('✅ Test order cleaned up successfully');
    }

    // Step 6: Final verification
    console.log('\n6️⃣ Final verification...');
    const { data: finalSubscriptions, error: finalError } = await supabase
      .from('user_subscriptions')
      .select('id, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (finalError) {
      console.error('❌ Error in final verification:', finalError);
      return;
    }

    const finalCount = finalSubscriptions?.length || 0;
    console.log(`Final subscription count: ${finalCount}`);
    
    if (finalCount === beforeCount) {
      console.log('✅ PERFECT: Subscription count unchanged throughout test');
    } else {
      console.log('⚠️  NOTE: Subscription count changed during test');
    }

  } catch (error) {
    console.error('❌ Error in test:', error);
  }
}

// Run the test
testLiveOrderCreation().then(() => {
  console.log('\n🔍 Live order creation test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Live order creation test failed:', error);
  process.exit(1);
}); 