import 'dotenv/config';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

console.log('[send-reset-password-email] API route loaded');

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );
}

async function getTransporter() {
  try {
    console.log('[getTransporter] Creating OAuth2 client...');
    const oAuth2Client = getOAuth2Client();
    
    console.log('[getTransporter] Setting credentials...');
    oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
    
    console.log('[getTransporter] Getting access token...');
    const accessTokenResponse = await oAuth2Client.getAccessToken();
    const accessToken = accessTokenResponse.token;
    
    if (!accessToken) {
      throw new Error('Failed to retrieve access token from OAuth2 client');
    }
    
    console.log('[getTransporter] Creating nodemailer transporter...');
    const transporter = nodemailer.createTransport({
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
    
    console.log('[getTransporter] Transporter created successfully');
    return transporter;
  } catch (error) {
    console.error('[getTransporter] Error creating transporter:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

function generateResetPasswordEmailHTML(resetLink: string, userEmail: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Elixr Password</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
        .content { padding: 40px 20px; }
        .reset-message { font-size: 24px; color: #333; margin-bottom: 20px; }
        .security-notice { background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0; color: #856404; }
        .reset-button { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; display: inline-block; margin: 20px 0; font-weight: bold; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .link-fallback { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; word-break: break-all; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Reset Your Password</h1>
          <p>Elixr Account Security</p>
        </div>
        
        <div class="content">
          <div class="reset-message">
            Password Reset Request
          </div>
          
          <p>Hello,</p>
          
          <p>We received a request to reset the password for your Elixr account associated with <strong>${userEmail}</strong>.</p>
          
          <div class="security-notice">
            <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
          </div>
          
          <p>To reset your password, click the button below:</p>
          
          <div style="text-align: center;">
            <a href="${resetLink}" class="reset-button">
              Reset My Password
            </a>
          </div>
          
          <p>This link will expire in 1 hour for security reasons.</p>
          
          <div class="link-fallback">
            <p><strong>If the button doesn't work, copy and paste this link into your browser:</strong></p>
            <p>${resetLink}</p>
          </div>
          
          <p>If you continue to have problems, please contact our support team at <a href="mailto:${process.env.ADMIN_EMAIL}">${process.env.ADMIN_EMAIL}</a></p>
          
          <p>Best regards,<br>The Elixr Team</p>
        </div>
        
        <div class="footer">
          <p>© 2025 Elixr. All rights reserved.</p>
          <p>This is an automated security email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function POST(request: NextRequest) {
  try {
    console.log('[send-reset-password-email] API route called');
    
    const { email, resetLink } = await request.json();

    if (!email || !resetLink) {
      console.error('[send-reset-password-email] Missing required fields:', { email: !!email, resetLink: !!resetLink });
      return NextResponse.json({ 
        error: 'Email and reset link are required' 
      }, { status: 400 });
    }

    console.log('[send-reset-password-email] Processing request for:', email);

    // Check if email mock mode is enabled
    if (process.env.EMAIL_MOCK_MODE === 'true') {
      console.log('[MOCK] Password reset email would be sent to:', email);
      console.log('[MOCK] Reset link:', resetLink);
      return NextResponse.json({ 
        success: true, 
        message: 'Password reset email sent (mock mode)',
        mock: true 
      });
    }

    // Check if Gmail credentials are available
    if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET || !process.env.GMAIL_REFRESH_TOKEN || !process.env.GMAIL_USER) {
      console.error('[send-reset-password-email] Gmail OAuth credentials not configured');
      return NextResponse.json(
        { 
          error: 'Email service not properly configured',
          details: 'Gmail OAuth credentials missing'
        },
        { status: 500 }
      );
    }

    console.log('[send-reset-password-email] Getting email transporter...');
    const transporter = await getTransporter();
    
    console.log('[send-reset-password-email] Generating email content...');
    const htmlContent = generateResetPasswordEmailHTML(resetLink, email);

    const mailOptions = {
      from: `"Elixr Security" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: '🔐 Reset Your Elixr Password',
      html: htmlContent,
    };

    console.log('[send-reset-password-email] Sending email...');
    const result = await transporter.sendMail(mailOptions);
    console.log('[send-reset-password-email] Email sent successfully:', result.messageId);

    return NextResponse.json({ 
      success: true, 
      message: 'Password reset email sent successfully',
      messageId: result.messageId
    });

  } catch (error) {
    console.error('[send-reset-password-email] Error details:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    // Provide specific error messages for common OAuth issues
    let errorMessage = 'Failed to send password reset email';
    let errorDetails = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorDetails.includes('invalid_grant')) {
      errorMessage = 'Gmail OAuth token expired or invalid';
      errorDetails = 'Please regenerate Gmail refresh token';
    } else if (errorDetails.includes('unauthorized_client')) {
      errorMessage = 'Gmail OAuth client not authorized';
      errorDetails = 'Please check Gmail API configuration';
    }
    
    return NextResponse.json(
      { 
        error: errorMessage, 
        details: errorDetails,
        timestamp: new Date().toISOString(),
        suggestion: 'Check Gmail OAuth2 credentials or enable EMAIL_MOCK_MODE for testing'
      },
      { status: 500 }
    );
  }
}
