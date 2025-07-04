/**
 * Debug script to test the reward points system
 * Run with: node debug-rewards-node.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env file');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Found' : 'Missing');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Found' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  }
});

async function checkRewardTables() {
  console.log('🔍 Checking reward system tables...\n');

  try {
    // Check if user_rewards table exists
    const { data: userRewardsTable, error: userRewardsError } = await supabase
      .from('user_rewards')
      .select('*')
      .limit(5);

    if (userRewardsError) {
      console.error('❌ user_rewards table error:', userRewardsError.message);
    } else {
      console.log('✅ user_rewards table exists');
      console.log(`📊 Found ${userRewardsTable.length} user reward records`);
      if (userRewardsTable.length > 0) {
        console.table(userRewardsTable);
      }
    }

    // Check if reward_transactions table exists
    const { data: transactionsTable, error: transactionsError } = await supabase
      .from('reward_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (transactionsError) {
      console.error('❌ reward_transactions table error:', transactionsError.message);
    } else {
      console.log('\n✅ reward_transactions table exists');
      console.log(`📊 Found ${transactionsTable.length} transaction records`);
      if (transactionsTable.length > 0) {
        console.table(transactionsTable);
      }
    }

    // Check orders table for testing
    const { data: ordersTable, error: ordersError } = await supabase
      .from('orders')
      .select('id, user_id, status, created_at, rating_submitted')
      .in('status', ['payment_success', 'Payment Success', 'delivered'])
      .limit(5);

    if (ordersError) {
      console.error('❌ orders table error:', ordersError.message);
    } else {
      console.log('\n✅ orders table exists');
      console.log(`📊 Found ${ordersTable.length} completed orders for testing`);
      if (ordersTable.length > 0) {
        console.table(ordersTable);
      }
    }

  } catch (error) {
    console.error('💥 Error checking tables:', error);
  }
}

async function testRewardSystem(userId, orderId) {
  console.log('\n🧪 Testing reward system...');
  console.log(`User ID: ${userId}`);
  console.log(`Order ID: ${orderId}`);

  try {
    // Check current user rewards
    console.log('\n📋 Current user rewards:');
    const { data: currentRewards, error: rewardsError } = await supabase
      .from('user_rewards')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (rewardsError && rewardsError.code !== 'PGRST116') {
      console.error('❌ Error fetching current rewards:', rewardsError.message);
    } else if (rewardsError && rewardsError.code === 'PGRST116') {
      console.log('ℹ️ No existing rewards record found');
    } else {
      console.table([currentRewards]);
    }

    // Check if order exists and belongs to user
    console.log('\n🔍 Checking order...');
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, status, rating_submitted')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (orderError) {
      console.error('❌ Order not found or error:', orderError.message);
      return;
    }

    console.log('✅ Order found:');
    console.table([order]);

    if (order.rating_submitted) {
      console.log('⚠️ Order already has a rating submitted');
    }

    // Check existing rating
    const { data: existingRating, error: ratingError } = await supabase
      .from('order_ratings')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (ratingError && ratingError.code !== 'PGRST116') {
      console.error('❌ Error checking existing rating:', ratingError.message);
    } else if (ratingError && ratingError.code === 'PGRST116') {
      console.log('✅ No existing rating found - can submit new rating');
    } else {
      console.log('⚠️ Rating already exists:');
      console.table([existingRating]);
    }

  } catch (error) {
    console.error('💥 Error testing reward system:', error);
  }
}

async function simulateRatingSubmission(userId, orderId) {
  console.log('\n🚀 Simulating rating submission...');

  try {
    // Insert a test rating
    const { data: newRating, error: insertError } = await supabase
      .from('order_ratings')
      .insert([{
        order_id: orderId,
        user_id: userId,
        rating: 5,
        feedback_text: 'Test rating for reward points debugging',
        anonymous: false
      }])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting rating:', insertError.message);
      return;
    }

    console.log('✅ Rating inserted successfully:');
    console.table([newRating]);

    // Now award points manually (simulating the API)
    const { data: userRewards } = await supabase
      .from('user_rewards')
      .select('total_points, total_earned')
      .eq('user_id', userId)
      .single();

    if (userRewards) {
      // Update existing rewards
      const { data: updatedRewards, error: updateError } = await supabase
        .from('user_rewards')
        .update({
          total_points: userRewards.total_points + 5,
          total_earned: userRewards.total_earned + 2.5,
          last_updated: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating rewards:', updateError.message);
      } else {
        console.log('✅ Rewards updated:');
        console.table([updatedRewards]);
      }
    } else {
      // Create new rewards record
      const referralCode = `ELIXR${userId.slice(0, 6)}`;
      const { data: newRewards, error: createError } = await supabase
        .from('user_rewards')
        .insert([{
          user_id: userId,
          total_points: 5,
          total_earned: 2.5,
          referral_code: referralCode,
          referrals_count: 0,
          redeemed_points: 0,
          last_updated: new Date().toISOString()
        }])
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating rewards:', createError.message);
      } else {
        console.log('✅ New rewards record created:');
        console.table([newRewards]);
      }
    }

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('reward_transactions')
      .insert([{
        user_id: userId,
        type: 'earned',
        points: 5,
        amount: 2.5,
        description: `Rating points for order #${orderId.slice(-8)}`,
        order_id: orderId,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (transactionError) {
      console.error('❌ Error creating transaction:', transactionError.message);
    } else {
      console.log('✅ Transaction recorded:');
      console.table([transaction]);
    }

    // Update order to mark rating as submitted
    await supabase
      .from('orders')
      .update({ rating_submitted: true })
      .eq('id', orderId);

    console.log('✅ Order marked as rated');

  } catch (error) {
    console.error('💥 Error simulating rating submission:', error);
  }
}

async function main() {
  console.log('🎯 Reward Points System Debug Tool\n');
  
  // First check if tables exist
  await checkRewardTables();

  // Get command line arguments
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('\n📝 Usage: node debug-rewards-node.js <userId> <orderId>');
    console.log('Example: node debug-rewards-node.js 123e4567-e89b-12d3-a456-426614174000 456e7890-e89b-12d3-a456-426614174000');
    
    // Show some sample data to help with testing
    const { data: sampleOrders } = await supabase
      .from('orders')
      .select('id, user_id, status')
      .in('status', ['payment_success', 'Payment Success', 'delivered'])
      .limit(3);
    
    if (sampleOrders && sampleOrders.length > 0) {
      console.log('\n📋 Sample orders you can test with:');
      console.table(sampleOrders);
    }
    
    process.exit(0);
  }

  const [userId, orderId] = args;
  
  // Test the reward system
  await testRewardSystem(userId, orderId);
  
  // Ask if user wants to simulate rating submission
  console.log('\n❓ Do you want to simulate a rating submission? (This will add test data)');
  console.log('   To simulate: node debug-rewards-node.js', userId, orderId, 'simulate');
  
  if (args[2] === 'simulate') {
    await simulateRatingSubmission(userId, orderId);
  }
  
  console.log('\n✅ Debug complete!');
}

main().catch(console.error);
