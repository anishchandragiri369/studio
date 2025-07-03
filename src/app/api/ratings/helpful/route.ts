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
    const { ratingId, userId, isHelpful } = body;

    // Validate required fields
    if (!ratingId || !userId || typeof isHelpful !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'Rating ID, user ID, and helpfulness vote are required.' },
        { status: 400 }
      );
    }

    // Verify rating exists
    const { data: rating, error: ratingError } = await supabase
      .from('order_ratings')
      .select('id, user_id')
      .eq('id', ratingId)
      .single();

    if (ratingError || !rating) {
      return NextResponse.json(
        { success: false, message: 'Rating not found.' },
        { status: 404 }
      );
    }

    // Prevent users from voting on their own ratings
    if (rating.user_id === userId) {
      return NextResponse.json(
        { success: false, message: 'Cannot vote on your own rating.' },
        { status: 400 }
      );
    }

    // Check if user has already voted
    const { data: existingVote } = await supabase
      .from('rating_helpfulness')
      .select('id, is_helpful')
      .eq('rating_id', ratingId)
      .eq('user_id', userId)
      .single();

    if (existingVote) {
      // Update existing vote
      const { error: updateError } = await supabase
        .from('rating_helpfulness')
        .update({ is_helpful: isHelpful })
        .eq('id', existingVote.id);

      if (updateError) {
        console.error('Error updating helpfulness vote:', updateError);
        return NextResponse.json(
          { success: false, message: 'Failed to update vote.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Vote updated successfully.',
        data: { action: 'updated', isHelpful }
      });
    } else {
      // Insert new vote
      const { error: insertError } = await supabase
        .from('rating_helpfulness')
        .insert([{
          rating_id: ratingId,
          user_id: userId,
          is_helpful: isHelpful
        }]);

      if (insertError) {
        console.error('Error inserting helpfulness vote:', insertError);
        return NextResponse.json(
          { success: false, message: 'Failed to submit vote.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Vote submitted successfully.',
        data: { action: 'created', isHelpful }
      });
    }

  } catch (error) {
    console.error('Error in helpfulness vote:', error);
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
    const ratingId = searchParams.get('ratingId');
    const userId = searchParams.get('userId');

    if (!ratingId) {
      return NextResponse.json(
        { success: false, message: 'Rating ID is required.' },
        { status: 400 }
      );
    }

    // Get helpfulness votes for the rating
    let query = supabase
      .from('rating_helpfulness')
      .select('is_helpful, user_id, created_at')
      .eq('rating_id', ratingId);

    const { data: votes, error } = await query;

    if (error) {
      console.error('Error fetching helpfulness votes:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch votes.' },
        { status: 500 }
      );
    }

    const helpfulCount = votes?.filter(v => v.is_helpful).length || 0;
    const notHelpfulCount = votes?.filter(v => !v.is_helpful).length || 0;
    const userVote = userId ? votes?.find(v => v.user_id === userId) : null;

    return NextResponse.json({
      success: true,
      data: {
        helpfulCount,
        notHelpfulCount,
        totalVotes: votes?.length || 0,
        userVote: userVote ? userVote.is_helpful : null
      }
    });

  } catch (error) {
    console.error('Error fetching helpfulness data:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}
