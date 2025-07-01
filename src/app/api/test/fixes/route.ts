import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Test 1: Check URL generation in welcome email
    const baseUrl = process.env.NEXT_PUBLIC_PRODUCTION_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://elixr.app';
    
    // Test 2: Check environment variables
    const config = {
      baseUrl,
      productionUrl: process.env.NEXT_PUBLIC_PRODUCTION_URL,
      localUrl: process.env.NEXT_PUBLIC_BASE_URL,
      customAuthEnabled: process.env.NEXT_PUBLIC_CUSTOM_AUTH_EMAILS,
    };
    
    return NextResponse.json({ 
      success: true,
      urlTest: {
        welcomeEmailUrl: `${baseUrl}/menu`,
        resetPasswordUrl: `${baseUrl}/reset-password?token=test123`,
      },
      config
    });

  } catch (error) {
    console.error('[test-fixes] Error:', error);
    return NextResponse.json(
      { error: 'Failed to test fixes', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
