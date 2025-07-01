const webhookPayload = {
  type: 'PAYMENT_SUCCESS_WEBHOOK',
  order: {
    id: 'test-order-123',
    user_id: 'your-actual-user-id', // Replace with your actual user ID
    email: 'test@example.com',
    total_amount: 2599,
    order_type: 'subscription',
    shipping_address: {
      name: 'Test User',
      email: 'test@example.com',
      phone: '1234567890',
      line1: '123 Test Street',
      city: 'Hyderabad',
      state: 'Telangana',
      zipCode: '500001',
      country: 'India'
    },
    subscription_info: {
      "subscriptionItems": [
        {
          "id": "subscription-monthly-1751333388405",
          "name": "Monthly Wellness Pack",
          "type": "subscription",
          "image": "/images/subscription-icon.jpg",
          "price": 2599,
          "quantity": 1,
          "juiceName": "Monthly Wellness Pack",
          "subscriptionData": {
            "planId": "monthly",
            "planName": "Monthly Wellness Pack",
            "basePrice": 2599,
            "planFrequency": "monthly",
            "selectedJuices": [
              {"juiceId": "1", "quantity": 4},
              {"juiceId": "2", "quantity": 4},
              {"juiceId": "3", "quantity": 4},
              {"juiceId": "4", "quantity": 4},
              {"juiceId": "5", "quantity": 2},
              {"juiceId": "6", "quantity": 2}
            ],
            "subscriptionDuration": 1
          }
        }
      ],
      "hasSubscriptionItems": true
    }
  }
};

// Simulate the webhook processing logic
console.log('Testing Monthly Wellness Pack webhook processing...');

const order = webhookPayload.order;
console.log('Order type:', order.order_type);
console.log('Has subscription_info:', !!order.subscription_info);

if (order.subscription_info) {
  console.log('Raw subscription_info:', JSON.stringify(order.subscription_info, null, 2));
  
  // Extract subscription items
  let subscriptionItems = [];
  
  if (Array.isArray(order.subscription_info.subscriptionItems)) {
    subscriptionItems = order.subscription_info.subscriptionItems;
    console.log('✅ Found subscriptionItems array with', subscriptionItems.length, 'items');
  } else if (order.subscription_info.planId) {
    subscriptionItems = [order.subscription_info];
    console.log('✅ Found direct subscription data');
  } else {
    console.log('❌ No valid subscription structure found');
  }
  
  // Process each subscription item
  for (const subscriptionItem of subscriptionItems) {
    console.log('\n--- Processing Subscription Item ---');
    console.log('Item:', JSON.stringify(subscriptionItem, null, 2));
    
    let subscriptionData = {};
    
    if (subscriptionItem.subscriptionData) {
      subscriptionData = subscriptionItem.subscriptionData;
      console.log('✅ Using nested subscriptionData');
    } else {
      subscriptionData = {
        planId: subscriptionItem.planId || subscriptionItem.id,
        planName: subscriptionItem.planName || subscriptionItem.name,
        planFrequency: subscriptionItem.planFrequency || 'weekly',
        selectedJuices: subscriptionItem.selectedJuices || [],
        subscriptionDuration: subscriptionItem.subscriptionDuration || 3,
        basePrice: subscriptionItem.basePrice || subscriptionItem.price || 120
      };
      console.log('✅ Using mapped subscriptionData');
    }
    
    console.log('Final subscriptionData:', JSON.stringify(subscriptionData, null, 2));
    
    // Create the payload that would be sent to the API
    const customerInfo = order.shipping_address || {};
    
    const subscriptionPayload = {
      userId: order.user_id,
      planId: subscriptionData.planId,
      planName: subscriptionData.planName || subscriptionItem?.name,
      planPrice: subscriptionItem?.price || subscriptionData.planPrice,
      planFrequency: subscriptionData.planFrequency,
      customerInfo: {
        name: customerInfo.firstName ? `${customerInfo.firstName} ${customerInfo.lastName || ''}`.trim() : customerInfo.name,
        email: order.email || customerInfo.email,
        phone: customerInfo.mobileNumber || customerInfo.phone,
        address: {
          line1: customerInfo.line1 || customerInfo.street,
          city: customerInfo.city,
          state: customerInfo.state,
          zipCode: customerInfo.zipCode,
          country: customerInfo.country
        }
      },
      selectedJuices: subscriptionData.selectedJuices || [],
      subscriptionDuration: subscriptionData.subscriptionDuration || 3,
      basePrice: subscriptionData.basePrice || subscriptionItem?.price || 120
    };
    
    console.log('\n--- Final API Payload ---');
    console.log(JSON.stringify(subscriptionPayload, null, 2));
    
    // Check for potential issues
    console.log('\n--- Validation Checks ---');
    console.log('✅ userId:', subscriptionPayload.userId ? '✅ Present' : '❌ Missing');
    console.log('✅ planId:', subscriptionPayload.planId ? '✅ Present' : '❌ Missing');
    console.log('✅ planName:', subscriptionPayload.planName ? '✅ Present' : '❌ Missing');
    console.log('✅ planPrice:', subscriptionPayload.planPrice ? '✅ Present' : '❌ Missing');
    console.log('✅ planFrequency:', subscriptionPayload.planFrequency ? '✅ Present' : '❌ Missing');
    console.log('✅ selectedJuices:', subscriptionPayload.selectedJuices?.length > 0 ? '✅ Present' : '❌ Missing');
    console.log('✅ subscriptionDuration:', subscriptionPayload.subscriptionDuration ? '✅ Present' : '❌ Missing');
    console.log('✅ customerInfo.email:', subscriptionPayload.customerInfo?.email ? '✅ Present' : '❌ Missing');
    console.log('✅ customerInfo.name:', subscriptionPayload.customerInfo?.name ? '✅ Present' : '❌ Missing');
  }
}
