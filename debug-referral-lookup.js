require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugReferralLookup() {
  console.log('🔍 Debug referral lookup...');
  
  try {
    const referralCode = 'TESTXV004U';
    console.log(`Looking for referral code: ${referralCode}`);
    
    // Test the exact query the API uses
    const { data: referrer, error: referrerError } = await supabaseAdmin
      .from('user_rewards')
      .select('user_id')
      .eq('referral_code', referralCode.toUpperCase())
      .single();
    
    console.log('Query result:', { referrer, referrerError });
    
    if (referrer && !referrerError) {
      console.log('✅ Referrer found:', referrer.user_id);
    } else {
      console.log('❌ Referrer not found or error occurred');
      console.log('Error:', referrerError);
    }
    
    // Also check all referral codes to ensure it exists
    const { data: allCodes } = await supabaseAdmin
      .from('user_rewards')
      .select('referral_code, user_id');
    
    console.log('\nAll referral codes:');
    allCodes.forEach(code => {
      console.log(`- ${code.referral_code} (${code.user_id})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugReferralLookup();
