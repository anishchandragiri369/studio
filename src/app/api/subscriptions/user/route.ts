import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { success: false, message: 'Database connection not available.' },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required.' },
        { status: 400 }
      );
    }

    // Fetch user subscriptions
    const { data: subscriptions, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_deliveries (
          id,
          delivery_date,
          status,
          items
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch subscriptions.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: subscriptions || []
    });

  } catch (error: any) {
    console.error('Error in get subscriptions API:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
