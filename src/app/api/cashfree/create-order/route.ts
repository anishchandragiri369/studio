
// src/app/api/cashfree/create-order/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { Cashfree } from "cashfree-pg";
import type { CreateOrderRequest } from 'cashfree-pg/dist/types/orders'; // Import specific types

// Load environment variables
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_API_MODE = process.env.CASHFREE_API_MODE as "sandbox" | "production" | undefined || "sandbox"; // Default to sandbox
const API_VERSION = "2023-08-01"; // Or your desired API version

// Log environment variable status during initialization (server-side)
console.log("[Cashfree API Init] Attempting to read CASHFREE_APP_ID:", CASHFREE_APP_ID ? "Present" : "MISSING or EMPTY");
console.log("[Cashfree API Init] Attempting to read CASHFREE_SECRET_KEY:", CASHFREE_SECRET_KEY ? "Present" : "MISSING or EMPTY");
console.log("[Cashfree API Init] CASHFREE_API_MODE:", CASHFREE_API_MODE);

let sdkInitialized = false;

if (CASHFREE_APP_ID && CASHFREE_SECRET_KEY) {
  try {
    Cashfree.XClientId = CASHFREE_APP_ID;
    Cashfree.XClientSecret = CASHFREE_SECRET_KEY;
    Cashfree.XEnvironment = CASHFREE_API_MODE === "production" ? Cashfree.Environment.PRODUCTION : Cashfree.Environment.SANDBOX;
    sdkInitialized = true;
    console.log("[Cashfree API Init] Cashfree SDK configured with Environment:", Cashfree.XEnvironment);
  } catch (error) {
    console.error("[Cashfree API Init] Error configuring Cashfree SDK:", error);
    sdkInitialized = false;
  }
} else {
  console.warn("[Cashfree API Init] Cashfree App ID or Secret Key is missing. SDK not initialized.");
  sdkInitialized = false;
}

export async function POST(request: NextRequest) {
  if (!sdkInitialized) {
    console.error("[Cashfree Create Order] SDK not initialized. Aborting.");
    return NextResponse.json(
      { success: false, message: 'Payment gateway SDK not initialized on server. Check server logs.' },
      { status: 503 } // Service Unavailable
    );
  }

  try {
    const body = await request.json();
    const { orderAmount, orderItems, customerInfo } = body;

    // Basic validation (add more as needed)
    if (!orderAmount || typeof orderAmount !== 'number' || orderAmount <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid order amount.' }, { status: 400 });
    }
    if (!customerInfo || !customerInfo.email || !customerInfo.phone) {
      return NextResponse.json({ success: false, message: 'Customer email and phone are required.' }, { status: 400 });
    }

    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const returnUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/order-success?order_id={order_id}`;
    // It's good practice to have a webhook for server-to-server confirmation
    // const notifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/api/webhook/payment-confirm`;


    const orderRequest: CreateOrderRequest = {
      order_id: orderId,
      order_amount: orderAmount,
      order_currency: "INR",
      customer_details: {
        customer_id: customerInfo.id || `cust_${Date.now()}`,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        customer_name: customerInfo.name || customerInfo.email.split('@')[0],
      },
      order_meta: {
        return_url: returnUrl,
        // notify_url: notifyUrl, // Optional: if you have a webhook
        payment_methods: "cc,dc,nb,upi,paypal,wallet,credit_card_emi" // Example payment methods
      },
      order_note: `Order for Elixr Juices. Items: ${Array.isArray(orderItems) ? orderItems.map((item: any) => `${item.name} (x${item.quantity})`).join(', ') : 'N/A'}`,
      // order_expiry_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // Example: Order expires in 30 mins
    };

    console.log("[Cashfree Create Order] Creating order with request:", JSON.stringify(orderRequest, null, 2));

    try {
      const cfOrder = await Cashfree.PGCreateOrder(API_VERSION, orderRequest);
      console.log("[Cashfree Create Order] Cashfree API Response Status:", cfOrder.status);
      console.log("[Cashfree Create Order] Cashfree API Response Data:", JSON.stringify(cfOrder.data, null, 2));

      if (cfOrder.data && cfOrder.data.payment_session_id) {
        return NextResponse.json({
          success: true,
          message: 'Order created successfully with Cashfree.',
          data: {
            orderId: cfOrder.data.order_id,
            paymentSessionId: cfOrder.data.payment_session_id, // This is the token for frontend checkout
            // orderToken: cfOrder.data.order_token, // order_token is also sometimes used, payment_session_id is key for Web JS SDK
            rawResponse: cfOrder.data, // For debugging if needed
          },
        });
      } else {
        // This case handles if cfOrder.data is null/undefined or payment_session_id is missing
        console.error("[Cashfree Create Order] Cashfree API call succeeded but response data is invalid or missing payment_session_id. Response Data:", cfOrder.data);
        return NextResponse.json(
          { 
            success: false, 
            message: 'Failed to create Cashfree order: Invalid response from gateway.',
            errorDetails: cfOrder.data // Send back what was received for client-side debugging if appropriate
          }, 
          { status: 500 }
        );
      }
    } catch (sdkError: any) {
      // This catches errors from the Cashfree.PGCreateOrder call itself
      console.error("[Cashfree Create Order] Error calling Cashfree PGCreateOrder:", sdkError);
      let errorMessage = "An unexpected error occurred while creating the payment order with Cashfree.";
      let errorDetails = null;

      if (sdkError.response && sdkError.response.data) {
        console.error("[Cashfree Create Order] Cashfree SDK Error Response Data:", sdkError.response.data);
        errorMessage = sdkError.response.data.message || errorMessage;
        errorDetails = sdkError.response.data;
      } else if (sdkError.message) {
        errorMessage = sdkError.message;
      }
      
      return NextResponse.json(
        { success: false, message: errorMessage, errorDetails },
        { status: sdkError.response?.status || 500 }
      );
    }

  } catch (error: any) {
    // This catches errors like `request.json()` failing or other unexpected errors in the POST handler
    console.error("[Cashfree Create Order] General error in POST handler:", error);
    return NextResponse.json(
      { success: false, message: error.message || 'An unexpected error occurred on the server.' },
      { status: 500 }
    );
  }
}
