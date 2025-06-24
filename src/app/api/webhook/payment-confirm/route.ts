import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Set up Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

// Set up Nodemailer transporter (OAuth2 or SMTP)
// (transporter is not used in this file, so it is removed to avoid unused variable warning)

// Signature verification function
function verifyWebhookSignature(
  signature: string,
  rawBody: string,
  timestamp: string,
  clientSecret: string
): boolean {
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

// Rate limiting and handler logic moved outside the function above
const rateLimitWindowMs = 60 * 1000; // 1 minute
const maxRequestsPerWindow = 30;
type IpRequestCount = { count: number; timestamp: number };
const ipRequestCounts: Record<string, IpRequestCount> = {};

export const handler = async (event: {
  headers: Record<string, string | undefined>;
  body: string;
}) => {
  console.log('Webhook POST handler invoked');

  // Rate limiting logic
  const ip = event.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();
  if (!ipRequestCounts[ip] || now - ipRequestCounts[ip].timestamp > rateLimitWindowMs) {
    ipRequestCounts[ip] = { count: 1, timestamp: now };
  } else {
    ipRequestCounts[ip].count += 1;
  }
  console.log(
    `[RateLimit] IP: ${ip}, Count: ${ipRequestCounts[ip].count}, Timestamp: ${new Date(
      ipRequestCounts[ip].timestamp
    ).toISOString()}`
  );
  if (ipRequestCounts[ip].count > maxRequestsPerWindow) {
    console.warn(`Rate limit exceeded for IP: ${ip}`);
    return {
      statusCode: 429,
      body: JSON.stringify({ success: false, message: 'Too Many Requests' }),
    };
  }

  // Get headers
  const signature = event.headers['x-webhook-signature'] as string;
  const timestamp = event.headers['x-webhook-timestamp'] as string;
  const clientSecret = process.env.CASHFREE_SECRET_KEY as string;

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
  let webhookData: any;
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
    const cashfreeOrderId = data.order.order_id; // e.g., 'elixr_0528303b-233b-41f3-aece-9c5b1385e84b'
    const internalOrderId = cashfreeOrderId.replace(/^elixr_/, ''); // Remove prefix to get your internal order ID
    console.log('Processing PAYMENT_SUCCESS_WEBHOOK for internalOrderId:', internalOrderId);
    try {
      // Fetch order details from Supabase using internal order ID
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
      // Extract user email from all possible locations
      const userEmail =
        order.email ||
        order.customer_email ||
        order.shipping_address?.email ||
        order.customerInfo?.email ||
        order.customerinfo?.email;
      if (!userEmail) {
        console.error('No user email found in order:', order);
        return {
          statusCode: 400,
          body: JSON.stringify({ success: false, message: 'No user email found in order' }),
        };
      }
      // Extract order details from items array
      const firstItem = Array.isArray(order.items) && order.items.length > 0 ? order.items[0] : {};
      const juiceName = firstItem.juiceName || firstItem.name || '';
      const price = firstItem.price || '';
      // Prepare payload for Next.js API
      const emailPayload = {
        orderId: order.id,
        userEmail,
        orderDetails: {
          juiceName,
          price,
        },
      };
      console.log('Calling /api/send-order-email with payload:', emailPayload);
      const apiUrl =
        process.env.SEND_ORDER_EMAIL_API_URL ||
        'https://develixr.netlify.app/api/send-order-email';
      const emailRes = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload),
      });
      const emailResult = (await emailRes.json()) as { success: boolean; error?: string };
      console.log('Email API response:', emailResult);
      if (!emailResult.success) {
        throw new Error(emailResult.error || 'Email API failed');
      }
    } catch (err) {
      console.error('Error sending order confirmation email:', err);
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, message: 'Email send error' }),
      };
    }
  } else {
    console.log('Webhook type did not match or missing order_id. Skipping email logic.');
  }
};
