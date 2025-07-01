import { NextRequest, NextResponse } from 'next/server';
import 'dotenv/config';
import nodemailer from 'nodemailer';

// This webhook intercepts Supabase auth events and sends custom emails
// while still using Supabase's built-in token system for actual password reset

async function getTransporter() {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error('Gmail SMTP credentials not configured');
    }
    
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  } catch (error) {
    console.error('[auth-webhook] Error creating transporter:', error);
    throw error;
  }
}

function generateCustomResetEmailHTML(resetLink: string, userEmail: string) {
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
        .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
        .content { padding: 40px 20px; }
        .reset-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .reset-button:hover { background: linear-gradient(135deg, #5a67d8 0%, #6b46a5 100%); }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
        .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; color: #856404; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hello!</h2>
          <p>You requested a password reset for your Elixr account (${userEmail}).</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center;">
            <a href="${resetLink}" class="reset-button">Reset My Password</a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace;">
            ${resetLink}
          </p>
          <div class="warning">
            <strong>Security Notice:</strong> This link will expire in 1 hour. If you didn't request this reset, please ignore this email and your password will remain unchanged.
          </div>
          <p>If you have any questions or need assistance, please contact our support team.</p>
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
    console.log('[auth-webhook] Webhook called');
    
    const body = await request.json();
    console.log('[auth-webhook] Webhook payload:', body);

    // Check if this is a password recovery event
    if (body.type === 'user.recovery' || (body.record && body.record.recovery_sent_at)) {
      console.log('[auth-webhook] Password recovery event detected');
      
      // Check if custom emails are enabled
      if (process.env.NEXT_PUBLIC_CUSTOM_AUTH_EMAILS !== 'true') {
        console.log('[auth-webhook] Custom emails disabled, skipping');
        return NextResponse.json({ success: true, message: 'Custom emails disabled' });
      }

      // Check if email mock mode is enabled
      if (process.env.EMAIL_MOCK_MODE === 'true') {
        console.log('[MOCK] Would send custom password reset email');
        return NextResponse.json({ success: true, message: 'Mock mode enabled' });
      }

      const userEmail = body.record?.email;
      const recoveryUrl = body.record?.recovery_url;

      if (!userEmail || !recoveryUrl) {
        console.error('[auth-webhook] Missing email or recovery URL');
        return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
      }

      // Send custom email using the Supabase-generated recovery URL
      const transporter = await getTransporter();
      const htmlContent = generateCustomResetEmailHTML(recoveryUrl, userEmail);

      const mailOptions = {
        from: `"Elixr Security" <${process.env.GMAIL_USER}>`,
        to: userEmail,
        subject: '🔐 Reset Your Elixr Password',
        html: htmlContent,
      };

      await transporter.sendMail(mailOptions);
      console.log('[auth-webhook] Custom password reset email sent to:', userEmail);

      return NextResponse.json({ success: true, message: 'Custom email sent' });
    }

    return NextResponse.json({ success: true, message: 'Event processed' });

  } catch (error) {
    console.error('[auth-webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Supabase Auth Webhook Endpoint',
    customEmails: process.env.NEXT_PUBLIC_CUSTOM_AUTH_EMAILS === 'true',
    mockMode: process.env.EMAIL_MOCK_MODE === 'true'
  });
}
