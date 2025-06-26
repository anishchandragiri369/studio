import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { SubscriptionManager } from '@/lib/subscriptionManager';

export async function GET() {
  if (!supabase) {
    return NextResponse.json(
      { success: false, message: 'Database connection not available.' },
      { status: 503 }
    );
  }

  try {
    // Get subscriptions that need renewal notifications
    const { data: subscriptions, error } = await supabase
      .from('user_subscriptions')
      .select(`
        id,
        user_id,
        subscription_end_date,
        renewal_notification_sent,
        status,
        subscription_duration,
        delivery_frequency,
        final_price,
        total_amount
      `)
      .eq('status', 'active')
      .eq('renewal_notification_sent', false)
      .gte('subscription_end_date', new Date().toISOString())
      .lte('subscription_end_date', new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()); // 5 days from now

    if (error) {
      console.error('Error fetching subscriptions for renewal:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch subscriptions.' },
        { status: 500 }
      );
    }

    const renewalData = subscriptions.map(subscription => {
      const renewalInfo = SubscriptionManager.getSubscriptionExpiryStatus(subscription.subscription_end_date);
      return {
        subscriptionId: subscription.id,
        userId: subscription.user_id,
        daysLeft: renewalInfo.daysLeft,
        message: renewalInfo.message,
        subscriptionEndDate: subscription.subscription_end_date,
        needsNotification: renewalInfo.status === 'expiring_soon'
      };
    }).filter(item => item.needsNotification);

    return NextResponse.json({
      success: true,
      data: renewalData,
      count: renewalData.length
    });

  } catch (error) {
    console.error('Error checking renewal notifications:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}

export async function POST() {
  if (!supabase) {
    return NextResponse.json(
      { success: false, message: 'Database connection not available.' },
      { status: 503 }
    );
  }

  try {
    // Mark renewal notifications as sent
    const { data: subscriptions, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('status', 'active')
      .eq('renewal_notification_sent', false)
      .gte('subscription_end_date', new Date().toISOString())
      .lte('subscription_end_date', new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString());

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch subscriptions.' },
        { status: 500 }
      );
    }

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No subscriptions need renewal notifications.',
        updated: 0
      });
    }

    const subscriptionIds = subscriptions.map(sub => sub.id);

    // Update renewal notification status
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({ renewal_notification_sent: true })
      .in('id', subscriptionIds);

    if (updateError) {
      console.error('Error updating renewal notifications:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to update renewal notification status.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Marked ${subscriptionIds.length} subscriptions as notified.`,
      updated: subscriptionIds.length
    });

  } catch (error) {
    console.error('Error updating renewal notifications:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
