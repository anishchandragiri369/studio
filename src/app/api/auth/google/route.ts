import { NextRequest, NextResponse } from 'next/server';
import GoogleAuthService from '@/lib/google-auth-service';

export async function GET(request: NextRequest) {
  try {
    // Generate Google OAuth URL and redirect
    const authUrl = GoogleAuthService.getAuthUrl();
    
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('[Google Auth] Failed to generate auth URL:', error);
    
    // Redirect to login page with error
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'google_auth_failed');
    
    return NextResponse.redirect(loginUrl);
  }
}
