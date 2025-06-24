-- Add subscription duration and pricing columns
ALTER TABLE user_subscriptions 
ADD COLUMN subscription_duration INTEGER CHECK (subscription_duration IN (2, 3, 4, 6, 12)),
ADD COLUMN subscription_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN original_price DECIMAL(10,2),
ADD COLUMN discount_percentage DECIMAL(5,2) DEFAULT 0,
ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN final_price DECIMAL(10,2),
ADD COLUMN renewal_notification_sent BOOLEAN DEFAULT FALSE;

-- Create index for efficient queries on subscription end dates
CREATE INDEX idx_user_subscriptions_end_date ON user_subscriptions(subscription_end_date);
CREATE INDEX idx_user_subscriptions_renewal ON user_subscriptions(subscription_end_date, renewal_notification_sent) WHERE status = 'active';

-- Update existing subscriptions to have default duration (this is for existing data)
UPDATE user_subscriptions 
SET 
  subscription_duration = 3,
  subscription_start_date = created_at,
  subscription_end_date = created_at + INTERVAL '3 months',
  original_price = total_amount,
  discount_percentage = 0,
  discount_amount = 0,
  final_price = total_amount
WHERE subscription_duration IS NULL;

-- Function to automatically update subscription status when expired
CREATE OR REPLACE FUNCTION update_expired_subscriptions()
RETURNS void AS $$
BEGIN
  UPDATE user_subscriptions 
  SET status = 'expired'
  WHERE status = 'active' 
    AND subscription_end_date < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a function that will be called to check for renewal notifications
CREATE OR REPLACE FUNCTION check_renewal_notifications()
RETURNS TABLE(
  subscription_id UUID,
  user_id UUID,
  user_email TEXT,
  days_left INTEGER,
  subscription_end_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as subscription_id,
    s.user_id,
    u.email as user_email,
    EXTRACT(DAY FROM s.subscription_end_date - NOW())::INTEGER as days_left,
    s.subscription_end_date
  FROM user_subscriptions s
  JOIN auth.users u ON s.user_id = u.id
  WHERE s.status = 'active'
    AND s.subscription_end_date >= NOW()
    AND s.subscription_end_date <= NOW() + INTERVAL '5 days'
    AND s.renewal_notification_sent = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE user_subscriptions IS 'Updated to support duration-based subscriptions with discount pricing';
