import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  console.log("Rating submission API called");
  
  if (!supabase) {
    console.error("Database connection not available - Supabase client not initialized");
    return NextResponse.json(
      { success: false, message: 'Database connection not available.' },
      { status: 503 }
    );
  }
  
  // Create a Supabase client with the user's session token to respect RLS
  // or use service role client to bypass RLS entirely
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  let adminClient = null;
  if (supabaseUrl && supabaseServiceKey) {
    adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      }
    });
    console.log("Created admin client with service role");
  } else {
    console.log("Unable to create admin client, service role key missing");
  }

  try {
    const body = await req.json();
    console.log("Rating submission request body:", JSON.stringify(body));
    
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
    console.log("Verifying order exists and belongs to user:", { orderId, userId });
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, status, items')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (orderError) {
      console.error("Error fetching order:", orderError);
      return NextResponse.json(
        { success: false, message: 'Error verifying order: ' + orderError.message },
        { status: 404 }
      );
    }
    
    if (!order) {
      console.error("Order not found or does not belong to user:", { orderId, userId });
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
    console.log("Inserting order rating for:", { orderId, userId, rating });
    
    let orderRating = null;
    try {
      const dbClient = adminClient || supabase;
      console.log("Using admin client:", !!adminClient);
      
      const { data: ratingData, error: ratingError } = await dbClient
        .from('order_ratings')
        .insert([{
          order_id: orderId,
          user_id: userId,
          rating,
          quality_rating: qualityRating,
          delivery_rating: deliveryRating,
          service_rating: serviceRating,
          feedback_text: feedbackText?.trim() ?? null,
          anonymous
        }])
        .select()
        .single();

      if (ratingError) {
        console.error('Error inserting order rating:', ratingError);
        return NextResponse.json(
          { success: false, message: 'Failed to submit rating: ' + ratingError.message },
          { status: 500 }
        );
      }
      
      orderRating = ratingData;
      console.log("Order rating inserted successfully:", orderRating);
    } catch (insertError) {
      console.error('Exception during order rating insertion:', insertError);
      return NextResponse.json(
        { success: false, message: 'Failed to submit rating due to database error.' },
        { status: 500 }
      );
    }

    // Insert product ratings if provided
    const productRatingInserts = [];
    if (productRatings && productRatings.length > 0) {
      console.log("Processing product ratings:", productRatings.length);
      
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
            feedback_text: productFeedback?.trim() ?? null,
            would_recommend: wouldRecommend,
            anonymous
          });
        }
      }

      if (productRatingInserts.length > 0) {
        console.log("Inserting product ratings:", productRatingInserts.length);
        try {
          const dbClient = adminClient || supabase;
          const { error: productRatingError } = await dbClient
            .from('product_ratings')
            .insert(productRatingInserts);

          if (productRatingError) {
            console.error('Error inserting product ratings:', productRatingError);
            // Don't fail the whole request, just log the error
          } else {
            console.log("Product ratings inserted successfully");
          }
        } catch (productRatingInsertError) {
          console.error('Exception during product ratings insertion:', productRatingInsertError);
          // Don't fail the whole request, just log the error
        }
      }
    }

    // Update order to mark rating as submitted
    const dbClient = adminClient || supabase;
    await dbClient
      .from('orders')
      .update({ rating_submitted: true })
      .eq('id', orderId);

    // Award points for rating (5 points for rating)
    try {
      const dbClient = adminClient || supabase;
      
      const { data: userRewards } = await dbClient
        .from('user_rewards')
        .select('total_points, total_earned')
        .eq('user_id', userId)
        .single();

      if (userRewards) {
        // Update both total_points and total_earned
        await dbClient
          .from('user_rewards')
          .update({
            total_points: userRewards.total_points + 5,
            total_earned: userRewards.total_earned + 2.5, // ₹2.5 for rating
            last_updated: new Date().toISOString()
          })
          .eq('user_id', userId);

        // Create transaction record
        await dbClient
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
        
        console.log(`Awarded 5 points to user ${userId} for rating order ${orderId}`);
      } else {
        // Create initial rewards record if it doesn't exist
        const referralCode = `ELIXR${userId.slice(0, 6)}`;
        
        await dbClient
          .from('user_rewards')
          .insert([{
            user_id: userId,
            total_points: 5,
            total_earned: 2.5,
            referral_code: referralCode,
            referrals_count: 0,
            redeemed_points: 0,
            last_updated: new Date().toISOString()
          }]);

        // Create transaction record
        await dbClient
          .from('reward_transactions')
          .insert([{
            user_id: userId,
            type: 'earned',
            points: 5,
            amount: 2.5,
            description: `Rating points for order #${orderId.slice(-8)}`,
            order_id: orderId,
            created_at: new Date().toISOString()
          }]);
        
        console.log(`Created new rewards record and awarded 5 points to user ${userId} for rating order ${orderId}`);
      }
    } catch (rewardError) {
      console.error('Error awarding rating points:', rewardError);
      // Don't fail the request for reward errors
    }

    console.log("Rating submission successful, returning response");
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
        orderRating: orderRating ?? null,
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
