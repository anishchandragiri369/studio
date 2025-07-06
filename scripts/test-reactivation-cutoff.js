/**
 * Test script to verify 6 PM cutoff logic for subscription reactivation
 * Tests both before and after 6 PM scenarios
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Mock the SubscriptionManager logic for testing
function calculateNextDeliveryDateWithCutoff(reactivationDate) {
  const now = new Date(reactivationDate);
  const currentHour = now.getHours();
  
  let nextDeliveryDate;
  if (currentHour >= 18) { // 6 PM or later
    // Schedule delivery for day after tomorrow
    nextDeliveryDate = new Date(now);
    nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 2);
  } else {
    // Schedule delivery for tomorrow
    nextDeliveryDate = new Date(now);
    nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 1);
  }
  
  // Set delivery time to 8 AM
  nextDeliveryDate.setHours(8, 0, 0, 0);
  
  // Skip Sunday if needed
  if (nextDeliveryDate.getDay() === 0) {
    nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 1);
  }
  
  return nextDeliveryDate;
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function testReactivationCutoffLogic() {
  console.log('🧪 Testing 6 PM Cutoff Logic for Subscription Reactivation\n');

  // Test Case 1: Reactivation before 6 PM (2 PM)
  console.log('📋 Test Case 1: Reactivation at 2 PM (before 6 PM)');
  const reactivationBefore6PM = new Date(2025, 6, 16, 14, 0); // July 16, 2025 at 2 PM
  const nextDeliveryBefore6PM = calculateNextDeliveryDateWithCutoff(reactivationBefore6PM);
  
  console.log(`Reactivation time: ${formatDate(reactivationBefore6PM)}`);
  console.log(`Next delivery: ${formatDate(nextDeliveryBefore6PM)}`);
  
  // Should be July 17th (next day)
  const expectedBefore6PM = new Date(2025, 6, 17, 8, 0);
  if (nextDeliveryBefore6PM.getTime() === expectedBefore6PM.getTime()) {
    console.log('✅ Correctly scheduled for next day (before 6 PM reactivation)');
  } else {
    console.log(`❌ Expected ${formatDate(expectedBefore6PM)}, got ${formatDate(nextDeliveryBefore6PM)}`);
  }
  console.log('');

  // Test Case 2: Reactivation after 6 PM (8 PM)
  console.log('📋 Test Case 2: Reactivation at 8 PM (after 6 PM)');
  const reactivationAfter6PM = new Date(2025, 6, 16, 20, 0); // July 16, 2025 at 8 PM
  const nextDeliveryAfter6PM = calculateNextDeliveryDateWithCutoff(reactivationAfter6PM);
  
  console.log(`Reactivation time: ${formatDate(reactivationAfter6PM)}`);
  console.log(`Next delivery: ${formatDate(nextDeliveryAfter6PM)}`);
  
  // Should be July 18th (day after next)
  const expectedAfter6PM = new Date(2025, 6, 18, 8, 0);
  if (nextDeliveryAfter6PM.getTime() === expectedAfter6PM.getTime()) {
    console.log('✅ Correctly scheduled for day after next (after 6 PM reactivation)');
  } else {
    console.log(`❌ Expected ${formatDate(expectedAfter6PM)}, got ${formatDate(nextDeliveryAfter6PM)}`);
  }
  console.log('');

  // Test Case 3: Reactivation exactly at 6 PM
  console.log('📋 Test Case 3: Reactivation exactly at 6 PM');
  const reactivationAt6PM = new Date(2025, 6, 16, 18, 0); // July 16, 2025 at 6 PM
  const nextDeliveryAt6PM = calculateNextDeliveryDateWithCutoff(reactivationAt6PM);
  
  console.log(`Reactivation time: ${formatDate(reactivationAt6PM)}`);
  console.log(`Next delivery: ${formatDate(nextDeliveryAt6PM)}`);
  
  // Should be July 18th (day after next) since 6 PM is considered "after 6 PM"
  const expectedAt6PM = new Date(2025, 6, 18, 8, 0);
  if (nextDeliveryAt6PM.getTime() === expectedAt6PM.getTime()) {
    console.log('✅ Correctly scheduled for day after next (at 6 PM reactivation)');
  } else {
    console.log(`❌ Expected ${formatDate(expectedAt6PM)}, got ${formatDate(nextDeliveryAt6PM)}`);
  }
  console.log('');

  // Test Case 4: Sunday exclusion
  console.log('📋 Test Case 4: Sunday exclusion test');
  const saturdayReactivation = new Date(2025, 6, 19, 14, 0); // July 19, 2025 (Saturday) at 2 PM
  const nextDeliverySaturday = calculateNextDeliveryDateWithCutoff(saturdayReactivation);
  
  console.log(`Reactivation time: ${formatDate(saturdayReactivation)} (Saturday)`);
  console.log(`Next delivery: ${formatDate(nextDeliverySaturday)}`);
  
  // Should be July 21st (Monday) as Sunday is skipped
  const expectedSaturday = new Date(2025, 6, 21, 8, 0);
  if (nextDeliverySaturday.getTime() === expectedSaturday.getTime()) {
    console.log('✅ Correctly skipped Sunday and scheduled for Monday');
  } else {
    console.log(`❌ Expected ${formatDate(expectedSaturday)}, got ${formatDate(nextDeliverySaturday)}`);
  }
  console.log('');

  // Test Case 5: Sunday exclusion with after 6 PM
  console.log('📋 Test Case 5: Sunday exclusion with after 6 PM reactivation');
  const fridayReactivation = new Date(2025, 6, 18, 20, 0); // July 18, 2025 (Friday) at 8 PM
  const nextDeliveryFriday = calculateNextDeliveryDateWithCutoff(fridayReactivation);
  
  console.log(`Reactivation time: ${formatDate(fridayReactivation)} (Friday at 8 PM)`);
  console.log(`Next delivery: ${formatDate(nextDeliveryFriday)}`);
  
  // Should be July 21st (Monday) as Sunday is skipped
  const expectedFriday = new Date(2025, 6, 21, 8, 0);
  if (nextDeliveryFriday.getTime() === expectedFriday.getTime()) {
    console.log('✅ Correctly skipped Sunday and scheduled for Monday (after 6 PM)');
  } else {
    console.log(`❌ Expected ${formatDate(expectedFriday)}, got ${formatDate(nextDeliveryFriday)}`);
  }
  console.log('');

  // Test Case 6: Edge case - 5:59 PM
  console.log('📋 Test Case 6: Edge case - 5:59 PM');
  const reactivation559PM = new Date(2025, 6, 16, 17, 59, 0); // July 16, 2025 at 5:59 PM
  const nextDelivery559PM = calculateNextDeliveryDateWithCutoff(reactivation559PM);
  
  console.log(`Reactivation time: ${formatDate(reactivation559PM)}`);
  console.log(`Next delivery: ${formatDate(nextDelivery559PM)}`);
  
  // Should be July 17th (next day) since it's before 6 PM
  const expected559PM = new Date(2025, 6, 17, 8, 0);
  if (nextDelivery559PM.getTime() === expected559PM.getTime()) {
    console.log('✅ Correctly scheduled for next day (5:59 PM reactivation)');
  } else {
    console.log(`❌ Expected ${formatDate(expected559PM)}, got ${formatDate(nextDelivery559PM)}`);
  }
  console.log('');

  // Test Case 7: Edge case - 6:00 PM
  console.log('📋 Test Case 7: Edge case - 6:00 PM');
  const reactivation600PM = new Date(2025, 6, 16, 18, 0, 0); // July 16, 2025 at 6:00 PM
  const nextDelivery600PM = calculateNextDeliveryDateWithCutoff(reactivation600PM);
  
  console.log(`Reactivation time: ${formatDate(reactivation600PM)}`);
  console.log(`Next delivery: ${formatDate(nextDelivery600PM)}`);
  
  // Should be July 18th (day after next) since it's at 6 PM
  const expected600PM = new Date(2025, 6, 18, 8, 0);
  if (nextDelivery600PM.getTime() === expected600PM.getTime()) {
    console.log('✅ Correctly scheduled for day after next (6:00 PM reactivation)');
  } else {
    console.log(`❌ Expected ${formatDate(expected600PM)}, got ${formatDate(nextDelivery600PM)}`);
  }
}

async function testDatabaseIntegration() {
  console.log('\n🔍 Testing Database Integration\n');

  try {
    // Check if there are any paused subscriptions to test with
    const { data: pausedSubscriptions, error } = await supabase
      .from('user_subscriptions')
      .select('id, plan_id, status, pause_date')
      .eq('status', 'paused')
      .limit(3);

    if (error) {
      console.error('❌ Error fetching paused subscriptions:', error);
      return;
    }

    if (!pausedSubscriptions || pausedSubscriptions.length === 0) {
      console.log('ℹ️  No paused subscriptions found in database');
      console.log('💡 To test reactivation, you can pause a subscription first');
      return;
    }

    console.log(`Found ${pausedSubscriptions.length} paused subscriptions`);
    
    pausedSubscriptions.forEach((sub, index) => {
      console.log(`\nSubscription ${index + 1}:`);
      console.log(`  ID: ${sub.id}`);
      console.log(`  Plan: ${sub.plan_id}`);
      console.log(`  Paused on: ${sub.pause_date}`);
      
      // Calculate what the next delivery would be if reactivated now
      const nextDelivery = calculateNextDeliveryDateWithCutoff(new Date());
      console.log(`  Next delivery if reactivated now: ${formatDate(nextDelivery)}`);
    });

  } catch (error) {
    console.error('❌ Error in database integration test:', error);
  }
}

// Run the tests
async function runTests() {
  testReactivationCutoffLogic();
  await testDatabaseIntegration();
  
  console.log('\n✅ Reactivation cutoff logic tests completed');
  console.log('\n📋 Summary:');
  console.log('- Before 6 PM: Next delivery = Next day');
  console.log('- After 6 PM: Next delivery = Day after next');
  console.log('- Sundays are automatically skipped');
  console.log('- Delivery time is set to 8 AM');
}

runTests().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
}); 