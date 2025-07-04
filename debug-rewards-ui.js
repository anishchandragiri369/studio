const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugRewardsUI() {
  console.log('🔍 Debugging Rewards UI Display Issue...\n');

  const userId = '8967ff0e-2f67-47fa-8b2f-4fa7e945c14b';
  
  try {
    // 1. Check user_rewards table directly
    console.log('1. Checking user_rewards table...');
    const { data: userRewards, error: rewardsError } = await supabase
      .from('user_rewards')
      .select('*')
      .eq('user_id', userId);

    if (rewardsError) {
      console.error('Error fetching user_rewards:', rewardsError);
    } else {
      console.log('User rewards data:', userRewards);
    }

    // 2. Check reward_transactions table
    console.log('\n2. Checking reward_transactions table...');
    const { data: transactions, error: transError } = await supabase
      .from('reward_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (transError) {
      console.error('Error fetching transactions:', transError);
    } else {
      console.log('User transactions:', transactions);
    }

    // 3. Test the user rewards API endpoint structure
    console.log('\n3. Testing API structure...');
    
    // First test with the service role key if available
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceKey) {
      console.log('Service role key found, testing with admin access...');
      const adminSupabase = createClient(supabaseUrl, serviceKey);
      
      const { data: adminRewards, error: adminError } = await adminSupabase
        .from('user_rewards')
        .select('*')
        .eq('user_id', userId);

      if (adminError) {
        console.error('Admin query error:', adminError);
      } else {
        console.log('Admin query results:', adminRewards);
      }
    } else {
      console.log('No service role key found in environment');
    }

    // 4. Check if there's an RLS policy issue
    console.log('\n4. Testing direct SQL access...');
    const { data: sqlTest, error: sqlError } = await supabase
      .rpc('get_user_rewards', { user_id_param: userId });

    if (sqlError) {
      console.log('RPC function not available (expected):', sqlError.message);
    } else {
      console.log('RPC results:', sqlTest);
    }

    // 5. Create test data using proper structure
    console.log('\n5. Ensuring rewards data exists with proper structure...');
    
    if (userRewards.length === 0) {
      console.log('No rewards found, creating initial record...');
      
      // Calculate total points from transactions
      const totalPoints = transactions.reduce((sum, t) => {
        return t.type === 'earned' ? sum + t.points : sum - t.points;
      }, 0);
      
      const totalEarned = transactions.reduce((sum, t) => {
        return t.type === 'earned' ? sum + t.amount : sum;
      }, 0);

      const referralCode = `ELIXR${userId.slice(0, 6)}`;

      // Try to create with service role if available
      const client = serviceKey ? createClient(supabaseUrl, serviceKey) : supabase;
      
      const { data: newReward, error: insertError } = await client
        .from('user_rewards')
        .insert({
          user_id: userId,
          total_points: totalPoints,
          redeemed_points: 0,
          total_earned: totalEarned,
          referral_code: referralCode,
          referrals_count: 0,
          last_updated: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating rewards record:', insertError);
      } else {
        console.log('Created rewards record:', newReward);
      }
    }

    // 6. Final check of what the API should return
    console.log('\n6. Final state check...');
    const { data: finalRewards, error: finalError } = await supabase
      .from('user_rewards')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (finalError) {
      console.error('Final check error:', finalError);
    } else {
      console.log('Final rewards state:', finalRewards);
      
      // Calculate what the API response should look like
      const apiResponse = {
        userId: finalRewards.user_id,
        totalPoints: finalRewards.total_points,
        availablePoints: finalRewards.available_points || (finalRewards.total_points - (finalRewards.redeemed_points || 0)),
        redeemedPoints: finalRewards.redeemed_points || 0,
        totalEarned: finalRewards.total_earned,
        referralCode: finalRewards.referral_code,
        referralsCount: finalRewards.referrals_count,
        lastUpdated: finalRewards.last_updated
      };
      
      console.log('\nExpected API response format:', apiResponse);
    }

  } catch (error) {
    console.error('Debug failed:', error);
  }
}

debugRewardsUI();
