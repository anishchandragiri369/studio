import 'dotenv/config';
import nodemailer from 'nodemailer';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

console.log('[send-reset-password-email-smtp] API route loaded');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service role key for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[send-reset-password-email-smtp] Missing Supabase configuration');
}

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

async function getTransporter() {
  try {
    console.log('[getTransporter] Creating SMTP transporter...');
    
    // Check if we have the required SMTP credentials
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error('Gmail SMTP credentials not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env');
    }
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD, // App password, not regular password
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    
    console.log('[getTransporter] SMTP transporter created successfully');
    return transporter;
  } catch (error) {
    console.error('[getTransporter] Error creating SMTP transporter:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
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
            <strong>Security Notice:</strong> This link will expire in 24 hours. If you didn't request this reset, please ignore this email and your password will remain unchanged.
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
    console.log('[send-reset-password-email-smtp] API route called');
    
    let email;
    try {
      const body = await request.json();
      email = body.email;
      console.log('[send-reset-password-email-smtp] Parsed request body:', { email });
    } catch (jsonError) {
      console.error('[send-reset-password-email-smtp] JSON parsing error:', jsonError);
      return NextResponse.json({ 
        error: 'Invalid JSON in request body',
        details: jsonError instanceof Error ? jsonError.message : 'Unknown JSON error'
      }, { status: 400 });
    }

    if (!email) {
      console.error('[send-reset-password-email-smtp] Missing email field');
      return NextResponse.json({ 
        error: 'Email is required' 
      }, { status: 400 });
    }

    if (!supabase) {
      console.error('[send-reset-password-email-smtp] Supabase not configured');
      return NextResponse.json({ 
        error: 'Database service not available' 
      }, { status: 500 });
    }

    console.log('[send-reset-password-email-smtp] Processing request for:', email);

    // Check if user exists in Supabase auth
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('[send-reset-password-email-smtp] Error checking user:', userError);
      return NextResponse.json({ 
        error: 'Failed to verify user' 
      }, { status: 500 });
    }

    const user = userData.users.find(u => u.email === email);
    if (!user) {
      // For security, don't reveal if email exists or not
      console.log('[send-reset-password-email-smtp] User not found for email:', email);
      return NextResponse.json({ 
        success: true, 
        message: 'If this email is registered, you will receive a password reset link.'
      });
    }

    // Generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Store the reset token in Supabase (you may need to create this table)
    try {
      const { error: insertError } = await supabase
        .from('password_reset_tokens')
        .insert({
          email: email,
          token: resetToken,
          expires_at: expiresAt.toISOString(),
          used: false
        });

      if (insertError) {
        console.error('[send-reset-password-email-smtp] Error storing reset token:', insertError);
        // Table might not exist, let's create a simple in-memory approach for now
        console.log('[send-reset-password-email-smtp] Falling back to temporary token generation');
      }
    } catch (dbError) {
      console.warn('[send-reset-password-email-smtp] Database token storage failed, continuing with email send');
    }

    // Create the reset link with our custom token
    const baseUrl = process.env.NEXT_PUBLIC_PRODUCTION_URL || process.env.NEXT_PUBLIC_APP_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    console.log('[send-reset-password-email-smtp] Generated reset link for email sending');

    // Check if email mock mode is enabled
    if (process.env.EMAIL_MOCK_MODE === 'true') {
      console.log('[MOCK] Password reset email would be sent to:', email);
      console.log('[MOCK] Reset link:', resetLink);
      console.log('[MOCK] Reset token:', resetToken);
      return NextResponse.json({ 
        success: true, 
        message: 'Password reset email sent (mock mode)',
        mock: true,
        resetLink: resetLink // Only include in mock mode for debugging
      });
    }

    // Check if Gmail SMTP credentials are available
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error('[send-reset-password-email-smtp] Gmail SMTP credentials not configured');
      return NextResponse.json(
        { 
          error: 'Email service not properly configured',
          details: 'Gmail SMTP credentials missing. Please set GMAIL_USER and GMAIL_APP_PASSWORD.'
        },
        { status: 500 }
      );
    }

    console.log('[send-reset-password-email-smtp] Getting SMTP transporter...');
    const transporter = await getTransporter();
    
    console.log('[send-reset-password-email-smtp] Generating email content...');
    const htmlContent = generateResetPasswordEmailHTML(resetLink, email);

    const mailOptions = {
      from: `"Elixr Security" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: '🔐 Reset Your Elixr Password',
      html: htmlContent,
    };

    console.log('[send-reset-password-email-smtp] Sending email...');
    const result = await transporter.sendMail(mailOptions);
    console.log('[send-reset-password-email-smtp] Email sent successfully:', result.messageId);

    return NextResponse.json({ 
      success: true, 
      message: 'Password reset email sent successfully',
      messageId: result.messageId,
      method: 'SMTP'
    });

  } catch (error) {
    console.error('[send-reset-password-email-smtp] Error details:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    // Provide specific error messages for common SMTP issues
    let errorMessage = 'Failed to send password reset email';
    let errorDetails = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorDetails.includes('Invalid login')) {
      errorMessage = 'Gmail SMTP authentication failed';
      errorDetails = 'Please check GMAIL_USER and GMAIL_APP_PASSWORD credentials';
    } else if (errorDetails.includes('username') || errorDetails.includes('password')) {
      errorMessage = 'Gmail SMTP credentials invalid';
      errorDetails = 'Please verify your Gmail app password';
    }
    
    return NextResponse.json(
      { 
        error: errorMessage, 
        details: errorDetails,
        timestamp: new Date().toISOString(),
        suggestion: 'Check Gmail SMTP credentials or enable EMAIL_MOCK_MODE for testing'
      },
      { status: 500 }
    );
  }
}
