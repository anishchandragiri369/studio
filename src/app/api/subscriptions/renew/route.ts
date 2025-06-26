import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { SubscriptionManager } from '@/lib/subscriptionManager';

export async function POST(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { success: false, message: 'Database connection not available.' },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();    const { subscriptionId, durationMonths, basePrice, frequency } = body;

    if (!subscriptionId || !durationMonths || !basePrice) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: subscriptionId, durationMonths, basePrice.' },
        { status: 400 }
      );
    }

    // Validate duration - now includes 1 month for weekly subscriptions
    if (![1, 2, 3, 4, 6, 12].includes(durationMonths)) {
      return NextResponse.json(
        { success: false, message: 'Invalid subscription duration.' },
        { status: 400 }
      );
    }

    // Fetch subscription details
    const { data: subscription, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (fetchError || !subscription) {
      return NextResponse.json(
        { success: false, message: 'Subscription not found.' },
        { status: 404 }
      );
    }    // Calculate new pricing - use frequency from subscription or passed parameter
    const subscriptionFrequency = frequency || subscription.delivery_frequency;
    const pricing = SubscriptionManager.calculateSubscriptionPricing(basePrice, durationMonths, subscriptionFrequency);
    
    // Calculate new subscription dates
    const startDate = new Date();
    const endDate = SubscriptionManager.calculateSubscriptionEndDate(startDate, durationMonths);
    
    // Calculate next delivery date
    const nextDeliveryDate = SubscriptionManager.calculateNextDeliveryDate(
      startDate, 
      subscription.delivery_frequency
    );

    // Update subscription
    const { data: updatedSubscription, error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'active',
        subscription_duration: durationMonths,
        subscription_start_date: startDate.toISOString(),
        subscription_end_date: endDate.toISOString(),
        next_delivery_date: nextDeliveryDate.toISOString(),
        original_price: pricing.originalPrice,
        discount_percentage: pricing.discountPercentage,
        discount_amount: pricing.discountAmount,
        final_price: pricing.finalPrice,
        total_amount: pricing.finalPrice,
        renewal_notification_sent: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating subscription:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to renew subscription.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription renewed successfully!',
      data: {
        subscription: updatedSubscription,
        pricing,
        nextDeliveryDate: nextDeliveryDate.toISOString(),
        subscriptionEndDate: endDate.toISOString()
      }
    });

  } catch (error) {
    console.error('Error renewing subscription:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
