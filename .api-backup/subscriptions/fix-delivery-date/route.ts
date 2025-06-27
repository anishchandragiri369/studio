import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { SubscriptionManager } from '@/lib/subscriptionManager';

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabase) {
      return NextResponse.json(
        { success: false, message: 'Database connection not available' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { subscriptionId, userId } = body;

    if (!subscriptionId || !userId) {
      return NextResponse.json(
        { success: false, message: 'Subscription ID and User ID are required' },
        { status: 400 }
      );
    }

    // Get subscription details
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('user_id', userId)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { success: false, message: 'Subscription not found' },
        { status: 404 }
      );
    }

    if (subscription.status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'Can only fix active subscriptions' },
        { status: 400 }
      );
    }    // Force calculate a new proper delivery date (next day, excluding Sunday)
    const currentDate = new Date();
    let newNextDelivery: Date;
    
    if (subscription.delivery_frequency === 'monthly') {
      // Set next delivery to tomorrow (or Monday if tomorrow is Sunday)
      newNextDelivery = new Date(currentDate);
      newNextDelivery.setDate(currentDate.getDate() + 2);
      newNextDelivery.setHours(10, 0, 0, 0); // Set to 10 AM
      
      // If it's Sunday, move to Monday
      if (newNextDelivery.getDay() === 0) {
        newNextDelivery.setDate(newNextDelivery.getDate() + 1);
      }
    } else {
      // For weekly, set to next week (7 days from now)
      newNextDelivery = new Date(currentDate);
      newNextDelivery.setDate(currentDate.getDate() + 2);
      newNextDelivery.setHours(10, 0, 0, 0); // Set to 10 AM
      
      // If it's Sunday, move to Monday
      if (newNextDelivery.getDay() === 0) {
        newNextDelivery.setDate(newNextDelivery.getDate() + 1);
      }
    }

    // Update subscription with corrected date
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        next_delivery_date: newNextDelivery.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);

    if (updateError) {
      console.error('Error updating subscription:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to update delivery date' },
        { status: 500 }
      );
    }

    // Generate proper delivery schedule for the future
    let deliveryDates: Date[] = [];
    
    if (subscription.delivery_frequency === 'monthly') {
      deliveryDates = SubscriptionManager.generateMonthlyDeliverySchedule(newNextDelivery, 2);
    } else {
      // For weekly, generate next 8 weeks
      for (let i = 0; i < 8; i++) {
        const nextDate = SubscriptionManager.getNextScheduledDelivery(
          new Date(newNextDelivery.getTime() + (i * 7 * 24 * 60 * 60 * 1000)),
          'weekly'
        );
        deliveryDates.push(nextDate);
      }
    }

    // Remove existing future delivery records
    await supabase
      .from('subscription_deliveries')
      .delete()
      .eq('subscription_id', subscriptionId)
      .eq('status', 'scheduled')
      .gte('delivery_date', new Date().toISOString());

    // Insert new delivery records
    const deliveryRecords = deliveryDates.map(date => ({
      subscription_id: subscriptionId,
      delivery_date: date.toISOString(),
      status: 'scheduled',
      items: subscription.selected_juices || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    if (deliveryRecords.length > 0) {
      const { error: insertError } = await supabase
        .from('subscription_deliveries')
        .insert(deliveryRecords);

      if (insertError) {
        console.error('Error inserting delivery records:', insertError);
      }
    }    return NextResponse.json({
      success: true,
      message: 'Delivery date fixed successfully',
      data: {
        oldDate: subscription.next_delivery_date,
        oldFormattedDate: SubscriptionManager.formatDate(subscription.next_delivery_date),
        newDate: newNextDelivery.toISOString(),
        formattedDate: SubscriptionManager.formatDate(newNextDelivery.toISOString()),
        timeUntilDelivery: SubscriptionManager.getTimeUntilDelivery(newNextDelivery.toISOString()),
        scheduleGenerated: deliveryRecords.length > 0,
        totalDeliveries: deliveryRecords.length,
        frequency: subscription.delivery_frequency
      }
    });

  } catch (error) {
    console.error('Error fixing delivery date:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
