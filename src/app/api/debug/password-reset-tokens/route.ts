import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

/**
 * Debug endpoint for password reset tokens
 * GET /api/debug/password-reset-tokens - List all tokens
 * POST /api/debug/password-reset-tokens - Create a test token
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    console.log('[DebugPasswordResetTokens] Fetching all tokens...');

    // Get all tokens (for debugging)
    const { data: tokens, error } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('[DebugPasswordResetTokens] Error fetching tokens:', error);
      return Response.json({
        error: 'Failed to fetch tokens',
        details: error.message
      }, { status: 500 });
    }

    return Response.json({
      tokens: tokens.map(token => ({
        id: token.id,
        user_id: token.user_id,
        token: token.token.substring(0, 10) + '...',
        expires_at: token.expires_at,
        used: token.used,
        created_at: token.created_at
      })),
      count: tokens.length
    });

  } catch (error) {
    console.error('[DebugPasswordResetTokens] Error:', error);
    return Response.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('[DebugPasswordResetTokens] Creating test token...');

    const { email } = await request.json();

    if (!email) {
      return Response.json({
        error: 'Email is required'
      }, { status: 400 });
    }

    // Find user by email
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      return Response.json({
        error: 'Failed to fetch users',
        details: userError.message
      }, { status: 500 });
    }

    const user = users.users.find(u => u.email === email);
    if (!user) {
      return Response.json({
        error: 'User not found',
        email
      }, { status: 404 });
    }

    // Generate test token
    const testToken = 'test-' + crypto.randomUUID() + '-' + Date.now();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Insert token into database
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token: testToken,
        expires_at: expiresAt.toISOString(),
        used: false
      })
      .select()
      .single();

    if (tokenError) {
      return Response.json({
        error: 'Failed to create token',
        details: tokenError.message
      }, { status: 500 });
    }

    // Generate reset link
    const resetLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9002'}/reset-password?token=${testToken}`;

    return Response.json({
      success: true,
      message: 'Test token created',
      token: testToken,
      resetLink,
      user: {
        id: user.id,
        email: user.email
      },
      expiresAt: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('[DebugPasswordResetTokens] Error creating token:', error);
    return Response.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
