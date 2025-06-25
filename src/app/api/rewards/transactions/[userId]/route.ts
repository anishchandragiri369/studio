import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  if (!supabase) {
    return NextResponse.json(
      { success: false, message: 'Database connection not available.' },
      { status: 503 }
    );
  }

  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required.' },
        { status: 400 }
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
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: transactions || []
    });

  } catch (error) {
    console.error('Error in reward transactions API:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}
