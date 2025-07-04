import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subscription_type = searchParams.get('subscription_type');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get delivery schedule audit history directly from table
    let query = supabase
      .from('delivery_schedule_audit')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (subscription_type) {
      query = query.eq('subscription_type', subscription_type);
    }

    const { data: auditHistory, error: auditError } = await query;

    if (auditError) {
      console.error('Error fetching delivery schedule audit history:', auditError);
      return NextResponse.json(
        { error: 'Failed to fetch audit history' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      audit_history: auditHistory || [],
      filters: {
        subscription_type: subscription_type,
        limit: limit
      }
    });

  } catch (error) {
    console.error('Error in delivery schedule audit API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
