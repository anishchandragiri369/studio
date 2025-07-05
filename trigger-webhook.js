require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Use node's built-in fetch (Node 18+) or import
let fetch;
try {
  fetch = globalThis.fetch;
} catch {
  fetch = require('node-fetch');
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateOrderAndTriggerWebhook() {
  console.log('Updating order status and triggering webhook...');
  
  try {
    // Get the most recent order
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (!orders || orders.length === 0) {
      console.log('No orders found');
      return;
    }
    
    const order = orders[0];
    console.log('Order to process:', order.id, 'Status:', order.status);
    
    // Update order status to Payment Success if it's not already
    if (order.status !== 'Payment Success') {
      const { error } = await supabaseAdmin
        .from('orders')
        .update({ status: 'Payment Success' })
        .eq('id', order.id);
      
      if (error) {
        console.error('Error updating order status:', error);
        return;
      }
      console.log('Order status updated to Payment Success');
    }
    
    // Simulate webhook payload
    const webhookPayload = {
      type: 'PAYMENT_SUCCESS_WEBHOOK',
      data: {
        order: {
          order_id: `elixr_${order.id}`,
          order_amount: order.total,
          order_status: 'PAID'
        },
        payment: {
          payment_status: 'SUCCESS',
          payment_amount: order.total
        }
      },
      event_time: new Date().toISOString()
    };
    
    console.log('Webhook payload:', JSON.stringify(webhookPayload, null, 2));
    
    // Generate proper signature
    const timestamp = Date.now().toString();
    const rawBody = JSON.stringify(webhookPayload);
    const clientSecret = process.env.CASHFREE_SECRET_KEY;
    const signingString = timestamp + rawBody;
    const signature = crypto
      .createHmac('sha256', clientSecret)
      .update(signingString)
      .digest('base64');
    
    console.log('Generated signature for timestamp:', timestamp);
    
    // Call the Netlify webhook
    const webhookUrl = 'https://develixr.netlify.app/.netlify/functions/payment-confirm';
    console.log('Calling webhook at:', webhookUrl);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': signature,
        'x-webhook-timestamp': timestamp
      },
      body: rawBody
    });
    
    const result = await response.text();
    console.log('Webhook response status:', response.status);
    console.log('Webhook response:', result);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

updateOrderAndTriggerWebhook();
