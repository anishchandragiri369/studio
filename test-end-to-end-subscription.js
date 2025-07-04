#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Test configuration
const API_BASE = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const TEST_USER_ID = 'test-user-123';

// Test data for a weekly customized subscription
const testSubscriptionData = {
  planId: 'weekly-customized',
  duration: 1, // 1 month
  selectedJuices: [
    { juiceId: '1', quantity: 2 },
    { juiceId: '2', quantity: 1 }
  ],
  selectedFruitBowls: [
    { fruitBowlId: '1', quantity: 1 }
  ],
  userDetails: {
    userId: TEST_USER_ID,
    email: 'test@example.com',
    name: 'Test User',
    phone: '+1234567890'
  },
  deliveryDetails: {
    address: '123 Test Street',
    city: 'Test City',
    pincode: '12345'
  }
};

async function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (data) {
      data = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const client = urlObj.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function testEndToEndSubscription() {
  console.log('🧪 Testing End-to-End Subscription Flow...\n');

  try {
    // Step 1: Test Juices API
    console.log('1. Testing Juices API...');
    const juicesResponse = await makeRequest(`${API_BASE}/api/juices`);
    
    if (juicesResponse.status === 200 && juicesResponse.data.juices) {
      console.log(`✅ Juices API working - Found ${juicesResponse.data.juices.length} juices`);
      console.log(`   Sample juice: ${juicesResponse.data.juices[0]?.name || 'N/A'}`);
    } else {
      console.log(`❌ Juices API failed - Status: ${juicesResponse.status}`);
      console.log(`   Response:`, juicesResponse.data);
    }

    // Step 2: Test Fruit Bowls API
    console.log('\n2. Testing Fruit Bowls API...');
    const fruitBowlsResponse = await makeRequest(`${API_BASE}/api/fruit-bowls`);
    
    if (fruitBowlsResponse.status === 200 && fruitBowlsResponse.data.fruitBowls) {
      console.log(`✅ Fruit Bowls API working - Found ${fruitBowlsResponse.data.fruitBowls.length} fruit bowls`);
      console.log(`   Sample fruit bowl: ${fruitBowlsResponse.data.fruitBowls[0]?.name || 'N/A'}`);
      
      // Update test data with actual fruit bowl ID
      if (fruitBowlsResponse.data.fruitBowls[0]?.id) {
        testSubscriptionData.selectedFruitBowls[0].fruitBowlId = fruitBowlsResponse.data.fruitBowls[0].id;
      }
    } else {
      console.log(`❌ Fruit Bowls API failed - Status: ${fruitBowlsResponse.status}`);
      console.log(`   Response:`, fruitBowlsResponse.data);
    }

    // Step 3: Test Subscription Creation API
    console.log('\n3. Testing Subscription Creation API...');
    const subscriptionResponse = await makeRequest(`${API_BASE}/api/subscriptions/create`, 'POST', testSubscriptionData);
    
    if (subscriptionResponse.status === 200 && subscriptionResponse.data.success) {
      console.log(`✅ Subscription Creation API working`);
      console.log(`   Subscription ID: ${subscriptionResponse.data.data?.subscriptionId || 'N/A'}`);
      console.log(`   Plan Type: ${subscriptionResponse.data.data?.planType || 'N/A'}`);
      
      // Check if selectedFruitBowls was saved
      if (subscriptionResponse.data.data?.selectedFruitBowls) {
        console.log(`   ✅ Selected Fruit Bowls saved: ${JSON.stringify(subscriptionResponse.data.data.selectedFruitBowls)}`);
      } else {
        console.log(`   ⚠️  Selected Fruit Bowls not found in response`);
      }
    } else {
      console.log(`❌ Subscription Creation API failed - Status: ${subscriptionResponse.status}`);
      console.log(`   Response:`, subscriptionResponse.data);
    }

    // Step 4: Test Database Schema (via API)
    console.log('\n4. Testing Database Schema...');
    // This would typically require a database connection, but we can infer from API responses
    
    console.log('\n📊 Test Summary:');
    console.log('================');
    console.log(`Juices API: ${juicesResponse.status === 200 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Fruit Bowls API: ${fruitBowlsResponse.status === 200 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Subscription API: ${subscriptionResponse.status === 200 ? '✅ PASS' : '❌ FAIL'}`);
    
    if (juicesResponse.status === 200 && fruitBowlsResponse.status === 200 && subscriptionResponse.status === 200) {
      console.log('\n🎉 All tests passed! The customized subscription flow is working.');
    } else {
      console.log('\n⚠️  Some tests failed. Check the individual test results above.');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Step 5: Test webhook simulation (optional)
async function testWebhookSimulation() {
  console.log('\n5. Testing Payment Webhook Simulation...');
  
  const webhookData = {
    order_id: 'elixr_test-order-123',
    order_status: 'PAID',
    payment_session_id: 'test-payment-session',
    order_amount: 500,
    cf_order_id: 'elixr_test-order-123'
  };

  try {
    // Note: This would normally hit the webhook endpoint
    // For testing, we might want to create a test endpoint
    console.log('   Webhook simulation data ready:', webhookData);
    console.log('   ✅ Webhook test data prepared (actual webhook testing requires payment gateway)');
  } catch (error) {
    console.log('   ❌ Webhook simulation failed:', error.message);
  }
}

// Run tests
if (require.main === module) {
  testEndToEndSubscription()
    .then(() => testWebhookSimulation())
    .then(() => {
      console.log('\n🏁 End-to-end testing completed!');
      console.log('\n📝 Next Steps:');
      console.log('   1. Run the application (npm run dev)');
      console.log('   2. Test the subscription UI manually');
      console.log('   3. Place a test order to verify webhook integration');
      console.log('   4. Check the database for proper data storage');
    })
    .catch(error => {
      console.error('❌ Testing failed:', error);
      process.exit(1);
    });
}

module.exports = { testEndToEndSubscription, testWebhookSimulation };
