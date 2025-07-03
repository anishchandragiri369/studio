import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptionAnalytics, calculateRevenueTrends, getAcquisitionMetrics, analyzeChurnPatterns } from '@/lib/analytics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const granularity = searchParams.get('granularity') as 'daily' | 'weekly' | 'monthly' || 'daily';
    const metric = searchParams.get('metric'); // 'revenue', 'acquisition', 'churn', or 'all'

    // Default to last 30 days if no dates provided
    const defaultStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const defaultEnd = new Date().toISOString().split('T')[0];
    
    const start = startDate || defaultStart;
    const end = endDate || defaultEnd;

    let analyticsData;

    switch (metric) {
      case 'revenue':
        analyticsData = {
          revenue_trends: await calculateRevenueTrends(start, end, granularity)
        };
        break;
      
      case 'acquisition':
        analyticsData = {
          customer_acquisition: await getAcquisitionMetrics(start, end, granularity)
        };
        break;
      
      case 'churn':
        analyticsData = {
          churn_analysis: await analyzeChurnPatterns(start, end, granularity)
        };
        break;
      
      default:
        // Return comprehensive analytics
        analyticsData = await getSubscriptionAnalytics({ start, end });
        break;
    }

    return NextResponse.json({
      success: true,
      data: analyticsData,
      meta: {
        start_date: start,
        end_date: end,
        granularity,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching subscription analytics:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch subscription analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      startDate, 
      endDate, 
      granularity = 'daily',
      metrics = ['revenue', 'acquisition', 'churn'] 
    } = body;

    const analyticsPromises = [];

    if (metrics.includes('revenue')) {
      analyticsPromises.push(
        calculateRevenueTrends(startDate, endDate, granularity)
          .then(data => ({ type: 'revenue', data }))
      );
    }

    if (metrics.includes('acquisition')) {
      analyticsPromises.push(
        getAcquisitionMetrics(startDate, endDate, granularity)
          .then(data => ({ type: 'acquisition', data }))
      );
    }

    if (metrics.includes('churn')) {
      analyticsPromises.push(
        analyzeChurnPatterns(startDate, endDate, granularity)
          .then(data => ({ type: 'churn', data }))
      );
    }

    const results = await Promise.all(analyticsPromises);
    
    const analyticsData = results.reduce((acc, result) => {
      acc[result.type] = result.data;
      return acc;
    }, {} as any);

    return NextResponse.json({
      success: true,
      data: analyticsData,
      meta: {
        start_date: startDate,
        end_date: endDate,
        granularity,
        metrics_requested: metrics,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generating custom analytics:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate custom analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
