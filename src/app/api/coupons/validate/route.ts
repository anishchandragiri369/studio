import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { success: false, message: 'Database connection not available.' },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { couponCode, userId, firstOrderOnly, maxUsesPerUser } = body;

    if (!couponCode || !userId) {
      return NextResponse.json(
        { success: false, message: 'Coupon code and user ID are required.' },
        { status: 400 }
      );
    }

    // Check if this is for first order only
    if (firstOrderOnly) {
      // Check if user has any completed orders
      const { data: orders, error: orderError } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .limit(1);

      if (orderError) {
        console.error('Error checking user orders:', orderError);
        return NextResponse.json(
          { success: false, message: 'Unable to validate coupon usage.' },
          { status: 500 }
        );
      }

      if (orders && orders.length > 0) {
        return NextResponse.json(
          { success: false, message: 'This coupon is only valid for first-time customers.' },
          { status: 400 }
        );
      }
    }

    // Check coupon usage count if maxUsesPerUser is specified
    if (maxUsesPerUser) {
      const { data: couponUsages, error: usageError } = await supabase
        .from('coupon_usage')
        .select('id')
        .eq('user_id', userId)
        .eq('coupon_code', couponCode);

      if (usageError) {
        console.error('Error checking coupon usage:', usageError);
        return NextResponse.json(
          { success: false, message: 'Unable to validate coupon usage.' },
          { status: 500 }
        );
      }

      if (couponUsages && couponUsages.length >= maxUsesPerUser) {
        return NextResponse.json(
          { success: false, message: `This coupon can only be used ${maxUsesPerUser} time(s) per customer.` },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in coupon validation:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}
