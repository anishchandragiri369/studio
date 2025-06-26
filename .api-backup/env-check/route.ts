import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const envCheck = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasAdminEmail: !!process.env.ADMIN_EMAIL,
      hasCronSecret: !!process.env.CRON_SECRET,
      supabaseUrlPreview: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      // Don't expose sensitive data, just check if they exist
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      message: 'Environment check for admin functionality',
      environment: envCheck,
      status: 'success'
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Environment check failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
