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
      pauseType, // 'all' or 'selected'
      userIds = [], // for selected users
      startDate, // when pause starts
      endDate, // when pause ends (optional for indefinite pause)
      reason,
      adminUserId // admin performing the action
    } = body;

    // Validate input
    if (!pauseType || !['all', 'selected'].includes(pauseType)) {
      return NextResponse.json(
        { success: false, message: 'Invalid pause type. Must be "all" or "selected"' },
        { status: 400 }
      );
    }

    if (pauseType === 'selected' && (!userIds || userIds.length === 0)) {
      return NextResponse.json(
        { success: false, message: 'User IDs required for selected pause' },
        { status: 400 }
      );
    }

    if (!startDate || !reason || !adminUserId) {
      return NextResponse.json(
        { success: false, message: 'Start date, reason, and admin user ID are required' },
        { status: 400 }
      );
    }

    const pauseStart = new Date(startDate);
    const pauseEnd = endDate ? new Date(endDate) : null;
    const now = new Date();

    // Validate dates
    if (pauseStart < now) {
      return NextResponse.json(
        { success: false, message: 'Start date cannot be in the past' },
        { status: 400 }
      );
    }

    if (pauseEnd && pauseEnd <= pauseStart) {
      return NextResponse.json(
        { success: false, message: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Note: Frontend handles admin authentication, this endpoint assumes valid admin access

    // Build query for fetching subscriptions
    let query = supabase
      .from('user_subscriptions')
      .select('*')
      .eq('status', 'active');

    if (pauseType === 'selected') {
      query = query.in('user_id', userIds);
    }

    const { data: subscriptions, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No active subscriptions found' },
        { status: 404 }
      );
    }

    // Create admin pause record
    const adminPauseRecord = {
      id: crypto.randomUUID(),
      pause_type: pauseType,
      affected_user_ids: pauseType === 'all' ? null : userIds,
      start_date: pauseStart.toISOString(),
      end_date: pauseEnd?.toISOString() ?? null,
      reason,
      admin_user_id: adminUserId,
      status: 'active',
      affected_subscription_count: subscriptions.length,
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };

    const { error: adminPauseError } = await supabase
      .from('admin_subscription_pauses')
      .insert(adminPauseRecord);

    if (adminPauseError) {
      console.error('Error creating admin pause record:', adminPauseError);
      return NextResponse.json(
        { success: false, message: 'Failed to create admin pause record' },
        { status: 500 }
      );
    }

    let processedCount = 0;
    let errors: string[] = [];

    // Process each subscription
    for (const subscription of subscriptions) {
      try {
        console.log(`Processing subscription ${subscription.id} for admin pause...`);
        
        // Update subscription status to admin_paused and link to admin pause record
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'admin_paused',
            admin_pause_id: adminPauseRecord.id,
            admin_pause_start: pauseStart.toISOString(),
            admin_pause_end: pauseEnd?.toISOString() ?? null,
            updated_at: now.toISOString()
          })
          .eq('id', subscription.id);

        if (updateError) {
          console.error(`Error updating subscription ${subscription.id}:`, updateError);
          errors.push(`Error updating subscription ${subscription.id}: ${updateError.message}`);
          continue;
        }

        console.log(`✅ Updated subscription ${subscription.id} to admin_paused status`);

        // Mark upcoming deliveries as admin_paused
        try {
          const { error: deliveryError } = await supabase
            .from('subscription_deliveries')
            .update({ 
              status: 'admin_paused',
              admin_pause_id: adminPauseRecord.id
            })
            .eq('subscription_id', subscription.id)
            .eq('status', 'scheduled')
            .gte('delivery_date', pauseStart.toISOString());

          if (deliveryError) {
            console.log(`Note: Could not update deliveries for subscription ${subscription.id}:`, deliveryError);
            // Continue - delivery updates are not critical
          } else {
            console.log(`✅ Updated deliveries for subscription ${subscription.id}`);
          }
        } catch (deliveryUpdateError) {
          console.log(`Note: Delivery update failed for subscription ${subscription.id}:`, deliveryUpdateError);
          // Continue - not critical
        }

        processedCount++;
        console.log(`✅ Successfully paused subscription ${subscription.id}`);

      } catch (error) {
        console.error(`Error processing subscription ${subscription.id}:`, error);
        errors.push(`Error processing subscription ${subscription.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Log admin action
    const auditLog = {
      id: crypto.randomUUID(),
      admin_user_id: adminUserId,
      action: 'ADMIN_PAUSE_SUBSCRIPTIONS',
      details: {
        pauseType,
        userIds: pauseType === 'selected' ? userIds : 'all',
        startDate: pauseStart.toISOString(),
        endDate: pauseEnd?.toISOString() ?? null,
        reason,
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
      message: `Successfully paused ${processedCount} subscriptions with admin pause (ID: ${adminPauseRecord.id}).`,
      data: {
        adminPauseId: adminPauseRecord.id,
        processedCount,
        totalSubscriptions: subscriptions.length,
        pauseType,
        startDate: pauseStart.toISOString(),
        endDate: pauseEnd?.toISOString() ?? null,
        reason,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('Error in admin pause subscriptions:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
