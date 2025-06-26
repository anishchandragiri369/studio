import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { REWARD_CONFIG, convertPointsToAmount } from '@/lib/rewards';

export async function POST(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { success: false, message: 'Database connection not available.' },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { userId, points } = body;

    if (!userId || !points || points < REWARD_CONFIG.MIN_REDEMPTION_POINTS) {
      return NextResponse.json(
        { success: false, message: `Minimum redemption is ${REWARD_CONFIG.MIN_REDEMPTION_POINTS} points.` },
        { status: 400 }
      );
    }

    // Get current user rewards
    const { data: userRewards, error: fetchError } = await supabase
      .from('user_rewards')
      .select('total_points, redeemed_points, available_points')
      .eq('user_id', userId)
      .single();

    if (fetchError || !userRewards) {
      return NextResponse.json(
        { success: false, message: 'User rewards not found.' },
        { status: 404 }
      );
    }

    // Check if user has enough available points
    const availablePoints = userRewards.total_points - userRewards.redeemed_points;
    if (availablePoints < points) {
      return NextResponse.json(
        { success: false, message: 'Insufficient points for redemption.' },
        { status: 400 }
      );
    }

    const redeemAmount = convertPointsToAmount(points);

    // Start transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('reward_transactions')
      .insert([{
        user_id: userId,
        type: 'redeemed',
        points: points,
        amount: redeemAmount,
        description: `Redeemed ${points} points for ₹${redeemAmount} account credit`,
        created_at: new Date().toISOString()
      }])
      .select('id')
      .single();

    if (transactionError) {
      console.error('Error creating redemption transaction:', transactionError);
      return NextResponse.json(
        { success: false, message: 'Unable to process redemption.' },
        { status: 500 }
      );
    }

    // Update user rewards
    const { error: updateError } = await supabase
      .from('user_rewards')
      .update({
        redeemed_points: userRewards.redeemed_points + points,
        last_updated: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating user rewards:', updateError);
      
      // Rollback transaction
      await supabase
        .from('reward_transactions')
        .delete()
        .eq('id', transaction.id);

      return NextResponse.json(
        { success: false, message: 'Unable to process redemption.' },
        { status: 500 }
      );
    }

    // Create account credit (you might want to create a separate table for this)
    const { error: creditError } = await supabase
      .from('account_credits')
      .insert([{
        user_id: userId,
        amount: redeemAmount,
        source: 'reward_redemption',
        transaction_id: transaction.id,
        status: 'active',
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year expiry
        created_at: new Date().toISOString()
      }]);

    if (creditError) {
      console.error('Error creating account credit:', creditError);
      // Note: We don't rollback here as the points are already redeemed
      // This should be handled by a background job or manual intervention
    }

    return NextResponse.json({
      success: true,
      data: {
        transactionId: transaction.id,
        pointsRedeemed: points,
        amountCredited: redeemAmount,
        newAvailablePoints: availablePoints - points
      },
      message: `Successfully redeemed ${points} points for ₹${redeemAmount} account credit.`
    });

  } catch (error) {
    console.error('Error in points redemption:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}
