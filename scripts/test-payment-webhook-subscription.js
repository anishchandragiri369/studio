const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testPaymentWebhookSubscription() {
  console.log('🧪 Testing Payment Webhook Subscription Creation');
  console.log('================================================\n');

  try {
    // Step 1: Create a test order with the new subscription structure
    console.log('1️⃣ Creating test order with new subscription structure...');
    
    const testOrderData = {
      user_id: 'test-user-webhook-' + Date.now(),
      email: 'test-webhook@example.com',
      total_amount: 2599,
      original_amount: 2599,
      items: [
        {
          id: 'subscription-monthly-juice-test',
          name: 'Monthly Juice Plan',
          type: 'subscription',
          price: 2599,
          quantity: 1,
          subscriptionData: {
            planId: 'monthly-juice',
            planName: 'Monthly Juice Plan',
            basePrice: 2599,
            planFrequency: 'monthly',
            selectedJuices: [
              { juiceId: '21', quantity: 5 },
              { juiceId: '23', quantity: 7 },
              { juiceId: '26', quantity: 7 },
              { juiceId: '28', quantity: 7 }
            ],
            selectedCategory: 'Fruit Blast',
            categoryDistribution: [
              {
                days: [1, 2, 3, 8, 15, 22, 26],
                juice: {
                  id: 23,
                  name: 'Berry Bliss',
                  tags: ['antioxidant', 'sweet', 'smoothie', 'Skin Glow', 'Kids Friendly'],
                  image: '/images/juice-3.jpeg',
                  price: 120,
                  flavor: 'Strawberry, Blueberry, Raspberry, Banana',
                  category: 'Fruit Blast',
                  dataAiHint: 'berry smoothie',
                  description: 'A delightful mix of sweet berries and creamy banana, rich in antioxidants.',
                  availability: 'Low Stock',
                  data_ai_hint: 'berry smoothie',
                  stockQuantity: 5,
                  stock_quantity: 5
                },
                juiceId: 23,
                quantity: 7
              },
              {
                days: [1, 2, 3, 8, 15, 22, 26],
                juice: {
                  id: 26,
                  name: 'Citrus Zing',
                  tags: ['citrus', 'refreshing', 'energizing', 'Immunity Booster', 'Morning Energy'],
                  image: '/images/juice-6.jpeg',
                  price: 120,
                  flavor: 'Orange, Grapefruit, Lemon, Mint',
                  category: 'Fruit Blast',
                  dataAiHint: 'citrus juice',
                  description: 'A zesty and invigorating blend of fresh citrus fruits with a cooling mint finish. Perfect for an afternoon pick-me-up.',
                  availability: 'In Stock',
                  data_ai_hint: 'citrus juice',
                  stockQuantity: 60,
                  stock_quantity: 60
                },
                juiceId: 26,
                quantity: 7
              },
              {
                days: [1, 2, 3, 4, 15, 22, 26],
                juice: {
                  id: 28,
                  name: 'Purple Power',
                  tags: ['antioxidant', 'superfruit', 'purple', 'Skin Glow', 'Immunity Booster'],
                  image: '/images/juice-8.jpeg',
                  price: 120,
                  flavor: 'Blackberry, Blueberry, Grape, Acai',
                  category: 'Fruit Blast',
                  dataAiHint: 'purple berry juice',
                  description: 'A antioxidant-rich purple powerhouse featuring berries and superfruit acai for maximum nutrition and flavor.',
                  availability: 'In Stock',
                  data_ai_hint: 'purple berry juice',
                  stockQuantity: 25,
                  stock_quantity: 25
                },
                juiceId: 28,
                quantity: 7
              },
              {
                days: [1, 2, 3, 22, 26],
                juice: {
                  id: 21,
                  name: 'Rejoice',
                  tags: ['energizing', 'vitamin c', 'morning', 'Immunity Booster', 'Seasonal Specials'],
                  image: '/images/juice-1.jpeg',
                  price: 120,
                  flavor: 'pomogranate, grape, strawberry, dragon',
                  category: 'Fruit Blast',
                  dataAiHint: 'pomogranate grape juice',
                  description: 'A vibrant blend of sweet pomogranate, grapes, and a spicy kick of ginger. Perfect to start your day.',
                  availability: 'In Stock',
                  data_ai_hint: 'pomogranate grape juice',
                  stockQuantity: 50,
                  stock_quantity: 50
                },
                juiceId: 21,
                quantity: 5
              }
            ],
            subscriptionDuration: 1
          }
        }
      ],
      shipping_address: {
        firstName: 'Test',
        lastName: 'Webhook',
        email: 'test-webhook@example.com',
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
        planName: 'Monthly Juice Plan',
        basePrice: 2599,
        planFrequency: 'monthly',
        selectedJuices: [
          { juiceId: '21', quantity: 5 },
          { juiceId: '23', quantity: 7 },
          { juiceId: '26', quantity: 7 },
          { juiceId: '28', quantity: 7 }
        ],
        selectedCategory: 'Fruit Blast',
        categoryDistribution: [
          {
            days: [1, 2, 3, 8, 15, 22, 26],
            juice: {
              id: 23,
              name: 'Berry Bliss',
              tags: ['antioxidant', 'sweet', 'smoothie', 'Skin Glow', 'Kids Friendly'],
              image: '/images/juice-3.jpeg',
              price: 120,
              flavor: 'Strawberry, Blueberry, Raspberry, Banana',
              category: 'Fruit Blast',
              dataAiHint: 'berry smoothie',
              description: 'A delightful mix of sweet berries and creamy banana, rich in antioxidants.',
              availability: 'Low Stock',
              data_ai_hint: 'berry smoothie',
              stockQuantity: 5,
              stock_quantity: 5
            },
            juiceId: 23,
            quantity: 7
          },
          {
            days: [1, 2, 3, 8, 15, 22, 26],
            juice: {
              id: 26,
              name: 'Citrus Zing',
              tags: ['citrus', 'refreshing', 'energizing', 'Immunity Booster', 'Morning Energy'],
              image: '/images/juice-6.jpeg',
              price: 120,
              flavor: 'Orange, Grapefruit, Lemon, Mint',
              category: 'Fruit Blast',
              dataAiHint: 'citrus juice',
              description: 'A zesty and invigorating blend of fresh citrus fruits with a cooling mint finish. Perfect for an afternoon pick-me-up.',
              availability: 'In Stock',
              data_ai_hint: 'citrus juice',
              stockQuantity: 60,
              stock_quantity: 60
            },
            juiceId: 26,
            quantity: 7
          },
          {
            days: [1, 2, 3, 4, 15, 22, 26],
            juice: {
              id: 28,
              name: 'Purple Power',
              tags: ['antioxidant', 'superfruit', 'purple', 'Skin Glow', 'Immunity Booster'],
              image: '/images/juice-8.jpeg',
              price: 120,
              flavor: 'Blackberry, Blueberry, Grape, Acai',
              category: 'Fruit Blast',
              dataAiHint: 'purple berry juice',
              description: 'A antioxidant-rich purple powerhouse featuring berries and superfruit acai for maximum nutrition and flavor.',
              availability: 'In Stock',
              data_ai_hint: 'purple berry juice',
              stockQuantity: 25,
              stock_quantity: 25
            },
            juiceId: 28,
            quantity: 7
          },
          {
            days: [1, 2, 3, 22, 26],
            juice: {
              id: 21,
              name: 'Rejoice',
              tags: ['energizing', 'vitamin c', 'morning', 'Immunity Booster', 'Seasonal Specials'],
              image: '/images/juice-1.jpeg',
              price: 120,
              flavor: 'pomogranate, grape, strawberry, dragon',
              category: 'Fruit Blast',
              dataAiHint: 'pomogranate grape juice',
              description: 'A vibrant blend of sweet pomogranate, grapes, and a spicy kick of ginger. Perfect to start your day.',
              availability: 'In Stock',
              data_ai_hint: 'pomogranate grape juice',
              stockQuantity: 50,
              stock_quantity: 50
            },
            juiceId: 21,
            quantity: 5
          }
        ],
        subscriptionDuration: 1
      }
    };

    const { data: createdOrder, error: orderError } = await supabase
      .from('orders')
      .insert([testOrderData])
      .select('id, created_at, user_id')
      .single();

    if (orderError) {
      console.error('❌ Error creating test order:', orderError);
      return;
    }

    console.log(`✅ Test order created successfully:`);
    console.log(`   Order ID: ${createdOrder.id}`);
    console.log(`   User ID: ${createdOrder.user_id}`);
    console.log(`   Created at: ${createdOrder.created_at}`);

    // Step 2: Get current subscription count
    console.log('\n2️⃣ Getting current subscription count...');
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

    // Step 3: Simulate payment success by updating order status
    console.log('\n3️⃣ Simulating payment success...');
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ status: 'Payment Success' })
      .eq('id', createdOrder.id)
      .select('id, status, updated_at')
      .single();

    if (updateError) {
      console.error('❌ Error updating order status:', updateError);
      return;
    }

    console.log(`✅ Order status updated to: ${updatedOrder.status}`);
    console.log(`   Updated at: ${updatedOrder.updated_at}`);

    // Step 4: Manually call subscription creation API
    console.log('\n4️⃣ Manually calling subscription creation API...');
    
    const subscriptionPayload = {
      userId: createdOrder.user_id,
      planId: 'monthly-juice',
      planName: 'Monthly Juice Plan',
      planPrice: 2599,
      planFrequency: 'monthly',
      customerInfo: testOrderData.shipping_address,
      selectedJuices: testOrderData.subscription_info.selectedJuices,
      selectedCategory: testOrderData.subscription_info.selectedCategory,
      categoryDistribution: testOrderData.subscription_info.categoryDistribution,
      subscriptionDuration: 1,
      basePrice: 2599
    };

    console.log('Subscription payload:', JSON.stringify(subscriptionPayload, null, 2));

    // Call the subscription creation API directly
    const fetch = require('node-fetch');
    const apiUrl = 'https://develixr.netlify.app/api/subscriptions/create';
    
    try {
      const subscriptionRes = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscriptionPayload),
      });

      const subscriptionResult = await subscriptionRes.json();
      console.log('Subscription API response status:', subscriptionRes.status);
      console.log('Subscription creation result:', subscriptionResult);

      if (!subscriptionResult.success) {
        console.error('❌ Failed to create subscription:', subscriptionResult.message);
        console.error('Error details:', subscriptionResult);
      } else {
        console.log('✅ Subscription created successfully:', subscriptionResult.data?.subscription?.id);
      }
    } catch (apiError) {
      console.error('❌ Error calling subscription API:', apiError);
    }

    // Step 5: Check if subscription was created
    console.log('\n5️⃣ Checking if subscription was created...');
    
    // Wait a moment for any async operations
    await new Promise(resolve => setTimeout(resolve, 3000));

    const { data: afterSubscriptions, error: afterError } = await supabase
      .from('user_subscriptions')
      .select('id, user_id, plan_id, selected_category, category_distribution, created_at')
      .eq('user_id', createdOrder.user_id)
      .order('created_at', { ascending: false });

    if (afterError) {
      console.error('❌ Error fetching subscriptions after creation:', afterError);
      return;
    }

    console.log(`Subscriptions for test user: ${afterSubscriptions?.length || 0}`);
    
    if (afterSubscriptions && afterSubscriptions.length > 0) {
      console.log('\n✅ Subscription created successfully!');
      afterSubscriptions.forEach((sub, index) => {
        console.log(`\nSubscription ${index + 1}:`);
        console.log(`  - ID: ${sub.id}`);
        console.log(`  - Plan ID: ${sub.plan_id}`);
        console.log(`  - Selected Category: ${sub.selected_category}`);
        console.log(`  - Has Category Distribution: ${!!sub.category_distribution}`);
        console.log(`  - Created at: ${sub.created_at}`);
        
        if (sub.category_distribution) {
          console.log(`  - Category Distribution Items: ${sub.category_distribution.length}`);
        }
      });
    } else {
      console.log('❌ No subscription was created for the test user');
    }

    // Step 6: Clean up test data
    console.log('\n6️⃣ Cleaning up test data...');
    
    // Delete the test order
    const { error: deleteOrderError } = await supabase
      .from('orders')
      .delete()
      .eq('id', createdOrder.id);

    if (deleteOrderError) {
      console.error('⚠️  Warning: Could not delete test order:', deleteOrderError);
    } else {
      console.log('✅ Test order cleaned up successfully');
    }

    // Delete the test subscription
    if (afterSubscriptions && afterSubscriptions.length > 0) {
      const { error: deleteSubError } = await supabase
        .from('user_subscriptions')
        .delete()
        .eq('user_id', createdOrder.user_id);

      if (deleteSubError) {
        console.error('⚠️  Warning: Could not delete test subscription:', deleteSubError);
      } else {
        console.log('✅ Test subscription cleaned up successfully');
      }
    }

  } catch (error) {
    console.error('❌ Error in test:', error);
  }
}

// Run the test
testPaymentWebhookSubscription().then(() => {
  console.log('\n🔍 Payment webhook subscription test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Payment webhook subscription test failed:', error);
  process.exit(1);
}); 