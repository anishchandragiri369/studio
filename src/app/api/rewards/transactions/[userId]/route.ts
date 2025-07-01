import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle preflight OPTIONS request
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  if (!supabase) {
    return NextResponse.json(
      { success: false, message: 'Database connection not available.' },
      { status: 503, headers: corsHeaders }
    );
  }

  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Fetch reward transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('reward_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (transactionsError) {
      console.error('Error fetching reward transactions:', transactionsError);
      return NextResponse.json(
        { success: false, message: 'Unable to fetch transactions.' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json({
      success: true,
      data: transactions || []
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error in reward transactions API:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500, headers: corsHeaders }
    );
  }
}
