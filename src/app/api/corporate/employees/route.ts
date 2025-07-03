import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const {
      corporate_account_id,
      user_id,
      employee_id,
      department,
      position,
      monthly_allowance
    } = await request.json();

    // Validate required fields
    if (!corporate_account_id || !user_id) {
      return NextResponse.json(
        { error: 'Corporate account ID and user ID are required' },
        { status: 400 }
      );
    }

    // Check if corporate account exists and is active
    const { data: corporateAccount, error: accountError } = await supabase
      .from('corporate_accounts')
      .select('*')
      .eq('id', corporate_account_id)
      .eq('status', 'active')
      .single();

    if (accountError || !corporateAccount) {
      return NextResponse.json(
        { error: 'Corporate account not found or not active' },
        { status: 404 }
      );
    }

    // Check if employee limit is reached
    const { data: existingEmployees } = await supabase
      .from('corporate_employees')
      .select('id')
      .eq('corporate_account_id', corporate_account_id)
      .eq('is_active', true);

    if (existingEmployees && existingEmployees.length >= corporateAccount.employee_limit) {
      return NextResponse.json(
        { error: 'Employee limit reached for this corporate account' },
        { status: 400 }
      );
    }

    // Check if user is already enrolled
    const { data: existingEmployee } = await supabase
      .from('corporate_employees')
      .select('id')
      .eq('corporate_account_id', corporate_account_id)
      .eq('user_id', user_id)
      .single();

    if (existingEmployee) {
      return NextResponse.json(
        { error: 'User is already enrolled in this corporate program' },
        { status: 400 }
      );
    }

    // Create employee record
    const { data: employee, error: employeeError } = await supabase
      .from('corporate_employees')
      .insert({
        corporate_account_id,
        user_id,
        employee_id,
        department,
        position,
        monthly_allowance: monthly_allowance || corporateAccount.monthly_budget || 2000
      })
      .select()
      .single();

    if (employeeError) {
      console.error('Error enrolling employee:', employeeError);
      return NextResponse.json(
        { error: 'Failed to enroll employee' },
        { status: 500 }
      );
    }

    // Create notification for employee
    await supabase
      .from('subscription_notifications')
      .insert({
        user_id,
        type: 'corporate_enrolled',
        title: 'Welcome to Corporate Wellness',
        message: `You have been enrolled in ${corporateAccount.company_name}'s wellness program.`,
        related_id: employee.id,
        related_type: 'corporate_employee'
      });

    return NextResponse.json({
      success: true,
      employee,
      message: 'Employee enrolled successfully'
    });

  } catch (error) {
    console.error('Error enrolling employee:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const corporateAccountId = searchParams.get('corporate_account_id');
    const userId = searchParams.get('user_id');

    if (userId) {
      // Get employee details for a specific user
      const { data: employee, error } = await supabase
        .from('corporate_employees')
        .select(`
          *,
          corporate_accounts(*),
          corporate_subscriptions(
            *,
            user_subscriptions(*)
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      return NextResponse.json({
        employee: employee || null
      });
    }

    if (corporateAccountId) {
      // Get all employees for a corporate account
      const { data: employees, error } = await supabase
        .from('corporate_employees')
        .select(`
          *,
          corporate_subscriptions(
            *,
            user_subscriptions(*)
          )
        `)
        .eq('corporate_account_id', corporateAccountId)
        .order('enrollment_date', { ascending: false });

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch employees' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        employees: employees || []
      });
    }

    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const {
      employee_id,
      monthly_allowance,
      department,
      position,
      is_active
    } = await request.json();

    if (!employee_id) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    // Update employee record
    const updateData: any = {};
    if (monthly_allowance !== undefined) updateData.monthly_allowance = monthly_allowance;
    if (department) updateData.department = department;
    if (position) updateData.position = position;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: updatedEmployee, error } = await supabase
      .from('corporate_employees')
      .update(updateData)
      .eq('id', employee_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating employee:', error);
      return NextResponse.json(
        { error: 'Failed to update employee' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      employee: updatedEmployee,
      message: 'Employee updated successfully'
    });

  } catch (error) {
    console.error('Error updating employee:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
