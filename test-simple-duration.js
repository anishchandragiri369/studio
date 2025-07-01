// Simple test for one duration to see the exact error
const testData = {
  userId: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID format
  planId: 'monthly-wellness-pack',
  planName: 'Monthly Wellness Pack',
  planPrice: 2400,
  planFrequency: 'monthly',
  basePrice: 120,
  subscriptionDuration: 3, // Test a duration that should work with current constraint (3 is allowed)
  customerInfo: {
    name: 'Test User Simple',
    phone: '+919876543210',
    email: 'test.simple@example.com',
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

async function testSimple() {
  try {
    console.log('Testing 3-month subscription (predefined duration)...\n');
    
    const response = await fetch('http://localhost:9002/api/subscriptions/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    const responseText = await response.text();
    console.log('Raw response:', responseText);
    
    if (response.status === 200 || response.status === 201) {
      try {
        const data = JSON.parse(responseText);
        console.log('\n✅ Parsed JSON successfully:');
        console.log(JSON.stringify(data, null, 2));
      } catch (parseError) {
        console.log('\n❌ Failed to parse JSON:', parseError.message);
      }
    } else {
      console.log(`\n❌ HTTP Error ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }
}

testSimple();
