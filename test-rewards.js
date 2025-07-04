/**
 * Script to test the reward points system
 * Run this to check if rewards are being awarded correctly for ratings
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testRewardSystem() {
  console.log('Testing reward system...');

  try {
    // Get all user rewards
    const { data: allRewards, error: allRewardsError } = await supabase
      .from('user_rewards')
      .select('*');

    if (allRewardsError) {
      console.error('Error fetching all rewards:', allRewardsError);
      return;
    }

    console.log('All user rewards:');
    console.table(allRewards);

    // Get all reward transactions
    const { data: allTransactions, error: allTransactionsError } = await supabase
      .from('reward_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (allTransactionsError) {
      console.error('Error fetching transactions:', allTransactionsError);
      return;
    }

    console.log('Recent reward transactions:');
    console.table(allTransactions);

    // Check if user_rewards table exists and has the right structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'user_rewards')
      .eq('table_schema', 'public');

    if (tableError) {
      console.error('Error checking table structure:', tableError);
    } else {
      console.log('User rewards table structure:');
      console.table(tableInfo);
    }

  } catch (error) {
    console.error('Error in test:', error);
  }
}

testRewardSystem();
