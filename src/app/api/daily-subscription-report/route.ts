import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import ExcelJS from 'exceljs';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';

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

async function generateSubscriptionExcel() {
  console.log('[daily-subscription-report] Fetching subscription data...');
  
  if (!supabase) {
    throw new Error('Database connection not available');
  }
  
  // Fetch all subscriptions with user details
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

  console.log(`[daily-subscription-report] Found ${subscriptions?.length || 0} subscriptions`);

  // Create Excel workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Daily Subscription Report');

  // Set up headers
  worksheet.columns = [
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

  // Style the header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '667eea' }
  };
  headerRow.alignment = { horizontal: 'center' };

  // Add data rows
  subscriptions?.forEach((subscription: any, index: number) => {
    const deliveryAddress = subscription.delivery_address || {};
    const selectedJuices = subscription.selected_juices || [];
    const juicesText = selectedJuices
      .map((juice: any) => `${juice.quantity}x ${juice.juiceId || 'Unknown Juice'}`)
      .join(', ');

    const userData = subscription.users || {};
    const userMetadata = userData.user_metadata || {};

    const row = worksheet.addRow({
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

  // Add summary row
  const summaryRowNum = worksheet.rowCount + 2;
  worksheet.getCell(`A${summaryRowNum}`).value = 'SUMMARY';
  worksheet.getCell(`A${summaryRowNum}`).font = { bold: true, size: 14 };
  
  const activeCount = subscriptions?.filter(s => s.status === 'active').length || 0;
  const pausedCount = subscriptions?.filter(s => s.status === 'paused').length || 0;
  const expiredCount = subscriptions?.filter(s => s.status === 'expired').length || 0;
  const totalRevenue = subscriptions?.reduce((sum, s) => sum + (s.final_price || s.total_amount || 0), 0) || 0;

  worksheet.getCell(`A${summaryRowNum + 1}`).value = `Total Subscriptions: ${subscriptions?.length || 0}`;
  worksheet.getCell(`A${summaryRowNum + 2}`).value = `Active: ${activeCount}`;
  worksheet.getCell(`A${summaryRowNum + 3}`).value = `Paused: ${pausedCount}`;
  worksheet.getCell(`A${summaryRowNum + 4}`).value = `Expired: ${expiredCount}`;
  worksheet.getCell(`A${summaryRowNum + 5}`).value = `Total Revenue: ₹${totalRevenue.toFixed(2)}`;

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

    console.log('[daily-subscription-report] Generating Excel report...');
    const excelBuffer = await generateSubscriptionExcel();

    console.log('[daily-subscription-report] Preparing email...');
    const transporter = await getTransporter();

    const today = new Date().toLocaleDateString();
    const fileName = `Elixr_Subscription_Report_${new Date().toISOString().split('T')[0]}.xlsx`;

    const mailOptions = {
      from: `"Elixr Reports" <${process.env.GMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.GMAIL_USER,
      cc: process.env.SUBSCRIPTION_REPORT_CC_EMAILS?.split(',').filter(Boolean),
      subject: `Daily Subscription Report - ${today}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Daily Subscription Report</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #333;">Subscription Report for ${today}</h2>
            
            <p>Please find attached the daily subscription report containing:</p>
            <ul>
              <li>All subscription details</li>
              <li>Customer information and addresses</li>
              <li>Selected juices for each subscription</li>
              <li>Delivery schedules and status</li>
              <li>Revenue summary</li>
            </ul>
            
            <div style="background: #e8f4f8; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea; margin: 20px 0;">
              <p style="margin: 0;"><strong>Note:</strong> This report is generated automatically every day at 6 PM and includes all active, paused, and expired subscriptions.</p>
            </div>
          </div>
          
          <div style="background: #333; color: white; padding: 20px; text-align: center;">
            <p style="margin: 0;">Elixr Subscription Management System</p>
            <p style="margin: 5px 0 0 0; font-size: 12px;">Generated automatically on ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `,
      text: `
Daily Subscription Report - ${today}

Please find attached the daily subscription report containing:
- All subscription details
- Customer information and addresses  
- Selected juices for each subscription
- Delivery schedules and status
- Revenue summary

Note: This report is generated automatically every day at 6 PM and includes all active, paused, and expired subscriptions.

Generated automatically on ${new Date().toLocaleString()}
      `,      attachments: [
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
    console.log('[daily-subscription-report] Generating test Excel report...');
    const excelBuffer = await generateSubscriptionExcel();

    const today = new Date().toISOString().split('T')[0];
    const fileName = `Elixr_Subscription_Report_${today}.xlsx`;

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
