import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Create admin client for bypassing RLS
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminClient = supabaseServiceKey && process.env.NEXT_PUBLIC_SUPABASE_URL 
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, supabaseServiceKey)
  : null;

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
  const dbClient = adminClient || supabase;
  
  if (!dbClient) {
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

    console.log(`Fetching transactions for user ${userId} using ${adminClient ? 'admin' : 'anon'} client`);

    // Fetch reward transactions
    const { data: transactions, error: transactionsError } = await dbClient
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
