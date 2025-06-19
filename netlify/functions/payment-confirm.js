const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

// Set up Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Set up Nodemailer transporter (OAuth2 or SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_FROM,
    clientId: process.env.EMAIL_CLIENT_ID,
    clientSecret: process.env.EMAIL_CLIENT_SECRET,
    refreshToken: process.env.EMAIL_REFRESH_TOKEN,
    accessToken: process.env.EMAIL_ACCESS_TOKEN, // Optional, can be refreshed
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
  const clientSecret = process.env.CASHFREE_CLIENT_SECRET;

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
  } catch (error) {
    console.error('Webhook processing error:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false }),
    };
  }

  // Example: process the webhook
  const { type, data, event_time } = webhookData;
  console.log(`Processing webhook: ${type} at ${event_time}`);

  // Only process successful payment events
  if (type === 'PAYMENT_SUCCESS_WEBHOOK' && data && data.order_id) {
    const orderId = data.order_id;
    try {
      // Fetch order details from Supabase
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      if (error || !order) {
        console.error('Order not found or Supabase error:', error);
        return {
          statusCode: 404,
          body: JSON.stringify({ success: false, message: 'Order not found' }),
        };
      }
      // Prepare email
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: order.email,
        subject: `Order Confirmation - Order #${order.id}`,
        text: `Thank you for your order! Your order ID is ${order.id}.`,
        html: `<h2>Thank you for your order!</h2><p>Your order ID is <b>${order.id}</b>.</p>`,
      };
      // Send email
      await transporter.sendMail(mailOptions);
      console.log('Order confirmation email sent to', order.email);
    } catch (err) {
      console.error('Error sending order confirmation email:', err);
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, message: 'Email send error' }),
      };
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
  };
};
