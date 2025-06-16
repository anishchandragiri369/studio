// src/app/api/webhook/payment-confirm/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

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

  try {
    let body: any;
    try {
      body = await request.json();
    } catch (e) {
      console.error('[Webhook] Failed to parse JSON body:', e);
      body = null;
    }
    console.log('[Webhook] Raw payload received:', JSON.stringify(body));

    // Fallback: If body is null, try to get order_id from query params (for Cashfree GET/POST fallback)
    let orderId = body?.orderId || null;
    let items = body?.items || [];
    if (!orderId) {
      const url = new URL(request.url);
      orderId = url.searchParams.get('order_id');
      console.log('[Webhook] Fallback order_id from query params:', orderId);
    }

    // Cashfree sends POST with their own format. Try to extract orderId from known fields.
    if (!orderId && body) {
      orderId = body.order_id || body.reference_id || body.data?.order?.order_id || null;
      console.log('[Webhook] Fallback orderId from Cashfree fields:', orderId);
    }

    // If items are not present, try to fetch them from the order in DB (for Cashfree payloads)
    if ((!items || items.length === 0) && orderId) {
      const { data: orderData, error: orderFetchError } = await supabase
        .from('orders')
        .select('items')
        .eq('id', orderId)
        .single();
      if (orderData && orderData.items) {
        items = orderData.items;
        console.log('[Webhook] Fetched items from DB for order:', orderId);
      } else {
        console.warn('[Webhook] Could not fetch items for order:', orderId, orderFetchError);
      }
    }

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'No orderId found in webhook payload or query.' },
        { status: 400 }
      );
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No items found for order. Cannot update stock.' },
        { status: 400 }
      );
    }

    console.log(`[Webhook] Processing payment confirmation for order: ${orderId}`);

    const updateResults = [];

    for (const item of items) {
      if (!item.juiceId || typeof item.quantity !== 'number' || item.quantity <= 0) {
        console.warn(`[Webhook] Invalid item data in order ${orderId}:`, item);
        updateResults.push({ juiceId: item.juiceId, success: false, message: 'Invalid item data (juiceId or quantity).' });
        continue;
      }
      // 1. Fetch current stock
      const { data: currentJuiceData, error: fetchError } = await supabase
        .from('juices')
        .select('stock_quantity, name')
        .eq('id', item.juiceId)
        .single();
      if (fetchError || !currentJuiceData) {
        console.error(`[Webhook] Error fetching stock for juiceId ${item.juiceId} (Order: ${orderId}):`, fetchError?.message || 'Juice not found');
        updateResults.push({ juiceId: item.juiceId, success: false, message: `Failed to fetch stock for ${item.juiceId}. ${fetchError?.message || 'Juice not found.'}` });
        continue;
      }
      const currentStock = currentJuiceData.stock_quantity ?? 0;
      const juiceName = currentJuiceData.name || item.juiceId;
      const newStock = currentStock - item.quantity;
      if (newStock < 0) {
        console.warn(`[Webhook] Insufficient stock for ${juiceName} (ID: ${item.juiceId}) in order ${orderId}. Required: ${item.quantity}, Available: ${currentStock}. Stock will NOT go negative. Update skipped.`);
        updateResults.push({
          juiceId: item.juiceId,
          juiceName,
          success: false,
          message: `Insufficient stock for ${juiceName}. Required: ${item.quantity}, Available: ${currentStock}. Stock not updated.`
        });
        continue;
      }
      // 2. Update stock
      const { error: updateError } = await supabase
        .from('juices')
        .update({ stock_quantity: newStock })
        .eq('id', item.juiceId);
      if (updateError) {
        console.error(`[Webhook] Error updating stock for ${juiceName} (ID: ${item.juiceId}) in order ${orderId}:`, updateError.message);
        updateResults.push({ juiceId: item.juiceId, juiceName, success: false, message: `Failed to update stock for ${juiceName}. ${updateError.message}` });
      } else {
        console.log(`[Webhook] Stock updated for ${juiceName} (ID: ${item.juiceId}). Old: ${currentStock}, New: ${newStock}. Order: ${orderId}`);
        updateResults.push({ juiceId: item.juiceId, juiceName, success: true, oldStock: currentStock, newStock: newStock, message: 'Stock updated successfully.' });
      }
    }

    const allSucceeded = updateResults.every(r => r.success);
    const partialSuccess = updateResults.some(r => r.success) && !allSucceeded;

    if (allSucceeded) {
      // Update order status to 'Payment Success' (try both id and cashfreeOrderId)
      let orderStatusError = null;
      // Try updating by internal id
      let { error } = await supabase
        .from('orders')
        .update({ status: 'Payment Success' })
        .eq('id', orderId);
      if (error) {
        // If not found, try updating by cashfreeOrderId
        const { error: cfError } = await supabase
          .from('orders')
          .update({ status: 'Payment Success' })
          .eq('cashfreeOrderId', orderId);
        orderStatusError = cfError;
      }
      if (orderStatusError) {
        console.error(`[Webhook] Failed to update order status for order ${orderId}:`, orderStatusError.message);
      } else {
        console.log(`[Webhook] Order status updated to 'Payment Success' for order ${orderId}`);
      }
      console.log(`[Webhook] Successfully processed payment confirmation for order ${orderId}. All stock levels updated.`);
      return NextResponse.json({
        success: true,
        message: `Stock levels successfully updated for order ${orderId}.`,
        details: updateResults
      });
    } else if (partialSuccess) {
      console.warn(`[Webhook] Partially processed payment confirmation for order ${orderId}. Some stock updates failed or were skipped.`);
      return NextResponse.json({
        success: false,
        message: `Partially processed order ${orderId}. Some stock updates had issues. Check details.`,
        details: updateResults
      }, { status: 207 });
    } else {
      console.error(`[Webhook] Failed to process payment confirmation for order ${orderId}. No stock levels were successfully updated.`);
      return NextResponse.json({
        success: false,
        message: `Failed to update stock for order ${orderId}. See details.`,
        details: updateResults
      }, { status: 409 });
    }
  } catch (error: any) {
    console.error("[Webhook] General Error processing payment confirmation request:", error.message);
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON payload provided.' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: 'Internal server error processing payment confirmation.' },
      { status: 500 }
    );
  }
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
