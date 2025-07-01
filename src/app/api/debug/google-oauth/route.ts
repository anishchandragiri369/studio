import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const redirectUri = `${baseUrl}/api/auth/google/callback`;
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  
  return NextResponse.json({
    message: 'Google OAuth Debug Info',
    baseUrl,
    redirectUri,
    googleClientId: googleClientId ? `${googleClientId.substring(0, 20)}...` : 'NOT SET',
    currentUrl: request.url,
    host: request.headers.get('host'),
  });
}
