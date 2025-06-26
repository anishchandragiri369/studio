-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    next_delivery_date TIMESTAMP WITH TIME ZONE NOT NULL,
    pause_date TIMESTAMP WITH TIME ZONE,
    pause_reason TEXT,
    reactivation_deadline TIMESTAMP WITH TIME ZONE,
    delivery_frequency VARCHAR(10) NOT NULL CHECK (delivery_frequency IN ('weekly', 'monthly')),
    selected_juices JSONB,
    delivery_address JSONB NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL
);

-- Create subscription_deliveries table
CREATE TABLE IF NOT EXISTS subscription_deliveries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE CASCADE,
    delivery_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'delivered', 'skipped', 'failed')),
    items JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_next_delivery ON user_subscriptions(next_delivery_date);
CREATE INDEX IF NOT EXISTS idx_subscription_deliveries_subscription_id ON subscription_deliveries(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_deliveries_delivery_date ON subscription_deliveries(delivery_date);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_deliveries_updated_at BEFORE UPDATE ON subscription_deliveries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE user_subscriptions IS 'Stores user subscription information with pause/resume functionality';
COMMENT ON TABLE subscription_deliveries IS 'Tracks individual subscription deliveries';
COMMENT ON COLUMN user_subscriptions.pause_date IS 'Date when subscription was paused';
COMMENT ON COLUMN user_subscriptions.reactivation_deadline IS '3 months from pause date - deadline for reactivation';
COMMENT ON COLUMN user_subscriptions.next_delivery_date IS 'Next scheduled delivery date (updated when paused/resumed)';
