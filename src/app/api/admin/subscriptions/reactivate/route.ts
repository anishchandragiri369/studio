import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SubscriptionManager } from '@/lib/subscriptionManager';
import crypto from 'crypto';

// Use service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    if (reactivateType === 'selected' && (!subscriptionIds || subscriptionIds.length === 0) && !adminPauseId) {
      return NextResponse.json(
        { success: false, message: 'Either subscription IDs or admin pause ID is required for selected reactivation' },
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

    // Note: Frontend handles admin authentication, this endpoint assumes valid admin access

    // Build query for fetching admin paused subscriptions
    // Due to database constraint issues, admin paused subscriptions may not have their status updated
    // So we need to find them via admin pause records instead
    let subscriptions = [];
    
    if (adminPauseId) {
      // Get specific admin pause record first
      const { data: adminPause, error: pauseError } = await supabase
        .from('admin_subscription_pauses')
        .select('*')
        .eq('id', adminPauseId)
        .eq('status', 'active')
        .single();

      if (pauseError || !adminPause) {
        console.log('No active admin pause record found for ID:', adminPauseId);
        return NextResponse.json(
          { 
            success: false, 
            message: `No active admin pause found with ID: ${adminPauseId}`,
            debug: { adminPauseId, pauseError }
          },
          { status: 404 }
        );
      }

      console.log('Found admin pause record:', adminPause);

      // Get subscriptions for the affected users
      const affectedUserIds = adminPause.pause_type === 'all' 
        ? null 
        : adminPause.affected_user_ids;

      let subscriptionQuery = supabase
        .from('user_subscriptions')
        .select('*')
        .eq('status', 'admin_paused')
        .eq('admin_pause_id', adminPauseId);

      const { data: subscriptionData, error: subscriptionError } = await subscriptionQuery;
      
      if (subscriptionError) {
        console.error('Error fetching subscriptions:', subscriptionError);
        return NextResponse.json(
          { success: false, message: 'Failed to fetch subscriptions' },
          { status: 500 }
        );
      }

      subscriptions = subscriptionData || [];
    } else if (reactivateType === 'all_paused') {
      // Get all active admin pause records and their affected subscriptions
      const { data: activePauses, error: pausesError } = await supabase
        .from('admin_subscription_pauses')
        .select('*')
        .eq('status', 'active');

      if (pausesError) {
        console.error('Error fetching admin pauses:', pausesError);
        return NextResponse.json(
          { success: false, message: 'Failed to fetch admin pauses' },
          { status: 500 }
        );
      }

      if (activePauses && activePauses.length > 0) {
        console.log(`Found ${activePauses.length} active admin pause records`);
        
        // Get all affected user IDs from all active pauses
        const allAffectedUserIds = new Set();
        let hasGlobalPause = false;
        
        activePauses.forEach(pause => {
          if (pause.pause_type === 'all') {
            hasGlobalPause = true;
          } else if (pause.affected_user_ids) {
            pause.affected_user_ids.forEach((userId: string) => allAffectedUserIds.add(userId));
          }
        });

        let subscriptionQuery = supabase
          .from('user_subscriptions')
          .select('*')
          .eq('status', 'admin_paused');

        if (!hasGlobalPause && allAffectedUserIds.size > 0) {
          subscriptionQuery = subscriptionQuery.in('user_id', Array.from(allAffectedUserIds));
        }

        const { data: subscriptionData, error: subscriptionError } = await subscriptionQuery;
        
        if (!subscriptionError && subscriptionData) {
          subscriptions = subscriptionData;
        }
      }
    } else if (reactivateType === 'selected') {
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .in('id', subscriptionIds)
        .eq('status', 'admin_paused');

      if (!subscriptionError && subscriptionData) {
        subscriptions = subscriptionData;
      }
    }

    console.log('Debug - Found subscriptions for reactivation:', subscriptions?.length || 0);

    if (!subscriptions || subscriptions.length === 0) {
      // Get debug info about all subscriptions and admin pauses
      const { data: debugSubscriptions } = await supabase
        .from('user_subscriptions')
        .select('id, status, admin_pause_id, user_id')
        .limit(10);
        
      const { data: debugPauses } = await supabase
        .from('admin_subscription_pauses')
        .select('id, status, pause_type, affected_user_ids')
        .eq('status', 'active');

      return NextResponse.json(
        { 
          success: false, 
          message: `No admin paused subscriptions found for reactivation.`,
          debug: {
            requestedAdminPauseId: adminPauseId,
            reactivateType,
            subscriptionIds,
            totalSubscriptions: debugSubscriptions?.length || 0,
            subscriptionStatuses: debugSubscriptions?.map(s => ({ 
              id: s.id, 
              status: s.status, 
              admin_pause_id: s.admin_pause_id,
              user_id: s.user_id 
            })) || [],
            activeAdminPauses: debugPauses?.map(p => ({
              id: p.id,
              status: p.status,
              pause_type: p.pause_type,
              affected_user_ids: p.affected_user_ids
            })) || []
          }
        },
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
