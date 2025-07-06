import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role - only at runtime
let supabase: any = null;

function getSupabase() {
  if (!supabase && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return supabase;
}

export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection not available' }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const subscriptionType = searchParams.get('subscription_type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('delivery_schedule_audit')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (subscriptionType) {
      query = query.eq('subscription_type', subscriptionType);
    }

    const { data: auditLogs, error } = await query;

    if (error) {
      console.error('Error fetching audit logs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch audit logs' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('delivery_schedule_audit')
      .select('*', { count: 'exact', head: true });

    if (subscriptionType) {
      countQuery = countQuery.eq('subscription_type', subscriptionType);
    }

    const { count } = await countQuery;

    return NextResponse.json({
      audit_logs: auditLogs || [],
      pagination: {
        limit,
        offset,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
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
