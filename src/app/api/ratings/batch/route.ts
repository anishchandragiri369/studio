import { NextResponse, NextRequest } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
  if (!supabase || !isSupabaseConfigured) {
    console.error("Database connection not available - Supabase client not initialized");
    return NextResponse.json(
      { success: false, message: 'Database connection not available.' },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const orderIdsParam = searchParams.get('orderIds');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required.' },
        { status: 400 }
      );
    }
    
    if (!orderIdsParam) {
      return NextResponse.json(
        { success: false, message: 'Order IDs are required.' },
        { status: 400 }
      );
    }

    // Parse the comma-separated order IDs
    const orderIds = orderIdsParam.split(',');
    console.log(`Batch checking ratings for ${orderIds.length} orders`);

    // Get ratings for all the specified orders
    const { data: ratings, error } = await supabase
      .from('order_ratings')
      .select('id, order_id, rating, created_at')
      .eq('user_id', userId)
      .in('order_id', orderIds);

    if (error) {
      console.error('Error fetching batch ratings:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch ratings.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ratings: ratings || [],
        // Include a map for easy lookup
        ratedOrderIds: (ratings || []).map(r => r.order_id)
      }
    });
  } catch (error) {
    console.error('Error in batch ratings API:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}
