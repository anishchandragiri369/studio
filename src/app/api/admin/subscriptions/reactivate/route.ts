import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { SubscriptionManager } from '@/lib/subscriptionManager';

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, message: 'Database connection not available' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { 
      adminPauseId, // specific admin pause to reactivate
      reactivateType, // 'all_paused' or 'selected'
      subscriptionIds = [], // for selected subscriptions
      adminUserId // admin performing the action
    } = body;

    // Validate input
    if (!reactivateType || !['all_paused', 'selected'].includes(reactivateType)) {
      return NextResponse.json(
        { success: false, message: 'Invalid reactivate type. Must be "all_paused" or "selected"' },
        { status: 400 }
      );
    }

    if (reactivateType === 'selected' && (!subscriptionIds || subscriptionIds.length === 0)) {
      return NextResponse.json(
        { success: false, message: 'Subscription IDs required for selected reactivation' },
        { status: 400 }
      );
    }

    if (!adminUserId) {
      return NextResponse.json(
        { success: false, message: 'Admin user ID is required' },
        { status: 400 }
      );
    }

    const now = new Date();

    // Verify admin user exists
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', adminUserId)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json(
        { success: false, message: 'Invalid admin user' },
        { status: 401 }
      );
    }

    // Build query for fetching admin paused subscriptions
    let query = supabase
      .from('user_subscriptions')
      .select('*')
      .eq('status', 'admin_paused');

    if (adminPauseId) {
      query = query.eq('admin_pause_id', adminPauseId);
    } else if (reactivateType === 'selected') {
      query = query.in('id', subscriptionIds);
    }

    const { data: subscriptions, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching admin paused subscriptions:', fetchError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No admin paused subscriptions found' },
        { status: 404 }
      );
    }

    // If specific admin pause ID provided, get the admin pause record
    let adminPauseRecord = null;
    if (adminPauseId) {
      const { data: pauseRecord, error: pauseError } = await supabase
        .from('admin_subscription_pauses')
        .select('*')
        .eq('id', adminPauseId)
        .single();

      if (pauseError) {
        console.error('Error fetching admin pause record:', pauseError);
        return NextResponse.json(
          { success: false, message: 'Admin pause record not found' },
          { status: 404 }
        );
      }

      adminPauseRecord = pauseRecord;
    }

    let processedCount = 0;
    let errors: string[] = [];

    // Process each subscription
    for (const subscription of subscriptions) {
      try {
        // Calculate reactivation delivery schedule with proper timing logic
        const reactivationResult = SubscriptionManager.updateDeliveryScheduleAfterReactivation(
          subscription, 
          now
        );
        
        const nextDeliveryDate = reactivationResult.nextDeliveryDate;
        const extendedEndDate = reactivationResult.extendedEndDate;

        // Update subscription status to active
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'active',
            next_delivery_date: nextDeliveryDate.toISOString(),
            subscription_end_date: extendedEndDate.toISOString(),
            pause_date: null,
            pause_reason: null,
            admin_pause_id: null,
            admin_pause_start: null,
            admin_pause_end: null,
            reactivation_deadline: null,
            admin_reactivated_at: now.toISOString(),
            admin_reactivated_by: adminUserId,
            updated_at: now.toISOString()
          })
          .eq('id', subscription.id);

        if (updateError) {
          console.error(`Error reactivating subscription ${subscription.id}:`, updateError);
          errors.push(`Failed to reactivate subscription ${subscription.id}`);
          continue;
        }

        // Generate new delivery schedule for the subscription using proper reactivation logic
        try {
          const deliverySchedule = SubscriptionManager.calculateReactivationDeliverySchedule(
            now,
            subscription.delivery_frequency || 'monthly'
          );
          
          const deliveryDates = deliverySchedule.adjustedSchedule.slice(0, 10); // Take first 10 deliveries

          // Remove old scheduled deliveries and create new ones
          await supabase
            .from('subscription_deliveries')
            .delete()
            .eq('subscription_id', subscription.id)
            .in('status', ['scheduled', 'admin_paused'])
            .gte('delivery_date', now.toISOString());

          // Insert new delivery records
          if (deliveryDates.length > 0) {
            const deliveryRecords = deliveryDates.map(date => ({
              subscription_id: subscription.id,
              delivery_date: date.toISOString(),
              status: 'scheduled',
              items: subscription.selected_juices || [],
              created_at: now.toISOString(),
              updated_at: now.toISOString()
            }));

            const { error: deliveryInsertError } = await supabase
              .from('subscription_deliveries')
              .insert(deliveryRecords);

            if (deliveryInsertError) {
              console.error(`Error creating delivery schedule for subscription ${subscription.id}:`, deliveryInsertError);
              // Continue - this is not critical for reactivation
            }
          }
        } catch (scheduleError) {
          console.error(`Error generating delivery schedule for subscription ${subscription.id}:`, scheduleError);
          // Continue - delivery schedule can be regenerated later
        }

        processedCount++;
      } catch (error) {
        console.error(`Error processing subscription ${subscription.id}:`, error);
        errors.push(`Error processing subscription ${subscription.id}`);
      }
    }

    // Update admin pause record status if specific pause was reactivated
    if (adminPauseRecord) {
      const { error: pauseUpdateError } = await supabase
        .from('admin_subscription_pauses')
        .update({
          status: 'reactivated',
          reactivated_at: now.toISOString(),
          reactivated_by: adminUserId,
          updated_at: now.toISOString()
        })
        .eq('id', adminPauseId);

      if (pauseUpdateError) {
        console.error('Error updating admin pause record:', pauseUpdateError);
        // Continue - this doesn't affect the main operation
      }
    }

    // Log admin action
    const auditLog = {
      id: crypto.randomUUID(),
      admin_user_id: adminUserId,
      action: 'ADMIN_REACTIVATE_SUBSCRIPTIONS',
      details: {
        reactivateType,
        adminPauseId,
        subscriptionIds: reactivateType === 'selected' ? subscriptionIds : 'all_paused',
        processedCount,
        totalSubscriptions: subscriptions.length,
        errors
      },
      created_at: now.toISOString()
    };

    const { error: auditError } = await supabase
      .from('admin_audit_logs')
      .insert(auditLog);

    if (auditError) {
      console.error('Error creating audit log:', auditError);
      // Continue - audit failure shouldn't block the operation
    }

    return NextResponse.json({
      success: true,
      message: `Successfully reactivated ${processedCount} subscriptions`,
      data: {
        processedCount,
        totalSubscriptions: subscriptions.length,
        reactivateType,
        adminPauseId,
        reactivatedAt: now.toISOString(),
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('Error in admin reactivate subscriptions:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
