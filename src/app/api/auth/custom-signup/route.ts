import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AuthEmailService } from '@/lib/auth-email-service';

console.log('[custom-signup] API route loaded');

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
    const { email, password, name } = await request.json();
    
    console.log('[custom-signup] Creating user with custom signup flow:', email);
    
    // Log incoming payload for debugging
    console.log('[custom-signup] Incoming payload:', { email, password, name });

    // Validate payload
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email and password are required',
        code: 'INVALID_PAYLOAD'
      }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format',
        code: 'INVALID_EMAIL'
      }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({
        success: false,
        error: 'Password must be at least 6 characters long',
        code: 'INVALID_PASSWORD'
      }, { status: 400 });
    }
    
    // Check if user already exists and is confirmed
    try {
      console.log('[custom-signup] Checking if user exists and is confirmed:', email);
      
      // Use listUsers to check for existing email
      const { data: existingUsers, error: checkError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000 // This should be enough for most apps
      });
      
      if (checkError) {
        console.warn('[custom-signup] Error checking existing users:', checkError);
      } else if (existingUsers && existingUsers.users) {
        const existingUser = existingUsers.users.find(user => user.email === email);
        if (existingUser) {
          console.log('[custom-signup] Found existing user:', { 
            email, 
            confirmed: !!existingUser.email_confirmed_at,
            confirmTime: existingUser.email_confirmed_at 
          });
          
          // Only prevent signup if the user is already confirmed
          if (existingUser.email_confirmed_at) {
            console.log('[custom-signup] User is already confirmed and registered:', email);
            return NextResponse.json({
              success: false,
              error: 'User already registered with this email address',
              code: 'USER_ALREADY_EXISTS'
            }, { status: 400 });
          } else {
            // User exists but not confirmed - delete the old record and allow new signup
            console.log('[custom-signup] User exists but not confirmed, deleting old record:', email);
            try {
              await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
              console.log('[custom-signup] Deleted unconfirmed user:', existingUser.id);
            } catch (deleteError) {
              console.warn('[custom-signup] Failed to delete unconfirmed user:', deleteError);
              // Continue anyway - the new signup might still work
            }
          }
        }
      }
    } catch (checkError) {
      console.warn('[custom-signup] Could not check existing user:', checkError);
      // Continue with signup if check fails
    }
    
    // Create user using admin API to have full control over email sending
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Don't auto-confirm - we'll handle this with our custom flow
      user_metadata: {
        custom_auth: true,
        name: name || email.split('@')[0]
      }
    });
    
    if (error) {
      console.error('[custom-signup] Error creating user:', error);
      
      // Handle specific Supabase errors
      if (error.message && (
        error.message.toLowerCase().includes('already') ||
        error.message.toLowerCase().includes('registered') ||
        error.message.toLowerCase().includes('exists') ||
        error.message.toLowerCase().includes('duplicate') ||
        error.message.toLowerCase().includes('taken')
      )) {
        return NextResponse.json({
          success: false,
          error: 'User already registered with this email address',
          code: 'USER_ALREADY_EXISTS'
        }, { status: 400 });
      }
      
      return NextResponse.json({
        success: false,
        error: error.message || 'Failed to create user account',
        code: error.status || 'USER_CREATION_ERROR'
      }, { status: 400 });
    }
    
    if (!data.user) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create user',
        code: 'USER_CREATION_FAILED'
      }, { status: 500 });
    }
    
    console.log('[custom-signup] User created successfully:', data.user.id);
    
    // Send activation email
    try {
      console.log('[custom-signup] Sending activation email');
      
      // Use the AuthEmailService static method
      const emailSent = await AuthEmailService.sendActivationEmail(
        data.user.email!,
        data.user.id,
        name || email.split('@')[0]
      );
      
      if (emailSent) {
        console.log('[custom-signup] Activation email sent successfully');
      } else {
        console.warn('[custom-signup] Failed to send activation email');
      }
    } catch (emailError) {
      console.warn('[custom-signup] Failed to send activation email:', emailError);
      // Don't fail the signup if email fails
    }
    
    return NextResponse.json({
      success: true,
      message: 'User created successfully. Please check your email for activation instructions.',
      user: {
        id: data.user.id,
        email: data.user.email,
        email_confirmed_at: data.user.email_confirmed_at
      }
    });
    
  } catch (error: any) {
    console.error('[custom-signup] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Custom signup endpoint',
    usage: 'POST with { email, password, name? } to create user with custom activation flow'
  });
}
