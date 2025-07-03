import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Generate a unique gift code
function generateGiftCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'GIFT';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const {
      gifter_user_id,
      recipient_email,
      recipient_name,
      recipient_phone,
      subscription_plan_id,
      subscription_duration,
      custom_message,
      delivery_date,
      is_anonymous,
      delivery_address,
      total_amount
    } = await request.json();

    // Validate required fields
    if (!gifter_user_id || !recipient_email || !recipient_name || !subscription_plan_id || !total_amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate unique gift code
    let gift_code = generateGiftCode();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const { data: existingGift } = await supabase
        .from('gift_subscriptions')
        .select('id')
        .eq('gift_code', gift_code)
        .single();

      if (!existingGift) break;
      
      gift_code = generateGiftCode();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: 'Failed to generate unique gift code' },
        { status: 500 }
      );
    }

    // Check if recipient already has an account
    const { data: recipientUser } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', recipient_email)
      .single();

    // Create gift subscription
    const { data: giftSubscription, error } = await supabase
      .from('gift_subscriptions')
      .insert({
        gifter_user_id,
        recipient_email,
        recipient_name,
        recipient_phone,
        subscription_plan_id,
        subscription_duration,
        custom_message,
        delivery_date,
        is_anonymous,
        delivery_address,
        total_amount,
        gift_code,
        recipient_user_id: recipientUser?.id || null,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating gift subscription:', error);
      return NextResponse.json(
        { error: 'Failed to create gift subscription' },
        { status: 500 }
      );
    }

    // Create notification for recipient if they have an account
    if (recipientUser?.id) {
      await supabase
        .from('subscription_notifications')
        .insert({
          user_id: recipientUser.id,
          type: 'gift_received',
          title: 'You received a gift subscription!',
          message: `${is_anonymous ? 'Someone' : 'A friend'} has gifted you a subscription. Use code ${gift_code} to claim it.`,
          related_id: giftSubscription.id,
          related_type: 'gift_subscription',
          is_action_required: true,
          action_url: `/gift/claim/${gift_code}`
        });
    }

    // TODO: Send email notification to recipient
    // You can integrate with your email service here

    return NextResponse.json({
      success: true,
      gift_subscription: giftSubscription,
      message: 'Gift subscription created successfully'
    });

  } catch (error) {
    console.error('Error in gift subscription creation:', error);
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
    const giftCode = searchParams.get('gift_code');

    if (giftCode) {
      // Get specific gift by code
      const { data: gift, error } = await supabase
        .from('gift_subscriptions')
        .select('*')
        .eq('gift_code', giftCode)
        .single();

      if (error || !gift) {
        return NextResponse.json(
          { error: 'Gift subscription not found' },
          { status: 404 }
        );
      }

      // Check if gift is expired
      if (new Date(gift.expires_at) < new Date()) {
        return NextResponse.json(
          { error: 'Gift subscription has expired' },
          { status: 410 }
        );
      }

      return NextResponse.json({ gift });
    }

    if (userId) {
      // Get gifts sent by user
      const { data: sentGifts, error: sentError } = await supabase
        .from('gift_subscriptions')
        .select('*')
        .eq('gifter_user_id', userId)
        .order('created_at', { ascending: false });

      // Get gifts received by user
      const { data: receivedGifts, error: receivedError } = await supabase
        .from('gift_subscriptions')
        .select('*')
        .eq('recipient_user_id', userId)
        .order('created_at', { ascending: false });

      if (sentError || receivedError) {
        return NextResponse.json(
          { error: 'Failed to fetch gift subscriptions' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        sent_gifts: sentGifts || [],
        received_gifts: receivedGifts || []
      });
    }

    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error fetching gift subscriptions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
