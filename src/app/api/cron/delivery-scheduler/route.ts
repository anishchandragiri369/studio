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

    console.log('Running delivery scheduler cron job for:', tomorrowStart.toISOString());    
    
    // First, cleanup expired admin pauses
    try {
      const { error: cleanupError } = await supabase.rpc('cleanup_expired_admin_pauses');
      if (cleanupError) {
        console.error('Error cleaning up expired admin pauses:', cleanupError);
      } else {
        console.log('Admin pause cleanup completed');
      }
    } catch (cleanupError) {
      console.error('Error in admin pause cleanup:', cleanupError);
    }

    // Get all active subscriptions (exclude admin_paused subscriptions)
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
        
        const deliveryDay = new Date(nextDeliveryDate);
        deliveryDay.setHours(0, 0, 0, 0);
        
        let needsUpdate = false;
        let newNextDelivery: Date | undefined;
        
        // If delivery date is today or in the past, definitely needs update
        if (deliveryDay <= today) {
          needsUpdate = true;
          // Calculate next delivery from current date
          newNextDelivery = SubscriptionManager.getNextScheduledDelivery(
            currentDate,
            subscription.delivery_frequency as 'weekly' | 'monthly',
            nextDeliveryDate
          );
          newNextDelivery.setHours(8, 0, 0, 0);
          
          console.log(`Subscription ${subscription.id} delivery is overdue (${deliveryDay.toDateString()} <= ${today.toDateString()}), moving to ${newNextDelivery.toDateString()}`);
        } else {
          // Check if delivery date is too far in the future (more than expected interval)
          const daysDifference = Math.floor((deliveryDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          // For monthly: should be within 10 days, for weekly: should be within 14 days
          const maxDays = subscription.delivery_frequency === 'weekly' ? 14 : 10;
          
          if (daysDifference > maxDays) {
            needsUpdate = true;
            newNextDelivery = SubscriptionManager.getNextScheduledDelivery(
              currentDate,
              subscription.delivery_frequency as 'weekly' | 'monthly',
              undefined // Start fresh from current date
            );
            newNextDelivery.setHours(8, 0, 0, 0);
            
            console.log(`Subscription ${subscription.id} delivery is too far in future (${daysDifference} days), resetting to ${newNextDelivery.toDateString()}`);
          }
        }
        
        if (needsUpdate && newNextDelivery) {
          console.log(`Updating subscription ${subscription.id}: from ${nextDeliveryDate.toISOString()} to ${newNextDelivery.toISOString()}`);
          
          // Create delivery record for the current due date if it's overdue or due today
          const deliveryDay = new Date(nextDeliveryDate);
          deliveryDay.setHours(0, 0, 0, 0);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (deliveryDay <= today) {
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
