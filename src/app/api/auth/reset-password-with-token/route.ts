import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[reset-password-with-token] Missing Supabase configuration');
}

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

export async function POST(request: NextRequest) {
  try {
    console.log('[reset-password-with-token] API route called');
    
    let token, newPassword;
    try {
      const body = await request.json();
      token = body.token;
      newPassword = body.newPassword;
      console.log('[reset-password-with-token] Parsed request:', { 
        hasToken: !!token, 
        hasPassword: !!newPassword,
        tokenLength: token?.length || 0
      });
    } catch (jsonError) {
      console.error('[reset-password-with-token] JSON parsing error:', jsonError);
      return NextResponse.json({ 
        error: 'Invalid JSON in request body',
        details: jsonError instanceof Error ? jsonError.message : 'Unknown JSON error'
      }, { status: 400 });
    }

    if (!token || !newPassword) {
      return NextResponse.json({ 
        error: 'Token and new password are required' 
      }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ 
        error: 'Database service not available' 
      }, { status: 500 });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return NextResponse.json({ 
        error: 'Password must be at least 6 characters long' 
      }, { status: 400 });
    }

    // Try to find and validate the reset token
    try {
      const { data: tokenData, error: tokenError } = await supabase
        .from('password_reset_tokens')
        .select('*')
        .eq('token', token)
        .eq('used', false)
        .single();

      if (tokenError || !tokenData) {
        console.log('[reset-password-with-token] Invalid or expired token');
        return NextResponse.json({ 
          error: 'Invalid or expired reset token' 
        }, { status: 400 });
      }

      // Check if token has expired
      const now = new Date();
      const expiresAt = new Date(tokenData.expires_at);
      
      if (now > expiresAt) {
        console.log('[reset-password-with-token] Token has expired');
        return NextResponse.json({ 
          error: 'Reset token has expired. Please request a new password reset.' 
        }, { status: 400 });
      }

      // Update the user's password using Supabase Admin API
      const { error: updateError } = await supabase.auth.admin.updateUserById(tokenData.user_id, {
        password: newPassword
      });

      if (updateError) {
        console.error('[reset-password-with-token] Error updating password:', updateError);
        return NextResponse.json({ 
          error: 'Failed to update password' 
        }, { status: 500 });
      }

      // Mark token as used after successful password update
      await supabase
        .from('password_reset_tokens')
        .update({ used: true })
        .eq('token', token);

      console.log('[reset-password-with-token] Password updated successfully for user:', tokenData.user_id);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Password has been reset successfully' 
      });

    } catch (dbError) {
      // If the table doesn't exist or there's an error, we can't validate custom tokens
      console.error('[reset-password-with-token] Token validation failed:', dbError);
      
      return NextResponse.json({ 
        error: 'Invalid reset token. Please use the reset link from your email or request a new one.' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('[reset-password-with-token] API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
