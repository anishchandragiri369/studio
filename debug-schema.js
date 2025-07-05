require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('🔍 Checking referral_rewards table schema...');
  
  try {
    // Get a sample record to understand the structure
    const { data: sample } = await supabaseAdmin
      .from('referral_rewards')
      .select('*')
      .limit(1);
    
    console.log('Sample record:', sample);
    
    // Try to describe the table structure by querying PostgreSQL information schema
    const { data: schema } = await supabaseAdmin
      .rpc('execute_sql', { 
        sql: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'referral_rewards' 
          ORDER BY ordinal_position;
        `
      });
    
    console.log('Table schema:', schema);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkSchema();
