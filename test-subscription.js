// Test subscription creation API
const testSubscriptionCreation = async () => {
  const testPayload = {
    userId: "550e8400-e29b-41d4-a716-446655440000",
    planId: "weekly_plan_001",
    planName: "Weekly Wellness Plan",
    planPrice: 840,
    planFrequency: "weekly",
    subscriptionDuration: 3,
    basePrice: 120,
    customerInfo: {
      name: "Test User",
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      phone: "9876543210",
      address: {
        street: "123 Test Street",
        city: "Test City",
        state: "Test State",
        zipCode: "500001",
        country: "India"
      }
    },
    selectedJuices: [
      { id: 1, name: "Orange Juice", price: 120 },
      { id: 2, name: "Apple Juice", price: 130 }
    ]
  };

  try {
    const response = await fetch('http://localhost:9002/api/subscriptions/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    const result = await response.json();
    console.log('Subscription API Response:', {
      status: response.status,
      success: result.success,
      message: result.message,
      data: result.data,
      error: result.error
    });

    if (!result.success) {
      console.error('Subscription creation failed:', result.error || result.message);
    } else {
      console.log('Subscription created successfully!');
      console.log('Subscription ID:', result.data?.subscription?.id);
    }

  } catch (error) {
    console.error('Error testing subscription API:', error);
  }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testSubscriptionCreation };
} else {
  // For browser/client-side testing
  window.testSubscriptionCreation = testSubscriptionCreation;
}

// Run test immediately if called directly
if (typeof require !== 'undefined' && require.main === module) {
  testSubscriptionCreation();
}
