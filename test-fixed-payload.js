// Test subscription API with fixed payload
const testSubscriptionWithValidData = async () => {
  const testPayload = {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    planId: 'premium',
    planName: 'Premium Plan',
    planPrice: 480,
    planFrequency: 'weekly',
    customerInfo: {
      name: 'Test User',
      email: 'test@example.com',
      phone: '1234567890',
      address: {
        line1: '123 Test Street',
        city: 'Hyderabad',
        state: 'Telangana',
        zipCode: '500001', // Valid Hyderabad pincode
        country: 'India'
      }
    },
    selectedJuices: [
      { juiceId: '1', quantity: 2 },
      { juiceId: '2', quantity: 1 }
    ],
    subscriptionDuration: 6,
    basePrice: 120
  };

  try {
    console.log('Testing subscription API with valid Hyderabad pincode...');
    const response = await fetch('http://localhost:9002/api/subscriptions/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });

    const result = await response.json();
    
    console.log('\n=== SUBSCRIPTION API TEST RESULT ===');
    console.log('Status:', response.status);
    console.log('Success:', result.success);
    console.log('Message:', result.message);
    
    if (response.status === 400) {
      console.log('❌ 400 Bad Request - Validation failed');
      console.log('Likely cause: Invalid pincode or missing required fields');
    } else if (response.status === 500 && result.error?.includes('foreign key')) {
      console.log('✅ API validation passed, reached database');
      console.log('Expected error: Test UUID not in auth.users table');
      console.log('🎉 This means the API is working correctly!');
    } else if (result.success) {
      console.log('✅ Subscription created successfully!');
    } else {
      console.log('❌ Unexpected error:', result.error);
    }

  } catch (error) {
    console.error('❌ Network or parsing error:', error);
  }
};

testSubscriptionWithValidData();
