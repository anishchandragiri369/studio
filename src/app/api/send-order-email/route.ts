import 'dotenv/config';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

console.log('[send-order-email] API route loaded');

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

// Test email function (call manually for testing)
async function sendTestEmail() {
  try {
    const transporter = await getTransporter();
    const mailOptions = {
      from: `"Elixr Test" <${process.env.GMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: 'Test Email from Elixr App',
      text: 'This is a test email sent from your Elixr application setup.',
      html: '<p>This is a <b>test email</b> sent from your Elixr application setup.</p>',
    };
    const info = await transporter.sendMail(mailOptions);
    console.log('Test email sent successfully! Message ID:', info.messageId);
  } catch (error) {
    console.error('Error sending test email:', error);
  }
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

  if (!orderId || !userEmail) {
    console.error('[send-order-email] Missing orderId or userEmail:', { orderId, userEmail });
    return NextResponse.json({ success: false, error: 'Missing orderId or userEmail.' }, { status: 400 });
  }

  try {
    const transporter = await getTransporter();
    const mailOptions = {
      from: `"Elixr Orders" <${process.env.GMAIL_USER}>`,
      to: userEmail,
      subject: `Order Confirmation - ${orderId}`,
      text: `Thank you for your order!\n\nOrder ID: ${orderId}\nJuice: ${orderDetails?.juiceName || 'N/A'}\nPrice: ${orderDetails?.price ? '₹' + orderDetails.price : 'N/A'}\n`,
    };
    const info = await transporter.sendMail(mailOptions);
    console.log('[send-order-email] Email sent:', info.messageId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[send-order-email] Error sending order email:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Uncomment for manual testing only
// sendTestEmail();