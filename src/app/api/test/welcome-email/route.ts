import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('[test-welcome-email] Testing welcome email for:', email);
    
    // Call the welcome email API
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/send-welcome-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    });

    const result = await response.json();
    
    return NextResponse.json({ 
      success: response.ok,
      status: response.status,
      result 
    });

  } catch (error) {
    console.error('[test-welcome-email] Error:', error);
    return NextResponse.json(
      { error: 'Failed to test welcome email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
