import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { SubscriptionManager } from '@/lib/subscriptionManager';
import type { CheckoutAddressFormData } from '@/lib/types';

export async function POST(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { success: false, message: 'Database connection not available.' },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { 
      userId, 
      planId, 
      planName, 
      planPrice, 
      planFrequency, 
      customerInfo, 
      selectedJuices,
      subscriptionDuration = 3, // Default to 3 months if not provided
      basePrice = 120 // Default base price if not provided
    } = body;

    // Validation
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required.' },
        { status: 400 }
      );
    }

    if (!planId || !planName || !planPrice || !planFrequency) {
      return NextResponse.json(
        { success: false, message: 'Plan details are required.' },
        { status: 400 }
      );
    }

    if (!customerInfo) {
      return NextResponse.json(
        { success: false, message: 'Customer information is required.' },
        { status: 400 }
      );
    }

    if (!['weekly', 'monthly'].includes(planFrequency)) {
      return NextResponse.json(
        { success: false, message: 'Invalid plan frequency.' },
        { status: 400 }
      );
    }

    if (![2, 3, 4, 6, 12].includes(subscriptionDuration)) {
      return NextResponse.json(
        { success: false, message: 'Invalid subscription duration.' },
        { status: 400 }
      );
    }

    // Calculate subscription pricing
    const pricing = SubscriptionManager.calculateSubscriptionPricing(basePrice, subscriptionDuration);
    
    // Calculate subscription dates
    const startDate = new Date();
    const endDate = SubscriptionManager.calculateSubscriptionEndDate(startDate, subscriptionDuration);
    const nextDeliveryDate = SubscriptionManager.calculateNextDeliveryDate(startDate, planFrequency);

    // Create subscription record
    const subscriptionData = {
      user_id: userId,
      plan_id: planId,
      status: 'active',
      delivery_frequency: planFrequency,
      selected_juices: selectedJuices || [],
      delivery_address: customerInfo,
      total_amount: pricing.finalPrice,
      subscription_duration: subscriptionDuration,
      subscription_start_date: startDate.toISOString(),
      subscription_end_date: endDate.toISOString(),
      next_delivery_date: nextDeliveryDate.toISOString(),
      original_price: pricing.originalPrice,
      discount_percentage: pricing.discountPercentage,
      discount_amount: pricing.discountAmount,
      final_price: pricing.finalPrice,
      renewal_notification_sent: false,
      created_at: startDate.toISOString(),
      updated_at: startDate.toISOString()
    };

    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .insert([subscriptionData])
      .select()
      .single();

    if (subscriptionError) {
      console.error('Error creating subscription:', subscriptionError);
      return NextResponse.json(
        { success: false, message: 'Failed to create subscription.', error: subscriptionError.message },
        { status: 500 }
      );
    }

    // Create initial delivery record
    const deliveryData = {
      subscription_id: subscription.id,
      delivery_date: nextDeliveryDate.toISOString(),
      status: 'scheduled',
      items: selectedJuices || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: deliveryError } = await supabase
      .from('subscription_deliveries')
      .insert([deliveryData]);

    if (deliveryError) {
      console.error('Error creating delivery record:', deliveryError);
      // Don't fail the subscription creation if delivery record fails
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription created successfully!',
      data: {
        subscription,
        pricing,
        nextDeliveryDate: nextDeliveryDate.toISOString(),
        subscriptionEndDate: endDate.toISOString()
      }
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
