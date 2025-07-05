require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testNullOrderId() {
  console.log('🧪 Testing null order_id for referral rewards...');
  
  try {
    // Create a test referral reward with null order_id
    const { data: reward, error: rewardError } = await supabaseAdmin
      .from('referral_rewards')
      .insert([{
        referrer_id: '49ffac0b-58ef-407a-9d76-08065eddf0da',
        referred_user_id: '818efca9-977f-4298-94b1-aaf502fd17ac',
        referral_code: 'TESTCODE',
        reward_points: 100,
        reward_amount: 50,
        status: 'completed',
        order_id: null, // Test null value
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      }])
      .select('id')
      .single();

    if (rewardError) {
      console.log('❌ Cannot use null order_id:', rewardError.message);
    } else {
      console.log('✅ Null order_id works, cleaning up test record');
      // Clean up the test record
      await supabaseAdmin
        .from('referral_rewards')
        .delete()
        .eq('id', reward.id);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testNullOrderId();
