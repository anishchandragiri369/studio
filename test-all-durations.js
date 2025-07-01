// Use built-in fetch instead of axios for Node 18+
const baseURL = 'http://localhost:9002';

const testData = {
  userId: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID format
  planId: 'monthly-wellness-pack',
  planName: 'Monthly Wellness Pack',
  planPrice: 2400,
  planFrequency: 'monthly',
  basePrice: 120,
  customerInfo: {
    name: 'Test User All Durations',
    phone: '+919876543210',
    email: 'test.alldur@example.com',
    address: {
      street: '123 Test Street',
      city: 'Hyderabad',
      state: 'Telangana',
      zipCode: '500001', // Valid Hyderabad pincode
      country: 'India'
    }
  },
  selectedJuices: ['apple', 'orange', 'carrot', 'beetroot']
};

async function testSubscriptionDuration(duration) {
  try {
    console.log(`\n=== Testing ${duration} month${duration > 1 ? 's' : ''} duration ===`);
    
    const response = await fetch(`${baseURL}/api/subscriptions/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...testData,
        subscriptionDuration: duration
      })
    });
    
    console.log(`   Response status: ${response.status}`);
    
    const responseText = await response.text();
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.log(`❌ ${duration} month${duration > 1 ? 's' : ''}: JSON PARSE ERROR`);
      console.log(`   Raw response: ${responseText.substring(0, 200)}...`);
      return false;
    }
    
    if (data.success) {
      console.log(`✅ ${duration} month${duration > 1 ? 's' : ''}: SUCCESS`);
      console.log(`   Original Price: ₹${data.data?.pricing?.originalPrice}`);
      console.log(`   Discount: ${data.data?.pricing?.discountPercentage}% (₹${data.data?.pricing?.discountAmount})`);
      console.log(`   Discount Type: ${data.data?.pricing?.discountType}`);
      console.log(`   Final Price: ₹${data.data?.pricing?.finalPrice}`);
      return true;
    } else {
      console.log(`❌ ${duration} month${duration > 1 ? 's' : ''}: FAILED`);
      console.log(`   Error: ${data.message}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${duration} month${duration > 1 ? 's' : ''}: ERROR`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testAllDurations() {
  console.log('🧪 Testing all subscription durations (1-12 months)...\n');
  
  const results = [];
  
  // Test all durations from 1 to 12 months
  for (let duration = 1; duration <= 12; duration++) {
    const success = await testSubscriptionDuration(duration);
    results.push({ duration, success });
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Test edge cases
  console.log('\n=== Testing Edge Cases ===');
  
  // Test 0 duration (should fail)
  console.log('\n--- Testing 0 duration (should fail) ---');
  await testSubscriptionDuration(0);
  
  // Test 13 duration (should fail)
  console.log('\n--- Testing 13 duration (should fail) ---');
  await testSubscriptionDuration(13);
  
  // Test negative duration (should fail)
  console.log('\n--- Testing -1 duration (should fail) ---');
  await testSubscriptionDuration(-1);
  
  // Test non-integer duration (should fail)
  console.log('\n--- Testing 3.5 duration (should fail) ---');
  await testSubscriptionDuration(3.5);
  
  // Summary
  console.log('\n=== SUMMARY ===');
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`✅ Successful: ${successCount}/${totalCount} durations`);
  console.log(`❌ Failed: ${totalCount - successCount}/${totalCount} durations`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 ALL DURATIONS WORKING CORRECTLY!');
  } else {
    console.log('\n⚠️  Some durations failed:');
    results.forEach(r => {
      if (!r.success) {
        console.log(`   - ${r.duration} month${r.duration > 1 ? 's' : ''}`);
      }
    });
  }
  
  // Test discount progression
  console.log('\n=== DISCOUNT PROGRESSION ===');
  console.log('Expected discount progression:');
  console.log('1 month: 0%');
  console.log('2 months: 2%');
  console.log('3 months: 5%');
  console.log('4+ months: 8%');
  console.log('6+ months: 12%');
  console.log('9+ months: 16%');
  console.log('12+ months: 20%');
}

// Test weekly subscriptions too
async function testWeeklySubscriptions() {
  console.log('\n🧪 Testing weekly subscription durations...\n');
  
  const weeklyTestData = {
    ...testData,
    planFrequency: 'weekly',
    planName: 'Weekly Wellness Pack',
    planPrice: 600 // Weekly price
  };
  
  for (let duration = 1; duration <= 4; duration++) {
    console.log(`\n=== Testing ${duration} week${duration > 1 ? 's' : ''} weekly subscription ===`);
    
    try {
      const response = await fetch(`${baseURL}/api/subscriptions/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...weeklyTestData,
          subscriptionDuration: duration
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ ${duration} week${duration > 1 ? 's' : ''}: SUCCESS`);
        console.log(`   Total Price: ₹${data.order?.amount}`);
        console.log(`   Discount: ${data.pricing?.discountPercentage}%`);
      } else {
        console.log(`❌ ${duration} week${duration > 1 ? 's' : ''}: FAILED`);
        console.log(`   Error: ${data.message}`);
      }
    } catch (error) {
      console.log(`❌ ${duration} week${duration > 1 ? 's' : ''}: ERROR`);
      console.log(`   Error: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

async function runAllTests() {
  try {
    await testAllDurations();
    await testWeeklySubscriptions();
  } catch (error) {
    console.error('Test suite failed:', error);
  }
}

runAllTests();
