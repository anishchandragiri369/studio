import { NextRequest, NextResponse } from 'next/server';
import 'dotenv/config';
import { google } from 'googleapis';

async function testGmailOAuth() {
  try {
    console.log('Testing Gmail OAuth configuration...');
    
    // Check if all required env vars are present
    const requiredVars = ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN', 'GMAIL_USER'];
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      return {
        success: false,
        error: `Missing environment variables: ${missing.join(', ')}`
      };
    }

    // Test OAuth2 client
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground'
    );

    oAuth2Client.setCredentials({ 
      refresh_token: process.env.GMAIL_REFRESH_TOKEN 
    });

    // Try to get access token
    const accessTokenResponse = await oAuth2Client.getAccessToken();
    
    if (!accessTokenResponse.token) {
      return {
        success: false,
        error: 'Failed to get access token - refresh token may be expired'
      };
    }

    return {
      success: true,
      message: 'Gmail OAuth configuration is working correctly',
      accessTokenObtained: true,
      gmailUser: process.env.GMAIL_USER
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    };
  }
}

export async function GET() {
  const result = await testGmailOAuth();
  
  return NextResponse.json({
    ...result,
    timestamp: new Date().toISOString(),
    mockMode: process.env.EMAIL_MOCK_MODE === 'true'
  });
}

export async function POST() {
  // Same as GET for convenience
  return GET();
}
