import 'dotenv/config';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

console.log('[send-order-email] API route loaded');

// Set up Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

// Types for order data
interface OrderItem {
  juiceId: string;
  juiceName: string;
  image?: string;
  quantity: number;
  pricePerItem: number;
}

interface ShippingAddress {
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  mobileNumber?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

interface OrderData {
  id: string;
  order_type: 'one_time' | 'subscription';
  items: OrderItem[];
  total_amount: number;
  shipping_address?: ShippingAddress;
  email?: string;
  customer_email?: string;
  subscription_info?: {
    planName: string;
    planFrequency: 'weekly' | 'monthly';
    subscriptionDuration: number;
    basePrice: number;
    originalPrice: number;
    discountPercentage: number;
    discountAmount: number;
    finalPrice: number;
    selectedJuices?: { juiceId: string; quantity: number }[];
  };
  created_at: string;
  updated_at: string;
  instructions?: string;
  special_instructions?: string;
}

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );
}


async function getTransporter() {
  const oAuth2Client = getOAuth2Client();
  oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
  const accessTokenResponse = await oAuth2Client.getAccessToken();
  const accessToken = accessTokenResponse.token;
  if (!accessToken) throw new Error('Failed to retrieve access token.');
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.GMAIL_USER,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      accessToken: accessToken,
    },
    tls: {
      rejectUnauthorized: false, // For local dev only
    },
  });
}

function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    console.warn('[formatCurrency] Invalid amount received:', amount);
    return '₹0.00';
  }
  return `₹${amount.toFixed(2)}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function generateCustomerEmailHtml(order: OrderData, customerName: string): string {
  const isSubscription = order.order_type === 'subscription';
  const subscriptionInfo = order.subscription_info;
  const userInstructions = (order as any).instructions || (order as any).special_instructions || '';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${isSubscription ? 'Subscription' : 'Order'} Confirmation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .success-message { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .order-details h3 { color: #667eea; margin-top: 0; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .item-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #eee; }
        .item-row:last-child { border-bottom: none; }
        .total-row { font-weight: bold; font-size: 18px; color: #667eea; margin-top: 15px; padding-top: 15px; border-top: 2px solid #667eea; }
        .subscription-info { background: #e8f4fd; border-left: 4px solid #667eea; padding: 15px; margin: 15px 0; }
        .address-section { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 14px; }
        .contact-info { background: #667eea; color: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
        @media (max-width: 600px) {
            .item-row { flex-direction: column; align-items: flex-start; }
            .header h1 { font-size: 24px; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧃 Elixr</h1>
        <p>${isSubscription ? 'Subscription Confirmed!' : 'Order Confirmed!'}</p>
    </div>
    
    <div class="content">
        <div class="success-message">
            <strong>✅ Payment Successful!</strong> Your ${isSubscription ? 'subscription' : 'order'} has been confirmed and is being processed.
        </div>
        
        <p>Dear ${customerName},</p>
        <p>Thank you for choosing Elixr! Your ${isSubscription ? 'subscription' : 'order'} has been successfully placed and payment confirmed.</p>
        
        <div class="order-details">
            <h3>${isSubscription ? 'Subscription' : 'Order'} Details</h3>
            <p><strong>${isSubscription ? 'Subscription' : 'Order'} ID:</strong> ${order.id}</p>
            <p><strong>Date:</strong> ${formatDate(order.created_at)}</p>
              ${isSubscription && subscriptionInfo ? `
            <div class="subscription-info">
                <h4>📅 Subscription Information</h4>
                <p><strong>Plan:</strong> ${subscriptionInfo.planName}</p>
                <p><strong>Frequency:</strong> ${subscriptionInfo.planFrequency === 'weekly' ? 'Weekly' : 'Monthly'} deliveries</p>
                <p><strong>Duration:</strong> ${subscriptionInfo.planFrequency === 'weekly' 
                  ? (subscriptionInfo.subscriptionDuration === 1 ? '1 week' : `${subscriptionInfo.subscriptionDuration} weeks`)
                  : (subscriptionInfo.subscriptionDuration === 12 ? '1 year' : `${subscriptionInfo.subscriptionDuration} months`)
                }</p>
                ${subscriptionInfo.discountPercentage > 0 ? `
                <p><strong>Discount Applied:</strong> ${subscriptionInfo.discountPercentage}% off (${formatCurrency(subscriptionInfo.discountAmount)} saved!)</p>
                ` : ''}
            </div>
            ` : ''}
              <h4>Items ${isSubscription ? '(per delivery)' : ''}:</h4>
            ${order.items && order.items.length > 0 ? order.items.map(item => `
                <div class="item-row">
                    <div>
                        <strong>${item.juiceName || 'Unknown Item'}</strong><br>
                        <small>Quantity: ${item.quantity || 0}</small>
                    </div>
                    <div>${formatCurrency((item.pricePerItem || 0) * (item.quantity || 0))}</div>
                </div>
            `).join('') : '<p>No items found</p>'}
              <div class="total-row">
                <div style="display: flex; justify-content: space-between;">
                    <span>Total Amount:</span>
                    <span>${formatCurrency(order.total_amount || 0)}</span>
                </div>
            </div>
        </div>
        
        ${order.shipping_address ? `
        <div class="address-section">
            <h4>📍 Delivery Address</h4>
            <p>
                ${order.shipping_address.firstName || order.shipping_address.name || ''} ${order.shipping_address.lastName || ''}<br>
                ${order.shipping_address.address || ''}<br>
                ${order.shipping_address.city || ''}, ${order.shipping_address.state || ''} ${order.shipping_address.zipCode || ''}<br>
                ${order.shipping_address.country || 'India'}<br>
                Phone: ${order.shipping_address.mobileNumber || order.shipping_address.phone || 'N/A'}
            </p>
            ${userInstructions ? `<div style="margin-top:12px;"><strong>Special Instructions:</strong><br><span style="white-space:pre-line;">${userInstructions}</span></div>` : ''}
        </div>
        ` : ''}
        
        <div class="contact-info">
            <h4>📞 Need Help?</h4>
            <p>If you have any questions about your ${isSubscription ? 'subscription' : 'order'}, please don't hesitate to contact us:</p>
            <p>Email: support@elixr.com | Phone: +91-XXXXXXXXXX</p>
        </div>
        
        <p>We'll send you another email with tracking information once your ${isSubscription ? 'first delivery' : 'order'} ships.</p>
        
        <p>Thank you for choosing Elixr for your healthy juice needs!</p>
        
        <p>Best regards,<br>The Elixr Team 🧃</p>
    </div>
    
    <div class="footer">
        <p>This is an automated email. Please do not reply to this email address.</p>
        <p>© 2024 Elixr. All rights reserved.</p>
    </div>
</body>
</html>
  `;
}

function generateAdminEmailHtml(order: OrderData, customerName: string, customerEmail: string): string {
  const isSubscription = order.order_type === 'subscription';
  const subscriptionInfo = order.subscription_info;
  const userInstructions = (order as any).instructions || (order as any).special_instructions || '';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New ${isSubscription ? 'Subscription' : 'Order'} Alert</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 25px; border-radius: 0 0 10px 10px; }
        .alert-box { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .order-details { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #dc3545; }
        .customer-info { background: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .item-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #dee2e6; }
        .total-row { font-weight: bold; font-size: 16px; margin-top: 10px; padding-top: 10px; border-top: 2px solid #dc3545; }
        .subscription-highlight { background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .action-needed { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚨 New ${isSubscription ? 'Subscription' : 'Order'} Alert</h1>
        <p>Action Required: Process ${isSubscription ? 'Subscription' : 'Order'}</p>
    </div>
    
    <div class="content">
        <div class="alert-box">
            <strong>⚡ New ${isSubscription ? 'Subscription' : 'Order'} Received!</strong> A customer has successfully completed payment.
        </div>
        
        <div class="action-needed">
            <h4>📋 Immediate Actions Required:</h4>
            <ul>
                <li>✅ Process payment confirmation</li>
                <li>📦 Prepare ${isSubscription ? 'first delivery items' : 'order items'}</li>
                <li>🚚 Schedule ${isSubscription ? 'first delivery' : 'shipping'}</li>
                ${isSubscription ? '<li>📅 Set up recurring delivery schedule</li>' : ''}
                <li>📞 Contact customer if needed</li>
            </ul>
        </div>
        
        <div class="customer-info">
            <h3>👤 Customer Information</h3>
            <p><strong>Name:</strong> ${customerName}</p>
            <p><strong>Email:</strong> ${customerEmail}</p>
            <p><strong>Phone:</strong> ${order.shipping_address?.mobileNumber || order.shipping_address?.phone || 'Not provided'}</p>
        </div>
        
        <div class="order-details">
            <h3>${isSubscription ? 'Subscription' : 'Order'} Details</h3>
            <p><strong>${isSubscription ? 'Subscription' : 'Order'} ID:</strong> ${order.id}</p>
            <p><strong>Order Date:</strong> ${formatDate(order.created_at)}</p>
            <p><strong>Payment Status:</strong> ✅ CONFIRMED</p>
              ${isSubscription && subscriptionInfo ? `
            <div class="subscription-highlight">
                <h4>🔄 Subscription Details</h4>
                <p><strong>Plan:</strong> ${subscriptionInfo.planName}</p>
                <p><strong>Frequency:</strong> ${subscriptionInfo.planFrequency === 'weekly' ? 'Weekly' : 'Monthly'}</p>
                <p><strong>Duration:</strong> ${subscriptionInfo.planFrequency === 'weekly' 
                  ? (subscriptionInfo.subscriptionDuration === 1 ? '1 week' : `${subscriptionInfo.subscriptionDuration} weeks`)
                  : (subscriptionInfo.subscriptionDuration === 12 ? '1 year' : `${subscriptionInfo.subscriptionDuration} months`)
                }</p>
                <p><strong>Total Deliveries Expected:</strong> ${subscriptionInfo.planFrequency === 'weekly' ? subscriptionInfo.subscriptionDuration : subscriptionInfo.subscriptionDuration}</p>
                ${subscriptionInfo.discountPercentage > 0 ? `
                <p><strong>Discount Applied:</strong> ${subscriptionInfo.discountPercentage}% (${formatCurrency(subscriptionInfo.discountAmount)} saved)</p>
                ` : ''}
            </div>
            ` : ''}
              <h4>Items to ${isSubscription ? 'deliver per shipment' : 'ship'}:</h4>
            ${order.items && order.items.length > 0 ? order.items.map(item => `
                <div class="item-row">
                    <div>
                        <strong>${item.juiceName || 'Unknown Item'}</strong> (ID: ${item.juiceId || 'N/A'})<br>
                        <small>Quantity: ${item.quantity || 0} | Unit Price: ${formatCurrency(item.pricePerItem || 0)}</small>
                    </div>
                    <div><strong>${formatCurrency((item.pricePerItem || 0) * (item.quantity || 0))}</strong></div>
                </div>
            `).join('') : '<p>No items found</p>'}
              <div class="total-row">
                Total Amount: ${formatCurrency(order.total_amount || 0)}
            </div>
        </div>
        
        ${order.shipping_address ? `
        <div class="order-details">
            <h3>📍 Delivery Address</h3>
            <p>
                <strong>${order.shipping_address.firstName || order.shipping_address.name || ''} ${order.shipping_address.lastName || ''}</strong><br>
                ${order.shipping_address.address || ''}<br>
                ${order.shipping_address.city || ''}, ${order.shipping_address.state || ''} ${order.shipping_address.zipCode || ''}<br>
                ${order.shipping_address.country || 'India'}<br>
                <strong>Phone:</strong> ${order.shipping_address.mobileNumber || order.shipping_address.phone || 'N/A'}
            </p>
            ${userInstructions ? `<div style="margin-top:12px;"><strong>User Instructions:</strong><br><span style="white-space:pre-line;">${userInstructions}</span></div>` : ''}
        </div>
        ` : ''}
        
        <div class="action-needed">
            <h4>📞 Next Steps:</h4>
            <p>1. Log into the admin panel to process this ${isSubscription ? 'subscription' : 'order'}</p>
            <p>2. Verify inventory for the items listed above</p>
            <p>3. Contact customer at ${customerEmail} if any clarifications needed</p>
            ${isSubscription ? '<p>4. Set up the recurring delivery schedule in the system</p>' : ''}
            <p>Timestamp: ${new Date().toLocaleString('en-IN')}</p>
        </div>
    </div>
</body>
</html>
  `;
}

// Enhanced email sending function
async function sendOrderConfirmationEmails(orderData: OrderData): Promise<{ userEmailSent: boolean, adminEmailSent: boolean, errors: string[] }> {
  console.log('[sendOrderConfirmationEmails] Starting email sending process for order:', orderData.id);
  
  const transporter = await getTransporter();
  console.log('[sendOrderConfirmationEmails] Email transporter created successfully');
  
  const errors: string[] = [];
  let userEmailSent = false;
  let adminEmailSent = false;

  // Extract customer information
  const customerEmail = orderData.email || orderData.customer_email || orderData.shipping_address?.email;
  const customerName = orderData.shipping_address?.firstName 
    ? `${orderData.shipping_address.firstName} ${orderData.shipping_address.lastName || ''}`.trim()
    : orderData.shipping_address?.name || 'Valued Customer';
  console.log('[sendOrderConfirmationEmails] Customer details extracted:', {
    customerEmail,
    customerName,
    orderType: orderData.order_type
  });

  // Debug: Log order data structure to identify missing fields
  console.log('[sendOrderConfirmationEmails] Order data structure:', {
    id: orderData.id,
    order_type: orderData.order_type,
    total_amount: orderData.total_amount,
    items: orderData.items ? orderData.items.map(item => ({
      juiceId: item.juiceId,
      juiceName: item.juiceName,
      quantity: item.quantity,
      pricePerItem: item.pricePerItem
    })) : 'No items'
  });
  if (!customerEmail) {
    console.error('[sendOrderConfirmationEmails] Customer email not found in order data');
    errors.push('Customer email not found in order data');
    return { userEmailSent: false, adminEmailSent: false, errors };
  }

  // Admin email address
  const adminEmail = process.env.ADMIN_EMAIL;
  console.log('[sendOrderConfirmationEmails] Admin email configured:', !!adminEmail);
  if (!adminEmail) {
    console.warn('[sendOrderConfirmationEmails] Admin email not configured in environment variables');
    errors.push('Admin email not configured');
  }

  const isSubscription = orderData.order_type === 'subscription';
  console.log('[sendOrderConfirmationEmails] Processing', isSubscription ? 'subscription' : 'order', 'emails');
  // Send customer confirmation email
  try {
    console.log('[sendOrderConfirmationEmails] Preparing customer email for:', customerEmail);
    const customerEmailHtml = generateCustomerEmailHtml(orderData, customerName);
    console.log('[sendOrderConfirmationEmails] Customer email HTML generated, length:', customerEmailHtml.length);
    
    const customerMailOptions = {
      from: `"Elixr ${isSubscription ? 'Subscriptions' : 'Orders'}" <${process.env.GMAIL_USER}>`,
      to: customerEmail,
      subject: `${isSubscription ? 'Subscription' : 'Order'} Confirmation - ${orderData.id} ✅`,
      html: customerEmailHtml,
      text: `Thank you for your ${isSubscription ? 'subscription' : 'order'}!\n\n${isSubscription ? 'Subscription' : 'Order'} ID: ${orderData.id}\nTotal: ₹${orderData.total_amount}\n\nWe'll process your ${isSubscription ? 'first delivery' : 'order'} soon!`
    };

    console.log('[sendOrderConfirmationEmails] Sending customer email...');
    const customerEmailInfo = await transporter.sendMail(customerMailOptions);
    console.log('[sendOrderConfirmationEmails] Customer email sent successfully! Message ID:', customerEmailInfo.messageId);
    userEmailSent = true;
  } catch (error) {
    console.error('[sendOrderConfirmationEmails] Error sending customer email:', error);
    errors.push(`Customer email failed: ${error}`);
  }
  // Send admin notification email
  if (adminEmail) {
    try {
      console.log('[sendOrderConfirmationEmails] Preparing admin notification email for:', adminEmail);
      const adminEmailHtml = generateAdminEmailHtml(orderData, customerName, customerEmail);
      console.log('[sendOrderConfirmationEmails] Admin email HTML generated, length:', adminEmailHtml.length);
      
      const adminMailOptions = {
        from: `"Elixr System" <${process.env.GMAIL_USER}>`,
        to: adminEmail,
        subject: `🚨 New ${isSubscription ? 'Subscription' : 'Order'} Alert - ${orderData.id} - ₹${orderData.total_amount}`,
        html: adminEmailHtml,
        text: `New ${isSubscription ? 'subscription' : 'order'} received!\n\n${isSubscription ? 'Subscription' : 'Order'} ID: ${orderData.id}\nCustomer: ${customerName} (${customerEmail})\nTotal: ₹${orderData.total_amount}\n\nPlease process this ${isSubscription ? 'subscription' : 'order'} immediately.`
      };

      console.log('[sendOrderConfirmationEmails] Sending admin email...');
      const adminEmailInfo = await transporter.sendMail(adminMailOptions);
      console.log('[sendOrderConfirmationEmails] Admin email sent successfully! Message ID:', adminEmailInfo.messageId);
      adminEmailSent = true;
    } catch (error) {
      console.error('[sendOrderConfirmationEmails] Error sending admin email:', error);
      errors.push(`Admin email failed: ${error}`);
    }
  } else {
    console.warn('[sendOrderConfirmationEmails] Skipping admin email - no admin email configured');
  }

  console.log('[sendOrderConfirmationEmails] Email process completed:', {
    userEmailSent,
    adminEmailSent,
    errorCount: errors.length
  });

  return { userEmailSent, adminEmailSent, errors };
}

export async function POST(req: NextRequest) {
  console.log('[send-order-email] POST handler called');
  let parsedBody;
  
  try {
    parsedBody = await req.json();
    console.log('[send-order-email] Request body:', parsedBody);
  } catch (parseError) {
    console.error('[send-order-email] Failed to parse request body:', parseError);
    return NextResponse.json({ success: false, error: 'Invalid JSON in request body.' }, { status: 400 });
  }

  const { orderId, userEmail, orderDetails } = parsedBody;

  if (!orderId) {
    console.error('[send-order-email] Missing orderId:', { orderId });
    return NextResponse.json({ success: false, error: 'Missing orderId.' }, { status: 400 });
  }
  try {
    console.log('[send-order-email] Fetching order data from Supabase for orderId:', orderId);
    // Fetch complete order data from Supabase
    const { data: orderData, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !orderData) {
      console.error('[send-order-email] Order not found:', fetchError);
      return NextResponse.json({ success: false, error: 'Order not found in database.' }, { status: 404 });
    }

    console.log('[send-order-email] Order data fetched successfully:', {
      orderId: orderData.id,
      orderType: orderData.order_type,
      totalAmount: orderData.total_amount,
      customerEmail: orderData.email || orderData.customer_email || orderData.shipping_address?.email
    });    // Send comprehensive emails
    console.log('[send-order-email] Calling sendOrderConfirmationEmails...');
    const emailResult = await sendOrderConfirmationEmails(orderData as OrderData);
    
    const response = {
      success: emailResult.userEmailSent || emailResult.adminEmailSent,
      userEmailSent: emailResult.userEmailSent,
      adminEmailSent: emailResult.adminEmailSent,
      errors: emailResult.errors
    };

    console.log('[send-order-email] Email sending result:', response);

    if (response.success) {
      console.log('[send-order-email] At least one email sent successfully, returning success');
      return NextResponse.json(response);
    } else {
      console.error('[send-order-email] No emails were sent successfully, returning error');
      return NextResponse.json(response, { status: 500 });
    }
  } catch (error: any) {
    console.error('[send-order-email] Error processing email request:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      userEmailSent: false,
      adminEmailSent: false
    }, { status: 500 });
  }
}

// Test email function (call manually for testing)

// Uncomment for manual testing only
// sendTestEmail();
