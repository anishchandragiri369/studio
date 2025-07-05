require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateReferralCodesToUppercase() {
  console.log('🔄 Updating all referral codes to uppercase...');
  
  try {
    // Get all user_rewards with referral codes
    const { data: users, error: fetchError } = await supabaseAdmin
      .from('user_rewards')
      .select('user_id, referral_code')
      .not('referral_code', 'is', null);

    if (fetchError) {
      console.error('❌ Error fetching user_rewards:', fetchError);
      return;
    }

    console.log(`📊 Found ${users.length} users with referral codes`);
    
    let updatedCount = 0;
    
    for (const user of users) {
      const originalCode = user.referral_code;
      const uppercaseCode = originalCode.toUpperCase();
      
      if (originalCode !== uppercaseCode) {
        console.log(`🔄 Updating ${user.user_id}: ${originalCode} -> ${uppercaseCode}`);
        
        // Update user_rewards table
        const { error: updateError } = await supabaseAdmin
          .from('user_rewards')
          .update({ referral_code: uppercaseCode })
          .eq('user_id', user.user_id);

        if (updateError) {
          console.error(`❌ Error updating user ${user.user_id}:`, updateError);
        } else {
          updatedCount++;
          
          // Also update any referral_rewards records that reference this code
          const { error: rewardsUpdateError } = await supabaseAdmin
            .from('referral_rewards')
            .update({ referral_code: uppercaseCode })
            .eq('referral_code', originalCode);

          if (rewardsUpdateError) {
            console.error(`⚠️  Error updating referral_rewards for ${originalCode}:`, rewardsUpdateError);
          }
        }
      } else {
        console.log(`✅ ${user.user_id}: ${originalCode} (already uppercase)`);
      }
    }
    
    console.log(`\n🎉 Successfully updated ${updatedCount} referral codes to uppercase!`);
    
    // Verify the update
    console.log('\n🔍 Verifying updates...');
    const { data: verifyUsers, error: verifyError } = await supabaseAdmin
      .from('user_rewards')
      .select('user_id, referral_code')
      .not('referral_code', 'is', null);

    if (verifyError) {
      console.error('❌ Error verifying updates:', verifyError);
      return;
    }

    let lowercaseCount = 0;
    verifyUsers.forEach(user => {
      if (user.referral_code !== user.referral_code.toUpperCase()) {
        console.log(`⚠️  Still has lowercase: ${user.referral_code}`);
        lowercaseCount++;
      }
    });
    
    if (lowercaseCount === 0) {
      console.log('✅ All referral codes are now uppercase!');
    } else {
      console.log(`❌ ${lowercaseCount} referral codes still have lowercase letters`);
    }
    
  } catch (error) {
    console.error('❌ Error updating referral codes:', error);
  }
}

updateReferralCodesToUppercase();
