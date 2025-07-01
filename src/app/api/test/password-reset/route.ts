import { NextRequest, NextResponse } from 'next/server';
import { AuthEmailService } from '@/lib/auth-email-service';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('[test-password-reset] Testing password reset for:', email);

    // Generate a test reset link
    const resetToken = 'test-token-' + Math.random().toString(36).substring(2, 15);
    const resetLink = AuthEmailService.generateResetLink(resetToken);

    console.log('[test-password-reset] Generated reset link:', resetLink);

    // Test sending the password reset email
    const emailSent = await AuthEmailService.sendPasswordResetEmail(email, resetLink);

    return NextResponse.json({
      success: emailSent,
      message: emailSent ? 'Password reset email sent successfully' : 'Failed to send password reset email',
      resetLink: resetLink,
      email: email,
      mock: process.env.EMAIL_MOCK_MODE === 'true'
    });

  } catch (error) {
    console.error('[test-password-reset] Error:', error);
    return NextResponse.json(
      {
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Password reset test endpoint',
    usage: 'POST with { "email": "test@example.com" }',
    mockMode: process.env.EMAIL_MOCK_MODE === 'true'
  });
}
