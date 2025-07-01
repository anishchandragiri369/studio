import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import ExcelJS from 'exceljs';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { 
  getDeliveryDatesForDateRange,
  formatDeliveryDate,
  type SubscriptionDeliveryDates 
} from '@/lib/deliveryScheduler';

console.log('[daily-subscription-report] API route loaded');

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
      rejectUnauthorized: false,
    },
  });
}

async function generateSubscriptionExcel(reportDate?: string) {
  console.log('[daily-subscription-report] Fetching subscription data...');
  
  if (!supabase) {
    throw new Error('Database connection not available');
  }

  // Parse the report date - if provided, filter for deliveries on that specific date
  const targetDate = reportDate ? new Date(reportDate) : new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  // First, get all subscription orders with delivery schedules
  const { data: subscriptionOrders, error: ordersError } = await supabase
    .from('orders')
    .select(`
      id,
      user_id,
      email,
      total_amount,
      original_amount,
      status,
      order_type,
      subscription_info,
      shipping_address,
      first_delivery_date,
      delivery_schedule,
      created_at,
      items
    `)
    .eq('order_type', 'subscription')
    .not('delivery_schedule', 'is', null);

  if (ordersError) {
    console.error('[daily-subscription-report] Error fetching subscription orders:', ordersError);
    throw new Error('Failed to fetch subscription order data');
  }

  // Also get traditional subscriptions for backwards compatibility
  const { data: subscriptions, error } = await supabase
    .from('user_subscriptions')
    .select(`
      *,
      users:user_id (
        email,
        user_metadata
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[daily-subscription-report] Error fetching subscriptions:', error);
    throw new Error('Failed to fetch subscription data');
  }

  // Filter subscription orders that have deliveries on the target date
  const deliveriesForDate = [];
  
  if (reportDate) {
    for (const order of subscriptionOrders || []) {
      if (!order.delivery_schedule) continue;

      try {
        const schedule: SubscriptionDeliveryDates = {
          startDate: new Date(order.delivery_schedule.startDate),
          endDate: new Date(order.delivery_schedule.endDate),
          deliveryDates: order.delivery_schedule.deliveryDates.map((date: string) => new Date(date)),
          totalDeliveries: order.delivery_schedule.totalDeliveries
        };

        // Check if any delivery dates fall within our target day
        const deliveriesOnDate = getDeliveryDatesForDateRange(
          schedule,
          startOfDay,
          endOfDay
        );

        if (deliveriesOnDate.length > 0) {
          deliveriesForDate.push({
            ...order,
            deliveryDatesOnTarget: deliveriesOnDate
          });
        }
      } catch (parseError) {
        console.error('Error parsing delivery schedule for order:', order.id, parseError);
        continue;
      }
    }
  }

  console.log(`[daily-subscription-report] Found ${subscriptions?.length || 0} subscriptions and ${deliveriesForDate.length} deliveries for ${reportDate || 'today'}`);

  // Create Excel workbook
  const workbook = new ExcelJS.Workbook();
  
  // Sheet 1: All Subscriptions (existing functionality)
  const subscriptionsSheet = workbook.addWorksheet('All Subscriptions');

  // Set up headers for subscriptions sheet
  subscriptionsSheet.columns = [
    { header: 'Subscription ID', key: 'id', width: 15 },
    { header: 'User Email', key: 'userEmail', width: 25 },
    { header: 'User Name', key: 'userName', width: 20 },
    { header: 'Plan ID', key: 'planId', width: 15 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Delivery Frequency', key: 'deliveryFrequency', width: 18 },
    { header: 'Total Amount', key: 'totalAmount', width: 15 },
    { header: 'Final Price', key: 'finalPrice', width: 15 },
    { header: 'Discount %', key: 'discountPercentage', width: 12 },
    { header: 'Duration (Months)', key: 'subscriptionDuration', width: 18 },
    { header: 'Start Date', key: 'subscriptionStartDate', width: 15 },
    { header: 'End Date', key: 'subscriptionEndDate', width: 15 },
    { header: 'Next Delivery', key: 'nextDeliveryDate', width: 15 },
    { header: 'Address Line 1', key: 'addressLine1', width: 30 },
    { header: 'Address Line 2', key: 'addressLine2', width: 30 },
    { header: 'City', key: 'city', width: 15 },
    { header: 'State', key: 'state', width: 15 },
    { header: 'Zip Code', key: 'zipCode', width: 12 },
    { header: 'Country', key: 'country', width: 15 },
    { header: 'Phone', key: 'phone', width: 15 },
    { header: 'Selected Juices', key: 'selectedJuices', width: 50 },
    { header: 'Pause Date', key: 'pauseDate', width: 15 },
    { header: 'Pause Reason', key: 'pauseReason', width: 30 },
    { header: 'Created At', key: 'createdAt', width: 15 },
  ];

  // Style the header row for subscriptions
  const subscriptionsHeaderRow = subscriptionsSheet.getRow(1);
  subscriptionsHeaderRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  subscriptionsHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '667eea' }
  };
  subscriptionsHeaderRow.alignment = { horizontal: 'center' };

  // Add data rows for subscriptions
  subscriptions?.forEach((subscription: any, index: number) => {
    const deliveryAddress = subscription.delivery_address || {};
    const selectedJuices = subscription.selected_juices || [];
    const juicesText = selectedJuices
      .map((juice: any) => `${juice.quantity}x ${juice.juiceId || 'Unknown Juice'}`)
      .join(', ');

    const userData = subscription.users || {};
    const userMetadata = userData.user_metadata || {};

    const row = subscriptionsSheet.addRow({
      id: subscription.id,
      userEmail: userData.email || deliveryAddress.email || 'N/A',
      userName: userMetadata.full_name || deliveryAddress.firstName + ' ' + (deliveryAddress.lastName || '') || 'N/A',
      planId: subscription.plan_id,
      status: subscription.status,
      deliveryFrequency: subscription.delivery_frequency,
      totalAmount: subscription.total_amount ? `₹${subscription.total_amount}` : 'N/A',
      finalPrice: subscription.final_price ? `₹${subscription.final_price}` : 'N/A',
      discountPercentage: subscription.discount_percentage ? `${subscription.discount_percentage}%` : '0%',
      subscriptionDuration: subscription.subscription_duration || 'N/A',
      subscriptionStartDate: subscription.subscription_start_date ? 
        new Date(subscription.subscription_start_date).toLocaleDateString() : 'N/A',
      subscriptionEndDate: subscription.subscription_end_date ? 
        new Date(subscription.subscription_end_date).toLocaleDateString() : 'N/A',
      nextDeliveryDate: subscription.next_delivery_date ? 
        new Date(subscription.next_delivery_date).toLocaleDateString() : 'N/A',
      addressLine1: deliveryAddress.addressLine1 || 'N/A',
      addressLine2: deliveryAddress.addressLine2 || '',
      city: deliveryAddress.city || 'N/A',
      state: deliveryAddress.state || 'N/A',
      zipCode: deliveryAddress.zipCode || 'N/A',
      country: deliveryAddress.country || 'N/A',
      phone: deliveryAddress.mobileNumber || deliveryAddress.phone || 'N/A',
      selectedJuices: juicesText || 'N/A',
      pauseDate: subscription.pause_date ? 
        new Date(subscription.pause_date).toLocaleDateString() : 'N/A',
      pauseReason: subscription.pause_reason || 'N/A',
      createdAt: subscription.created_at ? 
        new Date(subscription.created_at).toLocaleDateString() : 'N/A',
    });

    // Alternate row colors for better readability
    if (index % 2 === 1) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F8F9FA' }
      };
    }
  });

  // Sheet 2: Daily Deliveries (NEW - based on delivery scheduling)
  if (reportDate && deliveriesForDate.length > 0) {
    const deliveriesSheet = workbook.addWorksheet(`Deliveries for ${formatDeliveryDate(targetDate)}`);

    deliveriesSheet.columns = [
      { header: 'Order ID', key: 'orderId', width: 15 },
      { header: 'Customer Email', key: 'customerEmail', width: 25 },
      { header: 'Customer Name', key: 'customerName', width: 20 },
      { header: 'Customer Phone', key: 'customerPhone', width: 15 },
      { header: 'Total Amount', key: 'totalAmount', width: 15 },
      { header: 'Order Status', key: 'orderStatus', width: 15 },
      { header: 'Subscription Plan', key: 'subscriptionPlan', width: 20 },
      { header: 'Delivery Address', key: 'deliveryAddress', width: 50 },
      { header: 'Items to Deliver', key: 'itemsToDeliver', width: 60 },
      { header: 'Delivery Date', key: 'deliveryDate', width: 15 },
      { header: 'Order Created', key: 'orderCreated', width: 15 },
      { header: 'First Delivery Date', key: 'firstDeliveryDate', width: 18 },
    ];

    // Style the header row for deliveries
    const deliveriesHeaderRow = deliveriesSheet.getRow(1);
    deliveriesHeaderRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    deliveriesHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '28a745' }
    };
    deliveriesHeaderRow.alignment = { horizontal: 'center' };

    // Add delivery data rows
    deliveriesForDate.forEach((delivery: any, index: number) => {
      const customerInfo = delivery.shipping_address || {};
      const subscriptionInfo = delivery.subscription_info || {};
      const items = delivery.items || [];
      
      const itemsText = items
        .map((item: any) => `${item.quantity}x ${item.juiceName || item.juiceId || 'Unknown Juice'}`)
        .join('; ');

      const deliveryAddress = `${customerInfo.address || ''}, ${customerInfo.city || ''}, ${customerInfo.state || ''} ${customerInfo.zipCode || ''}`.trim();
      
      const deliveryDatesText = delivery.deliveryDatesOnTarget
        .map((date: Date) => formatDeliveryDate(date))
        .join('; ');

      const row = deliveriesSheet.addRow({
        orderId: delivery.id,
        customerEmail: delivery.email || customerInfo.email || 'N/A',
        customerName: customerInfo.name || `${customerInfo.firstName || ''} ${customerInfo.lastName || ''}`.trim() || 'N/A',
        customerPhone: customerInfo.phone || customerInfo.mobileNumber || 'N/A',
        totalAmount: delivery.total_amount ? `₹${delivery.total_amount}` : 'N/A',
        orderStatus: delivery.status || 'N/A',
        subscriptionPlan: subscriptionInfo.planName || subscriptionInfo.planId || 'N/A',
        deliveryAddress: deliveryAddress || 'N/A',
        itemsToDeliver: itemsText || 'N/A',
        deliveryDate: deliveryDatesText,
        orderCreated: delivery.created_at ? new Date(delivery.created_at).toLocaleDateString() : 'N/A',
        firstDeliveryDate: delivery.first_delivery_date ? new Date(delivery.first_delivery_date).toLocaleDateString() : 'N/A',
      });

      // Alternate row colors for better readability
      if (index % 2 === 1) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F0F8F0' }
        };
      }
    });

    // Add delivery summary
    const deliverySummaryRowNum = deliveriesSheet.rowCount + 2;
    deliveriesSheet.getCell(`A${deliverySummaryRowNum}`).value = 'DELIVERY SUMMARY';
    deliveriesSheet.getCell(`A${deliverySummaryRowNum}`).font = { bold: true, size: 14 };
    
    const totalDeliveryRevenue = deliveriesForDate.reduce((sum, delivery) => sum + (delivery.total_amount || 0), 0);

    deliveriesSheet.getCell(`A${deliverySummaryRowNum + 1}`).value = `Total Deliveries: ${deliveriesForDate.length}`;
    deliveriesSheet.getCell(`A${deliverySummaryRowNum + 2}`).value = `Total Revenue for Date: ₹${totalDeliveryRevenue.toFixed(2)}`;
    deliveriesSheet.getCell(`A${deliverySummaryRowNum + 3}`).value = `Report Date: ${formatDeliveryDate(targetDate)}`;
  }

  // Add summary to subscriptions sheet
  const summaryRowNum = subscriptionsSheet.rowCount + 2;
  subscriptionsSheet.getCell(`A${summaryRowNum}`).value = 'SUMMARY';
  subscriptionsSheet.getCell(`A${summaryRowNum}`).font = { bold: true, size: 14 };
  
  const activeCount = subscriptions?.filter(s => s.status === 'active').length || 0;
  const pausedCount = subscriptions?.filter(s => s.status === 'paused').length || 0;
  const expiredCount = subscriptions?.filter(s => s.status === 'expired').length || 0;
  const totalRevenue = subscriptions?.reduce((sum, s) => sum + (s.final_price || s.total_amount || 0), 0) || 0;

  subscriptionsSheet.getCell(`A${summaryRowNum + 1}`).value = `Total Subscriptions: ${subscriptions?.length || 0}`;
  subscriptionsSheet.getCell(`A${summaryRowNum + 2}`).value = `Active: ${activeCount}`;
  subscriptionsSheet.getCell(`A${summaryRowNum + 3}`).value = `Paused: ${pausedCount}`;
  subscriptionsSheet.getCell(`A${summaryRowNum + 4}`).value = `Expired: ${expiredCount}`;
  subscriptionsSheet.getCell(`A${summaryRowNum + 5}`).value = `Total Revenue: ₹${totalRevenue.toFixed(2)}`;
  
  if (reportDate) {
    subscriptionsSheet.getCell(`A${summaryRowNum + 6}`).value = `Deliveries for ${formatDeliveryDate(targetDate)}: ${deliveriesForDate.length}`;
  }

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

export async function POST(req: NextRequest) {
  console.log('[daily-subscription-report] POST request received');

  try {
    // Check if this is an authorized request (you can add API key validation here)
    const authHeader = req.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET || 'your-secret-token';
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get report date from request body or use today
    const body = await req.json().catch(() => ({}));
    const reportDate = body.date || new Date().toISOString().split('T')[0];

    console.log(`[daily-subscription-report] Generating Excel report for date: ${reportDate}`);
    const excelBuffer = await generateSubscriptionExcel(reportDate);

    console.log('[daily-subscription-report] Preparing email...');
    const transporter = await getTransporter();

    const today = new Date().toLocaleDateString();
    const fileName = `Elixr_Subscription_Report_${reportDate}.xlsx`;

    const mailOptions = {
      from: `"Elixr Reports" <${process.env.GMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.GMAIL_USER,
      cc: process.env.SUBSCRIPTION_REPORT_CC_EMAILS?.split(',').filter(Boolean),
      subject: `Daily Subscription Report - ${reportDate}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Daily Subscription Report</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #333;">Subscription Report for ${reportDate}</h2>
            
            <p>Please find attached the daily subscription report containing:</p>
            <ul>
              <li><strong>All Subscriptions Sheet:</strong> Complete subscription details, customer information, and revenue summary</li>
              <li><strong>Daily Deliveries Sheet:</strong> Orders scheduled for delivery on ${reportDate} (based on 6 PM cutoff rule)</li>
              <li>Delivery schedules calculated with the new delivery scheduling system</li>
              <li>Customer addresses and contact information</li>
              <li>Items to be delivered for each order</li>
            </ul>
            
            <div style="background: #e8f4f8; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea; margin: 20px 0;">
              <p style="margin: 0;"><strong>New Delivery Rules:</strong></p>
              <ul style="margin: 10px 0 0 20px;">
                <li>Orders placed before 6 PM: First delivery next day</li>
                <li>Orders placed after 6 PM: First delivery day after next</li>
                <li>Reports show actual delivery dates for better planning</li>
              </ul>
            </div>
          </div>
          
          <div style="background: #333; color: white; padding: 20px; text-align: center;">
            <p style="margin: 0;">Elixr Subscription Management System</p>
            <p style="margin: 5px 0 0 0; font-size: 12px;">Generated automatically on ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `,
      text: `
Daily Subscription Report - ${reportDate}

Please find attached the daily subscription report containing:
- All Subscriptions Sheet: Complete subscription details, customer information, and revenue summary
- Daily Deliveries Sheet: Orders scheduled for delivery on ${reportDate} (based on 6 PM cutoff rule)
- Delivery schedules calculated with the new delivery scheduling system
- Customer addresses and contact information
- Items to be delivered for each order

New Delivery Rules:
- Orders placed before 6 PM: First delivery next day
- Orders placed after 6 PM: First delivery day after next
- Reports show actual delivery dates for better planning

Generated automatically on ${new Date().toLocaleString()}
      `,
      attachments: [
        {
          filename: fileName,
          content: Buffer.from(excelBuffer),
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      ]
    };

    console.log('[daily-subscription-report] Sending email...');
    const info: any = await transporter.sendMail(mailOptions);
    console.log('[daily-subscription-report] Email sent successfully! Message ID:', info.messageId);

    return NextResponse.json({
      success: true,
      message: 'Daily subscription report generated and sent successfully',
      messageId: info.messageId,
      fileName: fileName,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[daily-subscription-report] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to generate or send daily subscription report',
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// GET endpoint for manual testing
export async function GET(req: NextRequest) {
  console.log('[daily-subscription-report] GET request received for testing');

  try {
    // Get date parameter from URL
    const { searchParams } = new URL(req.url);
    const reportDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

    console.log(`[daily-subscription-report] Generating test Excel report for date: ${reportDate}`);
    const excelBuffer = await generateSubscriptionExcel(reportDate);

    const fileName = `Elixr_Subscription_Report_${reportDate}.xlsx`;

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error: any) {
    console.error('[daily-subscription-report] Error in GET:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to generate subscription report',
        error: error.message 
      },
      { status: 500 }
    );
  }
}
