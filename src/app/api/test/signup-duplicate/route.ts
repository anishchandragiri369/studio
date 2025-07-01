import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('[test-signup-duplicate] Testing signup with existing email:', email);
    
    // Step 1: Check if user exists first
    const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/verify-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const verifyResult = await verifyResponse.json();
    
    // Step 2: Try to send welcome email (should not send if user exists)
    let welcomeResult = { sent: false, reason: 'User exists, skipped' };
    
    if (!verifyResult.exists) {
      const welcomeResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/send-welcome-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: email.split('@')[0] }),
      });
      welcomeResult = {
        sent: welcomeResponse.ok,
        reason: welcomeResponse.ok ? 'New user, email sent' : 'Email failed to send'
      };
    }
    
    return NextResponse.json({ 
      success: true,
      email,
      userExists: verifyResult.exists,
      welcomeEmail: welcomeResult,
      logic: 'If user exists, welcome email should NOT be sent'
    });

  } catch (error) {
    console.error('[test-signup-duplicate] Error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
