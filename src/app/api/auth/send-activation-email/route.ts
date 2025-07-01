import 'dotenv/config';
import nodemailer from 'nodemailer';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

console.log('[send-activation-email] API route loaded');

// Server-side Supabase client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

function createSMTPTransporter() {
  console.log('[send-activation-email] Creating SMTP transporter with App Password');
  
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error('Missing required environment variables: GMAIL_USER or GMAIL_APP_PASSWORD');
  }
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

function generateActivationEmailHTML(userEmail: string, activationLink: string, userName?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_PRODUCTION_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://elixr.app';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Activate Your Elixr Account</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
        .content { padding: 40px 20px; text-align: center; }
        .welcome-message { font-size: 24px; color: #333; margin-bottom: 20px; }
        .activation-button { 
          display: inline-block; 
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%); 
          color: white; 
          padding: 15px 30px; 
          text-decoration: none; 
          border-radius: 50px; 
          font-weight: bold; 
          margin: 20px 0;
          font-size: 16px;
        }
        .activation-button:hover { background: linear-gradient(135deg, #218838 0%, #1ba085 100%); }
        .info-box { background-color: #e3f2fd; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #2196f3; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .security-note { color: #6c757d; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🥤 Welcome to Elixr!</h1>
          <p>Activate your account to start your wellness journey</p>
        </div>
        
        <div class="content">
          <div class="welcome-message">
            Hello ${userName || userEmail}! 👋
          </div>
          
          <p>Thank you for signing up for Elixr! To complete your registration and start exploring our premium juice collection, please activate your account.</p>
          
          <div class="info-box">
            <h3>🔐 Account Activation Required</h3>
            <p>Click the button below to verify your email address and activate your Elixr account.</p>
          </div>
          
          <a href="${activationLink}" class="activation-button">
            ✅ Activate My Account
          </a>
          
          <p>After activation, you'll be able to:</p>
          <ul style="text-align: left; display: inline-block;">
            <li>Browse our premium juice collection</li>
            <li>Create custom juice combinations</li>
            <li>Set up flexible subscriptions</li>
            <li>Track your wellness journey</li>
          </ul>
          
          <div class="security-note">
            <p>If you didn't create this account, please ignore this email.</p>
            <p>This activation link will expire in 24 hours for security.</p>
          </div>
          
          <p>Questions? Contact us at <a href="mailto:${process.env.ADMIN_EMAIL}">${process.env.ADMIN_EMAIL}</a></p>
        </div>
        
        <div class="footer">
          <p>© 2025 Elixr. All rights reserved.</p>
          <p>This email was sent because you signed up for an Elixr account.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function POST(request: NextRequest) {
  try {
    console.log('[send-activation-email] POST request received');
    
    const { email, userId, name } = await request.json();
    console.log('[send-activation-email] Request data:', { email, userId, name: name ? 'provided' : 'not provided' });

    if (!email || !userId) {
      console.error('[send-activation-email] Email and userId are required');
      return NextResponse.json({ error: 'Email and userId are required' }, { status: 400 });
    }

    // Check if email mock mode is enabled
    if (process.env.EMAIL_MOCK_MODE === 'true') {
      console.log('[MOCK] Activation email would be sent to:', email);
      console.log('[MOCK] Email content: Account activation for Elixr');
      return NextResponse.json({ 
        success: true, 
        message: 'Activation email sent (mock mode)',
        mock: true 
      });
    }

    // Generate activation token and store it
    const activationToken = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    try {
      // Store activation token in database
      const { error: dbError } = await supabaseAdmin
        .from('user_activation_tokens')
        .insert({
          user_id: userId,
          token: activationToken,
          email: email,
          expires_at: expiresAt.toISOString(),
          used: false
        });

      if (dbError) {
        console.error('[send-activation-email] Database error:', dbError);
        // Continue with email sending even if DB storage fails
      }
    } catch (dbError) {
      console.warn('[send-activation-email] Failed to store activation token:', dbError);
    }

    // Create activation link
    // For local development, always use NEXT_PUBLIC_BASE_URL
    // For production, use NEXT_PUBLIC_PRODUCTION_URL
    const isLocalDev = process.env.NODE_ENV === 'development';
    const baseUrl = isLocalDev 
      ? (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002')
      : (process.env.NEXT_PUBLIC_PRODUCTION_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://elixr.app');
    const activationLink = `${baseUrl}/api/auth/activate?token=${activationToken}&email=${encodeURIComponent(email)}`;

    console.log('[send-activation-email] Creating SMTP transporter...');
    const transporter = createSMTPTransporter();
    
    console.log('[send-activation-email] Generating email HTML...');
    const htmlContent = generateActivationEmailHTML(email, activationLink, name);

    const mailOptions = {
      from: `"Elixr Team" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: '🔐 Activate Your Elixr Account - Welcome!',
      html: htmlContent,
    };

    console.log('[send-activation-email] Sending activation email to:', email);
    await transporter.sendMail(mailOptions);
    console.log('[send-activation-email] Activation email sent successfully');

    return NextResponse.json({ 
      success: true, 
      message: 'Activation email sent successfully' 
    });

  } catch (error) {
    console.error('[send-activation-email] Error:', error);
    
    const errorInfo = {
      name: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };
    
    return NextResponse.json(
      { 
        error: 'Failed to send activation email', 
        details: errorInfo.message,
        errorType: errorInfo.name
      },
      { status: 500 }
    );
  }
}
