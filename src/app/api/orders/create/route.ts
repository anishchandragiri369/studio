import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient'; // Assuming this is your Supabase client
import type { OrderItem, CheckoutAddressFormData } from '@/lib/types'; // Import necessary types
// If you have user authentication and want to link orders to users,
// import auth helper or get user session here.
console.log("inside orders page");

export async function POST(req: NextRequest) {
  if (!supabase) {
    console.error('/api/orders/create: Supabase client not initialized.');
     return NextResponse.json(
      { success: false, message: 'Database connection not available.' },
      { status: 503 } // Service Unavailable
    );
  }
  console.log("inside orders page");
  try {
    const body = await req.json();
    const { orderAmount, orderItems, shippingAddress, customerInfo, userId } = body;

    // TODO: Add more robust validation for incoming data
    if (!orderAmount || typeof orderAmount !== 'number' || orderAmount <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid order amount.' }, { status: 400 });
    }
     if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
       return NextResponse.json({ success: false, message: 'Order items are required.' }, { status: 400 });
     }
     // Add validation for shippingAddress and customerInfo as needed

    // TODO: Get authenticated user ID if orders are tied to users
    // Ensure userId is provided in the request body if user authentication is required
    // if (!userId) {
    //      return NextResponse.json({ success: false, message: 'User ID is required.' }, { status: 400 });
    // }

    const orderToInsert = {
      // user_id: userId, // Link order to user
      total_amount: orderAmount, // Use underscore to match schema
      items: orderItems, // Supabase can handle JSON columns
      shipping_address: customerInfo, // Use underscore to match schema
      // customerInfo: customerInfo, // Might also store customer info if needed
      status: 'Payment Pending', // Initial status
      // created_at will be automatically set by Supabase
    };
    console.log("orders to insert", orderToInsert);
    console.log('[API /orders/create] Attempting to insert order:', orderToInsert);

    const { data, error } = await supabase
      .from('orders') // Replace 'orders' with your actual table name
      .insert([orderToInsert])
      .select('id') // Select the generated ID to return
      .single(); // Expecting a single row back
    console.log("data is", data);
    console.log("error is", error);

    if (error) {
      console.error('[API /orders/create] Error inserting order into Supabase:', error);
      return NextResponse.json({ success: false, message: 'Failed to create order record in database.' }, { status: 500 });
    }

    console.log('[API /orders/create] Order created in Supabase with ID:', data.id);

    return NextResponse.json({ success: true, data: { id: data.id } }); // Return the internal order ID

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
