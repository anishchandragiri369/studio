
// src/app/api/cashfree/create-order/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { Cashfree , CFEnvironment } from "cashfree-pg";
import type { CreateOrderRequest } from "cashfree-pg"; // Import specific types

// Load environment variables
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_API_MODE = process.env.CASHFREE_API_MODE as "sandbox" | "production" | undefined || "sandbox"; // Default to sandbox
const API_VERSION = "2023-08-01"; // Or your desired API version

// More explicit logging for environment variables right at module load time
console.log("------------------------------------------------------");
console.log("[Cashfree API Init - Module Load] SERVER_SIDE_ENV_CHECK:");
console.log(`[Cashfree API Init - Module Load] process.env.CASHFREE_APP_ID: ${CASHFREE_APP_ID ? `'${CASHFREE_APP_ID}' (Present)` : 'MISSING or EMPTY'}`);
console.log(`[Cashfree API Init - Module Load] process.env.CASHFREE_SECRET_KEY: ${CASHFREE_SECRET_KEY ? 'Present (Secret - value not logged)' : 'MISSING or EMPTY'}`);
console.log(`[Cashfree API Init - Module Load] process.env.CASHFREE_API_MODE: ${CASHFREE_API_MODE}`);
console.log("------------------------------------------------------");

const cashfree = new Cashfree(
  CFEnvironment.SANDBOX,
  process.env.CASHFREE_APP_ID,
  process.env.CASHFREE_SECRET_KEY
);

let sdkInitialized = false;

if (CASHFREE_APP_ID && CASHFREE_SECRET_KEY) {
  try {
    cashfree.XClientId = CASHFREE_APP_ID;
    cashfree.XClientSecret = CASHFREE_SECRET_KEY;
    sdkInitialized = true;
    console.log("[Cashfree API Init] Cashfree SDK configured successfully with Environment:", cashfree.XEnvironment);
  } catch (error) {
    console.error("[Cashfree API Init] Error configuring Cashfree SDK:", error);
    sdkInitialized = false;
  }
} else {
  console.warn("[Cashfree API Init] Critical: Cashfree App ID or Secret Key is missing from server environment. SDK not initialized.");
  sdkInitialized = false;
}

export async function POST(request: NextRequest) {
  if (!sdkInitialized) {
    console.error("[Cashfree Create Order API] SDK not initialized at request time. Aborting. This means CASHFREE_APP_ID or CASHFREE_SECRET_KEY were missing when the server started or this module was loaded.");
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
    const notifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/api/webhook/payment-confirm`;


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
        notify_url: notifyUrl, 
        payment_methods: "cc,dc,ppc,ccc,emi,paypal,upi,nb,app,paylater" 
      },
      order_note: `Order for Elixr Juices. Items: ${Array.isArray(orderItems) ? orderItems.map((item: any) => `${item.name} (x${item.quantity})`).join(', ') : 'N/A'}`,
    };

    console.log("[Cashfree Create Order API] Creating order with request:", JSON.stringify(orderRequest, null, 2));

    try {
      const cfOrder = await cashfree.PGCreateOrder(orderRequest);
      console.log("[Cashfree Create Order API] Cashfree SDK PGCreateOrder Response Status:", cfOrder.status);
      console.log("[Cashfree Create Order API] Cashfree SDK PGCreateOrder Response Data:", JSON.stringify(cfOrder.data, null, 2)); // Log full data for debug

      if (cfOrder.data && cfOrder.data.payment_session_id) {
        return NextResponse.json({
          success: true,
          message: 'Order created successfully with Cashfree.',
          data: {
            orderId: cfOrder.data.order_id,
            paymentSessionId: cfOrder.data.payment_session_id,
            // orderToken is often an alias for payment_session_id with the Web JS SDK
            orderToken: cfOrder.data.payment_session_id, 
            rawResponse: cfOrder.data, 
          },
        });
      } else {
        console.error("[Cashfree Create Order API] Cashfree API call succeeded but response data is invalid or missing payment_session_id. Response Data:", cfOrder.data);
        return NextResponse.json(
          { 
            success: false, 
            message: 'Failed to create Cashfree order: Invalid response from gateway.',
            errorDetails: cfOrder.data 
          }, 
          { status: 500 }
        );
      }
    } catch (sdkError: any) {
      console.error("[Cashfree Create Order API] Error calling Cashfree PGCreateOrder:", sdkError);
      let errorMessage = "An unexpected error occurred while creating the payment order with Cashfree.";
      let errorDetails = null;

      if (sdkError.response && sdkError.response.data) {
        console.error("[Cashfree Create Order API] Cashfree SDK Error Response Data:", sdkError.response.data);
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
    console.error("[Cashfree Create Order API] General error in POST handler:", error);
    if (error instanceof SyntaxError) { // Specifically handle JSON parsing errors from request body
        return NextResponse.json(
            { success: false, message: `Invalid JSON payload in request: ${error.message}` },
            { status: 400 }
        );
    }
    return NextResponse.json(
      { success: false, message: error.message || 'An unexpected error occurred on the server.' },
      { status: 500 }
    );
  }
}
