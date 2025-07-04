const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRewardsAccess() {
  console.log('🔍 Testing Rewards Access After RLS Fix...\n');

  const userId = '8967ff0e-2f67-47fa-8b2f-4fa7e945c14b';
  
  try {
    // Test 1: Check user_rewards access
    console.log('1. Testing user_rewards access...');
    const { data: rewards, error: rewardsError } = await supabase
      .from('user_rewards')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (rewardsError) {
      console.error('❌ Error accessing user_rewards:', rewardsError);
    } else {
      console.log('✅ Successfully accessed user_rewards:', rewards);
    }

    // Test 2: Check reward_transactions access
    console.log('\n2. Testing reward_transactions access...');
    const { data: transactions, error: transactionsError } = await supabase
      .from('reward_transactions')
      .select('*')
      .eq('user_id', userId);

    if (transactionsError) {
      console.error('❌ Error accessing reward_transactions:', transactionsError);
    } else {
      console.log('✅ Successfully accessed reward_transactions:', transactions);
    }

    // Test 3: Test the API endpoints directly (simulating frontend)
    console.log('\n3. Testing API endpoints...');
    
    try {
      console.log('Testing rewards API...');
      const rewardsResponse = await fetch(`http://localhost:3000/api/rewards/user/${userId}`);
      const rewardsResult = await rewardsResponse.json();
      
      if (rewardsResult.success) {
        console.log('✅ Rewards API working:', rewardsResult.data);
      } else {
        console.log('❌ Rewards API failed:', rewardsResult);
      }
    } catch (error) {
      console.log('⚠️ API test skipped (server not running):', error.message);
    }

    try {
      console.log('Testing transactions API...');
      const transactionsResponse = await fetch(`http://localhost:3000/api/rewards/transactions/${userId}`);
      const transactionsResult = await transactionsResponse.json();
      
      if (transactionsResult.success) {
        console.log('✅ Transactions API working:', transactionsResult.data);
      } else {
        console.log('❌ Transactions API failed:', transactionsResult);
      }
    } catch (error) {
      console.log('⚠️ API test skipped (server not running):', error.message);
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testRewardsAccess();
