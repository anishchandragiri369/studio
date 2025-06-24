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
    const { subscriptionId, reason } = body;

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
      .eq('status', 'active')
      .single();

    if (fetchError || !subscription) {
      return NextResponse.json(
        { success: false, message: 'Subscription not found or not active.' },
        { status: 404 }
      );
    }

    // Check if subscription can be paused (24 hours notice)
    const pauseCheck = SubscriptionManager.canPauseSubscription(subscription.next_delivery_date);
    
    if (!pauseCheck.canPause) {
      return NextResponse.json(
        { success: false, message: pauseCheck.reason },
        { status: 400 }
      );
    }

    // Calculate reactivation deadline
    const pauseDate = new Date();
    const reactivationDeadline = SubscriptionManager.calculateReactivationDeadline(pauseDate);

    // Update subscription status to paused
    const { data: updatedSubscription, error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'paused',
        pause_date: pauseDate.toISOString(),
        pause_reason: reason || 'User requested pause',
        reactivation_deadline: reactivationDeadline.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error pausing subscription:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to pause subscription.' },
        { status: 500 }
      );
    }

    // Mark upcoming deliveries as skipped
    const { error: deliveryUpdateError } = await supabase
      .from('subscription_deliveries')
      .update({ status: 'skipped' })
      .eq('subscription_id', subscriptionId)
      .eq('status', 'scheduled')
      .gte('delivery_date', new Date().toISOString());

    if (deliveryUpdateError) {
      console.error('Error updating deliveries:', deliveryUpdateError);
      // Continue execution - this is not critical
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription paused successfully.',
      data: {
        subscription: updatedSubscription,
        reactivationDeadline: reactivationDeadline.toISOString(),
        canReactivateUntil: SubscriptionManager.formatDate(reactivationDeadline)
      }
    });

  } catch (error: any) {
    console.error('Error in pause subscription API:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
