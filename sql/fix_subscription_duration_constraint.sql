-- Let me manually run SQL through the Supabase dashboard
-- Or use a simpler approach by directly executing SQL

-- For now, let me create a migration file that should work
-- Update subscription duration constraint to allow 1-12 months

-- Drop the existing constraint
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE constraint_name = 'user_subscriptions_subscription_duration_check'
    ) THEN
        ALTER TABLE user_subscriptions DROP CONSTRAINT user_subscriptions_subscription_duration_check;
    END IF;
END $$;

-- Add new constraint allowing 1-12 months
ALTER TABLE user_subscriptions 
ADD CONSTRAINT user_subscriptions_subscription_duration_check 
CHECK (subscription_duration >= 1 AND subscription_duration <= 12);
