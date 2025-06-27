import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    const testResults = {
      timestamp: new Date().toISOString(),
      supabaseConfigured: isSupabaseConfigured,
      tests: {} as any
    };

    // Test 1: Basic Supabase configuration
    if (!isSupabaseConfigured) {
      testResults.tests.supabaseConfig = {
        status: 'FAILED',
        message: 'Supabase client not configured',
        details: 'Check environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
      };
      return NextResponse.json(testResults, { status: 500 });
    }

    testResults.tests.supabaseConfig = {
      status: 'PASSED',
      message: 'Supabase client configured'
    };

    // Test 2: Basic Supabase connection
    try {
      const { data: connectionTest, error: connectionError } = await supabase!
        .from('admins')
        .select('count', { count: 'exact', head: true });
      
      if (connectionError) {
        testResults.tests.supabaseConnection = {
          status: 'FAILED',
          message: 'Failed to connect to Supabase',
          error: connectionError.message,
          errorCode: connectionError.code,
          errorDetails: connectionError.details,
          errorHint: connectionError.hint
        };
      } else {
        testResults.tests.supabaseConnection = {
          status: 'PASSED',
          message: 'Successfully connected to Supabase',
          adminCount: connectionTest?.length || 0
        };
      }
    } catch (error) {
      testResults.tests.supabaseConnection = {
        status: 'FAILED',
        message: 'Exception during Supabase connection test',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test 3: Admins table access
    try {
      const { data: adminsData, error: adminsError } = await supabase!
        .from('admins')
        .select('*')
        .limit(1);
      
      if (adminsError) {
        testResults.tests.adminsTableAccess = {
          status: 'FAILED',
          message: 'Failed to access admins table',
          error: adminsError.message,
          errorCode: adminsError.code,
          errorDetails: adminsError.details,
          errorHint: adminsError.hint,
          possibleCause: 'RLS policy might be blocking access'
        };
      } else {
        testResults.tests.adminsTableAccess = {
          status: 'PASSED',
          message: 'Successfully accessed admins table',
          adminCount: adminsData?.length || 0,
          hasAdmins: (adminsData?.length || 0) > 0
        };
      }
    } catch (error) {
      testResults.tests.adminsTableAccess = {
        status: 'FAILED',
        message: 'Exception during admins table access test',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test 4: Environment variables check
    testResults.tests.environmentVariables = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    };

    // Determine overall status
    const failedTests = Object.values(testResults.tests).filter((test: any) => 
      test.status === 'FAILED'
    );
    
    if (failedTests.length > 0) {
      return NextResponse.json(testResults, { status: 500 });
    } else {
      testResults.tests.overall = {
        status: 'PASSED',
        message: 'All admin tests passed successfully'
      };
      return NextResponse.json(testResults);
    }

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Test suite failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
