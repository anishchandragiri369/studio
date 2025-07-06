import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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

export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection not available' }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('includeStats') === 'true';
    const adminUserId = searchParams.get('adminUserId');

    // Fetch all delivery time windows
    const { data: timeWindows, error } = await supabase
      .from('delivery_time_windows')
      .select('*')
      .order('start_time');

    if (error) {
      console.error('Error fetching time windows:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch time windows'
      }, { status: 500 });
    }

    if (!includeStats) {
      return NextResponse.json({
        success: true,
        data: timeWindows
      });
    }

    // Fetch booking statistics for each time window
    const timeWindowsWithStats = await Promise.all(
      (timeWindows || []).map(async (window: any) => {
        // Get booking count for today
        const today = new Date().toISOString().split('T')[0];
        const { count: todayBookings } = await supabase
          .from('subscription_deliveries')
          .select('*', { count: 'exact' })
          .eq('delivery_time_window_id', window.id)
          .gte('delivery_date', today)
          .lt('delivery_date', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .in('status', ['scheduled', 'delivered']);

        // Get weekly booking trend
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const { count: weeklyBookings } = await supabase
          .from('subscription_deliveries')
          .select('*', { count: 'exact' })
          .eq('delivery_time_window_id', window.id)
          .gte('delivery_date', weekAgo)
          .in('status', ['scheduled', 'delivered']);

        // Get monthly booking trend
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const { count: monthlyBookings } = await supabase
          .from('subscription_deliveries')
          .select('*', { count: 'exact' })
          .eq('delivery_time_window_id', window.id)
          .gte('delivery_date', monthAgo)
          .in('status', ['scheduled', 'delivered']);

        // Calculate utilization rate
        const utilizationRate = window.max_capacity > 0 
          ? ((todayBookings || 0) / window.max_capacity) * 100 
          : 0;

        return {
          ...window,
          stats: {
            today_bookings: todayBookings || 0,
            weekly_bookings: weeklyBookings || 0,
            monthly_bookings: monthlyBookings || 0,
            available_slots: Math.max(0, window.max_capacity - (todayBookings || 0)),
            utilization_rate: utilizationRate,
            is_full: (todayBookings || 0) >= window.max_capacity,
            trend: weeklyBookings > 0 ? ((todayBookings || 0) / weeklyBookings) * 7 : 0
          }
        };
      })
    );

    // Log admin action
    if (adminUserId) {
      await supabase
        .from('admin_audit_logs')
        .insert({
          id: crypto.randomUUID(),
          admin_user_id: adminUserId,
          action: 'ADMIN_VIEW_DELIVERY_WINDOWS',
          details: {
            includeStats,
            totalWindows: timeWindowsWithStats.length,
            activeWindows: timeWindowsWithStats.filter(w => w.is_active).length
          },
          created_at: new Date().toISOString()
        });
    }

    return NextResponse.json({
      success: true,
      data: timeWindowsWithStats,
      meta: {
        total_windows: timeWindowsWithStats.length,
        active_windows: timeWindowsWithStats.filter(w => w.is_active).length,
        full_windows: timeWindowsWithStats.filter(w => w.stats?.is_full).length,
        average_utilization: timeWindowsWithStats.reduce((sum, w) => sum + (w.stats?.utilization_rate || 0), 0) / timeWindowsWithStats.length
      }
    });

  } catch (error) {
    console.error('Error in time windows admin API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection not available' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const {
      name,
      startTime,
      endTime,
      isActive = true,
      deliveryFeeModifier = 0,
      maxCapacity = 50,
      daysOfWeek = [1, 2, 3, 4, 5, 6, 7],
      adminUserId
    } = body;

    if (!name || !startTime || !endTime) {
      return NextResponse.json({
        success: false,
        error: 'Name, start time, and end time are required'
      }, { status: 400 });
    }

    // Validate time format (HH:MM:SS)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid time format. Use HH:MM:SS format'
      }, { status: 400 });
    }

    // Validate time logic
    if (startTime >= endTime) {
      return NextResponse.json({
        success: false,
        error: 'End time must be after start time'
      }, { status: 400 });
    }

    // Validate capacity
    if (maxCapacity < 1 || maxCapacity > 1000) {
      return NextResponse.json({
        success: false,
        error: 'Max capacity must be between 1 and 1000'
      }, { status: 400 });
    }

    // Validate days of week
    const validDays = [1, 2, 3, 4, 5, 6, 7];
    if (!daysOfWeek.every((day: number) => validDays.includes(day))) {
      return NextResponse.json({
        success: false,
        error: 'Days of week must be numbers 1-7 (Monday-Sunday)'
      }, { status: 400 });
    }

    // Create new time window
    const { data: newWindow, error } = await supabase
      .from('delivery_time_windows')
      .insert({
        name,
        start_time: startTime,
        end_time: endTime,
        is_active: isActive,
        delivery_fee_modifier: deliveryFeeModifier,
        max_capacity: maxCapacity,
        days_of_week: daysOfWeek,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating time window:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to create time window'
      }, { status: 500 });
    }

    // Log admin action
    if (adminUserId) {
      await supabase
        .from('admin_audit_logs')
        .insert({
          id: crypto.randomUUID(),
          admin_user_id: adminUserId,
          action: 'ADMIN_CREATE_DELIVERY_WINDOW',
          details: {
            windowId: newWindow.id,
            name,
            startTime,
            endTime,
            maxCapacity,
            daysOfWeek
          },
          created_at: new Date().toISOString()
        });
    }

    return NextResponse.json({
      success: true,
      data: newWindow,
      message: 'Time window created successfully'
    });

  } catch (error) {
    console.error('Error creating time window:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const supabase = getSupabase();
  
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection not available' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const {
      id,
      name,
      startTime,
      endTime,
      isActive,
      deliveryFeeModifier,
      maxCapacity,
      daysOfWeek,
      adminUserId
    } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Time window ID is required'
      }, { status: 400 });
    }

    // Get current window data for audit
    const { data: currentWindow } = await supabase
      .from('delivery_time_windows')
      .select('*')
      .eq('id', id)
      .single();

    // Build update object
    const updateData: any = { updated_at: new Date().toISOString() };
    
    if (name !== undefined) updateData.name = name;
    if (startTime !== undefined) updateData.start_time = startTime;
    if (endTime !== undefined) updateData.end_time = endTime;
    if (isActive !== undefined) updateData.is_active = isActive;
    if (deliveryFeeModifier !== undefined) updateData.delivery_fee_modifier = deliveryFeeModifier;
    if (maxCapacity !== undefined) updateData.max_capacity = maxCapacity;
    if (daysOfWeek !== undefined) updateData.days_of_week = daysOfWeek;

    // Validate time logic if both times are provided
    if (startTime && endTime && startTime >= endTime) {
      return NextResponse.json({
        success: false,
        error: 'End time must be after start time'
      }, { status: 400 });
    }

    // Update time window
    const { data: updatedWindow, error } = await supabase
      .from('delivery_time_windows')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating time window:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to update time window'
      }, { status: 500 });
    }

    // Log admin action
    if (adminUserId) {
      await supabase
        .from('admin_audit_logs')
        .insert({
          id: crypto.randomUUID(),
          admin_user_id: adminUserId,
          action: 'ADMIN_UPDATE_DELIVERY_WINDOW',
          details: {
            windowId: id,
            changes: {
              name: name !== undefined ? { from: currentWindow?.name, to: name } : undefined,
              startTime: startTime !== undefined ? { from: currentWindow?.start_time, to: startTime } : undefined,
              endTime: endTime !== undefined ? { from: currentWindow?.end_time, to: endTime } : undefined,
              isActive: isActive !== undefined ? { from: currentWindow?.is_active, to: isActive } : undefined,
              maxCapacity: maxCapacity !== undefined ? { from: currentWindow?.max_capacity, to: maxCapacity } : undefined
            }
          },
          created_at: new Date().toISOString()
        });
    }

    return NextResponse.json({
      success: true,
      data: updatedWindow,
      message: 'Time window updated successfully'
    });

  } catch (error) {
    console.error('Error updating time window:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = getSupabase();
  
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection not available' }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const adminUserId = searchParams.get('adminUserId');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Time window ID is required'
      }, { status: 400 });
    }

    // Get window details for audit
    const { data: windowDetails } = await supabase
      .from('delivery_time_windows')
      .select('*')
      .eq('id', id)
      .single();

    // Check if there are any active deliveries using this time window
    const { count: activeDeliveries } = await supabase
      .from('subscription_deliveries')
      .select('*', { count: 'exact' })
      .eq('delivery_time_window_id', id)
      .gte('delivery_date', new Date().toISOString().split('T')[0])
      .in('status', ['scheduled']);

    if ((activeDeliveries || 0) > 0) {
      return NextResponse.json({
        success: false,
        error: `Cannot delete time window: ${activeDeliveries} scheduled deliveries are using this window`
      }, { status: 400 });
    }

    // Delete time window
    const { error } = await supabase
      .from('delivery_time_windows')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting time window:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to delete time window'
      }, { status: 500 });
    }

    // Log admin action
    if (adminUserId) {
      await supabase
        .from('admin_audit_logs')
        .insert({
          id: crypto.randomUUID(),
          admin_user_id: adminUserId,
          action: 'ADMIN_DELETE_DELIVERY_WINDOW',
          details: {
            windowId: id,
            windowName: windowDetails?.name,
            activeDeliveries: activeDeliveries || 0
          },
          created_at: new Date().toISOString()
        });
    }

    return NextResponse.json({
      success: true,
      message: 'Time window deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting time window:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
