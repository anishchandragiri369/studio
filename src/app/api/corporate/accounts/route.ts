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

export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection not available' }, { status: 503 });
  }

  try {
    const {
      company_name,
      admin_user_id,
      employee_limit,
      monthly_budget,
      contact_email,
      contact_phone,
      address,
      tax_id,
      subscription_plan_id
    } = await request.json();

    // Validate required fields
    if (!company_name || !admin_user_id || !contact_email) {
      return NextResponse.json(
        { error: 'Company name, admin user ID, and contact email are required' },
        { status: 400 }
      );
    }

    // Check if admin user already has a corporate account
    const { data: existingAccount } = await supabase
      .from('corporate_accounts')
      .select('id')
      .eq('admin_user_id', admin_user_id)
      .eq('status', 'active')
      .single();

    if (existingAccount) {
      return NextResponse.json(
        { error: 'User already has an active corporate account' },
        { status: 400 }
      );
    }

    // Create corporate account
    const { data: corporateAccount, error } = await supabase
      .from('corporate_accounts')
      .insert({
        company_name,
        admin_user_id,
        employee_limit: employee_limit || 10,
        monthly_budget: monthly_budget || 5000,
        contact_email,
        contact_phone,
        address,
        tax_id,
        subscription_plan_id,
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating corporate account:', error);
      return NextResponse.json(
        { error: 'Failed to create corporate account' },
        { status: 500 }
      );
    }

    // Create notification for admin
    await supabase
      .from('subscription_notifications')
      .insert({
        user_id: admin_user_id,
        type: 'corporate_account_created',
        title: 'Corporate Account Created',
        message: `Your corporate account for ${company_name} has been created successfully.`,
        related_id: corporateAccount.id,
        related_type: 'corporate_account'
      });

    return NextResponse.json({
      success: true,
      corporate_account: corporateAccount,
      message: 'Corporate account created successfully'
    });

  } catch (error) {
    console.error('Error creating corporate account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection not available' }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const adminUserId = searchParams.get('admin_user_id');

    if (adminUserId) {
      // Get corporate account for specific admin
      const { data: corporateAccount, error } = await supabase
        .from('corporate_accounts')
        .select(`
          *,
          corporate_employees(
            *,
            corporate_subscriptions(*)
          )
        `)
        .eq('admin_user_id', adminUserId)
        .eq('status', 'active')
        .single();

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch corporate account' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        corporate_account: corporateAccount || null
      });
    }

    // Get all active corporate accounts
    const { data: corporateAccounts, error } = await supabase
      .from('corporate_accounts')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch corporate accounts' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      corporate_accounts: corporateAccounts || []
    });

  } catch (error) {
    console.error('Error fetching corporate accounts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const {
      account_id,
      status,
      employee_limit,
      monthly_budget,
      subsidy_percentage,
      allowed_plans,
      account_manager_id
    } = await request.json();

    if (!account_id) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Update corporate account
    const updateData: any = {};
    if (status) updateData.status = status;
    if (employee_limit) updateData.employee_limit = employee_limit;
    if (monthly_budget !== undefined) updateData.monthly_budget = monthly_budget;
    if (subsidy_percentage !== undefined) updateData.subsidy_percentage = subsidy_percentage;
    if (allowed_plans) updateData.allowed_plans = allowed_plans;
    if (account_manager_id) updateData.account_manager_id = account_manager_id;

    const { data: updatedAccount, error } = await supabase
      .from('corporate_accounts')
      .update(updateData)
      .eq('id', account_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating corporate account:', error);
      return NextResponse.json(
        { error: 'Failed to update corporate account' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      account: updatedAccount,
      message: 'Corporate account updated successfully'
    });

  } catch (error) {
    console.error('Error updating corporate account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
