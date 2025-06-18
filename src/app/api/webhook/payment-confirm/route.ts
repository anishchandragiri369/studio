// src/app/api/webhook/payment-confirm/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import crypto from 'crypto';

interface WebhookOrderItem {
  juiceId: string;
  quantity: number;
}

interface WebhookRequestBody {
  orderId: string; // Example: "order_12345"
  items: WebhookOrderItem[]; // Example: [{ "juiceId": "1", "quantity": 2 }, { "juiceId": "3", "quantity": 1 }]
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured || !supabase) {
    console.error("Payment Webhook Error: Supabase is not configured.");
    return NextResponse.json(
      { success: false, message: 'Supabase connection error on server.' },
      { status: 503 } // Service Unavailable
    );
  }

  // --- Signature Verification for Cashfree Webhook ---
  // See: https://dev.cashfree.com/docs/webhooks/#security
  const signature = request.headers.get('x-webhook-signature');
  if (!signature) {
    console.error('[Webhook] Missing x-webhook-signature header');
    // Still return 200 OK to avoid repeated attempts, but log for security
    return NextResponse.json({ success: true });
  }

  // You must set this to your Cashfree webhook secret (from Cashfree dashboard)
  const CASHFREE_WEBHOOK_SECRET = process.env.CASHFREE_WEBHOOK_SECRET;
  if (!CASHFREE_WEBHOOK_SECRET) {
    console.error('[Webhook] CASHFREE_WEBHOOK_SECRET not set in environment');
    return NextResponse.json({ success: true });
  }

  // Read the raw body for signature verification
  let rawBody = '';
  try {
    rawBody = await request.text();
  } catch (e) {
    console.error('[Webhook] Failed to read raw body for signature verification:', e);
    return NextResponse.json({ success: true });
  }

  // Verify signature (HMAC SHA256)
  const computedSignature = crypto
    .createHmac('sha256', CASHFREE_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('base64');

  if (signature !== computedSignature) {
    console.error('[Webhook] Invalid webhook signature');
    return NextResponse.json({ success: true });
  }

  // Parse JSON body after signature verification
  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch (e) {
    console.error('[Webhook] Failed to parse JSON body after signature verification:', e);
    body = null;
  }
  console.log('[Webhook] Raw payload received:', JSON.stringify(body));

  // Always return 200 OK as soon as possible to acknowledge receipt
  // (You can do further processing asynchronously if needed)
  // Extract orderId as before
  let orderId = body?.orderId || null;
  if (!orderId) {
    const url = new URL(request.url);
    orderId = url.searchParams.get('order_id');
    console.log('[Webhook] Fallback order_id from query params:', orderId);
  }
  if (!orderId && body) {
    orderId = body.order_id || body.reference_id || body.data?.order?.order_id || null;
    console.log('[Webhook] Fallback orderId from Cashfree fields:', orderId);
  }

  // Respond 200 OK immediately
  const ackResponse = NextResponse.json({ success: true });

  // Do further processing asynchronously
  (async () => {
    try {
      // Fetch order details from DB
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      if (error || !order) {
        console.error('[Webhook] Order not found for email:', error);
        return;
      }
      const userEmail = order.shipping_address?.email;
      if (!userEmail) {
        console.error('[Webhook] No user email found in order.shipping_address');
        return;
      }
      // Send order confirmation email
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/send-order-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          userEmail,
          orderDetails: order,
        }),
      });
      console.log('[Webhook] Order confirmation email sent for order:', orderId);
    } catch (err) {
      console.error('[Webhook] Error in async email logic:', err);
    }
  })();

  return ackResponse;
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
