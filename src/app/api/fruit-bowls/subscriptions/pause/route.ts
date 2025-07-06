import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SubscriptionManager } from '@/lib/subscriptionManager';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch (error) {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    
    // Check if user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { subscriptionId, reason } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    // Verify the subscription belongs to the user
    const { data: subscription, error: fetchError } = await supabase
      .from('user_fruit_bowl_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    if (subscription.status !== 'active') {
      return NextResponse.json(
        { error: 'Only active subscriptions can be paused' },
        { status: 400 }
      );
    }

    // Check if subscription can be paused (6 PM cutoff for next-day delivery)
    const pauseCheck = SubscriptionManager.canPauseSubscription(subscription.next_delivery_date);
    
    if (!pauseCheck.canPause) {
      return NextResponse.json(
        { error: pauseCheck.reason },
        { status: 400 }
      );
    }

    // Calculate reactivation deadline (3 months from now)
    const pauseDate = new Date();
    const reactivationDeadline = SubscriptionManager.calculateReactivationDeadline(pauseDate);

    // Pause the subscription
    const { error: updateError } = await supabase
      .from('user_fruit_bowl_subscriptions')
      .update({
        status: 'paused',
        pause_date: pauseDate.toISOString(),
        pause_reason: reason || 'User requested pause',
        reactivation_deadline: reactivationDeadline.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);

    if (updateError) {
      console.error('Error pausing subscription:', updateError);
      return NextResponse.json(
        { error: 'Failed to pause subscription' },
        { status: 500 }
      );
    }

    // Update future deliveries to 'skipped' status
    const { error: deliveryUpdateError } = await supabase
      .from('fruit_bowl_subscription_deliveries')
      .update({ status: 'skipped' })
      .eq('subscription_id', subscriptionId)
      .gte('delivery_date', new Date().toISOString().split('T')[0])
      .eq('status', 'scheduled');

    if (deliveryUpdateError) {
      console.error('Error updating deliveries:', deliveryUpdateError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({ 
      message: 'Subscription paused successfully',
      subscription: { id: subscriptionId, status: 'paused' }
    });

  } catch (error) {
    console.error('Error in pause subscription API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
