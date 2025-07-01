// Test subscription creation API with webhook-like payload
const testWebhookPayload = async () => {
  const webhookStylePayload = {
    userId: "550e8400-e29b-41d4-a716-446655440000",
    planId: "weekly_3months",
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
      mobileNumber: "9876543210",
      zipCode: "500001", // Direct zipCode like webhook sends
      street: "123 Test Street",
      city: "Hyderabad",
      state: "Telangana",
      country: "India"
    },
    selectedJuices: [
      { id: 1, name: "Orange Juice", price: 120 },
      { id: 2, name: "Green Juice", price: 130 }
    ]
  };

  try {
    const response = await fetch('http://localhost:9002/api/subscriptions/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookStylePayload)
    });

    const result = await response.json();
    console.log('\n=== WEBHOOK-STYLE PAYLOAD TEST ===');
    console.log('Response Status:', response.status);
    console.log('Success:', result.success);
    console.log('Message:', result.message);
    
    if (result.success) {
      console.log('✅ Subscription would be created successfully!');
      console.log('Subscription Data:', {
        id: result.data?.subscription?.id,
        planId: result.data?.subscription?.plan_id,
        status: result.data?.subscription?.status,
        deliveryFrequency: result.data?.subscription?.delivery_frequency,
        nextDelivery: result.data?.subscription?.next_delivery_date
      });
    } else {
      console.log('❌ Subscription creation failed');
      console.log('Error:', result.error);
    }

  } catch (error) {
    console.error('Error testing webhook payload:', error);
  }
};

// Run test
testWebhookPayload();
