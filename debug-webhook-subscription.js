#!/usr/bin/env node

/**
 * Webhook Subscription Processing Diagnostic
 * 
 * This script simulates the webhook processing logic to identify why
 * "weekly-customized" subscriptions are not being created.
 */

require('dotenv').config();

// Sample order data from your example
const sampleOrderData = {
  id: "test-order-123",
  user_id: "test-user-456",
  email: "test@example.com",
  order_type: "subscription",
  shipping_address: {
    firstName: "Test",
    lastName: "User",
    email: "test@example.com",
    mobileNumber: "1234567890"
  },
  subscription_info: {
    subscriptionItems: [
      {
        id: "subscription-weekly-juice-1751590520751",
        name: "Weekly Juice Plan",
        type: "subscription",
        price: 699,
        subscriptionData: {
          planId: "weekly-juice",
          planName: "Weekly Juice Plan",
          basePrice: 699,
          planFrequency: "weekly",
          selectedJuices: [
            {"juiceId": "1", "quantity": 2},
            {"juiceId": "2", "quantity": 2},
            {"juiceId": "3", "quantity": 1},
            {"juiceId": "6", "quantity": 1}
          ],
          selectedFruitBowls: [],
          subscriptionDuration: 1
        }
      },
      {
        id: "subscription-monthly-fruit-bowl-1751590543133",
        name: "Monthly Fruit Bowl Plan",
        type: "subscription",
        price: 2999,
        subscriptionData: {
          planId: "monthly-fruit-bowl",
          planName: "Monthly Fruit Bowl Plan",
          basePrice: 2999,
          planFrequency: "monthly",
          selectedJuices: [],
          selectedFruitBowls: [
            {"quantity": 8, "fruitBowlId": "00203645-0096-41f2-a9f5-13c2d55bef7c"},
            {"quantity": 8, "fruitBowlId": "e2e4a836-2a12-400b-a535-e0ef3ce2cf52"},
            {"quantity": 5, "fruitBowlId": "61906677-daa6-4956-9512-75c3f2e308cc"}
          ],
          subscriptionDuration: 1
        }
      },
      {
        id: "subscription-weekly-customized-1751590565148",
        name: "Weekly Customized Plan",
        type: "subscription",
        price: 1299,
        subscriptionData: {
          planId: "weekly-customized",
          planName: "Weekly Customized Plan",
          basePrice: 1299,
          planFrequency: "weekly",
          selectedJuices: [
            {"juiceId": "1", "quantity": 2},
            {"juiceId": "2", "quantity": 2}
          ],
          selectedFruitBowls: [
            {"quantity": 2, "fruitBowlId": "00203645-0096-41f2-a9f5-13c2d55bef7c"},
            {"quantity": 2, "fruitBowlId": "e2e4a836-2a12-400b-a535-e0ef3ce2cf52"}
          ],
          subscriptionDuration: 1
        }
      }
    ]
  }
};

function simulateWebhookProcessing(order) {
  console.log('🔍 Simulating Webhook Subscription Processing');
  console.log('===========================================\n');

  console.log('1️⃣ Order data check:');
  console.log(`- Order ID: ${order.id}`);
  console.log(`- Order type: ${order.order_type}`);
  console.log(`- Has subscription_info: ${!!order.subscription_info}`);
  console.log(`- Subscription items count: ${order.subscription_info?.subscriptionItems?.length || 0}\n`);

  if (
    order.order_type === 'subscription' &&
    order.subscription_info &&
    order.subscription_info.subscriptionItems
  ) {
    console.log('2️⃣ Processing subscription items...\n');

    const subscriptionItems = order.subscription_info.subscriptionItems;

    subscriptionItems.forEach((subscriptionItem, index) => {
      console.log(`--- Processing Item ${index + 1} ---`);
      console.log(`Item ID: ${subscriptionItem.id}`);
      console.log(`Item Name: ${subscriptionItem.name}`);
      console.log(`Item Price: ${subscriptionItem.price}`);
      
      // Extract subscription data - this is the critical part
      let subscriptionData = {};
      
      if (subscriptionItem.subscriptionData) {
        subscriptionData = subscriptionItem.subscriptionData;
        console.log('✅ Found nested subscriptionData');
      } else {
        console.log('⚠️  No nested subscriptionData found, using fallback mapping');
        subscriptionData = {
          planId: subscriptionItem.planId || subscriptionItem.id,
          planName: subscriptionItem.planName || subscriptionItem.name,
          planFrequency: subscriptionItem.planFrequency || 'weekly',
          selectedJuices: subscriptionItem.selectedJuices || [],
          subscriptionDuration: subscriptionItem.subscriptionDuration || 3,
          basePrice: subscriptionItem.basePrice || subscriptionItem.price || 120
        };
      }

      console.log(`Plan ID: ${subscriptionData.planId}`);
      console.log(`Plan Name: ${subscriptionData.planName}`);
      console.log(`Plan Frequency: ${subscriptionData.planFrequency}`);
      console.log(`Base Price: ${subscriptionData.basePrice}`);
      console.log(`Selected Juices: ${subscriptionData.selectedJuices?.length || 0}`);
      console.log(`Selected Fruit Bowls: ${subscriptionData.selectedFruitBowls?.length || 0}`);
      console.log(`Duration: ${subscriptionData.subscriptionDuration}`);

      // Build subscription payload
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
          ...customerInfo
        },
        selectedJuices: subscriptionData.selectedJuices || [],
        selectedFruitBowls: subscriptionData.selectedFruitBowls || [],
        subscriptionDuration: subscriptionData.subscriptionDuration || 3,
        basePrice: subscriptionData.basePrice || subscriptionItem?.price || 120
      };

      console.log('📦 Generated subscription payload:');
      console.log(JSON.stringify(subscriptionPayload, null, 2));

      // Check for potential issues
      console.log('\n🔍 Validation checks:');
      console.log(`- Has userId: ${!!subscriptionPayload.userId}`);
      console.log(`- Has planId: ${!!subscriptionPayload.planId}`);
      console.log(`- Has planName: ${!!subscriptionPayload.planName}`);
      console.log(`- Has valid planPrice: ${!!subscriptionPayload.planPrice && subscriptionPayload.planPrice > 0}`);
      console.log(`- Has customerInfo email: ${!!subscriptionPayload.customerInfo.email}`);

      if (!subscriptionPayload.planId) {
        console.log('❌ CRITICAL: Missing planId - this would cause subscription creation to fail!');
      }
      if (!subscriptionPayload.planPrice || subscriptionPayload.planPrice <= 0) {
        console.log('❌ CRITICAL: Invalid planPrice - this would cause subscription creation to fail!');
      }
      if (!subscriptionPayload.customerInfo.email) {
        console.log('❌ CRITICAL: Missing customer email - this would cause subscription creation to fail!');
      }

      console.log(`\n${'='.repeat(60)}\n`);
    });

    console.log('3️⃣ Summary:');
    console.log(`Total subscription items to process: ${subscriptionItems.length}`);
    
    const planIds = subscriptionItems.map(item => 
      item.subscriptionData?.planId || item.planId || item.id
    );
    console.log(`Plan IDs found: ${planIds.join(', ')}`);
    
    console.log('\n🎯 Next steps:');
    console.log('1. Check if the subscription creation API is being called for all 3 items');
    console.log('2. Check if the "weekly-customized" API call is failing');
    console.log('3. Look for any plan-specific validation that might reject "weekly-customized"');
    console.log('4. Check database constraints or triggers that might prevent insertion');

  } else {
    console.log('❌ Order does not meet subscription processing criteria');
  }
}

// Run the simulation
simulateWebhookProcessing(sampleOrderData);
