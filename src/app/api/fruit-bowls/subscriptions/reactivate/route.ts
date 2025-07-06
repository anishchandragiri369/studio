import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SubscriptionManager } from '@/lib/subscriptionManager';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    const { subscriptionId } = await request.json();

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

    if (subscription.status !== 'paused') {
      return NextResponse.json(
        { error: 'Only paused subscriptions can be reactivated' },
        { status: 400 }
      );
    }

    // Check if subscription hasn't expired
    if (new Date(subscription.end_date) < new Date()) {
      return NextResponse.json(
        { error: 'Subscription has expired and cannot be reactivated' },
        { status: 400 }
      );
    }

    // Calculate new next delivery date with 6 PM cutoff logic
    const nextDeliveryDate = SubscriptionManager.calculateNextDeliveryDateWithCutoff(new Date());

    // Reactivate the subscription
    const { error: updateError } = await supabase
      .from('user_fruit_bowl_subscriptions')
      .update({
        status: 'active',
        next_delivery_date: nextDeliveryDate,
        pause_date: null,
        pause_reason: null,
        reactivation_deadline: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);

    if (updateError) {
      console.error('Error reactivating subscription:', updateError);
      return NextResponse.json(
        { error: 'Failed to reactivate subscription' },
        { status: 500 }
      );
    }

    // Reschedule future deliveries
    const { error: deliveryUpdateError } = await supabase
      .from('fruit_bowl_subscription_deliveries')
      .update({ status: 'scheduled' })
      .eq('subscription_id', subscriptionId)
      .gte('delivery_date', nextDeliveryDate.toISOString().split('T')[0])
      .lte('delivery_date', subscription.end_date.split('T')[0])
      .eq('status', 'skipped');

    if (deliveryUpdateError) {
      console.error('Error updating deliveries:', deliveryUpdateError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({ 
      message: 'Subscription reactivated successfully',
      subscription: { 
        id: subscriptionId, 
        status: 'active',
        next_delivery_date: nextDeliveryDate.toISOString()
      }
    });

  } catch (error) {
    console.error('Error in reactivate subscription API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
