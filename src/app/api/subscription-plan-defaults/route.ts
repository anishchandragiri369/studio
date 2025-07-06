import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    // Fetch default juices for the specified plan
    const { data: defaults, error } = await supabase
      .from('juice_subscription_plan_defaults')
      .select(`
        juice_id,
        quantity,
        sort_order,
        juices (
          id,
          name,
          flavor,
          price,
          description,
          category,
          tags,
          image,
          stock_quantity,
          is_active
        )
      `)
      .eq('plan_id', planId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching plan defaults:', error);
      return NextResponse.json(
        { error: 'Failed to fetch plan defaults' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    const transformedDefaults = defaults
      ?.filter(item => item.juices && (item.juices as any).is_active) // Only include active juices
      ?.map(item => ({
        juiceId: item.juice_id,
        quantity: item.quantity,
        juice: item.juices
      })) || [];

    return NextResponse.json({
      planId,
      defaults: transformedDefaults
    });

  } catch (error) {
    console.error('Error in subscription plan defaults API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Admin endpoint to manage plan defaults
export async function POST(request: Request) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: adminCheck } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { planId, defaults } = body;

    if (!planId || !Array.isArray(defaults)) {
      return NextResponse.json(
        { error: 'Plan ID and defaults array are required' },
        { status: 400 }
      );
    }

    // Validate defaults structure
    for (const item of defaults) {
      if (!item.juiceId || typeof item.quantity !== 'number' || item.quantity < 0) {
        return NextResponse.json(
          { error: 'Invalid default item structure' },
          { status: 400 }
        );
      }
    }

    // Delete existing defaults for this plan
    const { error: deleteError } = await supabase
      .from('juice_subscription_plan_defaults')
      .delete()
      .eq('plan_id', planId);

    if (deleteError) {
      console.error('Error deleting existing defaults:', deleteError);
      return NextResponse.json(
        { error: 'Failed to update plan defaults' },
        { status: 500 }
      );
    }

    // Insert new defaults
    const newDefaults = defaults.map((item, index) => ({
      plan_id: planId,
      juice_id: item.juiceId,
      quantity: item.quantity,
      sort_order: index + 1
    }));

    const { error: insertError } = await supabase
      .from('juice_subscription_plan_defaults')
      .insert(newDefaults);

    if (insertError) {
      console.error('Error inserting new defaults:', insertError);
      return NextResponse.json(
        { error: 'Failed to update plan defaults' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Plan defaults updated successfully',
      planId,
      defaults: newDefaults
    });

  } catch (error) {
    console.error('Error in subscription plan defaults API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 