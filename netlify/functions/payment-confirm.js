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
    return generatedSignature === signature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

exports.handler = async (event) => {
  console.log('Webhook POST handler invoked');
  
  try {
    // Test environment variables
    console.log('Environment check:');
    console.log('SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('SUPABASE_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    console.log('CASHFREE_SECRET exists:', !!process.env.CASHFREE_SECRET_KEY);
    
    // Test Supabase client creation
    console.log('Creating Supabase client...');
    console.log('Supabase client created successfully');
    
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

    // Process both successful and failed payment events
    if ((type === 'PAYMENT_SUCCESS_WEBHOOK' || type === 'PAYMENT_FAILED_WEBHOOK') && data?.order?.order_id) {
      const cashfreeOrderId = data.order.order_id;
      const internalOrderId = cashfreeOrderId.replace(/^elixr_/, '');
      console.log(`Processing ${type} for internalOrderId:`, internalOrderId);

      try {
        // Determine order status based on webhook type
        const orderStatus = type === 'PAYMENT_SUCCESS_WEBHOOK' ? 'Payment Success' : 'Payment Failed';
        console.log('Updating order status to:', orderStatus);
        
        // Update order status in Supabase
        const { data: updateResult, error: updateError } = await supabase
          .from('orders')
          .update({ status: orderStatus })
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
        // If order found and updated, send appropriate notifications
        try {
          // For Netlify functions, we'll use a different approach for fetch
          const fetch = require('node-fetch');
          
          if (orderStatus === 'Payment Success') {
            // Send success confirmation email
            const apiUrl = process.env.SEND_ORDER_EMAIL_API_URL || 'http://localhost:9002/api/send-order-email';
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
          } else {
            // Send payment failure notification
            console.log('Sending payment failure notification for order:', order.id);
            const failureApiUrl = process.env.SEND_PAYMENT_FAILURE_EMAIL_API_URL || 'http://localhost:9002/api/send-payment-failure-email';
            const failureEmailPayload = {
              orderId: order.id,
              userEmail: order.email || order.customer_email || order.shipping_address?.email,
              reason: data?.payment?.payment_message || 'Payment processing failed'
            };
            console.log('Calling send-payment-failure-email API with payload:', failureEmailPayload);
            try {
              const failureEmailRes = await fetch(failureApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(failureEmailPayload),
              });
              const failureEmailResult = await failureEmailRes.json();
              console.log('Payment failure email API response:', failureEmailResult);
              if (!failureEmailResult.success) {
                console.error('Payment failure email sending failed:', failureEmailResult.errors || failureEmailResult.error);
              }
            } catch (failureEmailError) {
              console.error('Error calling send-payment-failure-email API:', failureEmailError);
            }
          }
        } catch (emailError) {
          console.error('Error calling email APIs:', emailError);
        }
        // Create subscription ONLY if payment was successful and order has subscription data
        if (
          orderStatus === 'Payment Success' &&
          (order.order_type === 'subscription' || order.order_type === 'mixed') &&
          order.subscription_info
        ) {
  console.log('Creating subscriptions for successful payment...');
  
  // Handle both old and new subscription data structures
  let subscriptionItems = [];
  
  if (Array.isArray(order.subscription_info.subscriptionItems)) {
    // New structure: array of subscription items
    subscriptionItems = order.subscription_info.subscriptionItems;
  } else if (order.subscription_info.planId) {
    // Old structure: direct subscription data
    subscriptionItems = [order.subscription_info];
  }
  
  console.log('Found subscription items:', subscriptionItems.length);
  console.log('Subscription items details:', JSON.stringify(subscriptionItems, null, 2));
  
  for (const subscriptionItem of subscriptionItems) {
    try {
      console.log('Processing subscription item:', JSON.stringify(subscriptionItem, null, 2));
      
      // Extract subscription data - handle both old and new structures
      let subscriptionData = {};
      
      if (subscriptionItem.subscriptionData) {
        // New structure: subscription data is nested
        subscriptionData = subscriptionItem.subscriptionData;
        console.log('Using nested subscriptionData:', JSON.stringify(subscriptionData, null, 2));
      } else {
        // Old structure or direct mapping
        subscriptionData = {
          planId: subscriptionItem.planId || subscriptionItem.id,
          planName: subscriptionItem.planName || subscriptionItem.name,
          planFrequency: subscriptionItem.planFrequency || 'weekly',
          selectedJuices: subscriptionItem.selectedJuices || [],
          subscriptionDuration: subscriptionItem.subscriptionDuration || 3,
          basePrice: subscriptionItem.basePrice || subscriptionItem.price || 120
        };
        console.log('Using mapped subscriptionData:', JSON.stringify(subscriptionData, null, 2));
      }
      
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
        selectedFruitBowls: subscriptionData.selectedFruitBowls || [], // Add missing fruit bowls support
        subscriptionDuration: subscriptionData.subscriptionDuration || 3,
        basePrice: subscriptionData.basePrice || subscriptionItem?.price || 120
      };

      console.log('Creating subscription with payload:', subscriptionPayload);

      // Call the subscription creation API
      const apiUrl = process.env.SUBSCRIPTION_CREATE_API_URL || 'https://develixr.netlify.app/api/subscriptions/create';
      
      console.log('Calling subscription API at:', apiUrl);

      const subscriptionRes = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscriptionPayload),
      });

      const subscriptionResult = await subscriptionRes.json();
      console.log('Subscription API response status:', subscriptionRes.status);
      console.log('Subscription creation result:', subscriptionResult);

      if (!subscriptionResult.success) {
        console.error('Failed to create subscription:', subscriptionResult.message);
        // Continue with the webhook processing even if subscription creation fails
      } else {
        console.log('Subscription created successfully:', subscriptionResult.data?.subscription?.id);
        try {
          const emailApiUrl = process.env.SEND_ORDER_EMAIL_API_URL || 'https://develixr.netlify.app/api/send-order-email';
          const emailPayload = {
            orderId: order.id,
            userEmail: order.email || order.customer_email || order.shipping_address?.email,
            orderDetails: {
              subscriptiondetails: subscriptionData.planName,
              price: subscriptionData.planPrice,
              // Add more details as needed
            }
          };
          const emailRes = await fetch(emailApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailPayload),
          });
          const emailResult = await emailRes.json();
          console.log('Subscription email API response:', emailResult);
          if (!emailResult.success) {
            console.error('Subscription email sending failed:', emailResult.errors || emailResult.error);
          }
        } catch (emailError) {
          console.error('Error calling send-order-email API for subscription:', emailError);
        }
      }
    } catch (subscriptionError) {
      console.error('Error creating subscription in webhook:', subscriptionError);
      // Continue with the webhook processing even if subscription creation fails
    }
  }
}
        // Return success regardless of email result
        return {
          statusCode: 200,
          body: JSON.stringify({ 
            success: true, 
            message: `Order updated to ${orderStatus}, webhook processed, notifications attempted.`,
            orderStatus: orderStatus
          }),
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