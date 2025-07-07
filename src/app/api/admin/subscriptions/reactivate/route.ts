import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SubscriptionManager } from '@/lib/subscriptionManager';
import crypto from 'crypto';

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
    return NextResponse.json(
      { success: false, message: 'Database connection not available' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { 
      reactivationType, // 'all' or 'selected'
      subscriptionIds = [], // for selected subscriptions (changed from userIds)
      adminPauseId, // admin pause ID to reactivate
      adminUserId, // admin performing the action
      reactivationReason
    } = body;

    // Validate input
    if (!reactivationType || !['all', 'selected'].includes(reactivationType)) {
      return NextResponse.json(
        { success: false, message: 'Invalid reactivation type. Must be "all" or "selected"' },
        { status: 400 }
      );
    }

    // If adminPauseId is provided, fetch the affected subscription IDs automatically
    let finalSubscriptionIds = subscriptionIds;
    if (reactivationType === 'selected' && adminPauseId && (!subscriptionIds || subscriptionIds.length === 0)) {
      console.log(`Fetching subscription IDs for admin pause: ${adminPauseId}`);
      
      const { data: affectedSubscriptions, error: fetchPauseError } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('admin_pause_id', adminPauseId)
        .eq('status', 'admin_paused');

      if (fetchPauseError) {
        console.error('Error fetching subscriptions for admin pause:', fetchPauseError);
        return NextResponse.json(
          { success: false, message: 'Failed to fetch subscriptions for admin pause' },
          { status: 500 }
        );
      }

      if (!affectedSubscriptions || affectedSubscriptions.length === 0) {
        // Fallback: Mark the admin pause as reactivated since there are no subscriptions left
        const { error: pauseUpdateError } = await supabase
          .from('admin_subscription_pauses')
          .update({
            status: 'reactivated',
            reactivated_at: new Date().toISOString(),
            reactivated_by: adminUserId
          })
          .eq('id', adminPauseId);

        if (pauseUpdateError) {
          console.error('Error updating admin pause status:', pauseUpdateError);
          return NextResponse.json(
            { success: false, message: 'No paused subscriptions found for this admin pause, and failed to update admin pause status.' },
            { status: 404 }
          );
        }

        return NextResponse.json(
          { 
            success: true, 
            message: 'No paused subscriptions found for this admin pause. Admin pause marked as reactivated.',
            data: {
              processedCount: 0,
              totalSubscriptions: 0,
              reactivationType: 'selected',
              reactivationDate: new Date().toISOString()
            }
          },
          { status: 200 }
        );
      }

      finalSubscriptionIds = affectedSubscriptions.map((sub: { id: string }) => sub.id);
      console.log(`Found ${finalSubscriptionIds.length} subscriptions for admin pause ${adminPauseId}:`, finalSubscriptionIds);
    }

    if (reactivationType === 'selected' && (!finalSubscriptionIds || finalSubscriptionIds.length === 0)) {
      return NextResponse.json(
        { success: false, message: 'Subscription IDs required for selected reactivation. Please provide subscription IDs or select an admin pause.' },
        { status: 400 }
      );
    }

    if (!adminUserId) {
      return NextResponse.json(
        { success: false, message: 'Admin user ID is required' },
        { status: 400 }
      );
    }

    const reactivationDate = new Date();

    // Note: Frontend handles admin authentication, this endpoint assumes valid admin access

    // Build query for fetching admin-paused subscriptions
    let query = supabase
      .from('user_subscriptions')
      .select('*')
      .eq('status', 'admin_paused');

    if (reactivationType === 'selected') {
      query = query.in('id', finalSubscriptionIds); // Use the final subscription IDs
    }

    const { data: pausedSubscriptions, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching paused subscriptions:', fetchError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch paused subscriptions' },
        { status: 500 }
      );
    }

    if (!pausedSubscriptions || pausedSubscriptions.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No admin-paused subscriptions found' },
        { status: 404 }
      );
    }

    let processedCount = 0;
    let errors: string[] = [];

    // Process each subscription
    for (const subscription of pausedSubscriptions) {
      try {
        console.log(`Processing subscription ${subscription.id} for admin reactivation...`);

        // Calculate new next delivery date with 6 PM cutoff logic
        const nextDeliveryDate = SubscriptionManager.calculateNextDeliveryDateWithCutoff(new Date());

        // Update subscription back to active status
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'active',
            admin_reactivated_at: reactivationDate.toISOString(),
            admin_reactivated_by: adminUserId,
            next_delivery_date: nextDeliveryDate.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id);

        if (updateError) {
          console.error(`Error reactivating subscription ${subscription.id}:`, updateError);
          errors.push(`Error reactivating subscription ${subscription.id}: ${updateError.message}`);
          continue;
        }

        console.log(`✅ Updated subscription ${subscription.id} to active status`);

        // Reschedule future deliveries
        try {
          const { error: deliveryUpdateError } = await supabase
            .from('subscription_deliveries')
            .update({ 
              status: 'scheduled',
              admin_reactivated_at: reactivationDate.toISOString()
            })
            .eq('subscription_id', subscription.id)
            .eq('status', 'admin_paused')
            .gte('delivery_date', nextDeliveryDate.toISOString().split('T')[0]);

          if (deliveryUpdateError) {
            console.log(`Note: Could not update deliveries for subscription ${subscription.id}:`, deliveryUpdateError);
            // Continue - delivery updates are not critical
          } else {
            console.log(`✅ Updated deliveries for subscription ${subscription.id}`);
          }
        } catch (deliveryUpdateError) {
          console.log(`Note: Delivery update failed for subscription ${subscription.id}:`, deliveryUpdateError);
          // Continue - not critical
        }

        processedCount++;
        console.log(`✅ Successfully reactivated subscription ${subscription.id}`);

      } catch (error) {
        console.error(`Error processing subscription ${subscription.id}:`, error);
        errors.push(`Error processing subscription ${subscription.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Update admin pause records to reactivated status
    const pauseIds = [...new Set(pausedSubscriptions.map((s: any) => s.admin_pause_id).filter(Boolean))];
    
    if (pauseIds.length > 0) {
      const { error: pauseUpdateError } = await supabase
        .from('admin_subscription_pauses')
        .update({
          status: 'reactivated',
          reactivated_at: reactivationDate.toISOString(),
          reactivated_by: adminUserId
        })
        .in('id', pauseIds);

      if (pauseUpdateError) {
        console.error('Error updating admin pause records:', pauseUpdateError);
        // Continue - this is not critical
      }
    }

    // Log admin action
    const auditLog = {
      id: crypto.randomUUID(),
      admin_user_id: adminUserId,
      action: 'ADMIN_REACTIVATE_SUBSCRIPTIONS',
      details: {
        reactivationType,
        subscriptionIds: reactivationType === 'selected' ? finalSubscriptionIds : 'all',
        reactivationReason: reactivationReason || 'Admin reactivation',
        processedCount,
        totalSubscriptions: pausedSubscriptions.length,
        errors
      },
      created_at: reactivationDate.toISOString()
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
      message: `Successfully reactivated ${processedCount} subscriptions.`,
      data: {
        processedCount,
        totalSubscriptions: pausedSubscriptions.length,
        reactivationType,
        reactivationDate: reactivationDate.toISOString(),
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
