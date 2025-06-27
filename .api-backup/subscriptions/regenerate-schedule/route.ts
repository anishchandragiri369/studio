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

    // Get all active subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('status', 'active');

    if (subError) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
    }

    let processedCount = 0;
    let errors: string[] = [];

    for (const subscription of subscriptions || []) {
      try {
        const currentDate = new Date();
        let newNextDelivery: Date;
        
        // Set next delivery to tomorrow (or Monday if tomorrow is Sunday)
        newNextDelivery = new Date(currentDate);
        newNextDelivery.setDate(currentDate.getDate() + 1);
        newNextDelivery.setHours(10, 0, 0, 0);
        
        // If it's Sunday, move to Monday
        if (newNextDelivery.getDay() === 0) {
          newNextDelivery.setDate(newNextDelivery.getDate() + 1);
        }

        // Update subscription with new delivery date
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            next_delivery_date: newNextDelivery.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id);

        if (updateError) {
          errors.push(`Failed to update subscription ${subscription.id}: ${updateError.message}`);
          continue;
        }

        // Generate daily delivery schedule
        let deliveryDates: Date[] = [];
        
        if (subscription.delivery_frequency === 'monthly') {
          // Generate daily deliveries for next 1 month (excluding Sundays)
          deliveryDates = SubscriptionManager.generateMonthlyDeliverySchedule(newNextDelivery, 1);
        } else {
          // For weekly, generate daily for next 2 weeks
          deliveryDates = SubscriptionManager.generateMonthlyDeliverySchedule(newNextDelivery, 0.5);
        }

        // Remove existing future delivery records
        await supabase
          .from('subscription_deliveries')
          .delete()
          .eq('subscription_id', subscription.id)
          .eq('status', 'scheduled')
          .gte('delivery_date', new Date().toISOString());

        // Insert new daily delivery records
        if (deliveryDates.length > 0) {
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
            errors.push(`Failed to create deliveries for subscription ${subscription.id}: ${insertError.message}`);
            continue;
          }
        }

        processedCount++;
        console.log(`Updated subscription ${subscription.id} with ${deliveryDates.length} daily deliveries`);

      } catch (error) {
        errors.push(`Error processing subscription ${subscription.id}: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Delivery schedules regenerated successfully',
      data: {
        processedCount,
        totalSubscriptions: subscriptions?.length || 0,
        errors,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error regenerating delivery schedules:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
