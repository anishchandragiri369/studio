import 'dotenv/config';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

console.log('[send-subscription-email] API route loaded');

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

function generatePauseEmailContent(subscriptionDetails: any) {
  const { planId, pauseDate, pauseReason, canReactivateUntil } = subscriptionDetails;
  
  return {
    subject: 'Subscription Paused - Elixr',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Subscription Paused</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #333;">Your subscription has been paused</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #667eea; margin-top: 0;">Subscription Details:</h3>
            <p><strong>Plan:</strong> ${planId}</p>
            <p><strong>Paused on:</strong> ${new Date(pauseDate).toLocaleDateString()}</p>
            ${pauseReason ? `<p><strong>Reason:</strong> ${pauseReason}</p>` : ''}
            <p><strong>Can reactivate until:</strong> ${canReactivateUntil}</p>
          </div>
          
          <div style="background: #e8f4f8; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea;">
            <p style="margin: 0;"><strong>Important:</strong> You can reactivate your subscription anytime within 3 months. After that, it will expire and cannot be reactivated.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/my-subscriptions" 
               style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Manage Subscriptions
            </a>
          </div>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center;">
          <p style="margin: 0;">Thanks for choosing Elixr!</p>
          <p style="margin: 5px 0 0 0; font-size: 12px;">Questions? Contact us at support@elixr.com</p>
        </div>
      </div>
    `,
    text: `
Your Elixr subscription has been paused.

Subscription Details:
- Plan: ${planId}
- Paused on: ${new Date(pauseDate).toLocaleDateString()}
${pauseReason ? `- Reason: ${pauseReason}` : ''}
- Can reactivate until: ${canReactivateUntil}

Important: You can reactivate your subscription anytime within 3 months. After that, it will expire and cannot be reactivated.

Manage your subscriptions: ${process.env.NEXT_PUBLIC_APP_URL}/my-subscriptions

Thanks for choosing Elixr!
Questions? Contact us at support@elixr.com
    `
  };
}

function generateReactivateEmailContent(subscriptionDetails: any) {
  const { planId, reactivationDate, nextDeliveryFormatted, pauseDurationDays } = subscriptionDetails;
  
  return {
    subject: 'Subscription Reactivated - Elixr',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome Back!</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #333;">Your subscription is now active</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #667eea; margin-top: 0;">Subscription Details:</h3>
            <p><strong>Plan:</strong> ${planId}</p>
            <p><strong>Reactivated on:</strong> ${new Date(reactivationDate).toLocaleDateString()}</p>
            <p><strong>Next delivery:</strong> ${nextDeliveryFormatted}</p>
            ${pauseDurationDays > 0 ? `<p><strong>Subscription extended by:</strong> ${pauseDurationDays} day${pauseDurationDays > 1 ? 's' : ''}</p>` : ''}
          </div>
          
          <div style="background: #e8f8e8; padding: 15px; border-radius: 6px; border-left: 4px solid #4CAF50;">
            <p style="margin: 0;"><strong>Great news!</strong> Your subscription has been extended to account for the pause period, so you don't lose any paid time.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/my-subscriptions" 
               style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Subscription
            </a>
          </div>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center;">
          <p style="margin: 0;">Thanks for choosing Elixr!</p>
          <p style="margin: 5px 0 0 0; font-size: 12px;">Questions? Contact us at support@elixr.com</p>
        </div>
      </div>
    `,
    text: `
Welcome back! Your Elixr subscription is now active.

Subscription Details:
- Plan: ${planId}
- Reactivated on: ${new Date(reactivationDate).toLocaleDateString()}
- Next delivery: ${nextDeliveryFormatted}
${pauseDurationDays > 0 ? `- Subscription extended by: ${pauseDurationDays} day${pauseDurationDays > 1 ? 's' : ''}` : ''}

Great news! Your subscription has been extended to account for the pause period, so you don't lose any paid time.

View your subscription: ${process.env.NEXT_PUBLIC_APP_URL}/my-subscriptions

Thanks for choosing Elixr!
Questions? Contact us at support@elixr.com
    `
  };
}

export async function POST(req: NextRequest) {
  console.log('[send-subscription-email] POST request received');

  try {
    const body = await req.json();
    const { type, subscriptionId, userEmail, subscriptionDetails } = body;

    console.log('[send-subscription-email] Request body:', { type, subscriptionId, userEmail });

    if (!type || !subscriptionId || !userEmail || !subscriptionDetails) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: type, subscriptionId, userEmail, subscriptionDetails' },
        { status: 400 }
      );
    }

    if (!['pause', 'reactivate'].includes(type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid type. Must be "pause" or "reactivate"' },
        { status: 400 }
      );
    }

    console.log('[send-subscription-email] Getting transporter...');
    const transporter = await getTransporter();

    let emailContent;
    if (type === 'pause') {
      emailContent = generatePauseEmailContent(subscriptionDetails);
    } else {
      emailContent = generateReactivateEmailContent(subscriptionDetails);
    }

    const mailOptions = {
      from: `"Elixr" <${process.env.GMAIL_USER}>`,
      to: userEmail,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    };

    console.log('[send-subscription-email] Sending email to:', userEmail);
    const info = await transporter.sendMail(mailOptions);
    console.log('[send-subscription-email] Email sent successfully! Message ID:', info.messageId);

    return NextResponse.json({
      success: true,
      message: `${type === 'pause' ? 'Pause' : 'Reactivation'} confirmation email sent successfully`,
      messageId: info.messageId,
    });
  } catch (error: any) {
    console.error('[send-subscription-email] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to send subscription email',
        error: error.message 
      },
      { status: 500 }
    );
  }
}
