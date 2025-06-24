import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Simple test endpoint to verify admin download functionality
    const testData = {
      status: 'success',
      message: 'Admin download API is working',
      timestamp: new Date().toISOString(),
      endpoints: {
        download: '/api/admin-download-report',
        email: '/api/admin-send-report',
        test: '/api/test-daily-report'
      }
    };

    return NextResponse.json(testData);
  } catch (error) {
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
