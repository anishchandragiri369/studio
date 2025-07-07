-- Check and fix RLS policies for rewards tables
-- Run this in Supabase SQL Editor

-- First, check current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('user_rewards', 'reward_transactions')
ORDER BY tablename, policyname;

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename IN ('user_rewards', 'reward_transactions')
AND schemaname = 'public';

-- Enable RLS if not already enabled
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to recreate them properly)
DROP POLICY IF EXISTS "Users can view own rewards" ON user_rewards;
DROP POLICY IF EXISTS "Users can update own rewards" ON user_rewards;
DROP POLICY IF EXISTS "Service role can manage all rewards" ON user_rewards;

DROP POLICY IF EXISTS "Users can view own transactions" ON reward_transactions;
DROP POLICY IF EXISTS "Service role can manage all transactions" ON reward_transactions;

-- Create proper RLS policies for user_rewards table
CREATE POLICY "Users can view own rewards" ON user_rewards
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update own rewards" ON user_rewards
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Service role can manage all rewards" ON user_rewards
  FOR ALL TO service_role USING (true);

-- Create proper RLS policies for reward_transactions table
CREATE POLICY "Users can view own transactions" ON reward_transactions
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Service role can manage all transactions" ON reward_transactions
  FOR ALL TO service_role USING (true);

-- Allow authenticated users to insert their own rewards (needed for first-time setup)
CREATE POLICY "Users can insert own rewards" ON user_rewards
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Allow service role to insert transactions (needed for rating rewards)
CREATE POLICY "Service role can insert transactions" ON reward_transactions
  FOR INSERT TO service_role WITH CHECK (true);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('user_rewards', 'reward_transactions')
ORDER BY tablename, policyname;
