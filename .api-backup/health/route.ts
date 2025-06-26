import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // You can add more health checks here if needed
    // For example: database connection, external services, etc.
    
    return NextResponse.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Elixr API',
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
