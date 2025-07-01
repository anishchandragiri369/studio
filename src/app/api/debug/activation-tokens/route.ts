import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

console.log('[debug-activation-tokens] API route loaded');

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
    console.log('[debug-activation-tokens] Getting activation tokens');
    
    // Query activation tokens
    const { data: tokens, error } = await supabaseAdmin
      .from('user_activation_tokens')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('[debug-activation-tokens] Error querying tokens:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      tokens: tokens || [],
      count: tokens?.length || 0
    });
    
  } catch (error: any) {
    console.error('[debug-activation-tokens] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    
    console.log('[debug-activation-tokens] Looking up token:', token);
    
    // Query specific token
    const { data: tokenData, error } = await supabaseAdmin
      .from('user_activation_tokens')
      .select('*')
      .eq('token', token)
      .single();
    
    if (error) {
      console.error('[debug-activation-tokens] Error querying token:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      token: tokenData
    });
    
  } catch (error: any) {
    console.error('[debug-activation-tokens] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
