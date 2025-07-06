import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    const pincode = searchParams.get('pincode');

    if (!pincode) {
      return NextResponse.json(
        { error: 'Pincode is required' },
        { status: 400 }
      );
    }

    // Get delivery windows for the pincode
    const { data: deliveryWindows, error } = await supabase
      .from('delivery_windows')
      .select('*')
      .eq('pincode', pincode)
      .eq('is_active', true)
      .order('day_of_week', { ascending: true });

    if (error) {
      console.error('Error fetching delivery windows:', error);
      return NextResponse.json(
        { error: 'Failed to fetch delivery windows' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      delivery_windows: deliveryWindows || []
    });

  } catch (error) {
    console.error('Error in delivery windows API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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
