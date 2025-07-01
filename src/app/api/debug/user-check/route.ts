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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
    }
    
    console.log('[debug-user-check] Checking user:', email);
    
    // Test listUsers method
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });
    
    if (listError) {
      return NextResponse.json({
        success: false,
        error: listError.message,
        method: 'listUsers'
      });
    }
    
    const existingUser = users?.users?.find(user => user.email === email);
    
    return NextResponse.json({
      success: true,
      email,
      exists: !!existingUser,
      totalUsers: users?.users?.length || 0,
      user: existingUser ? {
        id: existingUser.id,
        email: existingUser.email,
        created_at: existingUser.created_at
      } : null
    });
    
  } catch (error: any) {
    console.error('[debug-user-check] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
