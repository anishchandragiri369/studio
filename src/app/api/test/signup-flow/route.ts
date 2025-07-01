import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('[test-signup-flow] Testing signup flow for:', email);
    
    // Test password reset (which should use custom tokens)
    console.log('[test-signup-flow] Testing password reset...');
    const resetResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/send-reset-password-email-smtp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const resetResult = await resetResponse.json();
    
    // Test welcome email (which should use SMTP)
    console.log('[test-signup-flow] Testing welcome email...');
    const welcomeResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/send-welcome-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name: email.split('@')[0] }),
    });
    const welcomeResult = await welcomeResponse.json();
    
    // Check password reset tokens
    console.log('[test-signup-flow] Checking password reset tokens...');
    const tokensResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/debug/password-reset-tokens`);
    const tokensResult = await tokensResponse.json();
    
    return NextResponse.json({ 
      success: true,
      tests: {
        passwordReset: {
          success: resetResponse.ok,
          result: resetResult
        },
        welcomeEmail: {
          success: welcomeResponse.ok,
          result: welcomeResult
        },
        tokens: {
          count: tokensResult.count,
          latest: tokensResult.tokens?.[tokensResult.tokens.length - 1]
        }
      }
    });

  } catch (error) {
    console.error('[test-signup-flow] Error:', error);
    return NextResponse.json(
      { error: 'Failed to test signup flow', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
