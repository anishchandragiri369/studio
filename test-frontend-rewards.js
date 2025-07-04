const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFrontendRewards() {
  console.log('🔍 Testing Frontend Rewards Access...\n');

  const userId = '8967ff0e-2f67-47fa-8b2f-4fa7e945c14b';
  
  try {
    // Test 1: Direct database query with anon key (simulating what the frontend does)
    console.log('1. Testing direct database access with anon key...');
    
    const { data: rewards, error: rewardsError } = await supabase
      .from('user_rewards')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (rewardsError) {
      console.error('❌ Error accessing rewards with anon key:', rewardsError);
    } else {
      console.log('✅ Successfully accessed rewards with anon key:', rewards);
    }

    const { data: transactions, error: transactionsError } = await supabase
      .from('reward_transactions')
      .select('*')
      .eq('user_id', userId)
      .limit(5);

    if (transactionsError) {
      console.error('❌ Error accessing transactions with anon key:', transactionsError);
    } else {
      console.log('✅ Successfully accessed transactions with anon key:', transactions);
    }

    // Test 2: Test the API endpoints (start the dev server first)
    console.log('\n2. Testing API endpoints...');
    
    const baseUrl = 'http://localhost:3000';
    
    try {
      const rewardsResponse = await fetch(`${baseUrl}/api/rewards/user/${userId}`);
      if (rewardsResponse.ok) {
        const rewardsResult = await rewardsResponse.json();
        console.log('✅ Rewards API working:', rewardsResult);
      } else {
        console.error('❌ Rewards API failed:', rewardsResponse.status, await rewardsResponse.text());
      }
    } catch (error) {
      console.log('⚠️  API test skipped (server not running):', error.message);
    }

    try {
      const transactionsResponse = await fetch(`${baseUrl}/api/rewards/transactions/${userId}`);
      if (transactionsResponse.ok) {
        const transactionsResult = await transactionsResponse.json();
        console.log('✅ Transactions API working:', transactionsResult);
      } else {
        console.error('❌ Transactions API failed:', transactionsResponse.status, await transactionsResponse.text());
      }
    } catch (error) {
      console.log('⚠️  API test skipped (server not running):', error.message);
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testFrontendRewards();
