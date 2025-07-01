import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, message: 'Database connection not available' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const adminUserId = searchParams.get('adminUserId');
    const includeSubscriptions = searchParams.get('includeSubscriptions') === 'true';

    if (!adminUserId) {
      return NextResponse.json(
        { success: false, message: 'Admin user ID is required' },
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

    // Get all admin pause records
    const { data: adminPauses, error: pausesError } = await supabase
      .from('admin_subscription_pauses')
      .select('*')
      .order('created_at', { ascending: false });

    if (pausesError) {
      console.error('Error fetching admin pauses:', pausesError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch admin pauses' },
        { status: 500 }
      );
    }

    // Get subscription counts by status
    const { data: subscriptionStats, error: statsError } = await supabase
      .from('user_subscriptions')
      .select('status')
      .in('status', ['active', 'admin_paused', 'paused', 'expired']);

    if (statsError) {
      console.error('Error fetching subscription stats:', statsError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch subscription statistics' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const stats = {
      total: subscriptionStats.length,
      active: subscriptionStats.filter(s => s.status === 'active').length,
      adminPaused: subscriptionStats.filter(s => s.status === 'admin_paused').length,
      userPaused: subscriptionStats.filter(s => s.status === 'paused').length,
      expired: subscriptionStats.filter(s => s.status === 'expired').length
    };

    let subscriptions = null;

    // If requested, include detailed subscription information
    if (includeSubscriptions) {
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select(`
          id,
          user_id,
          status,
          delivery_frequency,
          plan_id,
          next_delivery_date,
          subscription_end_date,
          pause_date,
          pause_reason,
          admin_pause_id,
          admin_pause_start,
          admin_pause_end,
          admin_reactivated_at,
          admin_reactivated_by,
          created_at,
          updated_at
        `)
        .order('updated_at', { ascending: false })
        .limit(100); // Limit to most recent 100 for performance

      if (subscriptionError) {
        console.error('Error fetching subscriptions:', subscriptionError);
        // Continue without subscription details
      } else {
        subscriptions = subscriptionData;
      }
    }

    // Get audit logs for admin actions
    const { data: auditLogs, error: auditError } = await supabase
      .from('admin_audit_logs')
      .select('*')
      .in('action', ['ADMIN_PAUSE_SUBSCRIPTIONS', 'ADMIN_REACTIVATE_SUBSCRIPTIONS'])
      .order('created_at', { ascending: false })
      .limit(50); // Most recent 50 admin actions

    if (auditError) {
      console.error('Error fetching audit logs:', auditError);
      // Continue without audit logs
    }

    return NextResponse.json({
      success: true,
      data: {
        adminPauses: adminPauses || [],
        subscriptionStats: stats,
        subscriptions,
        auditLogs: auditLogs || [],
        summary: {
          totalAdminPauses: adminPauses?.length || 0,
          activeAdminPauses: adminPauses?.filter(p => p.status === 'active').length || 0,
          reactivatedAdminPauses: adminPauses?.filter(p => p.status === 'reactivated').length || 0
        }
      }
    });

  } catch (error) {
    console.error('Error in admin subscription overview:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
