import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const config = {
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      requestUrl: request.url,
      requestHeaders: Object.fromEntries(request.headers.entries()),
      expectedRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/success?provider=google&new_user=false`
    };

    return NextResponse.json(config, { status: 200 });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to get config',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
