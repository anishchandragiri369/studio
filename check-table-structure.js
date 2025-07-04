/**
 * Script to check and fix the user_rewards table structure
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  }
});

async function checkTableStructure() {
  console.log('🔍 Checking user_rewards table structure...\n');

  try {
    // Check the current table structure
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'user_rewards')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (error) {
      console.error('❌ Error checking table structure:', error);
      return;
    }

    console.log('📋 Current user_rewards table structure:');
    console.table(columns);

    // Check if required columns exist
    const requiredColumns = [
      'id',
      'user_id', 
      'total_points',
      'total_earned',
      'referral_code',
      'referrals_count',
      'redeemed_points', // This is missing!
      'last_updated'
    ];

    const existingColumns = columns.map(col => col.column_name);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length > 0) {
      console.log('\n❌ Missing columns:', missingColumns);
      console.log('\n🔧 SQL to fix the table:');
      
      missingColumns.forEach(col => {
        let sqlCommand = '';
        switch (col) {
          case 'redeemed_points':
            sqlCommand = 'ALTER TABLE user_rewards ADD COLUMN redeemed_points INTEGER DEFAULT 0;';
            break;
          case 'available_points':
            sqlCommand = 'ALTER TABLE user_rewards ADD COLUMN available_points INTEGER GENERATED ALWAYS AS (total_points - redeemed_points) STORED;';
            break;
          default:
            sqlCommand = `-- Need to add column: ${col}`;
        }
        console.log(sqlCommand);
      });
    } else {
      console.log('\n✅ All required columns exist!');
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

async function fixTable() {
  console.log('\n🔧 Attempting to fix user_rewards table...\n');

  try {
    // Add the missing redeemed_points column
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE user_rewards ADD COLUMN IF NOT EXISTS redeemed_points INTEGER DEFAULT 0;'
    });

    if (addColumnError) {
      console.log('⚠️ Cannot use RPC to alter table. You need to run this SQL manually:');
      console.log('ALTER TABLE user_rewards ADD COLUMN IF NOT EXISTS redeemed_points INTEGER DEFAULT 0;');
      console.log('ALTER TABLE user_rewards ADD COLUMN IF NOT EXISTS available_points INTEGER GENERATED ALWAYS AS (total_points - redeemed_points) STORED;');
    } else {
      console.log('✅ Table structure fixed!');
    }

  } catch (error) {
    console.error('💥 Error fixing table:', error);
    console.log('\n📝 Manual SQL commands to run in Supabase SQL editor:');
    console.log('ALTER TABLE user_rewards ADD COLUMN IF NOT EXISTS redeemed_points INTEGER DEFAULT 0;');
    console.log('ALTER TABLE user_rewards ADD COLUMN IF NOT EXISTS available_points INTEGER GENERATED ALWAYS AS (total_points - redeemed_points) STORED;');
  }
}

async function main() {
  await checkTableStructure();
  
  const args = process.argv.slice(2);
  if (args[0] === 'fix') {
    await fixTable();
  } else {
    console.log('\n💡 To attempt automatic fix, run: node check-table-structure.js fix');
    console.log('🔧 Or manually run the SQL commands shown above in Supabase SQL editor');
  }
}

main().catch(console.error);
