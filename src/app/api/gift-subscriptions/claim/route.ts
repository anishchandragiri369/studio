import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Gift subscription feature is temporarily disabled' },
    { status: 503 }
  );
}
