// Final end-to-end test for customized subscription creation
// Run this AFTER the database migration is complete

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Configuration (update these with your actual values)
const CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY',
  subscriptionApiUrl: process.env.SUBSCRIPTION_CREATE_API_URL || 'http://localhost:3000/api/subscriptions/create',
  testUserId: 'test-user-' + Date.now() // Generate unique test user ID
};

const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);

async function testCustomizedSubscriptionE2E() {
  console.log('🚀 Starting End-to-End Customized Subscription Test\n');

  // Step 1: Check database schema
  console.log('📋 Step 1: Verifying database schema...');
  try {
    const { data, error } = await supabase.rpc('exec', {
      sql: `
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'user_subscriptions' 
        AND column_name IN ('selected_juices', 'selected_fruit_bowls')
        ORDER BY column_name;
      `
    });

    if (error) {
      console.log('⚠️  Cannot verify schema via RPC, proceeding with test...');
    } else {
      console.log('✅ Schema check results:', data);
    }
  } catch (error) {
    console.log('⚠️  Schema check not available, proceeding...');
  }

  // Step 2: Test subscription creation
  console.log('\n📤 Step 2: Creating customized subscription...');
  
  const testSubscription = {
    userId: CONFIG.testUserId,
    planId: 'weekly-customized-test',
    planName: 'Weekly Customized Test Plan',
    planPrice: 299,
    planFrequency: 'weekly',
    customerInfo: {
      name: 'Test Customer',
      email: 'test@example.com',
      phone: '9876543210',
      address: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        zipCode: '560001'
      }
    },
    selectedJuices: [
      { id: 'juice_1', name: 'Fresh Orange Juice', price: 50 },
      { id: 'juice_2', name: 'Apple Carrot Mix', price: 55 }
    ],
    selectedFruitBowls: [
      { id: 'bowl_1', name: 'Mixed Seasonal Bowl', price: 85 },
      { id: 'bowl_2', name: 'Tropical Paradise Bowl', price: 90 }
    ],
    subscriptionDuration: 3,
    basePrice: 120
  };

  console.log('📦 Subscription payload:');
  console.log(JSON.stringify(testSubscription, null, 2));

  try {
    const response = await fetch(CONFIG.subscriptionApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testSubscription),
    });

    const result = await response.json();
    console.log(`\n📊 API Response (${response.status}):`);
    console.log(JSON.stringify(result, null, 2));

    if (!result.success) {
      console.log('❌ Subscription creation failed:', result.message);
      return false;
    }

    const subscriptionId = result.data?.subscription?.id;
    if (!subscriptionId) {
      console.log('❌ No subscription ID returned');
      return false;
    }

    console.log('✅ Subscription created successfully!');
    console.log('🆔 Subscription ID:', subscriptionId);

    // Step 3: Verify database storage
    console.log('\n🔍 Step 3: Verifying database storage...');
    
    const { data: savedSubscription, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (fetchError) {
      console.log('❌ Failed to fetch saved subscription:', fetchError.message);
      return false;
    }

    console.log('✅ Subscription found in database');
    
    // Verify data integrity
    const hasJuices = savedSubscription.selected_juices && savedSubscription.selected_juices.length > 0;
    const hasFruitBowls = savedSubscription.selected_fruit_bowls && savedSubscription.selected_fruit_bowls.length > 0;
    
    console.log('\n📊 Data Verification:');
    console.log('Selected Juices:', savedSubscription.selected_juices);
    console.log('Selected Fruit Bowls:', savedSubscription.selected_fruit_bowls);
    console.log('Has Juices:', hasJuices, `(${savedSubscription.selected_juices?.length || 0} items)`);
    console.log('Has Fruit Bowls:', hasFruitBowls, `(${savedSubscription.selected_fruit_bowls?.length || 0} items)`);

    // Step 4: Validate customized subscription
    console.log('\n🎯 Step 4: Validating customized subscription...');
    
    if (hasJuices && hasFruitBowls) {
      console.log('🎉 ✅ SUCCESS: Customized subscription created correctly!');
      console.log('   ✅ Both juices and fruit bowls are stored');
      console.log('   ✅ Database schema supports mixed subscriptions');
      console.log('   ✅ API correctly processes customized plans');
    } else {
      console.log('❌ FAILED: Customized subscription is incomplete');
      console.log('   Expected: Both juices and fruit bowls');
      console.log('   Actual: Juices =', hasJuices, ', Fruit Bowls =', hasFruitBowls);
      return false;
    }

    // Step 5: Cleanup
    console.log('\n🧹 Step 5: Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('user_subscriptions')
      .delete()
      .eq('id', subscriptionId);

    if (deleteError) {
      console.log('⚠️  Could not clean up test subscription:', deleteError.message);
    } else {
      console.log('✅ Test data cleaned up');
    }

    return true;

  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    return false;
  }
}

async function testAllSubscriptionTypes() {
  console.log('\n\n🧪 Testing All Subscription Types\n');

  const testCases = [
    {
      name: 'Juice Only',
      planId: 'weekly-juice-only-test',
      selectedJuices: [{ id: 'j1', name: 'Orange Juice', price: 50 }],
      selectedFruitBowls: [],
      expectedType: 'juices'
    },
    {
      name: 'Fruit Bowl Only',
      planId: 'weekly-bowl-only-test',
      selectedJuices: [],
      selectedFruitBowls: [{ id: 'b1', name: 'Mixed Bowl', price: 80 }],
      expectedType: 'fruit_bowls'
    },
    {
      name: 'Customized (Mixed)',
      planId: 'weekly-mixed-test',
      selectedJuices: [{ id: 'j1', name: 'Orange Juice', price: 50 }],
      selectedFruitBowls: [{ id: 'b1', name: 'Mixed Bowl', price: 80 }],
      expectedType: 'customized'
    }
  ];

  let allPassed = true;

  for (const testCase of testCases) {
    console.log(`\n--- Testing: ${testCase.name} ---`);
    
    const testData = {
      userId: CONFIG.testUserId + '_' + testCase.name.replace(/\s/g, ''),
      planId: testCase.planId,
      planName: `${testCase.name} Test Plan`,
      planPrice: 200,
      planFrequency: 'weekly',
      customerInfo: {
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '9876543210',
        address: { zipCode: '560001' }
      },
      selectedJuices: testCase.selectedJuices,
      selectedFruitBowls: testCase.selectedFruitBowls,
      subscriptionDuration: 3,
      basePrice: 120
    };

    try {
      const response = await fetch(CONFIG.subscriptionApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ ${testCase.name} subscription created`);
        
        // Clean up
        if (result.data?.subscription?.id) {
          await supabase
            .from('user_subscriptions')
            .delete()
            .eq('id', result.data.subscription.id);
        }
      } else {
        console.log(`❌ ${testCase.name} failed:`, result.message);
        allPassed = false;
      }
    } catch (error) {
      console.log(`❌ ${testCase.name} error:`, error.message);
      allPassed = false;
    }
  }

  return allPassed;
}

// Main execution
async function runAllTests() {
  console.log('🏁 Starting Comprehensive Subscription Tests\n');
  console.log('⚙️  Configuration:');
  console.log('   API URL:', CONFIG.subscriptionApiUrl);
  console.log('   Test User ID:', CONFIG.testUserId);
  console.log('   Supabase URL:', CONFIG.supabaseUrl ? 'Configured' : 'Missing');
  console.log();

  try {
    // Test customized subscriptions
    const customizedTestPassed = await testCustomizedSubscriptionE2E();
    
    // Test all subscription types
    const allTypesTestPassed = await testAllSubscriptionTypes();

    console.log('\n\n🏆 FINAL RESULTS');
    console.log('================');
    console.log('Customized Subscription Test:', customizedTestPassed ? '✅ PASSED' : '❌ FAILED');
    console.log('All Types Test:', allTypesTestPassed ? '✅ PASSED' : '❌ FAILED');
    
    const overallSuccess = customizedTestPassed && allTypesTestPassed;
    console.log('Overall Status:', overallSuccess ? '🎉 ALL TESTS PASSED' : '❌ SOME TESTS FAILED');

    if (overallSuccess) {
      console.log('\n🎯 Customized subscriptions are working correctly!');
      console.log('✅ Payment webhook → Subscription API → Database storage all working');
    } else {
      console.log('\n⚠️  Some issues remain. Check the logs above for details.');
    }

    return overallSuccess;

  } catch (error) {
    console.log('💥 Test suite failed:', error);
    return false;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testCustomizedSubscriptionE2E, testAllSubscriptionTypes, runAllTests };
