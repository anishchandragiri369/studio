import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { success: false, message: 'Database connection not available.' },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'recent'; // recent, top-rated, by-product
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const juiceId = searchParams.get('juiceId');
    const minRating = parseInt(searchParams.get('minRating') || '1');
    const includeAnonymous = searchParams.get('includeAnonymous') === 'true';

    let query = supabase
      .from('order_ratings')
      .select(`
        id,
        order_id,
        rating,
        quality_rating,
        delivery_rating,
        service_rating,
        feedback_text,
        anonymous,
        helpful_count,
        created_at,
        orders!inner(
          id,
          created_at,
          total_amount,
          items
        )
      `)
      .gte('rating', minRating)
      .not('feedback_text', 'is', null)
      .neq('feedback_text', '');

    // Filter out anonymous ratings if not requested
    if (!includeAnonymous) {
      query = query.eq('anonymous', false);
    }

    // Apply ordering based on type
    switch (type) {
      case 'top-rated':
        query = query
          .gte('rating', 4)
          .order('rating', { ascending: false })
          .order('helpful_count', { ascending: false })
          .order('created_at', { ascending: false });
        break;
      case 'most-helpful':
        query = query
          .gte('helpful_count', 1)
          .order('helpful_count', { ascending: false })
          .order('rating', { ascending: false })
          .order('created_at', { ascending: false });
        break;
      case 'recent':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    const { data: ratings, error: ratingsError } = await query
      .range(offset, offset + limit - 1);

    if (ratingsError) {
      console.error('Error fetching ratings:', ratingsError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch ratings.' },
        { status: 500 }
      );
    }

    // Get product ratings if juiceId is specified
    let productRatings: any[] = [];
    if (juiceId) {
      const { data: prodRatings, error: prodError } = await supabase
        .from('product_ratings')
        .select(`
          id,
          juice_id,
          juice_name,
          order_id,
          rating,
          taste_rating,
          freshness_rating,
          feedback_text,
          would_recommend,
          anonymous,
          helpful_count,
          created_at
        `)
        .eq('juice_id', juiceId)
        .gte('rating', minRating)
        .not('feedback_text', 'is', null)
        .neq('feedback_text', '')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (!prodError) {
        productRatings = prodRatings || [];
      }
    }

    // Calculate overall statistics
    const { data: stats } = await supabase
      .from('order_ratings')
      .select('rating')
      .gte('rating', 1);

    const totalRatings = stats?.length || 0;
    const averageRating = totalRatings > 0 && stats
      ? (stats.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(1)
      : '0';

    // Get rating distribution
    const ratingDistribution = {
      1: stats?.filter(r => r.rating === 1).length || 0,
      2: stats?.filter(r => r.rating === 2).length || 0,
      3: stats?.filter(r => r.rating === 3).length || 0,
      4: stats?.filter(r => r.rating === 4).length || 0,
      5: stats?.filter(r => r.rating === 5).length || 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        ratings: ratings || [],
        productRatings,
        statistics: {
          totalRatings,
          averageRating: parseFloat(averageRating),
          ratingDistribution
        },
        pagination: {
          offset,
          limit,
          hasMore: (ratings?.length || 0) === limit
        }
      }
    });

  } catch (error) {
    console.error('Error in ratings fetch:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}
