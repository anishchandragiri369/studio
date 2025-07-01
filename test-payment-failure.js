#!/usr/bin/env node

/**
 * Payment Failure Test Script
 * This script helps test all payment failure scenarios
 */

const BASE_URL = 'http://localhost:9002';

// Test configuration with real order data
const TEST_ORDER_ID = '1cb8faa3-be4b-4b55-ada3-93736b830141';
const CASHFREE_ORDER_ID = 'elixr_1cb8faa3-be4b-4b55-ada3-93736b830141';
const TEST_AMOUNT = 69.00;
const TEST_EMAIL = 'bobby.ani209@gmail.com';

// Test scenarios
const testScenarios = [
  {
    name: 'Test Payment Failure Webhook',
    description: 'Tests PAYMENT_FAILED_WEBHOOK processing',
    endpoint: '/api/webhook/payment-confirm',
    method: 'POST',
    payload: {
      type: 'PAYMENT_FAILED_WEBHOOK',
      event_time: new Date().toISOString(),
      data: {
        order: {
          order_id: CASHFREE_ORDER_ID,
          order_amount: TEST_AMOUNT,
          order_currency: 'INR',
          order_status: 'FAILED'
        },
        payment: {
          payment_status: 'FAILED',
          payment_amount: TEST_AMOUNT,
          payment_currency: 'INR',
          payment_message: 'Insufficient funds in account',
          payment_time: new Date().toISOString()
        }
      }
    }
  },
  {
    name: 'Test Payment Failure Email',
    description: 'Tests payment failure email sending',
    endpoint: '/api/send-payment-failure-email',
    method: 'POST',
    payload: {
      orderId: TEST_ORDER_ID,
      userEmail: TEST_EMAIL,
      reason: 'Test payment failure - insufficient funds'
    }
  }
];

async function runTest(scenario) {
  console.log(`\n🧪 Running: ${scenario.name}`);
  console.log(`📝 Description: ${scenario.description}`);
  console.log(`🎯 Endpoint: ${scenario.endpoint}`);
  
  try {
    const response = await fetch(`${BASE_URL}${scenario.endpoint}`, {
      method: scenario.method,
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-timestamp': Math.floor(Date.now() / 1000).toString(),
        'x-webhook-signature': 'test-signature' // For development testing
      },
      body: JSON.stringify(scenario.payload)
    });
    
    const result = await response.json();
    
    console.log(`✅ Status: ${response.status} ${response.ok ? 'SUCCESS' : 'FAILED'}`);
    console.log(`📊 Response:`, JSON.stringify(result, null, 2));
    
    return { success: response.ok, result, status: response.status };
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function createTestOrder() {
  console.log('\n🔨 Creating test order for failure testing...');
  
  const testOrderPayload = {
    userId: 'test-user-id',
    customerInfo: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      mobileNumber: '9876543210',
      addressLine1: '123 Test Street',
      city: 'Hyderabad',
      state: 'Telangana',
      zipCode: '500001',
      country: 'India'
    },
    orderItems: [
      {
        juiceId: 1,
        juiceName: 'Orange Juice',
        quantity: 2,
        pricePerItem: 120
      }
    ],
    totalAmount: 240,
    paymentMethod: 'cashfree',
    couponCode: null
  };
  
  try {
    const response = await fetch(`${BASE_URL}/api/orders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testOrderPayload)
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log(`✅ Test order created: ${result.data.id}`);
      return result.data.id;
    } else {
      console.log(`⚠️  Order creation failed: ${result.message}`);
      return 'test-order-123'; // Fallback test order ID
    }
  } catch (error) {
    console.log(`⚠️  Using fallback test order ID due to error: ${error.message}`);
    return 'test-order-123';
  }
}

async function testPaymentFailurePage() {
  console.log('\n🌐 Testing Payment Failure Page...');
  console.log(`📄 Page URL: ${BASE_URL}/payment-failed?order_id=${TEST_ORDER_ID}&amount=${TEST_AMOUNT}&reason=Test%20failure`);
  console.log('👆 Open this URL in your browser to test the payment failure page');
}

async function runAllTests() {
  console.log('🚀 Starting Payment Failure Tests...');
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`🧪 Using test order: ${TEST_ORDER_ID}`);
  
  const results = [];
  
  // Run all test scenarios
  for (const scenario of testScenarios) {
    const result = await runTest(scenario);
    results.push({ scenario: scenario.name, ...result });
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Test the payment failure page
  await testPaymentFailurePage();
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.scenario} (${result.status || 'N/A'})`);
  });
  
  console.log('\n🔍 Additional Testing:');
  console.log('- Visit /test-webhook in your browser for interactive testing');
  console.log('- Check your email for failure notifications');
  console.log('- Monitor the browser console for detailed logs');
  console.log('- Test the payment failure page with different parameters');
  
  console.log('\n✨ Testing completed!');
}

// Check if running as script
if (typeof window === 'undefined') {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, testScenarios };
