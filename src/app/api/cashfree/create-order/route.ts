
// src/app/api/cashfree/create-order/route.ts
import { NextResponse } from 'next/server';
import { Cashfree } from 'cashfree-pg'; // Step 1: Import Cashfree SDK

// In a real app, these would come from environment variables securely.
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_API_MODE = process.env.CASHFREE_API_MODE || "sandbox"; // sandbox or production

// Step 2: Configure Cashfree SDK
// This should ideally be done once when your application starts.
// Make sure to handle errors during initialization.
if (CASHFREE_APP_ID && CASHFREE_SECRET_KEY) {
  try {
    Cashfree.XVerifySignature = true; // Recommended for security
    // Cashfree.XPartnerMerchantID = "YOUR_PARTNER_MERCHANT_ID_IF_APPLICABLE"; // If you are a partner
    // Cashfree.XEnableErrorAnalytics = true; // Optional: for error analytics
    // Cashfree.XTRAIL = true; // For testing in the sandbox environment, remove for production

    Cashfree.PG.setConfig({
      apiMode: CASHFREE_API_MODE, // or "production" based on environment variable
      checkoutVersion: "latest", // or a specific version like "4.0.0"
      appId: CASHFREE_APP_ID,
      secretKey: CASHFREE_SECRET_KEY,
    });
    console.log(`[Cashfree SDK] SDK configured in ${CASHFREE_API_MODE} mode.`);
  } catch (sdkError: any) {
    console.error("[Cashfree SDK] Error configuring Cashfree SDK:", sdkError.message);
    // Handle SDK configuration error appropriately
  }
} else {
  console.warn("[Cashfree SDK] App ID or Secret Key missing, SDK not configured.");
}

export async function POST(request: Request) {
  if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
    console.error("Cashfree API Error: App ID or Secret Key is not configured on the server. Cannot proceed.");
    return NextResponse.json(
      { success: false, message: 'Payment gateway configuration error on server. SDK cannot be initialized.' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json(); // Get order details from request body
    const { 
      orderAmount = 23.47, // Default example, should come from body.orderAmount
      orderCurrency = "INR", // Default example
      customerName = "Test Customer", // Example
      customerEmail = "test@example.com", // Example
      customerPhone = "9876543210", // Example
      internalOrderId = `elixr_order_${Date.now()}` // Unique order ID for your system
    } = body;

    console.log(`[Cashfree API Conceptual] Received request to create order:`);
    console.log(`  Amount: ${orderAmount} ${orderCurrency}`);
    console.log(`  Internal Order ID: ${internalOrderId}`);
    console.log(`  Customer: ${customerName}, ${customerEmail}, ${customerPhone}`);
    console.log(`  Using App ID (conceptual): ${CASHFREE_APP_ID.substring(0, 5)}...`);

    // Step 3: Simulate Cashfree SDK API Call to create order
    const orderRequest = {
      order_id: internalOrderId,
      order_amount: orderAmount,
      order_currency: orderCurrency,
      customer_details: {
        customer_id: `cust_${Date.now()}`, // Generate or retrieve your unique customer ID
        customer_email: customerEmail,
        customer_phone: customerPhone,
        customer_name: customerName,
      },
      order_meta: {
        return_url: `http://localhost:3000/checkout/success?order_id=${internalOrderId}`, // Replace with your actual return URL
        notify_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook/payment-confirm`, // Replace with your actual webhook URL
      },
      order_note: "Elixr Juice Order",
      // Add other necessary parameters like order_tags, payment_methods etc.
    };

    console.log("[Cashfree API] Preparing to call Cashfree.PG.Orders.createOrder with:", orderRequest);
    const cashfreeResponse = await Cashfree.PG.Orders.createOrder(orderRequest);

    console.log("[Cashfree API] Cashfree SDK order creation successful:", cashfreeResponse);

    if (!cashfreeResponse || !cashfreeResponse.order_token) {
        console.error("[Cashfree API] Cashfree response missing order_token:", cashfreeResponse);
        return NextResponse.json(
            { success: false, message: 'Cashfree API response missing order token.' },
            { status: 500 }
        );
    }

    // For this demo, we'll just simulate a successful response object structure.
    // Return the necessary data (like order_token) to the frontend
    return NextResponse.json({
      success: true,
      message: "Cashfree order created successfully (conceptual SDK simulation).",
      data: {
        orderToken: cashfreeResponse.order_token,
        orderId: cashfreeResponse.order_id,
        cfOrderId: cashfreeResponse.cf_order_id,
        paymentUrl: cashfreeResponse.payments?.url, // payments field might be optional based on API version
        // You might return other details as needed by Cashfree's JS SDK or your frontend
      },
    });

  } catch (error: any) {
    console.error("[Cashfree API] Error creating Cashfree order:", error);
    let errorMessage = 'Failed to create Cashfree order.';
    if (error.isAxiosError && error.response && error.response.data) { // Example of more specific error handling if SDK throws structured errors
        errorMessage = `Cashfree API Error: ${error.response.data.message || error.message}`;
    } else if (error.message) {
        errorMessage = error.message;
    }
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
