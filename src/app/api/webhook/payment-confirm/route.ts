import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Set up Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Signature verification function
function verifyWebhookSignature(signature: string, rawBody: string, timestamp: string, clientSecret: string): boolean {
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

export async function POST(req: NextRequest) {
  console.log('🔔 [Webhook API] Payment confirmation webhook received');
  
  try {
    // Get headers
    const signature = req.headers.get('x-webhook-signature');
    const timestamp = req.headers.get('x-webhook-timestamp');
    
    // Get raw body
    const rawBody = await req.text();
    const clientSecret = process.env.CASHFREE_SECRET_KEY;
    
    // Skip signature verification in development for testing
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (!isDevelopment) {
      const isValid = verifyWebhookSignature(signature || '', rawBody, timestamp || '', clientSecret || '');
      if (!isValid) {
        console.log('❌ [Webhook API] Invalid webhook signature');
        return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 401 });
      }
    } else {
      console.log('🔧 [Webhook API] Development mode - skipping signature verification');
    }

    // Parse webhook data
    let webhookData;
    try {
      webhookData = JSON.parse(rawBody);
      console.log('📦 [Webhook API] Parsed webhook data:', webhookData);
    } catch (error) {
      console.error('❌ [Webhook API] Failed to parse webhook data:', error);
      return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 });
    }

    // Extract webhook information
    const { type, data, event_time } = webhookData;
    console.log(`📋 [Webhook API] Event type: ${type}, Time: ${event_time}`);

    // Process both successful and failed payment events
    if ((type === 'PAYMENT_SUCCESS_WEBHOOK' || type === 'PAYMENT_FAILED_WEBHOOK') && data?.order?.order_id) {
      const cashfreeOrderId = data.order.order_id;
      const internalOrderId = cashfreeOrderId.replace(/^elixr_/, '');
      console.log(`🔄 [Webhook API] Processing ${type} for order: ${internalOrderId}`);

      try {
        // Determine order status based on webhook type
        const orderStatus = type === 'PAYMENT_SUCCESS_WEBHOOK' ? 'Payment Success' : 'Payment Failed';
        console.log(`📝 [Webhook API] Updating order status to: ${orderStatus}`);
        
        // Update order status in Supabase
        const { data: updateResult, error: updateError } = await supabase
          .from('orders')
          .update({ status: orderStatus })
          .eq('id', internalOrderId)
          .select();

        console.log('💾 [Webhook API] Order status update result:', { updateResult, updateError });
        
        if (updateError) {
          console.error('❌ [Webhook API] Error updating order status:', updateError);
          return NextResponse.json({ 
            success: false, 
            message: 'Failed to update order status', 
            error: updateError.message 
          }, { status: 500 });
        }

        // Fetch the updated order
        const { data: order, error: fetchError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', internalOrderId)
          .single();

        console.log('📋 [Webhook API] Order fetch result:', { order: !!order, fetchError });
        
        if (fetchError || !order) {
          console.error('❌ [Webhook API] Order not found:', fetchError);
          return NextResponse.json({ 
            success: false, 
            message: 'Order not found' 
          }, { status: 404 });
        }

        // Send appropriate notifications
        if (orderStatus === 'Payment Success') {
          console.log('✅ [Webhook API] Sending success confirmation email');
          try {
            const emailResponse = await fetch(`${req.nextUrl.origin}/api/send-order-email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: order.id,
                userEmail: order.email || order.customer_email || order.shipping_address?.email
              }),
            });
            
            const emailResult = await emailResponse.json();
            console.log('📧 [Webhook API] Success email result:', emailResult);
          } catch (emailError) {
            console.error('❌ [Webhook API] Error sending success email:', emailError);
          }

          // Create subscription if applicable
          if ((order.order_type === 'subscription' || order.order_type === 'mixed') && order.subscription_info) {
            console.log('🔄 [Webhook API] Creating subscription for successful payment');
            try {
              const subscriptionResponse = await fetch(`${req.nextUrl.origin}/api/subscriptions/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: order.user_id,
                  // Add subscription creation logic here based on order.subscription_info
                }),
              });
              
              const subscriptionResult = await subscriptionResponse.json();
              console.log('📋 [Webhook API] Subscription creation result:', subscriptionResult);
            } catch (subscriptionError) {
              console.error('❌ [Webhook API] Error creating subscription:', subscriptionError);
            }
          }
        } else {
          console.log('❌ [Webhook API] Sending payment failure notification');
          try {
            const failureEmailResponse = await fetch(`${req.nextUrl.origin}/api/send-payment-failure-email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: order.id,
                userEmail: order.email || order.customer_email || order.shipping_address?.email,
                reason: data?.payment?.payment_message || 'Payment processing failed'
              }),
            });
            
            const failureEmailResult = await failureEmailResponse.json();
            console.log('📧 [Webhook API] Failure email result:', failureEmailResult);
          } catch (emailError) {
            console.error('❌ [Webhook API] Error sending failure email:', emailError);
          }
        }

        console.log('✅ [Webhook API] Webhook processing completed successfully');
        return NextResponse.json({ 
          success: true, 
          message: `Order updated to ${orderStatus}, notifications sent`,
          orderStatus: orderStatus,
          orderId: internalOrderId
        });

      } catch (error: any) {
        console.error('❌ [Webhook API] Error processing webhook:', error);
        return NextResponse.json({ 
          success: false, 
          message: 'Webhook processing error',
          error: error.message 
        }, { status: 500 });
      }
    } else {
      console.log('⏭️  [Webhook API] Webhook type not handled or missing order_id');
      return NextResponse.json({ 
        success: true, 
        message: 'Webhook received but not processed (unsupported type or missing data)' 
      });
    }

  } catch (error: any) {
    console.error('❌ [Webhook API] Unhandled error:', error);
    console.error('❌ [Webhook API] Error stack:', error.stack);
    
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
