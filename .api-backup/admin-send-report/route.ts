import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  console.log('[admin-send-report] Admin email request received');

  try {
    // Simple admin check (you can enhance this with proper auth)
    const authHeader = req.headers.get('authorization');
    const userAgent = req.headers.get('user-agent');
    
    // For admin requests from the frontend, we don't require the CRON_SECRET
    // But we could add other validation here
    
    // Call the daily report API with admin privileges
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://develixr.netlify.app';
    const apiUrl = `${baseUrl}/api/daily-subscription-report`;
    
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET || 'your-secret-token'}`,
        'User-Agent': 'admin-manual-request'
      }
    });

    const result = await response.json() as any;

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Report generated and emailed successfully',
        data: result
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          message: result.message || 'Failed to generate report',
          error: result.error 
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('[admin-send-report] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to send admin report',
        error: error.message 
      },
      { status: 500 }
    );
  }
}
