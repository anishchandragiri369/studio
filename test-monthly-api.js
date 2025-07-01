// Test the subscription creation API directly with Monthly Wellness Pack data
const testMonthlyWellnessPack = async () => {
  const API_BASE = 'http://localhost:9002'; // Use your local development server
  
  const subscriptionPayload = {
    userId: 'your-actual-user-id', // ⚠️ REPLACE THIS with your actual user ID from auth
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
    subscriptionDuration: 1, // Monthly = 1 month duration
    basePrice: 2599
  };

  console.log('Testing Monthly Wellness Pack subscription creation...');
  console.log('Payload:', JSON.stringify(subscriptionPayload, null, 2));

  try {
    const response = await fetch(`${API_BASE}/api/subscriptions/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionPayload),
    });

    const result = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('✅ SUCCESS: Subscription created successfully!');
      console.log('Subscription ID:', result.data?.subscription?.id);
    } else {
      console.log('❌ FAILED: Subscription creation failed');
      console.log('Error:', result.message);
      if (result.error) {
        console.log('Details:', result.error);
      }
    }
  } catch (error) {
    console.error('❌ REQUEST FAILED:', error.message);
  }
};

// Run the test
testMonthlyWellnessPack();
