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
    const { orderId, orderStatus } = body;

    // Only process when order is completed
    if (orderStatus !== 'completed') {
      return NextResponse.json({ 
        success: true, 
        message: 'Order not completed yet, no processing needed.' 
      });
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, message: 'Order not found.' },
        { status: 404 }
      );
    }

    // Process referral reward if referral code exists
    if (order.referral_code && order.referrer_id) {
      try {
        const referralResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/referrals/process-reward`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id,
            userId: order.user_id,
            referralCode: order.referral_code
          })
        });

        const referralResult = await referralResponse.json();
        if (!referralResult.success) {
          console.error('Failed to process referral reward:', referralResult.message);
        }
      } catch (error) {
        console.error('Error processing referral reward:', error);
      }
    }

    // Award order points to customer (1 point per ₹10 spent)
    if (order.user_id && order.total_amount) {
      const orderPoints = Math.floor(order.total_amount / 10);
      
      if (orderPoints > 0) {
        try {
          // Check if user has rewards account
          const { data: userRewards, error: rewardsError } = await supabase
            .from('user_rewards')
            .select('*')
            .eq('user_id', order.user_id)
            .single();

          if (userRewards) {
            // Update existing rewards
            const { error: updateError } = await supabase
              .from('user_rewards')
              .update({
                total_points: userRewards.total_points + orderPoints,
                last_updated: new Date().toISOString()
              })
              .eq('user_id', order.user_id);

            if (updateError) {
              console.error('Error updating user points:', updateError);
            } else {
              // Create transaction record
              await supabase
                .from('reward_transactions')
                .insert([{
                  user_id: order.user_id,
                  type: 'earned',
                  points: orderPoints,
                  amount: orderPoints * 0.5, // ₹0.5 per point
                  description: `Order points for order #${order.id}`,
                  order_id: order.id,
                  created_at: new Date().toISOString()
                }]);
            }
          }
        } catch (error) {
          console.error('Error awarding order points:', error);
        }
      }
    }

    // Trigger rating request for completed orders
    try {
      const ratingResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ratings/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          orderStatus: orderStatus,
          triggerEmail: false // Set to true if you want to send rating request emails
        })
      });

      const ratingResult = await ratingResponse.json();
      if (!ratingResult.success) {
        console.error('Failed to trigger rating request:', ratingResult.message);
      } else {
        console.log('Rating request triggered successfully for order:', order.id);
      }
    } catch (error) {
      console.error('Error triggering rating request:', error);
      // Don't fail the webhook for rating request errors
    }

    return NextResponse.json({
      success: true,
      message: 'Order processing completed successfully.'
    });

  } catch (error) {
    console.error('Error in order completion webhook:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}
