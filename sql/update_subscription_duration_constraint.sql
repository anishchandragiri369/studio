-- Update subscription duration constraint to allow 1-12 months
ALTER TABLE user_subscriptions 
DROP CONSTRAINT IF EXISTS user_subscriptions_subscription_duration_check;

-- Add new constraint allowing 1-12 months
ALTER TABLE user_subscriptions 
ADD CONSTRAINT user_subscriptions_subscription_duration_check 
CHECK (subscription_duration >= 1 AND subscription_duration <= 12);
