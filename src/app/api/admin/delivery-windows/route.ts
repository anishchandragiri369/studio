import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('includeStats') === 'true';

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
      (timeWindows || []).map(async (window) => {
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

        // Calculate utilization rate
        const utilizationRate = window.max_capacity > 0 
          ? ((todayBookings || 0) / window.max_capacity) * 100 
          : 0;

        return {
          ...window,
          stats: {
            today_bookings: todayBookings || 0,
            weekly_bookings: weeklyBookings || 0,
            available_slots: Math.max(0, window.max_capacity - (todayBookings || 0)),
            utilization_rate: utilizationRate,
            is_full: (todayBookings || 0) >= window.max_capacity
          }
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: timeWindowsWithStats,
      meta: {
        total_windows: timeWindowsWithStats.length,
        active_windows: timeWindowsWithStats.filter(w => w.is_active).length,
        full_windows: timeWindowsWithStats.filter(w => w.stats?.is_full).length
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
  try {
    const body = await request.json();
    const {
      name,
      startTime,
      endTime,
      isActive = true,
      deliveryFeeModifier = 0,
      maxCapacity = 50,
      daysOfWeek = [1, 2, 3, 4, 5, 6, 7]
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
        days_of_week: daysOfWeek
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
      daysOfWeek
    } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Time window ID is required'
      }, { status: 400 });
    }

    // Build update object
    const updateData: any = { updated_at: new Date().toISOString() };
    
    if (name !== undefined) updateData.name = name;
    if (startTime !== undefined) updateData.start_time = startTime;
    if (endTime !== undefined) updateData.end_time = endTime;
    if (isActive !== undefined) updateData.is_active = isActive;
    if (deliveryFeeModifier !== undefined) updateData.delivery_fee_modifier = deliveryFeeModifier;
    if (maxCapacity !== undefined) updateData.max_capacity = maxCapacity;
    if (daysOfWeek !== undefined) updateData.days_of_week = daysOfWeek;

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
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Time window ID is required'
      }, { status: 400 });
    }

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
