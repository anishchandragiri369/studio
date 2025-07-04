import { NextResponse, NextRequest } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { SubscriptionManager } from '@/lib/subscriptionManager';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  // Create a local supabase client if the global one is not available
  const client = supabase || (isSupabaseConfigured ? createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ) : null);
  
  if (!client) {
    return NextResponse.json(
      { success: false, message: 'Database connection not available.' },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { subscriptionId, newDeliveryDate } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, message: 'Subscription ID is required.' },
        { status: 400 }
      );
    }

    // Fetch subscription details
    const { data: subscription, error: fetchError } = await client
      .from('user_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('status', 'paused')
      .single();

    if (fetchError || !subscription) {
      return NextResponse.json(
        { success: false, message: 'Subscription not found or not paused.' },
        { status: 404 }
      );
    }

    // Check if subscription can be reactivated (within 3 months)
    const reactivationCheck = SubscriptionManager.canReactivateSubscription(subscription.pause_date);
    
    if (!reactivationCheck.canReactivate) {
      // Mark subscription as expired
      await client
        .from('user_subscriptions')
        .update({ status: 'expired' })
        .eq('id', subscriptionId);

      return NextResponse.json(
        { success: false, message: reactivationCheck.reason },
        { status: 400 }
      );
    }

    // Calculate reactivation delivery schedule with proper logic
    const now = new Date();
    const reactivationResult = SubscriptionManager.updateDeliveryScheduleAfterReactivation(
      subscription, 
      now
    );
    
    // Use provided delivery date if specified, otherwise use calculated date
    const nextDelivery = newDeliveryDate ? 
      new Date(newDeliveryDate) : 
      reactivationResult.nextDeliveryDate;
    
    const extendedEndDate = reactivationResult.extendedEndDate;
    const pauseDurationDays = reactivationResult.pauseDurationDays;

    // Update subscription status to active with extended end date
    const { data: updatedSubscription, error: updateError } = await client
      .from('user_subscriptions')
      .update({
        status: 'active',
        next_delivery_date: nextDelivery.toISOString(),
        subscription_end_date: extendedEndDate.toISOString(),
        pause_date: null,
        pause_reason: null,
        reactivation_deadline: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error reactivating subscription:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to reactivate subscription.' },
        { status: 500 }
      );
    }    // Create new delivery schedule
    const { error: deliveryError } = await client
      .from('subscription_deliveries')
      .insert({
        subscription_id: subscriptionId,
        delivery_date: nextDelivery.toISOString(),
        status: 'scheduled',
        items: subscription.selected_juices || []
      });

    if (deliveryError) {
      console.error('Error creating delivery schedule:', deliveryError);
      // Continue execution - this is not critical for reactivation
    }    // Send reactivation confirmation email
    try {
      const fetch = (await import('node-fetch')).default;
      const apiUrl = process.env.SEND_SUBSCRIPTION_EMAIL_API_URL || 
        `${req.nextUrl.origin}/api/send-subscription-email`;
      
      const emailPayload = {
        type: 'reactivate',
        subscriptionId: subscription.id,
        userEmail: subscription.delivery_address?.email || 'user@example.com',
        subscriptionDetails: {
          planId: subscription.plan_id,
          reactivationDate: now.toISOString(),
          nextDeliveryDate: nextDelivery.toISOString(),
          nextDeliveryFormatted: SubscriptionManager.formatDate(nextDelivery),
          extendedEndDate: extendedEndDate.toISOString(),
          pauseDurationDays: pauseDurationDays
        }
      };

      console.log('Sending reactivation confirmation email with payload:', emailPayload);
      const emailRes = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload),
      });

      const emailResult = await emailRes.json() as any;
      console.log('Reactivation email API response:', emailResult);
      
      if (!emailResult.success) {
        console.error('Reactivation email sending failed:', emailResult.errors || emailResult.error);
      }
    } catch (emailError) {
      console.error('Error sending reactivation confirmation email:', emailError);
      // Continue execution - email failure shouldn't block the reactivation operation
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription reactivated successfully.',
      data: {
        subscription: updatedSubscription,
        nextDeliveryDate: nextDelivery.toISOString(),
        nextDeliveryFormatted: SubscriptionManager.formatDate(nextDelivery),
        extendedEndDate: extendedEndDate.toISOString(),
        pauseDurationDays: pauseDurationDays
      }
    });

  } catch (error: any) {
    console.error('Error in reactivate subscription API:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
