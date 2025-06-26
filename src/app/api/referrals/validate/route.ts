import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { success: false, message: 'Database connection not available.' },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { referralCode, userId } = body;

    if (!referralCode) {
      return NextResponse.json(
        { success: false, message: 'Referral code is required.' },
        { status: 400 }
      );
    }

    // Find the user who owns this referral code
    const { data: referrer, error: referrerError } = await supabase
      .from('user_rewards')
      .select('user_id')
      .eq('referral_code', referralCode.toUpperCase())
      .single();

    if (referrerError || !referrer) {
      return NextResponse.json(
        { success: false, message: 'Invalid referral code.' },
        { status: 400 }
      );
    }

    // Check if user is trying to use their own referral code
    if (userId && referrer.user_id === userId) {
      return NextResponse.json(
        { success: false, message: 'You cannot use your own referral code.' },
        { status: 400 }
      );
    }

    // Check if this referral code has already been used by this user
    if (userId) {
      const { data: existingReferral, error: existingError } = await supabase
        .from('referral_rewards')
        .select('id')
        .eq('referred_user_id', userId)
        .eq('referral_code', referralCode.toUpperCase())
        .single();

      if (existingReferral) {
        return NextResponse.json(
          { success: false, message: 'You have already used this referral code.' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      referrerId: referrer.user_id
    });
  } catch (error) {
    console.error('Error in referral validation:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}
