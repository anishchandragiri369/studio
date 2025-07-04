const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseStructure() {
  console.log('🔍 Checking Database Structure...\n');

  try {
    // Let's check what tables exist by looking at reward_transactions first
    console.log('1. Checking reward_transactions table...');
    const { data: transactions, error: transactionsError } = await supabase
      .from('reward_transactions')
      .select('user_id')
      .limit(5);

    if (transactionsError) {
      console.error('Error with reward_transactions:', transactionsError);
    } else {
      console.log('Sample user IDs from reward_transactions:', 
        [...new Set(transactions.map(t => t.user_id))]);
    }

    // Check user_rewards table
    console.log('\n2. Checking user_rewards table...');
    const { data: rewards, error: rewardsError } = await supabase
      .from('user_rewards')
      .select('*')
      .limit(5);

    if (rewardsError) {
      console.error('Error with user_rewards:', rewardsError);
    } else {
      console.log('Sample user_rewards records:', rewards);
    }

    // Check orders table to find user IDs
    console.log('\n3. Checking orders table for user IDs...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('user_id, email')
      .limit(5);

    if (ordersError) {
      console.error('Error with orders:', ordersError);
    } else {
      console.log('Sample users from orders:', orders);
      
      if (orders.length > 0) {
        const testUser = orders[0];
        console.log(`\n4. Testing with user: ${testUser.email} (${testUser.user_id})`);

        // Check this user's rewards
        const { data: userRewards, error: userRewardsError } = await supabase
          .from('user_rewards')
          .select('*')
          .eq('user_id', testUser.user_id)
          .single();

        if (userRewardsError) {
          if (userRewardsError.code === 'PGRST116') {
            console.log('No rewards record found for this user');
          } else {
            console.error('Error fetching user rewards:', userRewardsError);
          }
        } else {
          console.log('User rewards:', userRewards);
        }

        // Check this user's transactions
        const { data: userTransactions, error: userTransactionsError } = await supabase
          .from('reward_transactions')
          .select('*')
          .eq('user_id', testUser.user_id)
          .order('created_at', { ascending: false });

        if (userTransactionsError) {
          console.error('Error fetching user transactions:', userTransactionsError);
        } else {
          console.log('User transactions:', userTransactions);
        }

        // Test the API endpoints
        console.log('\n5. Testing API endpoints...');
        
        const baseUrl = 'http://localhost:3000'; // Assuming local development
        
        try {
          console.log(`Testing rewards API: ${baseUrl}/api/rewards/user/${testUser.user_id}`);
          const rewardsResponse = await fetch(`${baseUrl}/api/rewards/user/${testUser.user_id}`);
          const rewardsResult = await rewardsResponse.json();
          console.log('Rewards API response:', JSON.stringify(rewardsResult, null, 2));
        } catch (error) {
          console.error('Error testing rewards API (server might not be running):', error.message);
        }
      }
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

checkDatabaseStructure();
