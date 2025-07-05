import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { generateOrderInvoice } from '@/lib/invoiceGenerator';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');
  const userId = searchParams.get('userId');

  if (!orderId) {
    return NextResponse.json(
      { error: 'Order ID is required' },
      { status: 400 }
    );
  }

  if (!supabase) {
    return NextResponse.json(
      { error: 'Database connection not available' },
      { status: 503 }
    );
  }

  try {
    // Fetch order details
    let { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    // If userId is provided, ensure user owns the order
    if (userId && (!order || order.user_id !== userId)) {
      return NextResponse.json(
        { error: 'Order not found or access denied' },
        { status: 404 }
      );
    }

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found or access denied' },
        { status: 404 }
      );
    }

    // Fetch customer details
    let customer = null;
    if (order.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', order.user_id)
        .single();
      
      customer = profile;
    }

    // Generate PDF invoice
    const pdfGenerator = await generateOrderInvoice(order, customer);
    const pdfBuffer = pdfGenerator.getPDFArrayBuffer();

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${order.id}.pdf"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, userId, email } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    // Fetch order details
    let orderQuery = supabase
      .from('orders')
      .select('*')
      .eq('id', orderId);

    // If userId is provided, ensure user owns the order
    if (userId) {
      orderQuery = orderQuery.eq('user_id', userId);
    }

    const { data: orders, error: orderError } = await orderQuery;

    if (orderError || !orders || orders.length === 0) {
      return NextResponse.json(
        { error: 'Order not found or access denied' },
        { status: 404 }
      );
    }

    const order = orders[0];

    // For guest orders, verify email if provided
    if (!userId && email && order.customer_info?.email !== email) {
      return NextResponse.json(
        { error: 'Invalid email for this order' },
        { status: 403 }
      );
    }

    // Fetch customer details
    let customer = null;
    if (order.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', order.user_id)
        .single();
      
      customer = profile;
    } else if (order.customer_info) {
      // Use customer info from order for guest orders
      customer = order.customer_info;
    }

    // Generate PDF invoice
    const pdfGenerator = await generateOrderInvoice(order, customer);
    const pdfBlob = pdfGenerator.getPDFBlob();
    const pdfDataUri = pdfGenerator.getPDFDataUri();

    return NextResponse.json({
      success: true,
      pdfDataUri,
      filename: `invoice-${order.id}.pdf`
    });

  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}
