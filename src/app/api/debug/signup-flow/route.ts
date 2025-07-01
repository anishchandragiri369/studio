import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

console.log('[debug-signup-flow] API route loaded');

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

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    console.log('[debug-signup-flow] Testing signup flow for:', email);
    
    // Check environment variables
    const customEmailsEnabled = process.env.NEXT_PUBLIC_CUSTOM_AUTH_EMAILS === 'true';
    const supabaseEmailsDisabled = process.env.DISABLE_SUPABASE_EMAILS === 'true';
    
    console.log('[debug-signup-flow] Custom emails enabled:', customEmailsEnabled);
    console.log('[debug-signup-flow] Supabase emails disabled:', supabaseEmailsDisabled);
    
    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin.auth.admin.getUserByEmail(email);
    
    if (existingUser && existingUser.user) {
      return NextResponse.json({
        success: false,
        message: 'User already exists',
        userExists: true,
        userId: existingUser.user.id,
        userStatus: existingUser.user.email_confirmed_at ? 'confirmed' : 'unconfirmed'
      });
    }
    
    // Test signup with the same options as AuthContext
    const signupOptions = customEmailsEnabled ? {
      // Completely disable Supabase emails when using custom emails
      emailRedirectTo: undefined,
      // Disable email confirmation when using custom emails
      data: { custom_auth: true }
    } : {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`
    };
    
    console.log('[debug-signup-flow] Signup options:', signupOptions);
    
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: !customEmailsEnabled, // Don't auto-confirm if we're using custom emails
      user_metadata: signupOptions.data || {}
    });
    
    if (error) {
      console.error('[debug-signup-flow] Signup error:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        errorCode: error.status
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      userId: data.user?.id,
      userEmail: data.user?.email,
      emailConfirmed: data.user?.email_confirmed_at,
      customEmailsEnabled,
      supabaseEmailsDisabled,
      signupOptions
    });
    
  } catch (error: any) {
    console.error('[debug-signup-flow] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Debug signup flow endpoint',
    usage: 'POST with { email, password } to test signup flow',
    environment: {
      customEmailsEnabled: process.env.NEXT_PUBLIC_CUSTOM_AUTH_EMAILS === 'true',
      supabaseEmailsDisabled: process.env.DISABLE_SUPABASE_EMAILS === 'true',
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
      productionUrl: process.env.NEXT_PUBLIC_PRODUCTION_URL
    }
  });
}
