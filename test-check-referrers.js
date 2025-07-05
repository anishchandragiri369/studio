require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkReferrers() {
  console.log('🔍 Checking existing referral codes...');
  
  try {
    const { data: allRewards, error } = await supabaseAdmin
      .from('user_rewards')
      .select('user_id, referral_code');
    
    if (error) {
      console.error('Error fetching rewards:', error);
      return;
    }
    
    console.log('All referral codes in the database:');
    allRewards.forEach(reward => {
      console.log(`- ${reward.referral_code} (user: ${reward.user_id})`);
    });
    
    console.log(`\nTotal users with referral codes: ${allRewards.length}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

checkReferrers();
