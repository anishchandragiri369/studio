import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('email')
      .eq('email', user.email)
      .single();

    if (adminError || !adminData) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get query parameters for date filtering
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build the query
    let query = supabase
      .from('orders')
      .select('*');

    // Apply date filters if provided
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    // Calculate statistics
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = {
      totalOrders: orders?.length || 0,
      totalRevenue: orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0,
      averageOrderValue: orders?.length > 0 
        ? orders.reduce((sum, order) => sum + (order.total_amount || 0), 0) / orders.length 
        : 0,
      subscriptionOrders: orders?.filter(order => order.order_type === 'subscription').length || 0,
      regularOrders: orders?.filter(order => order.order_type !== 'subscription').length || 0,
      pendingOrders: orders?.filter(order => 
        ['payment_pending', 'Payment Pending', 'processing', 'Processing'].includes(order.status)
      ).length || 0,
      completedOrders: orders?.filter(order => 
        ['payment_success', 'Payment Success', 'delivered', 'Delivered', 'shipped', 'Shipped'].includes(order.status)
      ).length || 0,
      todayOrders: orders?.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= today;
      }).length || 0,
      todayRevenue: orders?.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= today;
      }).reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0,
      thisWeekOrders: orders?.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= thisWeek;
      }).length || 0,
      thisWeekRevenue: orders?.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= thisWeek;
      }).reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0,
      thisMonthOrders: orders?.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= thisMonth;
      }).length || 0,
      thisMonthRevenue: orders?.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= thisMonth;
      }).reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0,
      statusBreakdown: {
        payment_success: orders?.filter(order => order.status === 'payment_success' || order.status === 'Payment Success').length || 0,
        payment_pending: orders?.filter(order => order.status === 'payment_pending' || order.status === 'Payment Pending').length || 0,
        processing: orders?.filter(order => order.status === 'processing' || order.status === 'Processing').length || 0,
        shipped: orders?.filter(order => order.status === 'shipped' || order.status === 'Shipped').length || 0,
        delivered: orders?.filter(order => order.status === 'delivered' || order.status === 'Delivered').length || 0,
      },
      orderTypeBreakdown: {
        subscription: orders?.filter(order => order.order_type === 'subscription').length || 0,
        regular: orders?.filter(order => order.order_type !== 'subscription').length || 0,
      }
    };

    return NextResponse.json({ stats, success: true });

  } catch (error) {
    console.error('Error in order stats API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 