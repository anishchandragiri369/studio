// src/app/api/webhook/payment-confirm/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

// Signature verification function
function verifyWebhookSignature(signature: string | null, rawBody: string, timestamp: string | null, clientSecret: string | undefined) {
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
    return generatedSignature === signature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json(
      { success: false, message: 'Supabase connection error on server.' },
      { status: 503 } // Service Unavailable
    );
  }

  // Get headers
  const signature = request.headers.get('x-webhook-signature');
  const timestamp = request.headers.get('x-webhook-timestamp');
  const clientSecret = process.env.CASHFREE_CLIENT_SECRET;

  // Read raw body
  const rawBody = await request.text();

  // Verify signature
  const isValid = verifyWebhookSignature(signature, rawBody, timestamp, clientSecret);
  if (!isValid) {
    console.log('Invalid webhook signature');
    return NextResponse.json({ success: false }, { status: 401 });
  }

  // Parse and process webhook
  let webhookData: any;
  try {
    webhookData = JSON.parse(rawBody);
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ success: false }, { status: 400 });
  }

  // Example: process the webhook
  const { type, data, event_time } = webhookData;
  console.log(`Processing webhook: ${type} at ${event_time}`);

  // Your webhook processing logic here (e.g., update order, send email, etc.)

  return NextResponse.json({ success: true });
}

// Optional: Handle OPTIONS requests for CORS preflight, mainly if this endpoint were to be called from a browser context (unlikely for typical webhooks).
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204, // No Content
    headers: {
      'Access-Control-Allow-Origin': '*', // Be more specific in production
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization', // Add Authorization if you plan to secure webhook
    },
  });
}
