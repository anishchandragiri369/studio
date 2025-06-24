// Webhook Test Utility for Cashfree Payment Confirmation
// This file can be used to test the webhook locally or debug webhook issues

const crypto = require('crypto');

// Test data structure for a successful payment
const testWebhookData = {
  type: 'PAYMENT_SUCCESS_WEBHOOK',
  event_time: new Date().toISOString(),
  data: {
    order: {
      order_id: 'elixr_test-order-12345', // This would be your actual order ID with elixr_ prefix
      order_amount: 299.00,
      order_currency: 'INR',
      order_status: 'PAID'
    },
    payment: {
      payment_status: 'SUCCESS',
      payment_amount: 299.00,
      payment_currency: 'INR',
      payment_message: 'Transaction successful',
      payment_time: new Date().toISOString()
    }
  }
};

// Function to generate webhook signature for testing
function generateWebhookSignature(rawBody, timestamp, clientSecret) {
  const signingString = timestamp + rawBody;
  return crypto
    .createHmac('sha256', clientSecret)
    .update(signingString)
    .digest('base64');
}

// Test function to simulate webhook call
async function testWebhook() {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const rawBody = JSON.stringify(testWebhookData);
  const clientSecret = process.env.CASHFREE_SECRET_KEY || 'test-secret-key';
  const signature = generateWebhookSignature(rawBody, timestamp, clientSecret);

  console.log('=== WEBHOOK TEST ===');
  console.log('Timestamp:', timestamp);
  console.log('Raw Body:', rawBody);
  console.log('Generated Signature:', signature);
  console.log('Client Secret Present:', !!clientSecret);

  // Simulate the event object that Netlify would pass
  const testEvent = {
    httpMethod: 'POST',
    headers: {
      'x-webhook-signature': signature,
      'x-webhook-timestamp': timestamp,
      'content-type': 'application/json'
    },
    body: rawBody
  };

  // Import and test the webhook handler
  try {
    const { handler } = require('./payment-confirm');
    const result = await handler(testEvent);
    
    console.log('=== WEBHOOK TEST RESULT ===');
    console.log('Status Code:', result.statusCode);
    console.log('Body:', result.body);
    
    if (result.statusCode === 200) {
      console.log('✅ Webhook test PASSED');
    } else {
      console.log('❌ Webhook test FAILED');
    }
  } catch (error) {
    console.error('❌ Webhook test ERROR:', error);
  }
}

// Common webhook debugging tips
function debugWebhookIssues() {
  console.log(`
=== WEBHOOK DEBUGGING CHECKLIST ===

1. Environment Variables:
   - NEXT_PUBLIC_SUPABASE_URL: ${!!process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌'}
   - NEXT_PUBLIC_SUPABASE_ANON_KEY: ${!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌'}
   - CASHFREE_SECRET_KEY: ${!!process.env.CASHFREE_SECRET_KEY ? '✅' : '❌'}
   - GMAIL_USER: ${!!process.env.GMAIL_USER ? '✅' : '❌'}
   - GMAIL_CLIENT_ID: ${!!process.env.GMAIL_CLIENT_ID ? '✅' : '❌'}
   - GMAIL_CLIENT_SECRET: ${!!process.env.GMAIL_CLIENT_SECRET ? '✅' : '❌'}
   - GMAIL_REFRESH_TOKEN: ${!!process.env.GMAIL_REFRESH_TOKEN ? '✅' : '❌'}
   - ADMIN_EMAIL: ${!!process.env.ADMIN_EMAIL ? '✅' : '❌'}

2. Common Issues:
   - Order not found: Check if order ID exists in Supabase orders table
   - Status update failure: Check if status column accepts the values 'Payment Success'/'Payment Failed'
   - Email sending failure: Check Gmail OAuth2 configuration
   - Signature verification: Ensure CASHFREE_SECRET_KEY is correct

3. Database Schema:
   - Orders table should have: id, status, email, items, total_amount, order_type, subscription_info
   - Status field should accept: 'Payment Pending', 'Payment Success', 'Payment Failed'

4. Test Steps:
   - Create a test order through checkout
   - Check order exists in database with 'Payment Pending' status
   - Use the test function below with the actual order ID
   - Monitor webhook logs in Netlify Functions dashboard
  `);
}

// Export functions for use
module.exports = {
  testWebhookData,
  generateWebhookSignature,
  testWebhook,
  debugWebhookIssues
};

// Run debug info if called directly
if (require.main === module) {
  debugWebhookIssues();
  
  // Uncomment to run test
  // testWebhook();
}
