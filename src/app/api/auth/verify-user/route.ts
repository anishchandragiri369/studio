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
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('[verify-user] Checking if user exists:', email);

    try {
      // Alternative approach: Try to query the auth.users table directly
      const { data: users, error: queryError } = await supabaseAdmin
        .from('auth.users')
        .select('id, email')
        .eq('email', email)
        .limit(1);

      if (queryError) {
        console.log('[verify-user] Direct query failed, trying admin list method:', queryError.message);
        
        // Fallback: Use admin client to list users and find by email  
        const { data: adminData, error: adminError } = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 1000 // Adjust based on your user count needs
        });

        if (adminError) {
          console.log('[verify-user] Admin list also failed:', adminError.message);
          return NextResponse.json({ 
            exists: false, 
            message: 'User verification completed',
            securityNote: 'Always returns success for security compliance'
          });
        }

        // Check if user with this email exists in the admin list
        const userExists = adminData.users.some(user => user.email === email);
        
        if (!userExists) {
          console.log('[verify-user] User not found in admin list:', email);
          return NextResponse.json({ 
            exists: false, 
            message: 'User verification completed',
            securityNote: 'Always returns success for security compliance'
          });
        }
      } else {
        // Direct query worked
        if (!users || users.length === 0) {
          console.log('[verify-user] User not found via direct query:', email);
          return NextResponse.json({ 
            exists: false, 
            message: 'User verification completed',
            securityNote: 'Always returns success for security compliance'
          });
        }
      }
    } catch (queryError) {
      console.log('[verify-user] Query error:', queryError);
      return NextResponse.json({ 
        exists: false, 
        message: 'User verification completed',
        securityNote: 'Always returns success for security compliance'
      });
    }

    console.log('[verify-user] User found:', email);
    return NextResponse.json({ 
      exists: true, 
      message: 'User verification completed' 
    });

  } catch (error) {
    console.error('[verify-user] Error:', error);
    // For security, return success even on errors
    return NextResponse.json({ 
      exists: false, 
      message: 'User verification completed',
      securityNote: 'Always returns success for security compliance'
    });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'User verification endpoint',
    usage: 'POST with { "email": "user@example.com" }',
    note: 'Always returns success for security compliance'
  });
}
