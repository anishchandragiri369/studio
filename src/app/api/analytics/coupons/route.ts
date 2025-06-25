import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Required for static export
export const dynamic = 'force-static';
export const revalidate = false;

export async function GET(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { success: false, message: 'Database connection not available.' },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get coupon usage analytics
    const { data: couponUsage, error: couponError } = await supabase
      .from('coupon_usage')
      .select(`
        coupon_code,
        discount_amount,
        used_at,
        orders!inner(total_amount, status)
      `)
      .gte('used_at', startDate.toISOString())
      .eq('orders.status', 'completed');

    if (couponError) {
      console.error('Error fetching coupon analytics:', couponError);
      return NextResponse.json(
        { success: false, message: 'Unable to fetch coupon analytics.' },
        { status: 500 }
      );
    }

    // Process coupon data
    const couponAnalytics = couponUsage?.reduce((acc: any, usage: any) => {
      const code = usage.coupon_code;
      if (!acc[code]) {
        acc[code] = {
          couponCode: code,
          usageCount: 0,
          totalDiscount: 0,
          revenue: 0,
          conversionRate: 0
        };
      }
      
      acc[code].usageCount += 1;
      acc[code].totalDiscount += usage.discount_amount;
      acc[code].revenue += usage.orders.total_amount;
      
      return acc;
    }, {});

    // Convert to array and calculate conversion rates
    const couponData = Object.values(couponAnalytics || {}).map((coupon: any) => ({
      ...coupon,
      conversionRate: coupon.usageCount > 0 ? (coupon.usageCount / coupon.usageCount * 100) : 0 // Simplified for demo
    }));

    return NextResponse.json({
      success: true,
      data: couponData
    });

  } catch (error) {
    console.error('Error in coupon analytics API:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}
