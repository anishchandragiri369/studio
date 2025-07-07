-- Fix for user_rewards table missing columns
-- Run this in Supabase SQL Editor

-- Add the missing redeemed_points column
ALTER TABLE user_rewards ADD COLUMN IF NOT EXISTS redeemed_points INTEGER DEFAULT 0;

-- Add the computed available_points column  
ALTER TABLE user_rewards ADD COLUMN IF NOT EXISTS available_points INTEGER GENERATED ALWAYS AS (total_points - COALESCE(redeemed_points, 0)) STORED;

-- Update any existing records to have redeemed_points = 0 if null
UPDATE user_rewards SET redeemed_points = 0 WHERE redeemed_points IS NULL;

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_rewards' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test insert to verify everything works
-- INSERT INTO user_rewards (user_id, total_points, total_earned, referral_code, referrals_count, redeemed_points) 
-- VALUES ('12345678-1234-1234-1234-123456789012', 5, 2.5, 'TEST123', 0, 0);

-- Clean up test (uncomment if you ran the test insert)
-- DELETE FROM user_rewards WHERE user_id = '12345678-1234-1234-1234-123456789012';
