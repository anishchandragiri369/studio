import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import type { OrderItem, CheckoutAddressFormData } from '@/lib/types';

export async function POST(req: NextRequest) {
  if (!supabase) {
    console.error('/api/orders/create: Supabase client not initialized.');
    return NextResponse.json(
      { success: false, message: 'Database connection not available.' },
      { status: 503 }
    );
  }
  try {    const body = await req.json();
    const { orderAmount, originalAmount, appliedCoupon, appliedReferral, orderItems, customerInfo, userId, subscriptionData } = body;

    // Validation
    if (!orderAmount || typeof orderAmount !== 'number' || orderAmount <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid order amount.' }, { status: 400 });
    }
    
    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return NextResponse.json({ success: false, message: 'Order items are required.' }, { status: 400 });
    }
    
    if (!customerInfo) {
      return NextResponse.json({ success: false, message: 'Customer info is required.' }, { status: 400 });
    }
    
    if (!customerInfo.name || !customerInfo.email) {
      return NextResponse.json({ success: false, message: 'Customer name and email are required.' }, { status: 400 });
    }    const orderToInsert = {
      user_id: userId,
      email: customerInfo.email, // Add email field
      total_amount: orderAmount,
      original_amount: originalAmount || orderAmount,
      coupon_code: appliedCoupon?.code || null,
      discount_amount: appliedCoupon?.discountAmount || 0,
      referral_code: appliedReferral?.code || null,
      referrer_id: appliedReferral?.referrerId || null,
      items: orderItems,
      shipping_address: customerInfo, // <-- FIXED: use shipping_address
      status: 'payment_pending', // Use snake_case for consistency
      order_type: subscriptionData ? 'subscription' : 'one_time', // Add order type
      subscription_info: subscriptionData || null, // Store subscription details
    };const { data, error } = await supabase
      .from('orders')
      .insert([orderToInsert])
      .select('id')
      .single();

    if (error) {
      console.error('[API /orders/create] Error inserting order into Supabase:', error);
      console.error('[API /orders/create] Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json(
        { success: false, message: 'Failed to create order in database.' },
        { status: 500 }
      );
    }

    const orderId = data.id;

    // Process coupon usage if coupon was applied
    if (appliedCoupon && userId) {
      try {
        const { error: couponError } = await supabase
          .from('coupon_usage')
          .insert([{
            user_id: userId,
            coupon_code: appliedCoupon.code,
            order_id: orderId,
            discount_amount: appliedCoupon.discountAmount,
            used_at: new Date().toISOString()
          }]);

        if (couponError) {
          console.error('Error recording coupon usage:', couponError);
        }
      } catch (couponError) {
        console.error('Error processing coupon usage:', couponError);
      }
    }

    // Initialize user rewards if not exists
    if (userId) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/rewards/initialize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        });
      } catch (rewardError) {
        console.error('Error initializing user rewards:', rewardError);
      }
    }

    return NextResponse.json({ success: true, data: { id: orderId } });

  } catch (error: any) {
    console.error('[API /orders/create] General error in POST handler:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, message: `Invalid JSON payload: ${error.message}` },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: error.message || 'An unexpected server error occurred.' },
      { status: 500 }
    );
  }
}

// Add HEAD method handler for connectivity tests
export async function HEAD(req: NextRequest) {
  // Simple connectivity check - just return 200 OK
  return new NextResponse(null, { status: 200 });
}
