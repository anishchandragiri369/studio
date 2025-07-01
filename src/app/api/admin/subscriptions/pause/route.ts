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
      end_date: pauseEnd?.toISOString() || null,
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
        // Calculate reactivation deadline based on admin pause duration
        const reactivationDeadline = pauseEnd 
          ? new Date(pauseEnd.getTime() + (3 * 30 * 24 * 60 * 60 * 1000)) // 3 months after admin pause ends
          : new Date(pauseStart.getTime() + (6 * 30 * 24 * 60 * 60 * 1000)); // 6 months if indefinite

        // Update subscription status
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'admin_paused',
            admin_pause_id: adminPauseRecord.id,
            pause_date: pauseStart.toISOString(),
            pause_reason: `Admin pause: ${reason}`,
            reactivation_deadline: reactivationDeadline.toISOString(),
            admin_pause_start: pauseStart.toISOString(),
            admin_pause_end: pauseEnd?.toISOString() || null,
            updated_at: now.toISOString()
          })
          .eq('id', subscription.id);

        if (updateError) {
          console.error(`Error updating subscription ${subscription.id}:`, updateError);
          errors.push(`Failed to pause subscription ${subscription.id}`);
          continue;
        }

        // Mark upcoming deliveries as admin_paused
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
          console.error(`Error updating deliveries for subscription ${subscription.id}:`, deliveryError);
          // Continue - this is not critical
        }

        processedCount++;
      } catch (error) {
        console.error(`Error processing subscription ${subscription.id}:`, error);
        errors.push(`Error processing subscription ${subscription.id}`);
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
        endDate: pauseEnd?.toISOString() || null,
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
      message: `Successfully paused ${processedCount} subscriptions`,
      data: {
        adminPauseId: adminPauseRecord.id,
        processedCount,
        totalSubscriptions: subscriptions.length,
        pauseType,
        startDate: pauseStart.toISOString(),
        endDate: pauseEnd?.toISOString() || null,
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
