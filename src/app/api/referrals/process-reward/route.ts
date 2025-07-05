import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { REWARD_CONFIG } from '@/lib/rewards';

// Create admin client for accessing user metadata
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { success: false, message: 'Database connection not available.' },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { orderId, userId, referralCode } = body;

    if (!orderId || !userId) {
      return NextResponse.json(
        { success: false, message: 'Order ID and user ID are required.' },
        { status: 400 }
      );
    }

    // Get referral code from user metadata if not provided
    let finalReferralCode = referralCode;
    if (!finalReferralCode) {
      try {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (userError) {
          console.error('Error fetching user data:', userError);
          return NextResponse.json({ success: true, message: 'No referral code to process.' });
        }
        
        finalReferralCode = userData.user?.user_metadata?.referral_code;
        console.log('Retrieved referral code from user metadata:', finalReferralCode);
      } catch (error) {
        console.error('Error accessing user metadata:', error);
        return NextResponse.json({ success: true, message: 'No referral code to process.' });
      }
    }

    // Only process if referral code is available
    if (!finalReferralCode) {
      return NextResponse.json({ success: true, message: 'No referral code to process.' });
    }

    // Validate referral code and get referrer (case-insensitive for backward compatibility)
    const { data: referrer, error: referrerError } = await supabaseAdmin
      .from('user_rewards')
      .select('user_id, referral_code')
      .eq('referral_code', finalReferralCode.toUpperCase())
      .single();

    if (referrerError || !referrer) {
      return NextResponse.json(
        { success: false, message: 'Invalid referral code.' },
        { status: 400 }
      );
    }

    // Check if this is the user's first completed order or OAuth signup
    const isOAuthSignup = orderId.startsWith('oauth-signup-');
    
    if (!isOAuthSignup) {
      const { data: previousOrders, error: orderError } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .neq('id', orderId);

      if (orderError) {
        console.error('Error checking previous orders:', orderError);
        return NextResponse.json(
          { success: false, message: 'Unable to process referral reward.' },
          { status: 500 }
        );
      }

      // Only process referral reward if this is the first completed order
      if (previousOrders && previousOrders.length > 0) {
        return NextResponse.json({ 
          success: true, 
          message: 'Referral reward only applies to first order.' 
        });
      }
    } else {
      console.log('Processing referral reward for OAuth signup');
    }

    // Check if referral reward already exists (use actual referral code from DB)
    const { data: existingReward, error: existingError } = await supabaseAdmin
      .from('referral_rewards')
      .select('id')
      .eq('referred_user_id', userId)
      .eq('referral_code', referrer.referral_code)
      .single();

    if (existingReward) {
      return NextResponse.json({ 
        success: true, 
        message: 'Referral reward already processed.' 
      });
    }

    // Create referral reward record (use actual referral code from DB)
    const { data: reward, error: rewardError } = await supabaseAdmin
      .from('referral_rewards')
      .insert([{
        referrer_id: referrer.user_id,
        referred_user_id: userId,
        referral_code: referrer.referral_code,
        reward_points: REWARD_CONFIG.REFERRAL_REWARD_POINTS,
        reward_amount: REWARD_CONFIG.REFERRAL_REWARD_AMOUNT,
        status: 'completed',
        order_id: orderId,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      }])
      .select('id')
      .single();

    if (rewardError) {
      console.error('Error creating referral reward:', rewardError);
      return NextResponse.json(
        { success: false, message: 'Unable to create referral reward.' },
        { status: 500 }
      );
    }    // Update referrer's reward points
    const { data: currentRewards, error: fetchError } = await supabaseAdmin
      .from('user_rewards')
      .select('total_points, total_earned, referrals_count')
      .eq('user_id', referrer.user_id)
      .single();

    if (fetchError) {
      console.error('Error fetching current rewards:', fetchError);
      return NextResponse.json(
        { success: false, message: 'Unable to update referrer rewards.' },
        { status: 500 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from('user_rewards')
      .update({
        total_points: (currentRewards?.total_points || 0) + REWARD_CONFIG.REFERRAL_REWARD_POINTS,
        total_earned: (currentRewards?.total_earned || 0) + REWARD_CONFIG.REFERRAL_REWARD_AMOUNT,
        referrals_count: (currentRewards?.referrals_count || 0) + 1,
        last_updated: new Date().toISOString()
      })
      .eq('user_id', referrer.user_id);

    if (updateError) {
      console.error('Error updating referrer rewards:', updateError);
      // Note: We don't return error here as the referral record was created successfully
    }

    // Create reward transaction record
    const { error: transactionError } = await supabaseAdmin
      .from('reward_transactions')
      .insert([{
        user_id: referrer.user_id,
        type: 'earned',
        points: REWARD_CONFIG.REFERRAL_REWARD_POINTS,
        amount: REWARD_CONFIG.REFERRAL_REWARD_AMOUNT,
        description: `Referral reward for ${referrer.referral_code}`,
        order_id: orderId,
        referral_id: reward.id,
        created_at: new Date().toISOString()
      }]);

    if (transactionError) {
      console.error('Error creating reward transaction:', transactionError);
    }

    return NextResponse.json({
      success: true,
      message: 'Referral reward processed successfully.',
      rewardPoints: REWARD_CONFIG.REFERRAL_REWARD_POINTS,
      rewardAmount: REWARD_CONFIG.REFERRAL_REWARD_AMOUNT
    });

  } catch (error) {
    console.error('Error processing referral reward:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}
