import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { SubscriptionManager } from '@/lib/subscriptionManager';

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabase) {
      return NextResponse.json(
        { success: false, message: 'Database connection not available' },
        { status: 503 }
      );
    }

    // Get request body
    const body = await request.json();
    const { subscriptionId, action, userId } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, message: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
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

    switch (action) {
      case 'generate_schedule':
        return await generateDeliverySchedule(subscription);
      case 'update_next_delivery':
        return await updateNextDelivery(subscription);
      case 'get_schedule':
        return await getDeliverySchedule(subscriptionId);
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in delivery management:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateDeliverySchedule(subscription: any) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, message: 'Database connection not available' },
        { status: 503 }
      );
    }

    const startDate = new Date(subscription.next_delivery_date);
    const frequency = subscription.delivery_frequency;
    
    // Generate delivery schedule for next 2 months
    let deliveryDates: Date[] = [];
    
    if (frequency === 'monthly') {
      deliveryDates = SubscriptionManager.generateMonthlyDeliverySchedule(startDate, 2);
    } else {
      // For weekly, generate next 8 weeks
      for (let i = 0; i < 8; i++) {
        const nextDate = SubscriptionManager.getNextScheduledDelivery(
          new Date(startDate.getTime() + (i * 7 * 24 * 60 * 60 * 1000)),
          'weekly'
        );
        deliveryDates.push(nextDate);
      }
    }

    // Remove existing future delivery records
    await supabase
      .from('subscription_deliveries')
      .delete()
      .eq('subscription_id', subscription.id)
      .eq('status', 'scheduled')
      .gte('delivery_date', new Date().toISOString());

    // Insert new delivery records
    const deliveryRecords = deliveryDates.map(date => ({
      subscription_id: subscription.id,
      delivery_date: date.toISOString(),
      status: 'scheduled',
      items: subscription.selected_juices || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error: insertError } = await supabase
      .from('subscription_deliveries')
      .insert(deliveryRecords);

    if (insertError) {
      console.error('Error inserting delivery records:', insertError);
      return NextResponse.json(
        { success: false, message: 'Failed to generate delivery schedule' },
        { status: 500 }
      );
    }

    // Update subscription's next delivery date
    const nextDelivery = deliveryDates[0];
    await supabase
      .from('user_subscriptions')
      .update({ 
        next_delivery_date: nextDelivery.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id);

    return NextResponse.json({
      success: true,
      message: 'Delivery schedule generated successfully',
      data: {
        deliveryDates: deliveryDates.map(date => date.toISOString()),
        nextDelivery: nextDelivery.toISOString()
      }
    });

  } catch (error) {
    console.error('Error generating delivery schedule:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate delivery schedule' },
      { status: 500 }
    );
  }
}

async function updateNextDelivery(subscription: any) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, message: 'Database connection not available' },
        { status: 503 }
      );
    }

    const currentDate = new Date();
    const lastDeliveryDate = subscription.next_delivery_date ? new Date(subscription.next_delivery_date) : null;
    
    const nextDelivery = SubscriptionManager.getNextScheduledDelivery(
      currentDate,
      subscription.delivery_frequency,
      lastDeliveryDate || undefined
    );

    // Update subscription
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({ 
        next_delivery_date: nextDelivery.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id);

    if (updateError) {
      return NextResponse.json(
        { success: false, message: 'Failed to update next delivery date' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Next delivery date updated successfully',
      data: {
        nextDelivery: nextDelivery.toISOString(),
        timeUntilDelivery: SubscriptionManager.getTimeUntilDelivery(nextDelivery.toISOString())
      }
    });

  } catch (error) {
    console.error('Error updating next delivery:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update next delivery date' },
      { status: 500 }
    );
  }
}

async function getDeliverySchedule(subscriptionId: string) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, message: 'Database connection not available' },
        { status: 503 }
      );
    }

    const { data: deliveries, error } = await supabase
      .from('subscription_deliveries')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .gte('delivery_date', new Date().toISOString())
      .order('delivery_date', { ascending: true })
      .limit(10);

    if (error) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch delivery schedule' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        deliveries: deliveries || [],
        count: deliveries?.length || 0
      }
    });

  } catch (error) {
    console.error('Error fetching delivery schedule:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch delivery schedule' },
      { status: 500 }
    );
  }
}
