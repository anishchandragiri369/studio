const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function checkReferralCodes() {
  console.log('🔍 Checking Referral Codes in Database...\n');

  try {
    // Get all referral codes
    const { data: codes, error } = await adminClient
      .from('user_rewards')
      .select('user_id, referral_code')
      .limit(10);

    if (error) {
      console.error('Error fetching referral codes:', error);
      return;
    }

    console.log('Found referral codes:', codes);

    // Test validation with the actual code from database
    if (codes.length > 0) {
      const testCode = codes[0].referral_code;
      console.log(`\nTesting with actual code: ${testCode}`);
      
      const validateResponse = await fetch('http://localhost:9002/api/referrals/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode: testCode })
      });
      
      const result = await validateResponse.json();
      console.log('Validation result:', result);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkReferralCodes();
