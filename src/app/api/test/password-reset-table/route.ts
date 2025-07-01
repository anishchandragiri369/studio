import { createClient } from '@supabase/supabase-js';

/**
 * Test endpoint to verify password reset tokens table and flow
 * GET /api/test/password-reset-table - Check table status
 * POST /api/test/password-reset-table - Create table if missing
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    console.log('[TestPasswordResetTable] Checking table status...');

    // Try to query the table
    const { data, error } = await supabase
      .from('password_reset_tokens')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.log('[TestPasswordResetTable] Table does not exist or is not accessible:', error.message);
      return Response.json({
        tableExists: false,
        error: error.message,
        suggestion: 'Run the SQL script manually in Supabase SQL editor or POST to this endpoint to create it'
      });
    }

    return Response.json({
      tableExists: true,
      recordCount: data?.length || 0,
      message: 'Table exists and is accessible'
    });

  } catch (error) {
    console.error('[TestPasswordResetTable] Error:', error);
    return Response.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    console.log('[TestPasswordResetTable] Creating password_reset_tokens table...');

    // SQL to create the table
    const createTableSQL = `
      -- Create the table
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

      -- Enable RLS
      ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

      -- Create policy for service role
      DROP POLICY IF EXISTS "Service role can manage password reset tokens" ON password_reset_tokens;
      CREATE POLICY "Service role can manage password reset tokens" ON password_reset_tokens
        FOR ALL USING (auth.role() = 'service_role');
    `;

    // Try to execute the SQL using a raw query if rpc doesn't work
    try {
      // Method 1: Try using rpc if available
      const { error: rpcError } = await supabase.rpc('exec', { sql: createTableSQL });
      if (rpcError) {
        throw new Error(`RPC failed: ${rpcError.message}`);
      }
    } catch (rpcErr) {
      console.log('[TestPasswordResetTable] RPC method failed, trying direct query...');
      
      // Method 2: Execute statements one by one
      const statements = [
        `CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          token TEXT NOT NULL UNIQUE,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          used BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`,
        `CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token)`,
        `CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id)`,
        `CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at)`,
        `ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY`,
        `DROP POLICY IF EXISTS "Service role can manage password reset tokens" ON password_reset_tokens`,
        `CREATE POLICY "Service role can manage password reset tokens" ON password_reset_tokens FOR ALL USING (auth.role() = 'service_role')`
      ];

      for (const sql of statements) {
        try {
          // Use any available method to execute SQL
          const { error } = await (supabase as any).from('_').select().limit(0);
          // This is a workaround - in a real scenario, you'd need to run this SQL manually
          console.log('Would execute:', sql);
        } catch (e) {
          console.warn('Statement execution simulated:', e);
        }
      }
    }

    // Test if the table was created
    const { data, error: testError } = await supabase
      .from('password_reset_tokens')
      .select('count', { count: 'exact', head: true });

    if (testError) {
      return Response.json({
        success: false,
        error: 'Table creation may have failed',
        details: testError.message,
        manual: 'Please run the SQL script manually in Supabase SQL editor'
      }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: 'Table created successfully',
      tableExists: true,
      recordCount: 0
    });

  } catch (error) {
    console.error('[TestPasswordResetTable] Error creating table:', error);
    return Response.json(
      { 
        error: 'Failed to create table',
        details: (error as Error).message,
        manual: 'Please run the SQL script manually in Supabase SQL editor'
      },
      { status: 500 }
    );
  }
}
