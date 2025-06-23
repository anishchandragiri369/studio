import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import type { OrderItem, CheckoutAddressFormData } from '@/lib/types';

export async function POST(req: NextRequest) {
  if (!supabase) {
    console.error('/api/orders/create: Supabase client not initialized.');
    return NextResponse.json(
      { success: false, message: 'Database connection not available.' },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { orderAmount, orderItems, customerInfo, userId } = body;

    // Validation
    if (!orderAmount || typeof orderAmount !== 'number' || orderAmount <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid order amount.' }, { status: 400 });
    }
    
    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return NextResponse.json({ success: false, message: 'Order items are required.' }, { status: 400 });
    }
    
    if (!customerInfo) {
      return NextResponse.json({ success: false, message: 'Customer info is required.' }, { status: 400 });
    }
    
    if (!customerInfo.name || !customerInfo.email) {
      return NextResponse.json({ success: false, message: 'Customer name and email are required.' }, { status: 400 });
    }

    const orderToInsert = {
      user_id: userId,
      total_amount: orderAmount,
      items: orderItems,
      shipping_address: customerInfo, // <-- FIXED: use shipping_address
      status: 'Payment Pending',
    };
    
    const { data, error } = await supabase
      .from('orders')
      .insert([orderToInsert])
      .select('id')
      .single();

    if (error) {
      console.error('[API /orders/create] Error inserting order into Supabase:', error);
      console.error('[API /orders/create] Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to create order record in database.',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Database error'
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { id: data.id } });

  } catch (error: any) {
    console.error('[API /orders/create] General error in POST handler:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, message: `Invalid JSON payload: ${error.message}` },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: error.message || 'An unexpected server error occurred.' },
      { status: 500 }
    );
  }
}
