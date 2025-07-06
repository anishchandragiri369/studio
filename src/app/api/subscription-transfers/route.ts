import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role - only at runtime
let supabase: any = null;

function getSupabase() {
  if (!supabase && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return supabase;
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection not available' }, { status: 503 });
  }

  try {
    const { from_user_id, to_user_id, subscription_id, transfer_reason } = await request.json();

    if (!from_user_id || !to_user_id || !subscription_id) {
      return NextResponse.json(
        { error: 'From user ID, to user ID, and subscription ID are required' },
        { status: 400 }
      );
    }

    // Get subscription details
    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('id', subscription_id)
      .eq('user_id', from_user_id)
      .single();

    if (subscriptionError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found or access denied' },
        { status: 404 }
      );
    }

    // Check if subscription is active
    if (subscription.status !== 'active') {
      return NextResponse.json(
        { error: 'Only active subscriptions can be transferred' },
        { status: 400 }
      );
    }

    // Create transfer record
    const { data: transfer, error: transferError } = await supabase
      .from('subscription_transfers')
      .insert({
        from_user_id,
        to_user_id,
        subscription_id,
        transfer_reason,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (transferError) {
      console.error('Error creating transfer:', transferError);
      return NextResponse.json(
        { error: 'Failed to create transfer request' },
        { status: 500 }
      );
    }

    // Create notification for recipient
    await supabase
      .from('subscription_notifications')
      .insert({
        user_id: to_user_id,
        type: 'subscription_transfer_request',
        title: 'Subscription Transfer Request',
        message: `You have received a subscription transfer request.`,
        related_id: transfer.id,
        related_type: 'subscription_transfer',
        is_action_required: true
      });

    return NextResponse.json({
      success: true,
      transfer,
      message: 'Transfer request created successfully'
    });

  } catch (error) {
    console.error('Error creating subscription transfer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection not available' }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get transfers where user is sender or recipient
    const { data: transfers, error } = await supabase
      .from('subscription_transfers')
      .select(`
        *,
        user_subscriptions(*)
      `)
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transfers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transfers' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      transfers: transfers || []
    });

  } catch (error) {
    console.error('Error fetching subscription transfers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
