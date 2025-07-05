require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testReferralValidation() {
  console.log('🧪 Testing referral code validation');
  
  // Test with admin client directly
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('Testing with admin client...');
    
    const { data: referrer, error: referrerError } = await supabaseAdmin
      .from('user_rewards')
      .select('user_id, referral_code')
      .eq('referral_code', 'ELIXR8967FF')
      .single();

    if (referrerError) {
      console.error('❌ Database error:', referrerError);
    } else {
      console.log('✅ Found referrer:', referrer);
    }

    // Also test case-insensitive
    const { data: referrer2, error: referrerError2 } = await supabaseAdmin
      .from('user_rewards')
      .select('user_id, referral_code')
      .ilike('referral_code', 'elixr8967ff')
      .single();

    if (referrerError2) {
      console.error('❌ Case-insensitive error:', referrerError2);
    } else {
      console.log('✅ Case-insensitive found:', referrer2);
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testReferralValidation();
