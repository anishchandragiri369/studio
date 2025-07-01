import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('[test-full-signup] Testing full signup flow for:', email);
    
    // Step 1: Check if user exists using our verify-user endpoint
    const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/verify-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const verifyResult = await verifyResponse.json();
    
    // Step 2: Simulate what AuthContext would do
    if (verifyResult.exists) {
      return NextResponse.json({
        success: false,
        message: 'User already exists - signup prevented',
        userExists: true,
        welcomeEmailSent: false,
        flow: 'Existing user detected, no signup attempted, no welcome email sent'
      });
    }
    
    // Step 3: If user doesn't exist, we would proceed with signup and send welcome email
    return NextResponse.json({
      success: true,
      message: 'New user - would proceed with signup',
      userExists: false,
      welcomeEmailSent: true,
      flow: 'New user detected, would signup and send welcome email'
    });

  } catch (error) {
    console.error('[test-full-signup] Error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
