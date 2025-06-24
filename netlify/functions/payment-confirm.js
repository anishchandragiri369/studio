const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

// Set up Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Set up Nodemailer transporter (OAuth2 or SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.GMAIL_USER,
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    refreshToken: process.env.GMAIL_REFRESH_TOKEN, // Optional, can be refreshed
  },
});

// Signature verification function
function verifyWebhookSignature(signature, rawBody, timestamp, clientSecret) {
  try {
    if (!signature || !timestamp || !clientSecret) {
      console.log('Missing signature, timestamp, or client secret');
      return false;
    }
    const signingString = timestamp + rawBody;
    const generatedSignature = crypto
      .createHmac('sha256', clientSecret)
      .update(signingString)
      .digest('base64');
    // Debug logs
    console.log('Received signature:', signature);
    console.log('Timestamp:', timestamp);
    console.log('Client secret present:', !!clientSecret);
    console.log('Raw body:', rawBody);
    console.log('Computed signature:', generatedSignature);
    return generatedSignature === signature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

// Simple in-memory rate limiter
const rateLimitWindowMs = 60 * 1000; // 1 minute
const maxRequestsPerWindow = 30;
const ipRequestCounts = {};

exports.handler = async (event) => {
  console.log('Webhook POST handler invoked');

  try {
    console.log('=== DEBUG WEBHOOK START ===');
    console.log('Event method:', event.httpMethod);
    console.log('Event headers:', JSON.stringify(event.headers, null, 2));
    console.log('Event body length:', event.body?.length || 0);
    
    // Test basic dependencies step by step
    console.log('Testing crypto...');
    const crypto = require('crypto');
    console.log('Crypto loaded successfully');
    
    console.log('Testing nodemailer...');
    const nodemailer = require('nodemailer');
    console.log('Nodemailer loaded successfully');
    
    console.log('Testing supabase...');
    const { createClient } = require('@supabase/supabase-js');
    console.log('Supabase loaded successfully');
    
    // Test environment variables
    console.log('Environment variables check:');
    console.log('SUPABASE_URL present:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('SUPABASE_KEY present:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    console.log('CASHFREE_SECRET present:', !!process.env.CASHFREE_SECRET_KEY);
    console.log('GMAIL_USER present:', !!process.env.GMAIL_USER);
    
    // Test Supabase client creation
    console.log('Creating Supabase client...');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client created successfully');
    
    // Try to parse the body
    if (event.body) {
      console.log('Parsing body...');
      const webhookData = JSON.parse(event.body);
      console.log('Body parsed successfully:', typeof webhookData);
      console.log('Webhook type:', webhookData.type);
    }
    
    // Extract signature, timestamp, and raw body for verification
    const signature = event.headers['x-webhook-signature'] || '';
    const timestamp = event.headers['x-webhook-timestamp'] || '';
    const rawBody = event.body || '';
    const clientSecret = process.env.CASHFREE_SECRET_KEY;
    
    // Verify signature
    const isValid = verifyWebhookSignature(signature, rawBody, timestamp, clientSecret);
    if (!isValid) {
      console.log('Invalid webhook signature');
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false }),
      };
    }

    // Parse and process webhook
    let webhookData;
    try {
      webhookData = JSON.parse(rawBody);
      console.log('Parsed webhookData:', webhookData);
    } catch (error) {
      console.error('Webhook processing error:', error);
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false }),
      };
    }

    // Log event type and data
    const { type, data, event_time } = webhookData;
    console.log('Webhook type:', type);
    console.log('Webhook data:', data);
    console.log('Webhook event_time:', event_time);

    // Only process successful payment events
    if (type === 'PAYMENT_SUCCESS_WEBHOOK' && data?.order?.order_id) {
      const cashfreeOrderId = data.order.order_id;
      const internalOrderId = cashfreeOrderId.replace(/^elixr_/, '');
      console.log('Processing PAYMENT_SUCCESS_WEBHOOK for internalOrderId:', internalOrderId);

      try {
        // Update order status to 'Payment Success' in Supabase
        const { data: updateResult, error: updateError } = await supabase
          .from('orders')
          .update({ status: 'Payment Success' })
          .eq('id', internalOrderId)
          .select();
        console.log('Order status update result:', updateResult, updateError);
        if (updateError) {
          console.error('Error updating order status:', updateError);
          return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: 'Failed to update order status', error: updateError.message }),
          };
        }
        // Fetch the updated order to confirm
        const { data: order, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', internalOrderId)
          .single();
        console.log('Supabase order fetch result:', order, error);
        if (error || !order) {
          console.error('Order not found or Supabase error:', error);
          return {
            statusCode: 404,
            body: JSON.stringify({ success: false, message: 'Order not found' }),
          };
        }
        // If order found and updated, send confirmation email
        try {
          const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));
          const apiUrl = process.env.SEND_ORDER_EMAIL_API_URL || 'https://develixr.netlify.app/api/send-order-email';
          const emailPayload = {
            orderId: order.id,
            userEmail: order.email || order.customer_email || order.shipping_address?.email
          };
          console.log('Calling send-order-email API with payload:', emailPayload);
          const emailRes = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailPayload),
          });
          const emailResult = await emailRes.json();
          console.log('Email API response:', emailResult);
          if (!emailResult.success) {
            console.error('Email sending failed:', emailResult.errors || emailResult.error);
          }
        } catch (emailError) {
          console.error('Error calling send-order-email API:', emailError);
        }
        // Create subscription ONLY if payment was successful and order has subscription data
        if (type === 'PAYMENT_SUCCESS_WEBHOOK' && order.order_type === 'subscription' && order.subscription_info) {
          console.log('Creating subscription for successful payment...');
          try {
            const subscriptionData = order.subscription_info;
            const customerInfo = order.shipping_address || {};

            const subscriptionPayload = {
              userId: order.user_id,
              planId: subscriptionData.planId,
              planName: subscriptionData.planName,
              planPrice: subscriptionData.planPrice,
              planFrequency: subscriptionData.planFrequency,
              customerInfo: {
                name: customerInfo.firstName ? `${customerInfo.firstName} ${customerInfo.lastName || ''}`.trim() : customerInfo.name,
                email: order.email || customerInfo.email,
                phone: customerInfo.mobileNumber || customerInfo.phone,
                ...customerInfo
              },
              selectedJuices: subscriptionData.selectedJuices || [],
              subscriptionDuration: subscriptionData.subscriptionDuration || 3,
              basePrice: subscriptionData.basePrice || 120
            };

            console.log('Creating subscription with payload:', subscriptionPayload);

            // Call the subscription creation API
            const apiUrl = process.env.SUBSCRIPTION_CREATE_API_URL || 'https://develixr.netlify.app/api/subscriptions/create';

            const subscriptionRes = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(subscriptionPayload),
            });

            const subscriptionResult = await subscriptionRes.json();
            console.log('Subscription creation result:', subscriptionResult);

            if (!subscriptionResult.success) {
              console.error('Failed to create subscription:', subscriptionResult.message);
              // Continue with the webhook processing even if subscription creation fails
            } else {
              console.log('Subscription created successfully:', subscriptionResult.data?.subscription?.id);
            }
          } catch (subscriptionError) {
            console.error('Error creating subscription in webhook:', subscriptionError);
            // Continue with the webhook processing even if subscription creation fails
          }
        }
        // Return success regardless of email result
        return {
          statusCode: 200,
          body: JSON.stringify({ success: true, message: 'Order updated to Payment Success, webhook processed, email attempted.' }),
        };
      } catch (err) {
        console.error('Error updating/fetching order:', err);
        return {
          statusCode: 500,
          body: JSON.stringify({ success: false, message: 'Order update/fetch error', error: err.message }),
        };
      }
    } else {
      console.log('Webhook type did not match or missing order_id. Skipping order logic.');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error('Unhandled error in webhook handler:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Unhandled error', error: err.message }),
    };
  }
};