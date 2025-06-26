import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SubscriptionManager } from '@/lib/subscriptionManager';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!authHeader || !cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }    // Use service role client for cron operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const today = new Date();
    const tomorrowStart = new Date(today);
    tomorrowStart.setDate(today.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);
    
    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setHours(23, 59, 59, 999);

    console.log('Running delivery scheduler cron job for:', tomorrowStart.toISOString());    // Get all active subscriptions (check all, not just due ones)
    const { data: subscriptions, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('status', 'active');

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
    }

    let processedCount = 0;
    let errors: string[] = [];    for (const subscription of subscriptions || []) {
      try {
        const nextDeliveryDate = new Date(subscription.next_delivery_date);
        const currentDate = new Date();
        
        // Check if delivery needs scheduling update
        const today = new Date();
        today.setHours(0, 0, 0, 0);
          let needsUpdate = false;
        let newNextDelivery: Date | undefined;
        
        // Check if delivery date is in the past or too far in the future (more than 10 days)
        const daysDifference = Math.floor((nextDeliveryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
          if (nextDeliveryDate <= today || daysDifference > 10) {
          needsUpdate = true;
          // Use SubscriptionManager to calculate proper next delivery
          newNextDelivery = SubscriptionManager.getNextScheduledDelivery(
            currentDate,
            subscription.delivery_frequency as 'weekly' | 'monthly',
            nextDeliveryDate
          );
          newNextDelivery.setHours(10, 0, 0, 0);
        }else if (daysDifference <= 1 && daysDifference >= 0) {
          // If delivery is due today or tomorrow, calculate next one after delivery
          needsUpdate = true;
          
          if (subscription.delivery_frequency === 'monthly') {
            // Use smart scheduling for monthly deliveries
            newNextDelivery = SubscriptionManager.getNextScheduledDelivery(
              nextDeliveryDate,
              'monthly',
              nextDeliveryDate
            );
          } else {
            // Weekly delivery - next week
            newNextDelivery = SubscriptionManager.getNextScheduledDelivery(
              nextDeliveryDate,
              'weekly',
              nextDeliveryDate
            );
          }
        }
        
        if (needsUpdate && newNextDelivery) {
          console.log(`Updating subscription ${subscription.id}: from ${nextDeliveryDate.toISOString()} to ${newNextDelivery.toISOString()}`);
          
          // Create delivery record for the current due date if it's due
          if (daysDifference <= 1 && daysDifference >= 0) {
            const deliveryRecord = {
              subscription_id: subscription.id,
              delivery_date: nextDeliveryDate.toISOString(),
              status: 'scheduled',
              items: subscription.selected_juices || [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            // Insert delivery record if it doesn't exist
            const { error: deliveryError } = await supabase
              .from('subscription_deliveries')
              .upsert([deliveryRecord], { 
                onConflict: 'subscription_id,delivery_date',
                ignoreDuplicates: true 
              });

            if (deliveryError) {
              console.error('Error creating delivery record:', deliveryError);
            }
          }

          // Update subscription with new next delivery date
          const { error: updateError } = await supabase
            .from('user_subscriptions')
            .update({
              next_delivery_date: newNextDelivery.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', subscription.id);

          if (updateError) {
            console.error('Error updating subscription:', updateError);
            errors.push(`Failed to update subscription ${subscription.id}`);
            continue;
          }

          processedCount++;
        }
      } catch (error) {
        console.error(`Error processing subscription ${subscription.id}:`, error);
        errors.push(`Error processing subscription ${subscription.id}: ${error}`);
      }
    }

    // Additional cleanup: remove duplicate scheduled deliveries
    await cleanupDuplicateDeliveries(supabase);

    console.log(`Delivery scheduler completed. Processed: ${processedCount}, Errors: ${errors.length}`);

    return NextResponse.json({
      success: true,
      message: 'Delivery scheduler completed successfully',
      data: {
        processedCount,
        totalSubscriptions: subscriptions?.length || 0,
        errors,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in delivery scheduler cron:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error },
      { status: 500 }
    );
  }
}

async function cleanupDuplicateDeliveries(supabase: any) {
  try {
    // Remove duplicate scheduled deliveries for the same subscription and date
    const { error } = await supabase.rpc('cleanup_duplicate_deliveries');
    
    if (error) {
      console.error('Error cleaning up duplicate deliveries:', error);
    } else {
      console.log('Duplicate deliveries cleaned up successfully');
    }
  } catch (error) {
    console.error('Error in cleanup function:', error);
  }
}

// Allow GET for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Delivery Scheduler Cron Job',
    status: 'Ready',
    timestamp: new Date().toISOString()
  });
}
