import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role for admin operations - only at runtime
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

export async function GET() {
  const supabase = getSupabase();
  
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection not available' }, { status: 503 });
  }

  try {
    const { data, error } = await supabase
      .from('delivery_schedule_settings')
      .select('*')
      .eq('is_active', true)
      .order('id');

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching delivery schedule settings:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = getSupabase();
  
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection not available' }, { status: 503 });
  }

  try {
    const { subscription_type, delivery_gap_days, is_daily, description, change_reason, admin_email } = await request.json();
    
    // Get current settings for audit
    const { data: currentSettings } = await supabase
      .from('delivery_schedule_settings')
      .select('*')
      .eq('subscription_type', subscription_type)
      .single();

    if (!currentSettings) {
      return NextResponse.json({ error: 'Subscription type not found' }, { status: 404 });
    }

    // Update settings
    const { data: updatedSettings, error: updateError } = await supabase
      .from('delivery_schedule_settings')
      .update({
        delivery_gap_days,
        is_daily,
        description: description ?? currentSettings.description,
        updated_at: new Date().toISOString(),
        updated_by: admin_email
      })
      .eq('subscription_type', subscription_type)
      .select()
      .single();

    if (updateError) throw updateError;

    // Create audit record
    await supabase
      .from('delivery_schedule_audit')
      .insert({
        schedule_settings_id: updatedSettings.id,
        subscription_type,
        old_delivery_gap_days: currentSettings.delivery_gap_days,
        new_delivery_gap_days: delivery_gap_days,
        old_is_daily: currentSettings.is_daily,
        new_is_daily: is_daily,
        changed_by: admin_email,
        change_reason
      });

    return NextResponse.json({
      success: true,
      subscription_type,
      old_settings: {
        delivery_gap_days: currentSettings.delivery_gap_days,
        is_daily: currentSettings.is_daily
      },
      new_settings: {
        delivery_gap_days: updatedSettings.delivery_gap_days,
        is_daily: updatedSettings.is_daily,
        description: updatedSettings.description
      },
      updated_at: updatedSettings.updated_at
    });
  } catch (error) {
    console.error('Error updating delivery schedule settings:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
