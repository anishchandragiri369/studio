import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(_request: NextRequest) {
  try {
    // Get delivery schedule settings
    const { data: settings, error: settingsError } = await supabase
      .rpc('get_delivery_schedule_settings');

    if (settingsError) {
      console.error('Error fetching delivery schedule settings:', settingsError);
      return NextResponse.json(
        { error: 'Failed to fetch delivery schedule settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: settings ?? []
    });

  } catch (error) {
    console.error('Error in delivery schedule settings API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      subscription_type, 
      delivery_gap_days, 
      is_daily, 
      description, 
      change_reason,
      admin_user_id 
    } = body;

    // Validate required fields
    if (!subscription_type || delivery_gap_days === undefined || is_daily === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: subscription_type, delivery_gap_days, is_daily' },
        { status: 400 }
      );
    }

    // Validate subscription type
    const validTypes = ['juices', 'fruit_bowls', 'customized'];
    if (!validTypes.includes(subscription_type)) {
      return NextResponse.json(
        { error: 'Invalid subscription type. Must be one of: ' + validTypes.join(', ') },
        { status: 400 }
      );
    }

    // Validate delivery gap days
    if (delivery_gap_days < 1 || delivery_gap_days > 30) {
      return NextResponse.json(
        { error: 'Delivery gap days must be between 1 and 30' },
        { status: 400 }
      );
    }

    // Update delivery schedule setting
    const { data: result, error: updateError } = await supabase
      .rpc('update_delivery_schedule_setting', {
        p_subscription_type: subscription_type,
        p_delivery_gap_days: delivery_gap_days,
        p_is_daily: is_daily,
        p_description: description ?? null,
        p_change_reason: change_reason ?? null,
        p_admin_user_id: admin_user_id ?? null
      });

    if (updateError) {
      console.error('Error updating delivery schedule setting:', updateError);
      return NextResponse.json(
        { error: 'Failed to update delivery schedule setting' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      result: result
    });

  } catch (error) {
    console.error('Error in delivery schedule settings update API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
