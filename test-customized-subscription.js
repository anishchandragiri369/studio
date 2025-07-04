// Test script to verify customized subscription creation with both juices and fruit bowls
const { createClient } = require('@supabase/supabase-js');

// Set up Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testCustomizedSubscriptionCreation() {
  console.log('Testing customized subscription creation...');

  // Test payload that should create a customized subscription
  const customizedSubscriptionPayload = {
    userId: 'test-user-123',
    planId: 'weekly-customized',
    planName: 'Weekly Customized Plan',
    planPrice: 299,
    planFrequency: 'weekly',
    customerInfo: {
      name: 'Test Customer',
      email: 'test@example.com',
      phone: '1234567890',
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        zipCode: '560001'
      }
    },
    selectedJuices: [
      { id: 'juice1', name: 'Orange Juice', price: 50 },
      { id: 'juice2', name: 'Apple Juice', price: 45 }
    ],
    selectedFruitBowls: [
      { id: 'bowl1', name: 'Mixed Fruit Bowl', price: 80 },
      { id: 'bowl2', name: 'Seasonal Bowl', price: 90 }
    ],
    subscriptionDuration: 3,
    basePrice: 120
  };

  try {
    console.log('Calling subscription creation API with payload:');
    console.log(JSON.stringify(customizedSubscriptionPayload, null, 2));

    // Call the subscription creation API
    const response = await fetch('http://localhost:3000/api/subscriptions/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customizedSubscriptionPayload),
    });

    const result = await response.json();
    console.log('API Response Status:', response.status);
    console.log('API Response:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('✅ Customized subscription created successfully!');
      console.log('Subscription ID:', result.data?.subscription?.id);
      
      // Verify the subscription was stored correctly in the database
      if (result.data?.subscription?.id) {
        const { data: subscription, error } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('id', result.data.subscription.id)
          .single();

        if (error) {
          console.error('❌ Error fetching created subscription:', error);
        } else {
          console.log('✅ Subscription verified in database:');
          console.log('Selected Juices:', subscription.selected_juices);
          console.log('Selected Fruit Bowls:', subscription.selected_fruit_bowls);
          
          // Check if both are properly stored
          const hasJuices = subscription.selected_juices && subscription.selected_juices.length > 0;
          const hasFruitBowls = subscription.selected_fruit_bowls && subscription.selected_fruit_bowls.length > 0;
          
          if (hasJuices && hasFruitBowls) {
            console.log('✅ Customized subscription stored correctly with both juices and fruit bowls!');
          } else {
            console.log('❌ Missing data:');
            console.log('Has Juices:', hasJuices);
            console.log('Has Fruit Bowls:', hasFruitBowls);
          }
        }
      }
    } else {
      console.log('❌ Failed to create customized subscription');
      console.log('Error:', result.message);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Test different subscription types
async function testAllSubscriptionTypes() {
  console.log('\n=== Testing All Subscription Types ===\n');

  const testCases = [
    {
      name: 'Juice Only Subscription',
      payload: {
        userId: 'test-user-juice',
        planId: 'weekly-juice',
        planName: 'Weekly Juice Plan',
        planPrice: 180,
        planFrequency: 'weekly',
        customerInfo: { name: 'Juice Test', email: 'juice@test.com', phone: '1111111111', address: { zipCode: '560001' } },
        selectedJuices: [{ id: 'juice1', name: 'Orange Juice', price: 50 }],
        selectedFruitBowls: [],
        subscriptionDuration: 3,
        basePrice: 120
      }
    },
    {
      name: 'Fruit Bowl Only Subscription',
      payload: {
        userId: 'test-user-bowl',
        planId: 'weekly-fruit-bowl',
        planName: 'Weekly Fruit Bowl Plan',
        planPrice: 220,
        planFrequency: 'weekly',
        customerInfo: { name: 'Bowl Test', email: 'bowl@test.com', phone: '2222222222', address: { zipCode: '560001' } },
        selectedJuices: [],
        selectedFruitBowls: [{ id: 'bowl1', name: 'Mixed Bowl', price: 80 }],
        subscriptionDuration: 3,
        basePrice: 120
      }
    },
    {
      name: 'Customized (Mixed) Subscription',
      payload: {
        userId: 'test-user-mixed',
        planId: 'weekly-customized',
        planName: 'Weekly Customized Plan',
        planPrice: 299,
        planFrequency: 'weekly',
        customerInfo: { name: 'Mixed Test', email: 'mixed@test.com', phone: '3333333333', address: { zipCode: '560001' } },
        selectedJuices: [{ id: 'juice1', name: 'Orange Juice', price: 50 }],
        selectedFruitBowls: [{ id: 'bowl1', name: 'Mixed Bowl', price: 80 }],
        subscriptionDuration: 3,
        basePrice: 120
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n--- Testing: ${testCase.name} ---`);
    
    try {
      const response = await fetch('http://localhost:3000/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.payload),
      });

      const result = await response.json();
      console.log(`Status: ${response.status}`);
      
      if (result.success) {
        console.log(`✅ ${testCase.name} created successfully`);
        console.log(`Subscription ID: ${result.data?.subscription?.id}`);
      } else {
        console.log(`❌ ${testCase.name} failed`);
        console.log(`Error: ${result.message}`);
      }
    } catch (error) {
      console.log(`❌ ${testCase.name} failed with error: ${error.message}`);
    }
  }
}

// Run the tests
if (require.main === module) {
  console.log('Starting subscription creation tests...\n');
  testCustomizedSubscriptionCreation()
    .then(() => testAllSubscriptionTypes())
    .then(() => {
      console.log('\n=== Tests Completed ===');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { testCustomizedSubscriptionCreation, testAllSubscriptionTypes };
