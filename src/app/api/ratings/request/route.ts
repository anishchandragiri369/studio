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
    const { orderId, orderStatus, triggerEmail = false } = body;

    // Validate required fields
    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required.' },
        { status: 400 }
      );
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

    // Check if order is eligible for rating
    const completedStatuses = ['delivered', 'Delivered', 'payment_success', 'Payment Success', 'completed'];
    const isCompleted = completedStatuses.includes(orderStatus || order.status);
    
    if (!isCompleted) {
      return NextResponse.json(
        { success: false, message: 'Order is not completed yet.' },
        { status: 400 }
      );
    }

    // Check if rating has already been submitted
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

    // Update order to mark rating as requested
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        rating_requested: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order rating status:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to update order status.' },
        { status: 500 }
      );
    }

    // Optional: Send rating request email
    if (triggerEmail && order.user_id) {
      try {
        // This would integrate with your email system
        // For now, we'll just log it
        console.log(`Rating request triggered for order ${orderId}, user ${order.user_id}`);
        
        // You could call your email API here:
        // await fetch('/api/send-rating-request-email', {
        //   method: 'POST',
        //   body: JSON.stringify({ orderId, userEmail: order.email })
        // });
      } catch (emailError) {
        console.error('Error sending rating request email:', emailError);
        // Don't fail the request for email errors
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Rating request processed successfully.',
      data: {
        orderId,
        ratingRequested: true,
        emailSent: triggerEmail
      }
    });

  } catch (error) {
    console.error('Error in rating request:', error);
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
    const days = parseInt(searchParams.get('days') || '7');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get orders that are completed but haven't had rating requested
    const completedStatuses = ['delivered', 'Delivered', 'payment_success', 'Payment Success', 'completed'];
    
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, user_id, email, status, created_at, total_amount, items')
      .in('status', completedStatuses)
      .eq('rating_requested', false)
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching orders for rating requests:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch orders.' },
        { status: 500 }
      );
    }

    // Filter out orders that already have ratings
    const ordersWithoutRatings = [];
    for (const order of orders || []) {
      const { data: existingRating } = await supabase
        .from('order_ratings')
        .select('id')
        .eq('order_id', order.id)
        .single();

      if (!existingRating) {
        ordersWithoutRatings.push(order);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        orders: ordersWithoutRatings,
        count: ordersWithoutRatings.length,
        eligibleForRatingRequest: ordersWithoutRatings.length
      }
    });

  } catch (error) {
    console.error('Error fetching rating request candidates:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}
