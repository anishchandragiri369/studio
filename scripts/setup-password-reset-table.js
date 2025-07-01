#!/usr/bin/env node

/**
 * Setup script for password reset tokens table
 * Run this with: node scripts/setup-password-reset-table.js
 */

const { createClient } = require('@supabase/supabase-js');

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

async function setupPasswordResetTable() {
  console.log('🔧 Setting up password reset tokens table...');

  try {
    // First, test if the table already exists
    console.log('🔍 Checking if table already exists...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('password_reset_tokens')
      .select('count(*)')
      .limit(1);

    if (!tableError) {
      console.log('✅ Table already exists and is accessible!');
      return;
    }

    console.log('📋 Table does not exist, attempting to create...');
    console.log('⚠️  Note: You may need to run the SQL script manually in your Supabase dashboard.');
    console.log('📄 SQL file location: sql/create_password_reset_tokens_table.sql');

    // Try to create a simple record to test (this will fail but give us info)
    const { data, error } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        token: 'test',
        expires_at: new Date().toISOString()
      });

    if (error) {
      console.log('❌ Table creation needed. Error:', error.message);
      console.log('\n📋 Manual Setup Instructions:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Run the SQL from: sql/create_password_reset_tokens_table.sql');
      console.log('4. Then run this script again to verify');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the setup
setupPasswordResetTable();
