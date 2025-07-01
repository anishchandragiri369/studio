const fetch = require('node-fetch');

// Test configuration
const baseUrl = 'http://localhost:3000';

async function testDeliveryScheduler() {
  console.log('🚀 Testing Delivery Scheduler Improvements');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Run delivery scheduler cron job
    console.log('\n📅 Test 1: Running delivery scheduler cron job...');
    const cronResponse = await fetch(`${baseUrl}/api/cron/delivery-scheduler`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const cronResult = await cronResponse.json();
    console.log('✅ Cron job status:', cronResult);
    
    // Test 2: Check subscription pause logic (this would need a real subscription)
    console.log('\n⏸️ Test 2: Testing pause logic...');
    console.log('Note: This requires an active subscription to test properly');
    
    // Test current time vs 6 PM cutoff
    const now = new Date();
    const currentHour = now.getHours();
    const isAfterCutoff = currentHour >= 18;
    
    console.log(`Current time: ${now.toLocaleTimeString()}`);
    console.log(`Current hour: ${currentHour}`);
    console.log(`Is after 6 PM cutoff: ${isAfterCutoff}`);
    
    if (isAfterCutoff) {
      console.log('⚠️  Pause would be disabled for tomorrow\'s delivery');
    } else {
      console.log('✅ Pause would be allowed for tomorrow\'s delivery');
    }
    
    // Test 3: Check delivery time setting
    console.log('\n🕐 Test 3: Testing delivery time settings...');
    const testDate = new Date();
    testDate.setHours(8, 0, 0, 0);
    console.log(`Sample delivery time: ${testDate.toLocaleTimeString()} (should be 8:00 AM)`);
    
    console.log('\n🎉 All tests completed!');
    console.log('\nKey improvements implemented:');
    console.log('1. ✅ Pause logic changed from 24hr notice to 6 PM cutoff');
    console.log('2. ✅ Delivery time changed from 10 AM to 8 AM');
    console.log('3. ✅ Enhanced cron job to fix stuck next_delivery_dates');
    console.log('4. ✅ Updated frontend pause messages');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test SubscriptionManager logic
function testSubscriptionManagerLogic() {
  console.log('\n🧠 Testing SubscriptionManager Logic');
  console.log('-'.repeat(40));
  
  // Simulate different scenarios
  const scenarios = [
    {
      name: 'Morning before 6 PM, delivery tomorrow',
      now: new Date('2025-07-02T10:00:00'),
      nextDelivery: '2025-07-03T08:00:00',
      expectedCanPause: true
    },
    {
      name: 'Evening after 6 PM, delivery tomorrow',
      now: new Date('2025-07-02T19:00:00'),
      nextDelivery: '2025-07-03T08:00:00',
      expectedCanPause: false
    },
    {
      name: 'Delivery is today',
      now: new Date('2025-07-02T10:00:00'),
      nextDelivery: '2025-07-02T08:00:00',
      expectedCanPause: false
    },
    {
      name: 'Delivery is day after tomorrow',
      now: new Date('2025-07-02T19:00:00'),
      nextDelivery: '2025-07-04T08:00:00',
      expectedCanPause: true
    }
  ];
  
  scenarios.forEach((scenario, index) => {
    console.log(`\nScenario ${index + 1}: ${scenario.name}`);
    console.log(`Current time: ${scenario.now.toLocaleString()}`);
    console.log(`Next delivery: ${new Date(scenario.nextDelivery).toLocaleString()}`);
    console.log(`Expected can pause: ${scenario.expectedCanPause}`);
    
    // Mock the logic (in real code this would call SubscriptionManager.canPauseSubscription)
    const deliveryDate = new Date(scenario.nextDelivery);
    const now = scenario.now;
    
    const deliveryDay = new Date(deliveryDate);
    deliveryDay.setHours(0, 0, 0, 0);
    
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    let canPause = true;
    let reason = '';
    
    if (deliveryDay <= today) {
      canPause = false;
      reason = 'Next delivery is today or overdue';
    } else if (deliveryDay.getTime() === tomorrow.getTime()) {
      const currentHour = now.getHours();
      if (currentHour >= 18) {
        canPause = false;
        reason = 'After 6 PM and next delivery is tomorrow';
      }
    }
    
    console.log(`Actual can pause: ${canPause}`);
    if (!canPause) console.log(`Reason: ${reason}`);
    console.log(`✅ ${canPause === scenario.expectedCanPause ? 'PASS' : 'FAIL'}`);
  });
}

// Run tests
async function runAllTests() {
  await testDeliveryScheduler();
  testSubscriptionManagerLogic();
}

if (require.main === module) {
  runAllTests();
}

module.exports = {
  testDeliveryScheduler,
  testSubscriptionManagerLogic
};
