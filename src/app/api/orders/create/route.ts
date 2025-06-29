import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import type { OrderItem, CheckoutAddressFormData } from '@/lib/types';
import { 
  calculateFirstDeliveryDate, 
  generateSubscriptionDeliveryDates,
  type DeliverySchedule,
  type SubscriptionDeliveryDates 
} from '@/lib/deliveryScheduler';
import { validatePincode } from '@/lib/pincodeValidation';

export async function POST(req: NextRequest) {
  if (!supabase) {
    console.error('/api/orders/create: Supabase client not initialized.');
    return NextResponse.json(
      { success: false, message: 'Database connection not available.' },
      { status: 503 }
    );
  }
  try {    const body = await req.json();
    const { orderAmount, originalAmount, appliedCoupon, appliedReferral, orderItems, customerInfo, userId, subscriptionData, hasSubscriptions, hasRegularItems } = body;

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
    }
    
    // Validate pincode for delivery area
    if (!customerInfo.address?.zipCode) {
      return NextResponse.json({ success: false, message: 'Pincode is required for delivery.' }, { status: 400 });
    }
    
    const pincodeValidation = validatePincode(customerInfo.address.zipCode);
    if (!pincodeValidation.isServiceable) {
      return NextResponse.json({ 
        success: false, 
        message: 'Sorry, we don\'t deliver to this pincode yet. Please contact us for delivery updates!',
        pincodeError: true
      }, { status: 400 });
    }
    
    // Determine if this order contains subscriptions - check multiple sources
    const containsSubscriptions = hasSubscriptions || 
                                 subscriptionData || 
                                 orderItems.some((item: any) => item.type === 'subscription');
    
    // Determine order type based on content
    let orderType: string;
    if (containsSubscriptions && hasRegularItems) {
      orderType = 'mixed'; // Both subscription and regular items
    } else if (containsSubscriptions) {
      orderType = 'subscription'; // Only subscription items
    } else {
      orderType = 'one_time'; // Only regular items
    }    // Calculate delivery dates for subscription orders
    let deliverySchedule: DeliverySchedule | null = null;
    let subscriptionDeliveryDates: SubscriptionDeliveryDates | null = null;
    
    if (containsSubscriptions) {
      // Calculate the first delivery date based on order time and 6 PM cutoff
      deliverySchedule = calculateFirstDeliveryDate(new Date());
      
      // Generate all delivery dates for the subscription period
      // For mixed orders, use subscription data from the first subscription item
      let subscriptionInfo = subscriptionData;
      if (!subscriptionInfo) {
        // Extract subscription info from subscription items
        const subscriptionItem = orderItems.find((item: any) => item.type === 'subscription');
        if (subscriptionItem?.subscriptionData) {
          subscriptionInfo = {
            frequency: subscriptionItem.subscriptionData.planFrequency,
            duration: subscriptionItem.subscriptionData.subscriptionDuration
          };
        }
      }
      
      if (subscriptionInfo?.frequency && subscriptionInfo?.duration) {
        subscriptionDeliveryDates = generateSubscriptionDeliveryDates(
          subscriptionInfo.frequency,
          subscriptionInfo.duration,
          deliverySchedule.firstDeliveryDate
        );
      }
    }

    const orderToInsert = {
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
      order_type: orderType, // Use the new calculated order type
      subscription_info: containsSubscriptions ? (subscriptionData || {
        hasSubscriptionItems: true,
        subscriptionItems: orderItems.filter((item: any) => item.type === 'subscription')
      }) : null, // Store subscription details
      // Add delivery scheduling information
      first_delivery_date: deliverySchedule?.firstDeliveryDate?.toISOString() || null,
      is_after_cutoff: deliverySchedule?.isAfterCutoff || null,
      delivery_schedule: subscriptionDeliveryDates ? {
        startDate: subscriptionDeliveryDates.startDate.toISOString(),
        endDate: subscriptionDeliveryDates.endDate.toISOString(),
        deliveryDates: subscriptionDeliveryDates.deliveryDates.map(date => date.toISOString()),
        totalDeliveries: subscriptionDeliveryDates.totalDeliveries
      } : null,
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
