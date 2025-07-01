import 'dotenv/config';
import nodemailer from 'nodemailer';
import { NextRequest, NextResponse } from 'next/server';

console.log('[send-welcome-email] API route loaded');

function createSMTPTransporter() {
  console.log('[send-welcome-email] Creating SMTP transporter with App Password');
  
  // Validate required environment variables
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error('Missing required environment variables: GMAIL_USER or GMAIL_APP_PASSWORD');
  }
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD, // Using App Password instead of OAuth2
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

function generateWelcomeEmailHTML(userEmail: string, userName?: string) {
  // Use production URL if available, otherwise fallback to base URL
  // For local development, always use NEXT_PUBLIC_BASE_URL
  // For production, use NEXT_PUBLIC_PRODUCTION_URL
  const isLocalDev = process.env.NODE_ENV === 'development';
  const baseUrl = isLocalDev 
    ? (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002')
    : (process.env.NEXT_PUBLIC_PRODUCTION_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://elixr.app');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Elixr</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
        .content { padding: 40px 20px; }
        .welcome-message { font-size: 24px; color: #333; margin-bottom: 20px; }
        .feature-list { background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; }
        .feature-item { margin: 10px 0; padding-left: 20px; position: relative; }
        .feature-item:before { content: "✓"; position: absolute; left: 0; color: #28a745; font-weight: bold; }
        .cta-button { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; display: inline-block; margin: 20px 0; font-weight: bold; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🥤 Welcome to Elixr!</h1>
          <p>Your journey to better health starts here</p>
        </div>
        
        <div class="content">
          <div class="welcome-message">
            Hello ${userName || userEmail}! 👋
          </div>
          
          <p>Thank you for joining Elixr! We're excited to have you as part of our community of health enthusiasts.</p>
          
          <div class="feature-list">
            <h3>What you can do with your Elixr account:</h3>
            <div class="feature-item">Browse our premium juice collection</div>
            <div class="feature-item">Create custom juice combinations</div>
            <div class="feature-item">Set up flexible subscriptions</div>
            <div class="feature-item">Track your wellness journey</div>
            <div class="feature-item">Get personalized recommendations</div>
          </div>
          
          <p>Ready to start your healthy lifestyle? Explore our fresh, cold-pressed juices made from the finest ingredients.</p>
          
          <div style="text-align: center;">
            <a href="${baseUrl}/menu" class="cta-button">
              Start Shopping
            </a>
          </div>
          
          <p>If you have any questions, feel free to reach out to us at <a href="mailto:${process.env.ADMIN_EMAIL}">${process.env.ADMIN_EMAIL}</a></p>
        </div>
        
        <div class="footer">
          <p>© 2025 Elixr. All rights reserved.</p>
          <p>You received this email because you signed up for an Elixr account.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function POST(request: NextRequest) {
  try {
    console.log('[send-welcome-email] POST request received');
    
    const { email, name } = await request.json();
    console.log('[send-welcome-email] Request data:', { email, name: name ? 'provided' : 'not provided' });

    if (!email) {
      console.error('[send-welcome-email] Email is required');
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if email mock mode is enabled
    if (process.env.EMAIL_MOCK_MODE === 'true') {
      console.log('[MOCK] Welcome email would be sent to:', email);
      console.log('[MOCK] Email content: Welcome to Elixr!');
      return NextResponse.json({ 
        success: true, 
        message: 'Welcome email sent (mock mode)',
        mock: true 
      });
    }

    console.log('[send-welcome-email] Creating SMTP transporter...');
    const transporter = createSMTPTransporter();
    
    console.log('[send-welcome-email] Generating email HTML...');
    const htmlContent = generateWelcomeEmailHTML(email, name);

    const mailOptions = {
      from: `"Elixr Team" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: '🥤 Welcome to Elixr - Your Health Journey Begins!',
      html: htmlContent,
    };

    console.log('[send-welcome-email] Sending email to:', email);
    await transporter.sendMail(mailOptions);
    console.log('[send-welcome-email] Email sent successfully');

    return NextResponse.json({ 
      success: true, 
      message: 'Welcome email sent successfully' 
    });

  } catch (error) {
    console.error('[send-welcome-email] Error:', error);
    
    // Enhanced error logging
    const errorInfo = {
      name: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };
    
    return NextResponse.json(
      { 
        error: 'Failed to send welcome email', 
        details: errorInfo.message,
        errorType: errorInfo.name
      },
      { status: 500 }
    );
  }
}
