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

    // Fetch user rewards
    const { data: rewards, error: rewardsError } = await supabase
      .from('user_rewards')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (rewardsError) {
      if (rewardsError.code === 'PGRST116') {
        // No rewards found, return empty state
        return NextResponse.json({
          success: true,
          data: null,
          message: 'No rewards found for user.'
        }, { headers: corsHeaders });
      }
      
      console.error('Error fetching user rewards:', rewardsError);
      return NextResponse.json(
        { success: false, message: 'Unable to fetch user rewards.' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: rewards.user_id,
        totalPoints: rewards.total_points,
        totalEarned: rewards.total_earned,
        referralCode: rewards.referral_code,
        referralsCount: rewards.referrals_count,
        lastUpdated: rewards.last_updated
      }
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error in user rewards API:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500, headers: corsHeaders }
    );
  }
}
