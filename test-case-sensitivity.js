const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function testCaseSensitivity() {
  console.log('🔍 Testing Case Sensitivity...\n');

  try {
    const testCode = 'ELIXR8967ff';
    
    console.log('1. Testing exact match:', testCode);
    const { data: exact, error: exactError } = await adminClient
      .from('user_rewards')
      .select('user_id, referral_code')
      .eq('referral_code', testCode)
      .single();
    console.log('Exact match result:', { exact, exactError });

    console.log('\n2. Testing uppercase:', testCode.toUpperCase());
    const { data: upper, error: upperError } = await adminClient
      .from('user_rewards')
      .select('user_id, referral_code')
      .eq('referral_code', testCode.toUpperCase())
      .single();
    console.log('Uppercase result:', { upper, upperError });

    console.log('\n3. Testing ilike (case insensitive):', testCode);
    const { data: ilike, error: ilikeError } = await adminClient
      .from('user_rewards')
      .select('user_id, referral_code')
      .ilike('referral_code', testCode)
      .single();
    console.log('Case insensitive result:', { ilike, ilikeError });

  } catch (error) {
    console.error('Error:', error);
  }
}

testCaseSensitivity();
