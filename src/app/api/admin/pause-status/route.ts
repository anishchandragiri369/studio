import { NextRequest, NextResponse } from 'next/server';
import { getAdminPauseInfo } from '@/lib/adminPauseHelper';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;

    const pauseInfo = await getAdminPauseInfo(userId);

    return NextResponse.json({
      success: true,
      data: pauseInfo
    });

  } catch (error) {
    console.error('Error checking admin pause status:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
