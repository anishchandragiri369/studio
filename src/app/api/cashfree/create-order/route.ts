
// src/app/api/cashfree/create-order/route.ts
import { NextResponse } from 'next/server';
import { Cashfree } from "cashfree-pg";

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_API_MODE = process.env.CASHFREE_API_MODE || "sandbox"; // "sandbox" or "production"
const CASHFREE_API_VERSION = "2023-08-01"; // Use a recent, valid API version for Cashfree

let sdkInitialized = false;

if (CASHFREE_APP_ID && CASHFREE_SECRET_KEY) {
  try {
    Cashfree.XClientId = CASHFREE_APP_ID;
    Cashfree.XClientSecret = CASHFREE_SECRET_KEY;
    Cashfree.XEnvironment = CASHFREE_API_MODE === "production" 
      ? Cashfree.Environment.PRODUCTION 
      : Cashfree.Environment.SANDBOX;
    
    // Optional: You can still use these for partner or error analytics if needed and supported by v5.
    // Check v5 docs for XPartnerMerchantID and XEnableErrorAnalytics equivalents if required.
    // Cashfree.XVerifySignature = true; // This is often handled by webhook verification logic.

    console.log(`[Cashfree SDK v5] SDK configured in ${Cashfree.XEnvironment} mode.`);
    sdkInitialized = true;
  } catch (sdkError: any) {
    console.error("[Cashfree SDK v5] Error configuring Cashfree SDK:", sdkError.message);
    sdkInitialized = false;
  }
} else {
  console.warn("[Cashfree SDK v5] App ID or Secret Key missing. SDK cannot be initialized.");
  sdkInitialized = false;
}

export async function POST(request: Request) {
  if (!sdkInitialized) {
    console.error("Cashfree API Error: SDK is not initialized. Cannot proceed.");
    return NextResponse.json(
      { success: false, message: 'Payment gateway SDK not initialized on server.' },
      { status: 503 } // Service Unavailable
    );
  }

  try {
    const body = await request.json();
    const { 
      orderAmount,
      // orderCurrency, // Will default to INR if not provided by client, or set explicitly below
      internalOrderId, // Unique order ID for your system
      customerInfo,
      orderItems // For logging or internal use, not directly part of minimal Cashfree order creation payload
    } = body;

    if (!orderAmount || !internalOrderId || !customerInfo || !customerInfo.customerEmail || !customerInfo.customerPhone) {
        return NextResponse.json(
            { success: false, message: 'Missing required fields: orderAmount, internalOrderId, customerEmail, or customerPhone.' },
            { status: 400 }
        );
    }
    
    console.log("[Cashfree API] Received orderItems for logging (not directly in PGCreateOrder minimal payload):", orderItems);

    const orderRequestPayload = {
      order_id: internalOrderId,
      order_amount: parseFloat(orderAmount.toFixed(2)),
      order_currency: "INR", // Defaulting to INR, can be made dynamic
      customer_details: {
        customer_id: customerInfo.customerId || `cust_${Date.now()}`,
        customer_email: customerInfo.email, // Assuming customerInfo structure matches from frontend
        customer_phone: customerInfo.phone, // Assuming customerInfo structure matches
        customer_name: customerInfo.name, // Optional, but good to have
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?order_id=${internalOrderId}`,
        notify_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook/payment-confirm`, // Your webhook URL
      },
      order_note: "Elixr Juice Order",
      // Add other necessary parameters like order_tags, etc. as per Cashfree v5 docs
    };

    console.log("[Cashfree API v5] Preparing to call Cashfree.PGCreateOrder with:", orderRequestPayload);
    const cashfreeResponse = await Cashfree.PGCreateOrder(CASHFREE_API_VERSION, orderRequestPayload);

    console.log("[Cashfree API v5] Cashfree SDK order creation successful, raw response:", cashfreeResponse);

    // According to Cashfree docs, response.data will contain the order details
    // and payment_session_id is the token needed for checkout SDK.
    if (!cashfreeResponse.data || !cashfreeResponse.data.payment_session_id) {
        console.error("[Cashfree API v5] Cashfree response missing payment_session_id in data:", cashfreeResponse);
        const errorMessage = cashfreeResponse.data?.message || 'Cashfree API response missing payment_session_id or other critical data.';
        return NextResponse.json(
            { success: false, message: errorMessage },
            { status: 500 }
        );
    }

    return NextResponse.json({
      success: true,
      message: "Cashfree order created successfully.",
      data: {
        orderToken: cashfreeResponse.data.payment_session_id, // This is the payment_session_id
        orderId: cashfreeResponse.data.order_id,
        cfOrderId: cashfreeResponse.data.cf_order_id, // Cashfree's internal order ID
        // paymentUrl is typically not needed if using JS SDK drop-in, but can be part of `payments` object in response
      },
    });

  } catch (error: any) {
    console.error("[Cashfree API v5] Error creating Cashfree order:", error);
    let errorMessage = 'Failed to create Cashfree order.';
    // Cashfree SDK v5 errors might be structured in error.response.data
    if (error.response && error.response.data && error.response.data.message) {
        errorMessage = `Cashfree API Error: ${error.response.data.message}`;
        console.error("[Cashfree API v5] Detailed error from SDK:", error.response.data);
    } else if (error.message) {
        errorMessage = error.message;
    }
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
