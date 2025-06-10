
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
    const body: WebhookRequestBody = await request.json();

    if (!body.orderId || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid payload: orderId and items array (with at least one item) are required.' },
        { status: 400 }
      );
    }

    console.log(`[Webhook] Received payment confirmation for order: ${body.orderId}`);

    const updateResults = [];

    for (const item of body.items) {
      if (!item.juiceId || typeof item.quantity !== 'number' || item.quantity <= 0) {
        console.warn(`[Webhook] Invalid item data in order ${body.orderId}:`, item);
        updateResults.push({ juiceId: item.juiceId, success: false, message: 'Invalid item data (juiceId or quantity).' });
        continue; 
      }

      // 1. Fetch current stock
      const { data: currentJuiceData, error: fetchError } = await supabase
        .from('juices')
        .select('stock_quantity, name') // Also fetch name for better logging
        .eq('id', item.juiceId)
        .single();

      if (fetchError || !currentJuiceData) {
        console.error(`[Webhook] Error fetching stock for juiceId ${item.juiceId} (Order: ${body.orderId}):`, fetchError?.message || 'Juice not found');
        updateResults.push({ juiceId: item.juiceId, success: false, message: `Failed to fetch stock for ${item.juiceId}. ${fetchError?.message || 'Juice not found.'}` });
        continue;
      }

      const currentStock = currentJuiceData.stock_quantity ?? 0;
      const juiceName = currentJuiceData.name || item.juiceId;
      const newStock = currentStock - item.quantity;

      if (newStock < 0) {
        console.warn(`[Webhook] Insufficient stock for ${juiceName} (ID: ${item.juiceId}) in order ${body.orderId}. Required: ${item.quantity}, Available: ${currentStock}. Stock will NOT go negative. Update skipped.`);
        updateResults.push({ 
            juiceId: item.juiceId, 
            juiceName,
            success: false, 
            message: `Insufficient stock for ${juiceName}. Required: ${item.quantity}, Available: ${currentStock}. Stock not updated.` 
        });
        continue; // Skip update for this item
      }

      // 2. Update stock
      const { error: updateError } = await supabase
        .from('juices')
        .update({ stock_quantity: newStock })
        .eq('id', item.juiceId);

      if (updateError) {
        console.error(`[Webhook] Error updating stock for ${juiceName} (ID: ${item.juiceId}) in order ${body.orderId}:`, updateError.message);
        updateResults.push({ juiceId: item.juiceId, juiceName, success: false, message: `Failed to update stock for ${juiceName}. ${updateError.message}` });
      } else {
        console.log(`[Webhook] Stock updated for ${juiceName} (ID: ${item.juiceId}). Old: ${currentStock}, New: ${newStock}. Order: ${body.orderId}`);
        updateResults.push({ juiceId: item.juiceId, juiceName, success: true, oldStock: currentStock, newStock: newStock, message: 'Stock updated successfully.' });
      }
    }

    const allSucceeded = updateResults.every(r => r.success);
    const partialSuccess = updateResults.some(r => r.success) && !allSucceeded;

    if (allSucceeded) {
      console.log(`[Webhook] Successfully processed payment confirmation for order ${body.orderId}. All stock levels updated.`);
      return NextResponse.json({
        success: true,
        message: `Stock levels successfully updated for order ${body.orderId}.`,
        details: updateResults
      });
    } else if (partialSuccess) {
         console.warn(`[Webhook] Partially processed payment confirmation for order ${body.orderId}. Some stock updates failed or were skipped.`);
         return NextResponse.json({
            success: false, // Indicate overall that not everything went smoothly
            message: `Partially processed order ${body.orderId}. Some stock updates had issues. Check details.`,
            details: updateResults
         }, { status: 207 }); // Multi-Status
    }
     else { // All failed or skipped
      console.error(`[Webhook] Failed to process payment confirmation for order ${body.orderId}. No stock levels were successfully updated.`);
      return NextResponse.json({
        success: false,
        message: `Failed to update stock for order ${body.orderId}. See details.`,
        details: updateResults
      }, { status: 409 }); // Conflict or Unprocessable Entity might be appropriate
    }

  } catch (error: any) {
    console.error("[Webhook] General Error processing payment confirmation request:", error.message);
    if (error instanceof SyntaxError) { // JSON parsing error
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
