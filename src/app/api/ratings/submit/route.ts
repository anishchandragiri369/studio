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
    const {
      orderId,
      userId,
      rating,
      qualityRating,
      deliveryRating,
      serviceRating,
      feedbackText,
      anonymous = false,
      productRatings = []
    } = body;

    // Validate required fields
    if (!orderId || !userId || !rating) {
      return NextResponse.json(
        { success: false, message: 'Order ID, user ID, and overall rating are required.' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: 'Rating must be between 1 and 5.' },
        { status: 400 }
      );
    }

    // Verify that the order belongs to the user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, status, items')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, message: 'Order not found or access denied.' },
        { status: 404 }
      );
    }

    // Check if order is completed/delivered
    const completedStatuses = ['delivered', 'Delivered', 'payment_success', 'Payment Success', 'completed'];
    if (!completedStatuses.includes(order.status)) {
      return NextResponse.json(
        { success: false, message: 'Order must be completed before rating.' },
        { status: 400 }
      );
    }

    // Check if rating already exists
    const { data: existingRating } = await supabase
      .from('order_ratings')
      .select('id')
      .eq('order_id', orderId)
      .single();

    if (existingRating) {
      return NextResponse.json(
        { success: false, message: 'Rating already submitted for this order.' },
        { status: 400 }
      );
    }

    // Start transaction - insert order rating
    const { data: orderRating, error: ratingError } = await supabase
      .from('order_ratings')
      .insert([{
        order_id: orderId,
        user_id: userId,
        rating,
        quality_rating: qualityRating,
        delivery_rating: deliveryRating,
        service_rating: serviceRating,
        feedback_text: feedbackText?.trim() || null,
        anonymous
      }])
      .select()
      .single();

    if (ratingError) {
      console.error('Error inserting order rating:', ratingError);
      return NextResponse.json(
        { success: false, message: 'Failed to submit rating.' },
        { status: 500 }
      );
    }

    // Insert product ratings if provided
    const productRatingInserts = [];
    if (productRatings && productRatings.length > 0) {
      for (const productRating of productRatings) {
        const {
          juiceId,
          juiceName,
          rating: productRatingValue,
          tasteRating,
          freshnessRating,
          feedbackText: productFeedback,
          wouldRecommend
        } = productRating;

        if (juiceId && juiceName && productRatingValue >= 1 && productRatingValue <= 5) {
          productRatingInserts.push({
            juice_id: juiceId,
            juice_name: juiceName,
            order_id: orderId,
            user_id: userId,
            rating: productRatingValue,
            taste_rating: tasteRating,
            freshness_rating: freshnessRating,
            feedback_text: productFeedback?.trim() || null,
            would_recommend: wouldRecommend,
            anonymous
          });
        }
      }

      if (productRatingInserts.length > 0) {
        const { error: productRatingError } = await supabase
          .from('product_ratings')
          .insert(productRatingInserts);

        if (productRatingError) {
          console.error('Error inserting product ratings:', productRatingError);
          // Don't fail the whole request, just log the error
        }
      }
    }

    // Update order to mark rating as submitted
    await supabase
      .from('orders')
      .update({ rating_submitted: true })
      .eq('id', orderId);

    // Award points for rating (5 points for rating)
    try {
      const { data: userRewards } = await supabase
        .from('user_rewards')
        .select('total_points')
        .eq('user_id', userId)
        .single();

      if (userRewards) {
        await supabase
          .from('user_rewards')
          .update({
            total_points: userRewards.total_points + 5,
            last_updated: new Date().toISOString()
          })
          .eq('user_id', userId);

        // Create transaction record
        await supabase
          .from('reward_transactions')
          .insert([{
            user_id: userId,
            type: 'earned',
            points: 5,
            amount: 2.5, // ₹2.5 for rating
            description: `Rating points for order #${orderId.slice(-8)}`,
            order_id: orderId,
            created_at: new Date().toISOString()
          }]);
      }
    } catch (rewardError) {
      console.error('Error awarding rating points:', rewardError);
      // Don't fail the request for reward errors
    }

    return NextResponse.json({
      success: true,
      message: 'Rating submitted successfully! You earned 5 reward points.',
      data: {
        orderRating,
        productRatingsCount: productRatingInserts.length,
        pointsEarned: 5
      }
    });

  } catch (error) {
    console.error('Error in rating submission:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { success: false, message: 'Database connection not available.' },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    const userId = searchParams.get('userId');

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required.' },
        { status: 400 }
      );
    }

    // Get order rating
    const { data: orderRating, error: ratingError } = await supabase
      .from('order_ratings')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (ratingError && ratingError.code !== 'PGRST116') {
      console.error('Error fetching order rating:', ratingError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch rating.' },
        { status: 500 }
      );
    }

    // Get product ratings for this order
    const { data: productRatings, error: productError } = await supabase
      .from('product_ratings')
      .select('*')
      .eq('order_id', orderId);

    if (productError) {
      console.error('Error fetching product ratings:', productError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch product ratings.' },
        { status: 500 }
      );
    }

    // Get feedback responses if user owns the rating
    let feedbackResponses = [];
    if (orderRating && userId && orderRating.user_id === userId) {
      const { data: responses } = await supabase
        .from('feedback_responses')
        .select('*')
        .eq('rating_id', orderRating.id)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      feedbackResponses = responses || [];
    }

    return NextResponse.json({
      success: true,
      data: {
        orderRating: orderRating || null,
        productRatings: productRatings || [],
        feedbackResponses
      }
    });

  } catch (error) {
    console.error('Error fetching ratings:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}
