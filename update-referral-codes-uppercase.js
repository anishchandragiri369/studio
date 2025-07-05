require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateReferralCodesToUppercase() {
  console.log('🔄 Updating all referral codes to uppercase...');
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing environment variables');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.error('SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    return;
  }
  
  try {
    // 1. Get all users with referral codes
    const { data: users, error: fetchError } = await supabaseAdmin
      .from('user_rewards')
      .select('user_id, referral_code')
      .not('referral_code', 'is', null);

    if (fetchError) {
      console.error('❌ Error fetching users:', fetchError);
      return;
    }

    console.log(`📊 Found ${users.length} users with referral codes`);

    let updatedCount = 0;
    
    // 2. Update each referral code to uppercase
    for (const user of users) {
      const originalCode = user.referral_code;
      const upperCode = originalCode.toUpperCase();
      
      if (originalCode !== upperCode) {
        console.log(`🔄 Updating ${originalCode} → ${upperCode}`);
        
        const { error: updateError } = await supabaseAdmin
          .from('user_rewards')
          .update({ referral_code: upperCode })
          .eq('user_id', user.user_id);

        if (updateError) {
          console.error(`❌ Error updating ${user.user_id}:`, updateError);
        } else {
          updatedCount++;
        }
      } else {
        console.log(`✅ ${originalCode} already uppercase`);
      }
    }

    console.log(`\n✅ Updated ${updatedCount} referral codes to uppercase`);

    // 3. Also update any referral_rewards table entries
    console.log('\n🔄 Updating referral_rewards table...');
    
    const { data: rewards, error: rewardsFetchError } = await supabaseAdmin
      .from('referral_rewards')
      .select('id, referral_code');

    if (rewardsFetchError) {
      console.error('❌ Error fetching referral rewards:', rewardsFetchError);
      return;
    }

    let rewardsUpdatedCount = 0;
    
    for (const reward of rewards) {
      const originalCode = reward.referral_code;
      const upperCode = originalCode.toUpperCase();
      
      if (originalCode !== upperCode) {
        console.log(`🔄 Updating reward ${originalCode} → ${upperCode}`);
        
        const { error: updateError } = await supabaseAdmin
          .from('referral_rewards')
          .update({ referral_code: upperCode })
          .eq('id', reward.id);

        if (updateError) {
          console.error(`❌ Error updating reward ${reward.id}:`, updateError);
        } else {
          rewardsUpdatedCount++;
        }
      }
    }

    console.log(`✅ Updated ${rewardsUpdatedCount} referral reward codes to uppercase`);

    console.log('\n🎉 Database update complete! All referral codes are now uppercase.');

  } catch (error) {
    console.error('❌ Update error:', error);
  }
}

updateReferralCodesToUppercase();
