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
  console.log('=== WEBHOOK HANDLER START ===');
  console.log('Event method:', event.httpMethod);
  console.log('Event headers:', JSON.stringify(event.headers, null, 2));
  console.log('Event body length:', event.body?.length || 0);
  console.log('Webhook POST handler invoked');

  // Rate limiting logic
  const ip = event.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();
  if (!ipRequestCounts[ip] || now - ipRequestCounts[ip].timestamp > rateLimitWindowMs) {
    ipRequestCounts[ip] = { count: 1, timestamp: now };
  } else {
    ipRequestCounts[ip].count += 1;
  }
  console.log(`[RateLimit] IP: ${ip}, Count: ${ipRequestCounts[ip].count}, Timestamp: ${new Date(ipRequestCounts[ip].timestamp).toISOString()}`);
  if (ipRequestCounts[ip].count > maxRequestsPerWindow) {
    console.warn(`Rate limit exceeded for IP: ${ip}`);
    return {
      statusCode: 429,
      body: JSON.stringify({ success: false, message: 'Too Many Requests' }),
    };
  }

  // Get headers
  const signature = event.headers['x-webhook-signature'];
  const timestamp = event.headers['x-webhook-timestamp'];
  const clientSecret = process.env.CASHFREE_SECRET_KEY;

  // Read raw body
  const rawBody = event.body;

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
  console.log('Webhook event_time:', event_time);  // Process payment events (both success and failure)
  if ((type === 'PAYMENT_SUCCESS_WEBHOOK' || type === 'PAYMENT_FAILED_WEBHOOK') && data?.order?.order_id) {
    const cashfreeOrderId = data.order.order_id; // e.g., 'elixr_0528303b-233b-41f3-aece-9c5b1385e84b'
    const internalOrderId = cashfreeOrderId.replace(/^elixr_/, ''); // Remove prefix to get your internal order ID
    console.log(`Processing ${type} for cashfreeOrderId: ${cashfreeOrderId}, internalOrderId: ${internalOrderId}`);
      // Determine order status based on webhook type - using proper status values
    const orderStatus = type === 'PAYMENT_SUCCESS_WEBHOOK' ? 'Payment Success' : 'Payment Failed';
    console.log('Setting order status to:', orderStatus);
    
    try {
      // First, update the order status in the database
      const { data: updateResult, error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: orderStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', internalOrderId)
        .select();
      
      console.log('Order status update result:', updateResult, updateError);
      
      if (updateError) {
        console.error('Error updating order status:', updateError);
        // Log more details about the error
        console.error('Update error details:', JSON.stringify(updateError, null, 2));
        return {
          statusCode: 500,
          body: JSON.stringify({ success: false, message: 'Failed to update order status', error: updateError.message }),
        };
      }      // Fetch order details from Supabase using internal order ID
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', internalOrderId)
        .single();
      
      console.log('Supabase order fetch result:', order, error);
      if (error || !order) {
        console.error('Order not found or Supabase error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return {
          statusCode: 404,
          body: JSON.stringify({ success: false, message: 'Order not found', error: error?.message }),
        };
      }

      console.log('Order found successfully:', { 
        id: order.id, 
        order_type: order.order_type, 
        status: order.status,
        email: order.email,
        total_amount: order.total_amount 
      });

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
          const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));
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
            console.log('Subscription created successfully:', subscriptionResult.data.subscription.id);
          }
        } catch (subscriptionError) {
          console.error('Error creating subscription in webhook:', subscriptionError);
          // Continue with the webhook processing even if subscription creation fails
        }
      }      // Extract user email from all possible locations
      const userEmail =
        order.email ||
        order.customer_email ||
        order.shipping_address?.email ||
        order.customerInfo?.email ||
        order.customerinfo?.email;
      
      console.log('Extracted user email:', userEmail);
      
      if (!userEmail) {
        console.error('No user email found in order:', {
          order_id: order.id,
          email: order.email,
          customer_email: order.customer_email,
          shipping_address_email: order.shipping_address?.email
        });
        return {
          statusCode: 400,
          body: JSON.stringify({ success: false, message: 'No user email found in order' }),
        };
      }      // Only send email for successful payments
      if (type === 'PAYMENT_SUCCESS_WEBHOOK') {
        console.log('Payment successful - sending confirmation emails...');
        
        // Prepare payload for the robust email API (no longer need orderDetails)
        const emailPayload = {
          orderId: order.id,
          userEmail: userEmail // Optional - API will fetch from DB if not provided
        };
        
        console.log('Calling /api/send-order-email with payload:', emailPayload);
        
        try {
          // Call Next.js API route to send email
          const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));
          const apiUrl = process.env.SEND_ORDER_EMAIL_API_URL || 'https://develixr.netlify.app/api/send-order-email';
          const emailRes = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailPayload),
          });
          
          const emailResult = await emailRes.json();
          console.log('Email API response:', emailResult);
          
          if (!emailResult.success) {
            console.error('Email sending failed:', emailResult.error);
            console.error('Email errors:', emailResult.errors);
            // Don't fail the webhook if email fails, just log it
            console.warn('Continuing webhook processing despite email failure');
          } else {
            console.log('Emails sent successfully:', {
              userEmailSent: emailResult.userEmailSent,
              adminEmailSent: emailResult.adminEmailSent
            });
          }
        } catch (emailError) {
          console.error('Error calling email API:', emailError);
          // Don't fail the webhook if email fails, just log it
          console.warn('Continuing webhook processing despite email API error');
        }
      } else {
        console.log('Payment failed - skipping email notification');
      }    } catch (err) {
      console.error('Error processing payment webhook:', err);
      console.error('Error stack:', err.stack);
      console.error('Error details:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
      
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          success: false, 
          message: 'Webhook processing error',
          error: err.message,
          timestamp: new Date().toISOString()
        }),
      };
    }  } else {
    console.log('Webhook type did not match or missing order_id. Skipping processing.');
    console.log('Expected: PAYMENT_SUCCESS_WEBHOOK or PAYMENT_FAILED_WEBHOOK');
    console.log('Received type:', type);
    console.log('Order ID present:', !!data?.order?.order_id);
  }

  console.log('=== WEBHOOK HANDLER END ===');
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, timestamp: new Date().toISOString() }),
  };
};
