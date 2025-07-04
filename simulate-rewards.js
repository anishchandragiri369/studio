const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRatingsAndSimulate() {
  console.log('🔍 Checking Ratings and Simulating Reward Creation...\n');

  const userId = '8967ff0e-2f67-47fa-8b2f-4fa7e945c14b';
  
  try {
    // Check for any ratings by this user
    console.log('1. Checking order_ratings...');
    const { data: ratings, error: ratingsError } = await supabase
      .from('order_ratings')
      .select('*')
      .eq('user_id', userId);

    if (ratingsError) {
      console.error('Error fetching ratings:', ratingsError);
    } else {
      console.log(`Found ${ratings.length} ratings for user:`, ratings);
    }

    // Check if user_rewards table structure is correct
    console.log('\n2. Checking user_rewards table structure...');
    const { data: structure, error: structureError } = await supabase
      .from('user_rewards')
      .select('*')
      .limit(0);

    if (structureError) {
      console.error('Error checking table structure:', structureError);
    } else {
      console.log('user_rewards table exists and is accessible');
    }

    // Create a test rewards record to see if the API works
    console.log('\n3. Creating test rewards record...');
    
    const testRewardsData = {
      user_id: userId,
      total_points: 50,
      redeemed_points: 0,
      total_earned: 0,
      referral_code: 'TEST123',
      referrals_count: 0,
      last_updated: new Date().toISOString()
    };

    const { data: insertedReward, error: insertError } = await supabase
      .from('user_rewards')
      .insert(testRewardsData)
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting test reward:', insertError);
    } else {
      console.log('Test reward inserted:', insertedReward);

      // Now create a test transaction
      console.log('\n4. Creating test transaction...');
      const testTransactionData = {
        user_id: userId,
        type: 'earned',
        points: 50,
        amount: 25, // 50 points = ₹25
        description: 'Test rating reward',
        created_at: new Date().toISOString()
      };

      const { data: insertedTransaction, error: transactionError } = await supabase
        .from('reward_transactions')
        .insert(testTransactionData)
        .select()
        .single();

      if (transactionError) {
        console.error('Error inserting test transaction:', transactionError);
      } else {
        console.log('Test transaction inserted:', insertedTransaction);
      }
    }

    // Now check what we have
    console.log('\n5. Checking final state...');
    const { data: finalRewards, error: finalError } = await supabase
      .from('user_rewards')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (finalError) {
      console.error('Error fetching final rewards:', finalError);
    } else {
      console.log('Final rewards state:', finalRewards);
    }

    const { data: finalTransactions, error: finalTransError } = await supabase
      .from('reward_transactions')
      .select('*')
      .eq('user_id', userId);

    if (finalTransError) {
      console.error('Error fetching final transactions:', finalTransError);
    } else {
      console.log('Final transactions:', finalTransactions);
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

checkRatingsAndSimulate();
