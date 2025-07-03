import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const {
      company_name,
      company_email,
      contact_person,
      contact_phone,
      billing_address,
      tax_id,
      employee_limit,
      monthly_budget,
      subsidy_percentage,
      allowed_plans
    } = await request.json();

    // Validate required fields
    if (!company_name || !company_email || !contact_person || !billing_address) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if company email already exists
    const { data: existingAccount } = await supabase
      .from('corporate_accounts')
      .select('id')
      .eq('company_email', company_email)
      .single();

    if (existingAccount) {
      return NextResponse.json(
        { error: 'Corporate account with this email already exists' },
        { status: 400 }
      );
    }

    // Create corporate account
    const { data: corporateAccount, error } = await supabase
      .from('corporate_accounts')
      .insert({
        company_name,
        company_email,
        contact_person,
        contact_phone,
        billing_address,
        tax_id,
        employee_limit: employee_limit || 50,
        monthly_budget,
        subsidy_percentage: subsidy_percentage || 100,
        allowed_plans,
        status: 'pending' // Admin approval required
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

    // TODO: Send email notification to admin for approval
    // You can integrate with your email service here

    return NextResponse.json({
      success: true,
      corporate_account: corporateAccount,
      message: 'Corporate account created successfully. Pending admin approval.'
    });

  } catch (error) {
    console.error('Error in corporate account creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account_id');
    const userEmail = searchParams.get('user_email');
    const status = searchParams.get('status');

    if (accountId) {
      // Get specific corporate account with employees
      const { data: account, error } = await supabase
        .from('corporate_accounts')
        .select(`
          *,
          corporate_employees(
            *,
            corporate_subscriptions(*)
          )
        `)
        .eq('id', accountId)
        .single();

      if (error || !account) {
        return NextResponse.json(
          { error: 'Corporate account not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ account });
    }

    if (userEmail) {
      // Check if user is enrolled in any corporate program
      const { data: employee, error } = await supabase
        .from('corporate_employees')
        .select(`
          *,
          corporate_accounts(*),
          corporate_subscriptions(*)
        `)
        .eq('user_id', userEmail) // Assuming user_id can be email for lookup
        .eq('is_active', true)
        .single();

      return NextResponse.json({
        employee: employee || null,
        enrolled: !!employee
      });
    }

    // Get all corporate accounts (admin view)
    let query = supabase
      .from('corporate_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: accounts, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch corporate accounts' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      accounts: accounts || []
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
