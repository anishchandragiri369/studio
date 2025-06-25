import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Required for static export
export const dynamic = 'force-static';
export const revalidate = false;

export async function GET(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { success: false, message: 'Database connection not available.' },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get referral analytics
    const { data: referralRewards, error: referralError } = await supabase
      .from('referral_rewards')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .eq('status', 'completed');

    if (referralError) {
      console.error('Error fetching referral analytics:', referralError);
      return NextResponse.json(
        { success: false, message: 'Unable to fetch referral analytics.' },
        { status: 500 }
      );
    }

    // Get top referrers
    const { data: topReferrers, error: referrersError } = await supabase
      .from('user_rewards')
      .select('user_id, referral_code, referrals_count, total_earned')
      .gt('referrals_count', 0)
      .order('referrals_count', { ascending: false })
      .limit(20);

    if (referrersError) {
      console.error('Error fetching top referrers:', referrersError);
    }

    // Calculate monthly trends (simplified for demo)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      const monthReferrals = referralRewards?.filter(reward => {
        const rewardDate = new Date(reward.created_at);
        return rewardDate >= monthStart && rewardDate <= monthEnd;
      }) || [];

      monthlyTrends.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        referrals: monthReferrals.length,
        rewards: monthReferrals.reduce((sum, reward) => sum + reward.reward_amount, 0)
      });
    }

    const analytics = {
      totalReferrals: referralRewards?.length || 0,
      successfulReferrals: referralRewards?.filter(r => r.status === 'completed').length || 0,
      totalRewardsPaid: referralRewards?.reduce((sum, reward) => sum + reward.reward_amount, 0) || 0,
      topReferrers: topReferrers || [],
      monthlyTrends
    };

    return NextResponse.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Error in referral analytics API:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}
