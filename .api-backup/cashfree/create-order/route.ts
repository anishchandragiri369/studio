// src/app/api/cashfree/create-order/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { Cashfree , CFEnvironment } from "cashfree-pg";
import type { CreateOrderRequest } from "cashfree-pg";
import { supabase } from '@/lib/supabaseClient';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';

// Load environment variables
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_API_MODE = process.env.CASHFREE_API_MODE as "sandbox" | "production" | undefined || "sandbox"; // Default to sandbox
const API_VERSION = "2023-08-01"; // Or your desired API version

const cashfree = new Cashfree(
  CASHFREE_API_MODE === "production" ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
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
    // ACCEPT internalOrderId from the request body
    const { internalOrderId, orderAmount, orderItems, customerInfo } = body;
    console.log("order-id",internalOrderId)

    // Basic validation (add more as needed)
    if (!internalOrderId || typeof internalOrderId !== 'string') { // Validate internalOrderId
       return NextResponse.json({ success: false, message: 'Internal Order ID is missing or invalid.' }, { status: 400 });
    }
    if (!orderAmount || typeof orderAmount !== 'number' || orderAmount <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid order amount.' }, { status: 400 });
    }
    
    // Add Cashfree sandbox amount validation
    if (CASHFREE_API_MODE === "sandbox" && orderAmount > 10000) {
      return NextResponse.json({ 
        success: false, 
        message: `Order amount (₹${orderAmount}) exceeds the maximum limit of ₹10,000 for sandbox payments. Please reduce the order amount.` 
      }, { status: 400 });
    }
    
    if (orderAmount > 100000) { // General production limit
      return NextResponse.json({ 
        success: false, 
        message: `Order amount (₹${orderAmount}) exceeds the maximum limit of ₹1,00,000. Please contact support for large orders.` 
      }, { status: 400 });
    }
    
    console.log(`[Cashfree API] Processing order amount: ₹${orderAmount} in ${CASHFREE_API_MODE} mode`);
    
    console.log("customerinfo",customerInfo.email)
    console.log("customerinfo",customerInfo.phone)
    if (!customerInfo || !customerInfo.email || !customerInfo.phone) {
      return NextResponse.json({ success: false, message: 'Customer email and phone are required.' }, { status: 400 });
    }

    // Use the internalOrderId for Cashfree's order_id if suitable,
    // or use a new one but include the internalOrderId in metadata/URLs.
    // Using the internalOrderId as Cashfree's order_id is common for simpler mapping.
    // Ensure your internalOrderId format meets Cashfree's requirements if used directly.
    const cashfreeOrderId = `elixr_${internalOrderId}`; // Prefixing to ensure uniqueness and identification

    // Construct return and notify URLs including the internalOrderId
    // const returnUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/order-success?order_id=${internalOrderId}`;
    // const notifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/api/webhook/payment-confirm?order_id=${internalOrderId}`;
    // const returnUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://dev.exlir.in'}/order-success?order_id=${internalOrderId}`;
    // const notifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://dev.elixr.in'}/api/webhook/payment-confirm?order_id=${internalOrderId}`;
    const returnUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://develixr.netlify.app'}/order-success?order_id=${internalOrderId}`;
    const notifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://develixr.netlify.app'}/.netlify/functions/payment-confirm?order_id=${internalOrderId}`;
    const customer_id = `${customerInfo.name?.substring(0, 4) || ""}_${customerInfo.phoneNumber?.replace(/\D/g, '').substring(0, 5) || ""}`;

    const orderRequest: CreateOrderRequest = {
      order_id: cashfreeOrderId, // Use the prefixed internal order ID
      order_amount: orderAmount,
      order_currency: "INR", // Ensure this is correct
      customer_details: {
        // Use customerInfo passed from frontend
        customer_id: `${customerInfo.name?.substring(0, 4) || ""}_${customerInfo.phone?.replace(/\D/g, '').substring(0, 5) || ""}`, // Use a stable customer ID // Use a stable customer ID
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        customer_name: customerInfo.name || customerInfo.email.split('@')[0],
      },
      order_meta: {
        return_url: returnUrl,
        notify_url: notifyUrl,
        payment_methods: "cc,dc,ppc,ccc,emi,paypal,upi,nb,app,paylater"
      },
      order_note: `Order for Elixr Juices. Internal ID: ${internalOrderId}`, // Include internal ID in note
      // Add any other required fields for Cashfree
    };

    console.log("[Cashfree Create Order API] Creating order with request:", JSON.stringify(orderRequest, null, 2));

    try {
      const cfOrder = await cashfree.PGCreateOrder(orderRequest);
      console.log("[Cashfree Create Order API] Cashfree SDK PGCreateOrder Response Status:", cfOrder.status);
      console.log("[Cashfree Create Order API] Cashfree SDK PGCreateOrder Response Data:", JSON.stringify(cfOrder.data, null, 2));      if (cfOrder.data && cfOrder.data.payment_session_id) {
        // Update the order record with Cashfree details
        if (supabase) {
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              cashfree_order_id: cfOrder.data.order_id,
              payment_session_id: cfOrder.data.payment_session_id,
              updated_at: new Date().toISOString()
            })
            .eq('id', internalOrderId);

          if (updateError) {
            console.error("[Cashfree Create Order API] Failed to update order with Cashfree details:", updateError);
            // Continue execution but log the error
          } else {
            console.log("[Cashfree Create Order API] Successfully updated order with Cashfree details");
          }
        } else {
          console.error("[Cashfree Create Order API] Supabase client not available for updating order");
        }

        // Order is already created in the orders/create API. Only send emails here if needed.
        // Send confirmation emails
        return NextResponse.json({
          success: true,
          message: 'Order created successfully with Cashfree.',
          data: {
            cashfreeOrderId: cfOrder.data.order_id,
            paymentSessionId: cfOrder.data.payment_session_id,
            orderToken: cfOrder.data.payment_session_id,
            internalOrderId: internalOrderId,
            rawResponse: cfOrder.data,
          },
        });
      } else {
        console.error("[Cashfree Create Order API] Cashfree API call succeeded but response data is invalid or missing payment_session_id. Response Data:", cfOrder.data);
        // TODO: Potentially update Supabase order status to 'Payment Failed' or similar
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
      // TODO: Potentially update Supabase order status to 'Payment Failed' or similar
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
     if (error instanceof SyntaxError) { 
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
