// Test Monthly Wellness Pack with 1-month duration
const testMonthlyWellnessPack = async () => {
  console.log('Testing Monthly Wellness Pack (1-month duration) subscription creation...');
  
  const API_BASE = 'https://develixr.netlify.app/';
  
  // This should match your Monthly Wellness Pack structure exactly
  const subscriptionPayload = {
    userId: '8967ff0e-2f67-47fa-8b2f-4fa7e945c14b', // ⚠️ REPLACE with real user ID
    planId: 'monthly',
    planName: 'Monthly Wellness Pack',
    planPrice: 2599,
    planFrequency: 'monthly',
    customerInfo: {
      name: 'Test User',
      email: 'test@example.com',
      phone: '1234567890',
      address: {
        line1: '123 Test Street',
        city: 'Hyderabad',
        state: 'Telangana',
        zipCode: '500001',
        country: 'India'
      }
    },
    selectedJuices: [
      { juiceId: '1', quantity: 4 },
      { juiceId: '2', quantity: 4 },
      { juiceId: '3', quantity: 4 },
      { juiceId: '4', quantity: 4 },
      { juiceId: '5', quantity: 2 },
      { juiceId: '6', quantity: 2 }
    ],
    subscriptionDuration: 1, // ← This was causing the error!
    basePrice: 2599
  };

  console.log('Payload being sent:');
  console.log(JSON.stringify(subscriptionPayload, null, 2));

  try {
    const response = await fetch(`${API_BASE}/api/subscriptions/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionPayload),
    });

    const result = await response.json();
    
    console.log('\n=== RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Result:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n🎉 SUCCESS! Monthly Wellness Pack subscription created successfully!');
      console.log('Subscription ID:', result.data?.subscription?.id);
    } else {
      console.log('\n❌ FAILED! Error:', result.message);
      if (result.log) {
        console.log('Log details:', result.log);
      }
    }
  } catch (error) {
    console.error('\n💥 REQUEST FAILED:', error.message);
  }
};

// Run the test
testMonthlyWellnessPack();
