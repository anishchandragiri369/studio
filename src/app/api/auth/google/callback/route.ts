import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import GoogleAuthService from '@/lib/google-auth-service';
import AuthEmailService from '@/lib/auth-email-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('[Google Callback] OAuth error:', error);
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'google_auth_cancelled');
      return NextResponse.redirect(loginUrl);
    }

    if (!code) {
      console.error('[Google Callback] No authorization code received');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'no_auth_code');
      return NextResponse.redirect(loginUrl);
    }

    // Exchange code for tokens and user info
    const authResult = await GoogleAuthService.exchangeCodeForTokens(code);
    
    if (!authResult.success || !authResult.user) {
      console.error('[Google Callback] Failed to get user info:', authResult.error);
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'google_user_info_failed');
      return NextResponse.redirect(loginUrl);
    }

    const { user } = authResult;

    // Check if user exists in Supabase
    const { data: users, error: userLookupError } = await supabase.auth.admin.listUsers();
    
    let existingUser = null;
    if (!userLookupError && users?.users) {
      existingUser = users.users.find(u => u.email === user.email);
    }

    let supabaseUser;
    let isNewUser = false;

    if (userLookupError || !existingUser) {
      // Create new user in Supabase
      const { data: newUserData, error: createError } = await supabase.auth.admin.createUser({
        email: user.email,
        email_confirm: true, // Auto-confirm since Google verified the email
        user_metadata: {
          name: user.name,
          avatar_url: user.picture,
          provider: 'google',
          google_id: user.id,
        },
      });

      if (createError || !newUserData.user) {
        console.error('[Google Callback] Failed to create user:', createError);
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('error', 'user_creation_failed');
        return NextResponse.redirect(loginUrl);
      }

      supabaseUser = newUserData.user;
      isNewUser = true;
    } else {
      supabaseUser = existingUser;
    }

    // Generate a magic link for the user to establish session
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email,
    });

    if (linkError || !linkData.properties?.action_link) {
      console.error('[Google Callback] Failed to generate magic link:', linkError);
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'session_creation_failed');
      return NextResponse.redirect(loginUrl);
    }

    // Send welcome email for new users
    if (isNewUser) {
      try {
        const useCustomEmails = process.env.CUSTOM_AUTH_EMAILS === 'true';
        if (useCustomEmails) {
          await AuthEmailService.sendWelcomeEmail(user.email, user.name);
        }
      } catch (emailError) {
        console.warn('[Google Callback] Failed to send welcome email:', emailError);
        // Don't fail the auth flow if email fails
      }
    }

    // Extract token from magic link and redirect to our own success page
    const magicLink = linkData.properties.action_link;
    const magicLinkUrl = new URL(magicLink);
    
    // Get the token from the magic link
    const token = magicLinkUrl.searchParams.get('token');
    const tokenHash = magicLinkUrl.searchParams.get('token_hash');
    const type = magicLinkUrl.searchParams.get('type');
    
    if (!token && !tokenHash) {
      console.error('[Google Callback] No token in magic link');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'token_extraction_failed');
      return NextResponse.redirect(loginUrl);
    }
    
    // Redirect to our success page with the token parameters
    const successUrl = new URL('/auth/success', request.url);
    if (token) successUrl.searchParams.set('token', token);
    if (tokenHash) successUrl.searchParams.set('token_hash', tokenHash);
    if (type) successUrl.searchParams.set('type', type);
    successUrl.searchParams.set('provider', 'google');
    successUrl.searchParams.set('new_user', isNewUser.toString());

    return NextResponse.redirect(successUrl.toString());

  } catch (error) {
    console.error('[Google Callback] Unexpected error:', error);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'unexpected_error');
    return NextResponse.redirect(loginUrl);
  }
}
