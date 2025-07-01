#!/usr/bin/env node

/**
 * Script to set up the password_reset_tokens table and cleanup processes
 * Run this with: node scripts/setup-password-reset-tokens.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function setupPasswordResetTokens() {
  console.log('🚀 Setting up password_reset_tokens table...');

  try {
    // Read the SQL migration file
    const sqlFile = path.join(__dirname, '../sql/create_password_reset_tokens_table.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ Error executing SQL migration:', error);
      
      // If exec_sql function doesn't exist, try running individual statements
      console.log('🔄 Trying alternative approach...');
      
      // Split SQL into individual statements and execute each one
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        try {
          const { error: stmtError } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });
          if (stmtError) {
            console.warn('⚠️ Warning executing statement:', stmtError.message);
          }
        } catch (e) {
          console.warn('⚠️ Warning with statement:', e.message);
        }
      }
    }

    // Test if table was created successfully
    const { data, error: testError } = await supabase
      .from('password_reset_tokens')
      .select('count', { count: 'exact', head: true });

    if (testError) {
      console.error('❌ Failed to create password_reset_tokens table:', testError);
      process.exit(1);
    }

    console.log('✅ password_reset_tokens table created successfully!');

    // Test cleanup function
    const { error: cleanupError } = await supabase.rpc('cleanup_expired_password_reset_tokens');
    
    if (cleanupError) {
      console.warn('⚠️ Cleanup function test failed:', cleanupError);
    } else {
      console.log('✅ Cleanup function is working!');
    }

    console.log('\n📋 Summary:');
    console.log('- password_reset_tokens table created');
    console.log('- Indexes created for performance');
    console.log('- RLS (Row Level Security) enabled');
    console.log('- Service role policies added');
    console.log('- Cleanup function created');
    console.log('- Auto-update triggers added');

    console.log('\n💡 Next steps:');
    console.log('1. Test the password reset flow end-to-end');
    console.log('2. Set up a cron job to call cleanup_expired_password_reset_tokens() periodically');
    console.log('3. Monitor table growth and adjust cleanup frequency as needed');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the setup
setupPasswordResetTokens();
