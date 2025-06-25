import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { generateReferralCode } from '@/lib/rewards';

export async function POST(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { success: false, message: 'Database connection not available.' },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required.' },
        { status: 400 }
      );
    }

    // Check if user already has rewards record
    const { data: existingRewards, error: existingError } = await supabase
      .from('user_rewards')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingRewards) {
      return NextResponse.json({
        success: true,
        data: existingRewards,
        message: 'User rewards already exist.'
      });
    }

    // Generate unique referral code
    let referralCode = generateReferralCode(userId);
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const { data: existingCode, error: codeError } = await supabase
        .from('user_rewards')
        .select('referral_code')
        .eq('referral_code', referralCode)
        .single();

      if (!existingCode) {
        break; // Code is unique
      }

      referralCode = generateReferralCode(userId);
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { success: false, message: 'Unable to generate unique referral code.' },
        { status: 500 }
      );
    }

    // Create user rewards record
    const { data: newRewards, error: insertError } = await supabase
      .from('user_rewards')
      .insert([{
        user_id: userId,
        total_points: 0,
        total_earned: 0,
        referral_code: referralCode,
        referrals_count: 0,
        last_updated: new Date().toISOString()
      }])
      .select('*')
      .single();

    if (insertError) {
      console.error('Error creating user rewards:', insertError);
      return NextResponse.json(
        { success: false, message: 'Unable to create user rewards.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newRewards,
      message: 'User rewards initialized successfully.'
    });

  } catch (error) {
    console.error('Error initializing user rewards:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}
