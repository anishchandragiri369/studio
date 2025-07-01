import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin API to reset password directly (for Supabase recovery tokens that can't be exchanged)
const supabase = createClient(
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
    console.log('[reset-password-admin] API route called');
    
    const { email, newPassword, token } = await request.json();

    if (!email || !newPassword) {
      return NextResponse.json({ 
        error: 'Email and new password are required' 
      }, { status: 400 });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return NextResponse.json({ 
        error: 'Password must be at least 6 characters long' 
      }, { status: 400 });
    }

    console.log('[reset-password-admin] Attempting to reset password for:', email);

    // Find user by email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('[reset-password-admin] Error listing users:', listError);
      return NextResponse.json({ 
        error: 'Failed to find user account' 
      }, { status: 500 });
    }

    const user = users.users.find(u => u.email === email);
    if (!user) {
      console.log('[reset-password-admin] User not found:', email);
      return NextResponse.json({ 
        error: 'User account not found' 
      }, { status: 404 });
    }

    // Update password using admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword
    });

    if (updateError) {
      console.error('[reset-password-admin] Error updating password:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update password' 
      }, { status: 500 });
    }

    console.log('[reset-password-admin] Password updated successfully for user:', user.id);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Password has been reset successfully' 
    });

  } catch (error) {
    console.error('[reset-password-admin] API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
