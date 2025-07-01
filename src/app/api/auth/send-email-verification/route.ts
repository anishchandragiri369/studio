import 'dotenv/config';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

console.log('[send-email-verification] API route loaded');

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

function generateEmailVerificationHTML(confirmationLink: string, userEmail: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Elixr Account</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
        .content { padding: 40px 20px; }
        .verify-message { font-size: 24px; color: #333; margin-bottom: 20px; }
        .steps-list { background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; }
        .step-item { margin: 10px 0; padding-left: 25px; position: relative; }
        .step-item:before { content: counter(step-counter); counter-increment: step-counter; position: absolute; left: 0; background: #667eea; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; }
        .steps-list { counter-reset: step-counter; }
        .verify-button { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; display: inline-block; margin: 20px 0; font-weight: bold; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .link-fallback { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; word-break: break-all; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✉️ Verify Your Email</h1>
          <p>Almost there! One more step to activate your account</p>
        </div>
        
        <div class="content">
          <div class="verify-message">
            Confirm Your Email Address
          </div>
          
          <p>Hello!</p>
          
          <p>Thank you for signing up with Elixr! To complete your registration and start enjoying our premium juices, please verify your email address <strong>${userEmail}</strong>.</p>
          
          <div class="steps-list">
            <h3>What happens after verification:</h3>
            <div class="step-item">Your account will be fully activated</div>
            <div class="step-item">You'll get access to exclusive member benefits</div>
            <div class="step-item">You can start placing orders immediately</div>
            <div class="step-item">You'll receive important updates about your orders</div>
          </div>
          
          <p>Click the button below to verify your email address:</p>
          
          <div style="text-align: center;">
            <a href="${confirmationLink}" class="verify-button">
              Verify My Email
            </a>
          </div>
          
          <p>This verification link will expire in 24 hours.</p>
          
          <div class="link-fallback">
            <p><strong>If the button doesn't work, copy and paste this link into your browser:</strong></p>
            <p>${confirmationLink}</p>
          </div>
          
          <p>If you didn't create an account with Elixr, please ignore this email.</p>
          
          <p>Need help? Contact us at <a href="mailto:${process.env.ADMIN_EMAIL}">${process.env.ADMIN_EMAIL}</a></p>
          
          <p>Welcome to the Elixr family!<br>The Elixr Team</p>
        </div>
        
        <div class="footer">
          <p>© 2025 Elixr. All rights reserved.</p>
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function POST(request: NextRequest) {
  try {
    const { email, confirmationLink } = await request.json();

    if (!email || !confirmationLink) {
      return NextResponse.json({ 
        error: 'Email and confirmation link are required' 
      }, { status: 400 });
    }

    // Check if email mock mode is enabled
    if (process.env.EMAIL_MOCK_MODE === 'true') {
      console.log('[MOCK] Email verification would be sent to:', email);
      console.log('[MOCK] Confirmation link:', confirmationLink);
      return NextResponse.json({ 
        success: true, 
        message: 'Email verification sent (mock mode)',
        mock: true 
      });
    }

    const transporter = await getTransporter();
    const htmlContent = generateEmailVerificationHTML(confirmationLink, email);

    const mailOptions = {
      from: `"Elixr Team" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: '✉️ Please Verify Your Elixr Account',
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ 
      success: true, 
      message: 'Email verification sent successfully' 
    });

  } catch (error) {
    console.error('[send-email-verification] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send email verification', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
