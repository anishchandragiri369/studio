import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const userId = searchParams.get('userId');

    // Get available time windows for the specified date
    const { data: timeWindows, error } = await supabase
      .rpc('get_available_time_windows', { 
        p_delivery_date: date,
        p_user_id: userId 
      });

    if (error) {
      console.error('Error fetching time windows:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch delivery time windows'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        date,
        time_windows: timeWindows || [],
        total_windows: timeWindows?.length || 0
      }
    });

  } catch (error) {
    console.error('Error in delivery windows API:', error);
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
      subscriptionId, 
      userId, 
      preferredTimeWindowId, 
      alternativeTimeWindowId,
      specialInstructions,
      isFlexible = true,
      preferredDays = [1, 2, 3, 4, 5], // Monday to Friday by default
      avoidDays = []
    } = body;

    if (!subscriptionId || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Subscription ID and User ID are required'
      }, { status: 400 });
    }

    // Insert or update customer delivery preferences
    const { data: preference, error } = await supabase
      .from('customer_delivery_preferences')
      .upsert({
        subscription_id: subscriptionId,
        user_id: userId,
        preferred_time_window_id: preferredTimeWindowId,
        alternative_time_window_id: alternativeTimeWindowId,
        special_instructions: specialInstructions,
        is_flexible: isFlexible,
        preferred_days: preferredDays,
        avoid_days: avoidDays,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving delivery preferences:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to save delivery preferences'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: preference,
      message: 'Delivery preferences saved successfully'
    });

  } catch (error) {
    console.error('Error saving delivery preferences:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
