import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  console.log('[test-daily-report] Manual test trigger received');

  try {
    // Get the base URL for the API call
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://develixr.netlify.app';
    const apiUrl = `${baseUrl}/api/daily-subscription-report`;
    
    // Make request to the daily report API
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET || 'your-secret-token'}`
      }
    });

    const result = await response.json() as any;

    return NextResponse.json({
      success: true,
      message: 'Manual test completed',
      reportResult: result
    });

  } catch (error: any) {
    console.error('[test-daily-report] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Test failed',
        error: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Daily subscription report test endpoint',
    usage: 'Send POST request to trigger a test report',
    schedule: 'Automatically runs daily at 6 PM',
    features: [
      'Excel file generation with all subscription data',
      'Customer information and addresses',
      'Selected juices for each subscription',
      'Delivery schedules and status',
      'Revenue summary',
      'Email delivery to admin'
    ]
  });
}
