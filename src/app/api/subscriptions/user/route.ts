import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { logger, createLoggedResponse } from '@/lib/logger';

export async function GET(req: NextRequest) {
  if (!supabase) {
    logger.error('Database connection not available', {}, 'User Subscriptions API');
    return NextResponse.json(
      createLoggedResponse(false, 'Database connection not available.', {}, 503, 'error'),
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      logger.warn('User ID missing in request', {}, 'User Subscriptions API');
      return NextResponse.json(
        createLoggedResponse(false, 'User ID is required.', {}, 400, 'error'),
        { status: 400 }
      );
    }

    logger.info('Fetching subscriptions for user', { userId }, 'User Subscriptions API');


    // Fetch user subscriptions from user_subscriptions table
    const { data: subscriptions, error: subError } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_deliveries (
          id,
          delivery_date,
          status,
          items
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (subError) {
      logger.error('Error fetching native subscriptions', { error: subError.message }, 'User Subscriptions API');
      return NextResponse.json(
        createLoggedResponse(false, 'Failed to fetch subscriptions.', { error: subError }, 500, 'error'),
        { status: 500 }
      );
    }

    logger.info('Native subscriptions fetched', { count: subscriptions?.length || 0 }, 'User Subscriptions API');

    // Fetch subscription items from orders table (order_type = 'subscription' or 'mixed')
    // Only include orders that have completed payment (not payment_pending)
    const { data: orderSubs, error: orderError } = await supabase
      .from('orders')
      .select(`id, user_id, order_type, items, subscription_info, status, created_at, first_delivery_date, delivery_schedule, shipping_address`)
      .eq('user_id', userId)
      .in('order_type', ['subscription', 'mixed'])
      .not('status', 'eq', 'payment_pending') // Exclude payment pending orders
      .in('status', ['completed', 'confirmed', 'active', 'processing']) // Only include successful payment statuses
      .order('created_at', { ascending: false });

    if (orderError) {
      logger.error('Error fetching subscription orders', { error: orderError.message }, 'User Subscriptions API');
      return NextResponse.json(
        createLoggedResponse(false, 'Failed to fetch subscription orders.', { error: orderError }, 500, 'error'),
        { status: 500 }
      );
    }

    logger.info('Subscription orders fetched', { 
      count: orderSubs?.length || 0,
      statuses: orderSubs?.map(o => o.status) || []
    }, 'User Subscriptions API');

    // Extract only subscription items from each order, merging subscription_info fields
    const extractedOrderSubscriptions = (orderSubs || []).flatMap(order => {
      if (!order.items || !Array.isArray(order.items)) return [];
      const info = order.subscription_info || {};
      return order.items
        .filter((item) => item.type === 'subscription')
        .map((item) => {
          // Merge fields from item.subscriptionData if present
          const subData = item.subscriptionData || {};
          return {
            ...item,
            order_id: order.id,
            order_status: order.status,
            created_at: order.created_at,
            first_delivery_date: order.first_delivery_date,
            delivery_schedule: order.delivery_schedule,
            shipping_address: order.shipping_address,
            // Merge relevant fields from subscriptionData, then subscription_info, then item
            plan_id: subData.planId || subData.plan_id || item.plan_id || info.plan_id || info.planId || undefined,
            plan_name: subData.planName || item.plan_name || undefined,
            delivery_frequency: subData.planFrequency || subData.frequency || item.delivery_frequency || info.frequency || info.delivery_frequency || undefined,
            subscription_duration: subData.subscriptionDuration || item.subscription_duration || info.duration || info.subscription_duration || undefined,
            total_amount: subData.basePrice || item.total_amount || info.total_amount || item.price || undefined,
            original_price: subData.basePrice || item.original_price || info.original_price || item.price || undefined,
            discount_percentage: item.discount_percentage || info.discount_percentage || undefined,
            discount_amount: item.discount_amount || info.discount_amount || undefined,
            final_price: item.final_price || info.final_price || item.price || undefined,
            subscription_start_date: item.subscription_start_date || info.start_date || info.subscription_start_date || order.first_delivery_date || undefined,
            subscription_end_date: item.subscription_end_date || info.end_date || info.subscription_end_date || undefined,
            selected_juices: subData.selectedJuices || item.selected_juices || info.selected_juices || undefined,
            subscription_info: info,
          };
        });
    });

    logger.info('Order-based subscriptions extracted', { 
      count: extractedOrderSubscriptions.length,
      planIds: extractedOrderSubscriptions.map(s => s.plan_id)
    }, 'User Subscriptions API');

    const totalResults = [
      ...(subscriptions || []),
      ...extractedOrderSubscriptions
    ];

    logger.info('Subscriptions fetch completed', { 
      nativeCount: subscriptions?.length || 0,
      orderBasedCount: extractedOrderSubscriptions.length,
      totalCount: totalResults.length
    }, 'User Subscriptions API');

    // Combine both sources
    return NextResponse.json(createLoggedResponse(true, 'Subscriptions fetched successfully', totalResults));

  } catch (error: any) {
    logger.error('Error in get subscriptions API', { error: error.message }, 'User Subscriptions API');
    return NextResponse.json(
      createLoggedResponse(false, error.message || 'An unexpected error occurred.', {}, 500, 'error'),
      { status: 500 }
    );
  }
}
