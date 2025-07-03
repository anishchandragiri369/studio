import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const {
      subscription_id,
      seller_user_id,
      asking_price,
      title,
      description,
      transfer_reason,
      is_negotiable
    } = await request.json();

    // Validate required fields
    if (!subscription_id || !seller_user_id || !asking_price || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify subscription ownership and eligibility
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('id', subscription_id)
      .eq('user_id', seller_user_id)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found or not owned by user' },
        { status: 404 }
      );
    }

    // Check if subscription is transferable
    if (subscription.status !== 'active') {
      return NextResponse.json(
        { error: 'Only active subscriptions can be transferred' },
        { status: 400 }
      );
    }

    // Check if subscription already has a pending transfer
    const { data: existingTransfer } = await supabase
      .from('subscription_transfers')
      .select('id')
      .eq('subscription_id', subscription_id)
      .in('status', ['listed', 'pending'])
      .single();

    if (existingTransfer) {
      return NextResponse.json(
        { error: 'Subscription already has a pending transfer' },
        { status: 400 }
      );
    }

    // Calculate remaining deliveries
    const endDate = new Date(subscription.subscription_end_date);
    const now = new Date();
    const remainingDays = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const deliveryFrequency = subscription.delivery_frequency === 'weekly' ? 7 : 30;
    const remaining_deliveries = Math.ceil(remainingDays / deliveryFrequency);

    if (remaining_deliveries <= 0) {
      return NextResponse.json(
        { error: 'Subscription has no remaining deliveries' },
        { status: 400 }
      );
    }

    // Create transfer listing
    const { data: transfer, error: transferError } = await supabase
      .from('subscription_transfers')
      .insert({
        subscription_id,
        seller_user_id,
        asking_price: parseFloat(asking_price),
        remaining_deliveries,
        original_price: subscription.final_price || subscription.total_amount,
        title,
        description,
        transfer_reason,
        is_negotiable: is_negotiable ?? true,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      })
      .select()
      .single();

    if (transferError) {
      console.error('Error creating transfer listing:', transferError);
      return NextResponse.json(
        { error: 'Failed to create transfer listing' },
        { status: 500 }
      );
    }

    // Create notification for seller
    await supabase
      .from('subscription_notifications')
      .insert({
        user_id: seller_user_id,
        type: 'transfer_listed',
        title: 'Subscription listed for transfer',
        message: `Your subscription "${title}" has been listed in the transfer marketplace.`,
        related_id: transfer.id,
        related_type: 'transfer'
      });

    return NextResponse.json({
      success: true,
      transfer,
      message: 'Transfer listing created successfully'
    });

  } catch (error) {
    console.error('Error creating transfer listing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const transferId = searchParams.get('transfer_id');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    if (transferId) {
      // Get specific transfer with subscription details
      const { data: transfer, error } = await supabase
        .from('subscription_transfers')
        .select(`
          *,
          user_subscriptions(
            plan_id,
            delivery_frequency,
            selected_juices,
            subscription_duration
          )
        `)
        .eq('id', transferId)
        .single();

      if (error || !transfer) {
        return NextResponse.json(
          { error: 'Transfer not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ transfer });
    }

    if (userId) {
      // Get user's transfers (both selling and buying)
      const { data: sellingTransfers } = await supabase
        .from('subscription_transfers')
        .select('*')
        .eq('seller_user_id', userId)
        .order('created_at', { ascending: false });

      const { data: offers } = await supabase
        .from('subscription_transfer_offers')
        .select(`
          *,
          subscription_transfers(*)
        `)
        .eq('buyer_user_id', userId)
        .order('created_at', { ascending: false });

      return NextResponse.json({
        selling_transfers: sellingTransfers || [],
        buying_offers: offers || []
      });
    }

    // Get marketplace listings
    let query = supabase
      .from('subscription_transfers')
      .select(`
        *,
        user_subscriptions(
          plan_id,
          delivery_frequency,
          selected_juices,
          subscription_duration
        )
      `)
      .eq('status', status || 'listed')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: transfers, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch transfers' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('subscription_transfers')
      .select('*', { count: 'exact', head: true })
      .eq('status', status || 'listed')
      .gt('expires_at', new Date().toISOString());

    return NextResponse.json({
      transfers: transfers || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching transfers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
