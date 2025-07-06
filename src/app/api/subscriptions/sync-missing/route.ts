import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { logger, createLoggedResponse } from '@/lib/logger';

export async function POST(req: NextRequest) {
  if (!supabase) {
    logger.error('Supabase client not initialized', {}, 'Sync Missing Subscriptions API');
    return NextResponse.json(
      createLoggedResponse(false, 'Database connection not available.', {}, 503, 'error'),
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        createLoggedResponse(false, 'User ID is required.', {}, 400, 'error'),
        { status: 400 }
      );
    }

    logger.info('Starting sync of missing subscriptions', { userId }, 'Sync Missing Subscriptions API');

    // Find orders with subscription data that don't have corresponding user_subscriptions
    // ONLY include orders with successful payment status
    const { data: subscriptionOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .in('order_type', ['subscription', 'mixed'])
      .not('status', 'eq', 'payment_pending')
      .in('status', ['completed', 'confirmed', 'active', 'processing', 'Payment Success'])
      .order('created_at', { ascending: false });

    if (ordersError) {
      logger.error('Error fetching subscription orders', { error: ordersError.message }, 'Sync Missing Subscriptions API');
      return NextResponse.json(
        createLoggedResponse(false, 'Failed to fetch subscription orders.', { error: ordersError }, 500, 'error'),
        { status: 500 }
      );
    }

    if (!subscriptionOrders || subscriptionOrders.length === 0) {
      return NextResponse.json(
        createLoggedResponse(true, 'No subscription orders found for this user.', { syncedCount: 0 }),
        { status: 200 }
      );
    }

    // Get existing subscriptions for this user
    const { data: existingSubscriptions, error: subsError } = await supabase
      .from('user_subscriptions')
      .select('id, plan_id, created_at')
      .eq('user_id', userId);

    if (subsError) {
      logger.error('Error fetching existing subscriptions', { error: subsError.message }, 'Sync Missing Subscriptions API');
      return NextResponse.json(
        createLoggedResponse(false, 'Failed to fetch existing subscriptions.', { error: subsError }, 500, 'error'),
        { status: 500 }
      );
    }

    const existingSubscriptionIds = new Set(existingSubscriptions?.map(sub => sub.plan_id) || []);
    let syncedCount = 0;
    const errors: string[] = [];

    // Process each subscription order
    for (const order of subscriptionOrders) {
      if (!order.subscription_info || !order.subscription_info.subscriptionItems) {
        continue;
      }

      const subscriptionItems = order.subscription_info.subscriptionItems;
      
      for (const subscriptionItem of subscriptionItems) {
        let subscriptionData = subscriptionItem.subscriptionData || subscriptionItem;
        const planId = subscriptionData.planId || subscriptionItem.id;

        // FALLBACK: If subscriptionData is empty, try to extract from root level
        if (!subscriptionData.planId && subscriptionData.planName) {
          subscriptionData = {
            planId: subscriptionData.planId || `plan-${Date.now()}`,
            planName: subscriptionData.planName,
            planFrequency: subscriptionData.planFrequency || 'weekly',
            selectedJuices: subscriptionData.selectedJuices || [],
            selectedFruitBowls: subscriptionData.selectedFruitBowls || [],
            subscriptionDuration: subscriptionData.subscriptionDuration || 3,
            basePrice: subscriptionData.basePrice || subscriptionItem.price || 120
          };
        }

        // Skip if subscription already exists
        if (existingSubscriptionIds.has(planId)) {
          continue;
        }

        try {
          // Create subscription record
          const subscriptionRecord = {
            user_id: userId,
            plan_id: planId,
            status: 'active',
            delivery_frequency: subscriptionData.planFrequency || 'weekly',
            selected_juices: subscriptionData.selectedJuices || [],
            selected_fruit_bowls: subscriptionData.selectedFruitBowls || [],
            delivery_address: order.shipping_address || {},
            total_amount: subscriptionItem.price || subscriptionData.basePrice || 120,
            subscription_duration: subscriptionData.subscriptionDuration || 3,
            subscription_start_date: order.created_at || new Date().toISOString(),
            subscription_end_date: new Date(new Date(order.created_at).getTime() + (subscriptionData.subscriptionDuration || 3) * 30 * 24 * 60 * 60 * 1000).toISOString(),
            next_delivery_date: order.first_delivery_date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            original_price: subscriptionItem.price || subscriptionData.basePrice || 120,
            discount_percentage: 0,
            discount_amount: 0,
            final_price: subscriptionItem.price || subscriptionData.basePrice || 120,
            renewal_notification_sent: false,
            created_at: order.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            first_delivery_date: order.first_delivery_date || null,
            is_after_cutoff: order.is_after_cutoff || false,
            delivery_schedule: order.delivery_schedule || null,
          };

          const { data: createdSubscription, error: subscriptionError } = await supabase
            .from('user_subscriptions')
            .insert([subscriptionRecord])
            .select()
            .single();

          if (subscriptionError) {
            logger.error('Failed to create subscription record', {
              error: subscriptionError.message,
              orderId: order.id,
              planId
            }, 'Sync Missing Subscriptions API');
            errors.push(`Failed to create subscription for plan ${planId}: ${subscriptionError.message}`);
          } else {
            logger.info('Subscription synced successfully', {
              subscriptionId: createdSubscription.id,
              orderId: order.id,
              planId
            }, 'Sync Missing Subscriptions API');
            syncedCount++;
            existingSubscriptionIds.add(planId); // Add to set to avoid duplicates
          }
        } catch (error: any) {
          logger.error('Error processing subscription item', {
            error: error.message,
            orderId: order.id,
            planId
          }, 'Sync Missing Subscriptions API');
          errors.push(`Error processing subscription for plan ${planId}: ${error.message}`);
        }
      }
    }

    logger.info('Sync completed', { 
      userId, 
      syncedCount, 
      totalOrders: subscriptionOrders.length,
      errors: errors.length 
    }, 'Sync Missing Subscriptions API');

    return NextResponse.json(createLoggedResponse(true, 'Subscription sync completed.', {
      syncedCount,
      totalOrders: subscriptionOrders.length,
      errors: errors.length > 0 ? errors : undefined
    }));

  } catch (error: any) {
    logger.error('Error in sync missing subscriptions', { error: error.message }, 'Sync Missing Subscriptions API');
    return NextResponse.json(
      createLoggedResponse(false, 'An unexpected error occurred.', {}, 500, 'error'),
      { status: 500 }
    );
  }
} 