-- Simple RLS fix for rewards visibility issue
-- Run this in Supabase SQL Editor

-- Enable RLS if not already enabled
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view own rewards" ON user_rewards;
DROP POLICY IF EXISTS "Users can update own rewards" ON user_rewards;
DROP POLICY IF EXISTS "Users can insert own rewards" ON user_rewards;
DROP POLICY IF EXISTS "Service role can manage all rewards" ON user_rewards;

DROP POLICY IF EXISTS "Users can view own transactions" ON reward_transactions;
DROP POLICY IF EXISTS "Service role can manage all transactions" ON reward_transactions;
DROP POLICY IF EXISTS "Service role can insert transactions" ON reward_transactions;

-- Create RLS policies for user_rewards table
CREATE POLICY "Users can view own rewards" ON user_rewards
  FOR SELECT USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can insert own rewards" ON user_rewards
  FOR INSERT WITH CHECK (auth.uid() = user_id::uuid);

CREATE POLICY "Users can update own rewards" ON user_rewards
  FOR UPDATE USING (auth.uid() = user_id::uuid);

CREATE POLICY "Service role can manage all rewards" ON user_rewards
  FOR ALL TO service_role USING (true);

-- Create RLS policies for reward_transactions table
CREATE POLICY "Users can view own transactions" ON reward_transactions
  FOR SELECT USING (auth.uid() = user_id::uuid);

CREATE POLICY "Service role can manage all transactions" ON reward_transactions
  FOR ALL TO service_role USING (true);

-- Test the policies by checking if we can see rewards for a specific user
-- You can test this by replacing the user_id with your actual user ID
-- SELECT * FROM user_rewards WHERE user_id = '8967ff0e-2f67-47fa-8b2f-4fa7e945c14b';
-- SELECT * FROM reward_transactions WHERE user_id = '8967ff0e-2f67-47fa-8b2f-4fa7e945c14b';

-- Check final policies
SELECT tablename, policyname, cmd, roles
FROM pg_policies 
WHERE tablename IN ('user_rewards', 'reward_transactions')
ORDER BY tablename, policyname;
