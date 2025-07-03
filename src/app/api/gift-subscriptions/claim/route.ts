import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { gift_code, user_id, delivery_address } = await request.json();

    if (!gift_code || !user_id) {
      return NextResponse.json(
        { error: 'Gift code and user ID are required' },
        { status: 400 }
      );
    }

    // Get gift subscription details
    const { data: gift, error: giftError } = await supabase
      .from('gift_subscriptions')
      .select('*')
      .eq('gift_code', gift_code)
      .single();

    if (giftError || !gift) {
      return NextResponse.json(
        { error: 'Invalid gift code' },
        { status: 404 }
      );
    }

    // Check if gift is already claimed
    if (gift.status === 'claimed') {
      return NextResponse.json(
        { error: 'Gift has already been claimed' },
        { status: 400 }
      );
    }

    // Check if gift is expired
    if (new Date(gift.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Gift has expired' },
        { status: 410 }
      );
    }

    // Check if user is trying to claim their own gift
    if (gift.gifter_user_id === user_id) {
      return NextResponse.json(
        { error: 'You cannot claim your own gift' },
        { status: 400 }
      );
    }

    // Use provided delivery address or fallback to gift's delivery address
    const finalDeliveryAddress = delivery_address || gift.delivery_address;

    if (!finalDeliveryAddress) {
      return NextResponse.json(
        { error: 'Delivery address is required' },
        { status: 400 }
      );
    }

    // Create the subscription for the recipient
    const subscriptionData = {
      user_id,
      plan_id: gift.subscription_plan_id,
      status: 'active',
      delivery_frequency: gift.subscription_plan_id.includes('weekly') ? 'weekly' : 'monthly',
      delivery_address: finalDeliveryAddress,
      total_amount: gift.total_amount,
      subscription_duration: gift.subscription_duration,
      subscription_start_date: new Date().toISOString(),
      subscription_end_date: new Date(Date.now() + gift.subscription_duration * 30 * 24 * 60 * 60 * 1000).toISOString(),
      original_price: gift.total_amount,
      final_price: gift.total_amount,
      next_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Start next week
    };

    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .insert(subscriptionData)
      .select()
      .single();

    if (subscriptionError) {
      console.error('Error creating subscription:', subscriptionError);
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 }
      );
    }

    // Update gift subscription status
    const { error: updateError } = await supabase
      .from('gift_subscriptions')
      .update({
        status: 'claimed',
        recipient_user_id: user_id,
        created_subscription_id: subscription.id,
        claimed_at: new Date().toISOString()
      })
      .eq('id', gift.id);

    if (updateError) {
      console.error('Error updating gift status:', updateError);
      // Note: Subscription was created, but gift status update failed
      // This is a partial success scenario
    }

    // Create notification for the gifter
    if (!gift.is_anonymous) {
      await supabase
        .from('subscription_notifications')
        .insert({
          user_id: gift.gifter_user_id,
          type: 'gift_claimed',
          title: 'Your gift was claimed!',
          message: `${gift.recipient_name} has claimed the subscription you gifted them.`,
          related_id: gift.id,
          related_type: 'gift_subscription'
        });
    }

    // Create welcome notification for recipient
    await supabase
      .from('subscription_notifications')
      .insert({
        user_id: user_id,
        type: 'subscription_activated',
        title: 'Gift subscription activated!',
        message: `Your gift subscription has been activated and will start delivering soon.`,
        related_id: subscription.id,
        related_type: 'subscription'
      });

    return NextResponse.json({
      success: true,
      subscription,
      message: 'Gift subscription claimed successfully'
    });

  } catch (error) {
    console.error('Error claiming gift subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
