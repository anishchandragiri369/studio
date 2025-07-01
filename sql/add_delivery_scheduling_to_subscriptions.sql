-- Add delivery scheduling columns to user_subscriptions table
-- This enables the new 6 PM cutoff delivery scheduling system for direct subscriptions

-- Add first delivery date column (when the subscription starts delivering)
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS first_delivery_date TIMESTAMP WITH TIME ZONE;

-- Add flag to track if subscription was created after 6 PM cutoff
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS is_after_cutoff BOOLEAN;

-- Add complete delivery schedule for subscription (JSONB for flexibility)
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS delivery_schedule JSONB;

-- Add indexes for efficient querying on delivery dates
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_first_delivery_date ON user_subscriptions(first_delivery_date);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_delivery_schedule ON user_subscriptions USING GIN(delivery_schedule);

-- Add comments for documentation
COMMENT ON COLUMN user_subscriptions.first_delivery_date IS 'The first delivery date calculated based on 6 PM cutoff rule';
COMMENT ON COLUMN user_subscriptions.is_after_cutoff IS 'True if subscription was created after 6 PM, affecting delivery date calculation';
COMMENT ON COLUMN user_subscriptions.delivery_schedule IS 'Complete delivery schedule for subscription including all delivery dates';

-- Example of delivery_schedule JSONB structure:
-- {
--   "startDate": "2025-06-30T00:00:00.000Z",
--   "endDate": "2025-08-30T00:00:00.000Z", 
--   "deliveryDates": ["2025-06-30T00:00:00.000Z", "2025-07-07T00:00:00.000Z", ...],
--   "totalDeliveries": 8
-- }
