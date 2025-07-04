const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRewardsDisplay() {
  console.log('🔍 Testing Rewards Display System...\n');

  try {
    // First, let's check what users exist
    console.log('1. Checking users...');
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(5);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }

    console.log('Found users:', users.map(u => ({ id: u.id, email: u.email })));

    if (users.length === 0) {
      console.log('No users found');
      return;
    }

    // Test with the first user
    const testUser = users[0];
    console.log(`\n2. Testing with user: ${testUser.email} (${testUser.id})`);

    // Check user_rewards table
    console.log('\n3. Checking user_rewards table...');
    const { data: rewards, error: rewardsError } = await supabase
      .from('user_rewards')
      .select('*')
      .eq('user_id', testUser.id)
      .single();

    if (rewardsError) {
      if (rewardsError.code === 'PGRST116') {
        console.log('No rewards record found for user');
      } else {
        console.error('Error fetching rewards:', rewardsError);
      }
    } else {
      console.log('User rewards:', rewards);
    }

    // Check reward_transactions table
    console.log('\n4. Checking reward_transactions table...');
    const { data: transactions, error: transactionsError } = await supabase
      .from('reward_transactions')
      .select('*')
      .eq('user_id', testUser.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError);
    } else {
      console.log('User transactions:', transactions);
    }

    // Test API endpoints directly
    console.log('\n5. Testing API endpoints...');
    
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
    
    try {
      console.log(`Testing rewards API: ${baseUrl}/api/rewards/user/${testUser.id}`);
      const rewardsResponse = await fetch(`${baseUrl}/api/rewards/user/${testUser.id}`);
      const rewardsResult = await rewardsResponse.json();
      console.log('Rewards API response:', rewardsResult);
    } catch (error) {
      console.error('Error testing rewards API:', error.message);
    }

    try {
      console.log(`Testing transactions API: ${baseUrl}/api/rewards/transactions/${testUser.id}`);
      const transactionsResponse = await fetch(`${baseUrl}/api/rewards/transactions/${testUser.id}`);
      const transactionsResult = await transactionsResponse.json();
      console.log('Transactions API response:', transactionsResult);
    } catch (error) {
      console.error('Error testing transactions API:', error.message);
    }

    // Check if there are any ratings that should have awarded points
    console.log('\n6. Checking recent ratings...');
    const { data: ratings, error: ratingsError } = await supabase
      .from('order_ratings')
      .select('*')
      .eq('user_id', testUser.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (ratingsError) {
      console.error('Error fetching ratings:', ratingsError);
    } else {
      console.log('User ratings:', ratings);
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testRewardsDisplay();
