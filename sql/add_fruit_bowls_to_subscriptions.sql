-- Add selected_fruit_bowls column to user_subscriptions table to support mixed subscriptions
-- This enables customers to have both juices and fruit bowls in a single subscription

-- Add the selected_fruit_bowls column
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS selected_fruit_bowls JSONB DEFAULT '[]'::jsonb;

-- Add a comment to document the purpose
COMMENT ON COLUMN user_subscriptions.selected_fruit_bowls IS 'JSONB array storing selected fruit bowls for mixed juice and fruit bowl subscriptions';

-- Update existing subscriptions to have empty fruit bowls array if not set
UPDATE user_subscriptions 
SET selected_fruit_bowls = '[]'::jsonb 
WHERE selected_fruit_bowls IS NULL;

-- Add a check constraint to ensure it's a valid JSON array
ALTER TABLE user_subscriptions 
ADD CONSTRAINT check_selected_fruit_bowls_is_array 
CHECK (jsonb_typeof(selected_fruit_bowls) = 'array');
