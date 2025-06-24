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
    const body = await req.json();
    const { subscriptionId, newDeliveryDate } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, message: 'Subscription ID is required.' },
        { status: 400 }
      );
    }

    // Fetch subscription details
    const { data: subscription, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('status', 'paused')
      .single();

    if (fetchError || !subscription) {
      return NextResponse.json(
        { success: false, message: 'Subscription not found or not paused.' },
        { status: 404 }
      );
    }

    // Check if subscription can be reactivated (within 3 months)
    const reactivationCheck = SubscriptionManager.canReactivateSubscription(subscription.pause_date);
    
    if (!reactivationCheck.canReactivate) {
      // Mark subscription as expired
      await supabase
        .from('user_subscriptions')
        .update({ status: 'expired' })
        .eq('id', subscriptionId);

      return NextResponse.json(
        { success: false, message: reactivationCheck.reason },
        { status: 400 }
      );
    }

    // Calculate next delivery date
    const nextDelivery = newDeliveryDate ? 
      new Date(newDeliveryDate) : 
      SubscriptionManager.calculateNextDeliveryDate(new Date(), subscription.delivery_frequency);    // Ensure next delivery is at least 24 hours from now
    const minDeliveryDate = new Date();
    minDeliveryDate.setHours(minDeliveryDate.getHours() + 24);

    if (nextDelivery < minDeliveryDate) {
      nextDelivery.setTime(minDeliveryDate.getTime());
    }

    // Calculate pause duration and extend subscription end date
    const now = new Date();
    const pauseStartDate = new Date(subscription.pause_date);
    const pauseDurationMs = now.getTime() - pauseStartDate.getTime();
    
    // Extend the subscription end date by the pause duration
    const currentEndDate = new Date(subscription.subscription_end_date);
    const extendedEndDate = new Date(currentEndDate.getTime() + pauseDurationMs);

    // Update subscription status to active with extended end date
    const { data: updatedSubscription, error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'active',
        next_delivery_date: nextDelivery.toISOString(),
        subscription_end_date: extendedEndDate.toISOString(),
        pause_date: null,
        pause_reason: null,
        reactivation_deadline: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error reactivating subscription:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to reactivate subscription.' },
        { status: 500 }
      );
    }

    // Create new delivery schedule
    const { error: deliveryError } = await supabase
      .from('subscription_deliveries')
      .insert({
        subscription_id: subscriptionId,
        delivery_date: nextDelivery.toISOString(),
        status: 'scheduled',
        items: subscription.selected_juices || []
      });

    if (deliveryError) {
      console.error('Error creating delivery schedule:', deliveryError);
      // Continue execution - this is not critical for reactivation
    }    return NextResponse.json({
      success: true,
      message: 'Subscription reactivated successfully.',
      data: {
        subscription: updatedSubscription,
        nextDeliveryDate: nextDelivery.toISOString(),
        nextDeliveryFormatted: SubscriptionManager.formatDate(nextDelivery),
        extendedEndDate: extendedEndDate.toISOString(),
        pauseDurationDays: Math.round(pauseDurationMs / (1000 * 60 * 60 * 24))
      }
    });

  } catch (error: any) {
    console.error('Error in reactivate subscription API:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
