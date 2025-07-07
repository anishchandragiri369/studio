-- Add category_distribution and selected_category columns to user_subscriptions table
-- This supports the new subscription structure with category-based juice selection

ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS selected_category VARCHAR(100),
ADD COLUMN IF NOT EXISTS category_distribution JSONB;

-- Add comments for the new columns
COMMENT ON COLUMN user_subscriptions.selected_category IS 'The selected category for the subscription (e.g., Immunity Booster, Detoxify, etc.)';
COMMENT ON COLUMN user_subscriptions.category_distribution IS 'JSONB array storing the distribution of juices across delivery days for category-based subscriptions';

-- Create index for better performance on category queries
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_selected_category ON user_subscriptions(selected_category);

-- Update existing subscriptions to have default values
UPDATE user_subscriptions 
SET selected_category = 'Custom',
    category_distribution = '[]'::jsonb
WHERE selected_category IS NULL;

-- Add NOT NULL constraint after setting default values
ALTER TABLE user_subscriptions 
ALTER COLUMN selected_category SET NOT NULL,
ALTER COLUMN category_distribution SET NOT NULL;

-- Log the changes
DO $$
BEGIN
    RAISE NOTICE 'Added category_distribution and selected_category columns to user_subscriptions table';
END $$; 