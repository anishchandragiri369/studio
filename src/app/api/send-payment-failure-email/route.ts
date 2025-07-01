import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Set up Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Order type interface
interface OrderData {
  id: string;
  email?: string;
  customer_email?: string;
  total_amount: number;
  order_type: 'regular' | 'subscription' | 'mixed';
  items?: Array<{
    juiceId?: string;
    juiceName?: string;
    quantity?: number;
    pricePerItem?: number;
  }>;
  shipping_address?: {
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    mobileNumber?: string;
    addressLine1?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  subscription_info?: any;
  created_at?: string;
}

// Enhanced email transporter setup with better error handling
async function getTransporter() {
  console.log('[Payment Failure Email] Setting up email transporter...');
  
  // Check if we're in test/mock mode
  if (process.env.EMAIL_MOCK_MODE === 'true') {
    console.log('[Payment Failure Email] Running in MOCK mode - emails will be simulated');
    return null; // Return null to indicate mock mode
  }
  
  // Validate required environment variables
  const requiredEnvVars = ['GMAIL_USER', 'GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('[Payment Failure Email] Missing environment variables:', missingVars);
    console.log('[Payment Failure Email] Falling back to MOCK mode');
    return null; // Use mock mode if env vars are missing
  }

  // Try OAuth2 first, fallback to App Password for testing
  let transporter;
  
  try {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      },
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates in development
      }
    });
  } catch (oauthError) {
    console.warn('[Payment Failure Email] OAuth2 setup failed, using fallback configuration');
    
    // Fallback to app password or basic auth for testing
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_REFRESH_TOKEN, // Fallback
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  console.log('[Payment Failure Email] Email transporter configured successfully');
  return transporter;
}

// Helper function to format currency
function formatCurrency(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}

// Helper function to format date
function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata'
  });
}

// Generate customer payment failure email HTML
function generateCustomerFailureEmailHtml(order: OrderData, customerName: string, failureReason: string): string {
  const isSubscription = order.order_type === 'subscription';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Failed - Elixr</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 25px; border-radius: 0 0 10px 10px; }
        .failure-message { background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #dc3545; }
        .order-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border: 1px solid #dee2e6; }
        .retry-section { background: #d1ecf1; color: #0c5460; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #17a2b8; }
        .contact-info { background: #667eea; color: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
        .item-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee; }
        .total-section { margin: 15px 0; padding: 15px; background: #fff3cd; border-radius: 5px; }
        @media (max-width: 600px) {
            .item-row { flex-direction: column; align-items: flex-start; }
            .header h1 { font-size: 24px; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧃 Elixr</h1>
        <p>Payment Failed</p>
    </div>
    
    <div class="content">
        <div class="failure-message">
            <strong>❌ Payment Failed</strong> Unfortunately, we couldn't process your payment for ${isSubscription ? 'subscription' : 'order'} #${order.id}.
        </div>
        
        <p>Dear ${customerName},</p>
        
        <p>We're sorry to inform you that your payment for ${isSubscription ? 'subscription' : 'order'} #${order.id} could not be processed.</p>
        
        <div class="order-details">
            <h3>${isSubscription ? 'Subscription' : 'Order'} Details</h3>
            <p><strong>${isSubscription ? 'Subscription' : 'Order'} ID:</strong> ${order.id}</p>
            <p><strong>Date:</strong> ${formatDate(order.created_at)}</p>
            <p><strong>Amount:</strong> ${formatCurrency(order.total_amount)}</p>
            <p><strong>Status:</strong> Payment Failed</p>
            ${failureReason ? `<p><strong>Reason:</strong> ${failureReason}</p>` : ''}
        </div>
        
        <div class="retry-section">
            <h4>💡 What You Can Do:</h4>
            <ol>
                <li><strong>Try Again:</strong> Visit our website and place your ${isSubscription ? 'subscription' : 'order'} again</li>
                <li><strong>Check Payment Method:</strong> Ensure your card has sufficient balance and is not expired</li>
                <li><strong>Use Different Payment Method:</strong> Try with a different card or payment option</li>
                <li><strong>Contact Support:</strong> If the issue persists, please reach out to our customer support</li>
            </ol>
        </div>
        
        <div class="contact-info">
            <h4>📞 Need Help?</h4>
            <p><strong>Customer Support:</strong> help@elixr.com</p>
            <p><strong>WhatsApp:</strong> +91 98765 43210</p>
            <p><strong>Hours:</strong> Monday - Saturday, 9 AM - 6 PM IST</p>
        </div>
        
        <p>We apologize for any inconvenience caused. Our team is here to help you complete your ${isSubscription ? 'subscription' : 'purchase'} successfully.</p>
        
        <p>Best regards,<br>
        The Elixr Team</p>
    </div>
    
    <div class="footer">
        <p>This is an automated message from Elixr. Please do not reply to this email.</p>
        <p>© 2024 Elixr. All rights reserved.</p>
    </div>
</body>
</html>
  `;
}

// Generate admin payment failure notification email HTML
function generateAdminFailureEmailHtml(order: OrderData, customerName: string, customerEmail: string, failureReason: string): string {
  const isSubscription = order.order_type === 'subscription';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Failure Alert - Elixr Admin</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 25px; border-radius: 0 0 10px 10px; }
        .alert-box { background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #dc3545; }
        .customer-info { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border: 1px solid #dee2e6; }
        .order-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border: 1px solid #dee2e6; }
        .action-needed { background: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚨 Elixr Admin Alert</h1>
        <p>Payment Failure Notification</p>
    </div>
    
    <div class="content">
        <div class="alert-box">
            <strong>❌ Payment Failed!</strong> A customer's payment could not be processed.
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
            <p><strong>Amount:</strong> ${formatCurrency(order.total_amount)}</p>
            <p><strong>Payment Status:</strong> ❌ FAILED</p>
            ${failureReason ? `<p><strong>Failure Reason:</strong> ${failureReason}</p>` : ''}
        </div>
        
        <div class="action-needed">
            <h4>📋 Recommended Actions:</h4>
            <ul>
                <li>Monitor if customer retries the payment</li>
                <li>Reach out to customer if they need assistance</li>
                <li>Check for any payment gateway issues</li>
                <li>Follow up after 24 hours if no retry attempt</li>
            </ul>
            <p>Timestamp: ${new Date().toLocaleString('en-IN')}</p>
        </div>
    </div>
</body>
</html>
  `;
}

// Send payment failure notification emails
async function sendPaymentFailureEmails(
  orderData: OrderData, 
  failureReason: string
): Promise<{ userEmailSent: boolean, adminEmailSent: boolean, errors: string[] }> {
  console.log('[Payment Failure Email] Starting payment failure notification process for order:', orderData.id);
  
  const transporter = await getTransporter();
  console.log('[Payment Failure Email] Email transporter created successfully');
  
  const errors: string[] = [];
  let userEmailSent = false;
  let adminEmailSent = false;

  // Extract customer information
  const customerEmail = orderData.email || orderData.customer_email || orderData.shipping_address?.email;
  const customerName = orderData.shipping_address?.firstName 
    ? `${orderData.shipping_address.firstName} ${orderData.shipping_address.lastName || ''}`.trim()
    : orderData.shipping_address?.name || 'Valued Customer';
    
  console.log('[Payment Failure Email] Customer details extracted:', {
    customerEmail,
    customerName,
    orderType: orderData.order_type,
    failureReason
  });

  if (!customerEmail) {
    console.error('[Payment Failure Email] Customer email not found in order data');
    errors.push('Customer email not found in order data');
    return { userEmailSent: false, adminEmailSent: false, errors };
  }

  // Admin email address
  const adminEmail = process.env.ADMIN_EMAIL;
  console.log('[Payment Failure Email] Admin email configured:', !!adminEmail);

  const isSubscription = orderData.order_type === 'subscription';
  console.log('[Payment Failure Email] Processing', isSubscription ? 'subscription' : 'order', 'failure notifications');

  // Send customer failure notification email
  try {
    console.log('[Payment Failure Email] Preparing customer failure email for:', customerEmail);
    const customerEmailHtml = generateCustomerFailureEmailHtml(orderData, customerName, failureReason);
    console.log('[Payment Failure Email] Customer email HTML generated, length:', customerEmailHtml.length);
    
    const customerMailOptions = {
      from: `"Elixr Support" <${process.env.GMAIL_USER}>`,
      to: customerEmail,
      subject: `❌ Payment Failed - ${isSubscription ? 'Subscription' : 'Order'} #${orderData.id}`,
      html: customerEmailHtml,
      text: `Payment Failed\n\nDear ${customerName},\n\nYour payment for ${isSubscription ? 'subscription' : 'order'} #${orderData.id} could not be processed.\n\nAmount: ₹${orderData.total_amount}\nReason: ${failureReason}\n\nPlease try placing your ${isSubscription ? 'subscription' : 'order'} again or contact our support team.\n\nBest regards,\nElixr Team`
    };

    if (transporter) {
      console.log('[Payment Failure Email] Sending customer failure email...');
      const customerEmailInfo = await transporter.sendMail(customerMailOptions);
      console.log('[Payment Failure Email] Customer failure email sent successfully! Message ID:', customerEmailInfo.messageId);
    } else {
      console.log('[Payment Failure Email] MOCK MODE: Customer failure email would be sent with options:', JSON.stringify(customerMailOptions, null, 2));
    }
    userEmailSent = true;
  } catch (error) {
    console.error('[Payment Failure Email] Error sending customer failure email:', error);
    errors.push(`Customer failure email failed: ${error}`);
  }

  // Send admin failure notification email
  if (adminEmail) {
    try {
      console.log('[Payment Failure Email] Preparing admin failure notification email for:', adminEmail);
      const adminEmailHtml = generateAdminFailureEmailHtml(orderData, customerName, customerEmail, failureReason);
      console.log('[Payment Failure Email] Admin email HTML generated, length:', adminEmailHtml.length);
      
      const adminMailOptions = {
        from: `"Elixr System" <${process.env.GMAIL_USER}>`,
        to: adminEmail,
        subject: `🚨 Payment Failure Alert - ${isSubscription ? 'Subscription' : 'Order'} #${orderData.id} - ₹${orderData.total_amount}`,
        html: adminEmailHtml,
        text: `Payment failure alert!\n\n${isSubscription ? 'Subscription' : 'Order'} ID: ${orderData.id}\nCustomer: ${customerName} (${customerEmail})\nAmount: ₹${orderData.total_amount}\nReason: ${failureReason}\n\nPlease monitor for customer retry attempts.`
      };

      if (transporter) {
        console.log('[Payment Failure Email] Sending admin failure notification email...');
        const adminEmailInfo = await transporter.sendMail(adminMailOptions);
        console.log('[Payment Failure Email] Admin failure notification email sent successfully! Message ID:', adminEmailInfo.messageId);
      } else {
        console.log('[Payment Failure Email] MOCK MODE: Admin failure notification email would be sent with options:', JSON.stringify(adminMailOptions, null, 2));
      }
      adminEmailSent = true;
    } catch (error) {
      console.error('[Payment Failure Email] Error sending admin failure notification email:', error);
      errors.push(`Admin failure email failed: ${error}`);
    }
  } else {
    console.warn('[Payment Failure Email] Skipping admin email - no admin email configured');
  }

  console.log('[Payment Failure Email] Payment failure notification process completed:', {
    userEmailSent,
    adminEmailSent,
    errorCount: errors.length
  });

  return { userEmailSent, adminEmailSent, errors };
}

export async function POST(req: NextRequest) {
  console.log('[Payment Failure Email] POST handler called');
  let parsedBody;
  
  try {
    parsedBody = await req.json();
    console.log('[Payment Failure Email] Request body:', parsedBody);
  } catch (parseError) {
    console.error('[Payment Failure Email] Failed to parse request body:', parseError);
    return NextResponse.json({ success: false, error: 'Invalid JSON in request body.' }, { status: 400 });
  }

  const { orderId, userEmail, reason } = parsedBody;

  if (!orderId) {
    console.error('[Payment Failure Email] Missing orderId:', { orderId });
    return NextResponse.json({ success: false, error: 'Missing orderId.' }, { status: 400 });
  }

  try {
    console.log('[Payment Failure Email] Fetching order data from Supabase for orderId:', orderId);
    
    // Fetch complete order data from Supabase
    const { data: orderData, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    console.log('[Payment Failure Email] Supabase fetch result:', { orderData: !!orderData, error: fetchError });

    if (fetchError || !orderData) {
      console.error('[Payment Failure Email] Order not found:', fetchError);
      return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
    }

    // Send payment failure notification emails
    const emailResult = await sendPaymentFailureEmails(orderData, reason || 'Payment processing failed');

    const response = {
      success: emailResult.userEmailSent || emailResult.adminEmailSent,
      userEmailSent: emailResult.userEmailSent,
      adminEmailSent: emailResult.adminEmailSent,
      errors: emailResult.errors
    };

    console.log('[Payment Failure Email] Email sending result:', response);

    if (response.success) {
      console.log('[Payment Failure Email] At least one failure notification email sent successfully, returning success');
      return NextResponse.json(response);
    } else {
      console.error('[Payment Failure Email] No failure notification emails were sent successfully, returning error');
      return NextResponse.json(response, { status: 500 });
    }
  } catch (error: any) {
    console.error('[Payment Failure Email] Error processing payment failure email request:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      userEmailSent: false,
      adminEmailSent: false
    }, { status: 500 });
  }
}
