-- Coupon and Referral System Database Schema
-- Run these SQL commands in your Supabase SQL editor

-- 1. Coupon usage tracking table
CREATE TABLE IF NOT EXISTS coupon_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    coupon_code VARCHAR(50) NOT NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    discount_amount DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User rewards table
CREATE TABLE IF NOT EXISTS user_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    total_points INTEGER DEFAULT 0 CHECK (total_points >= 0),
    total_earned DECIMAL(10,2) DEFAULT 0 CHECK (total_earned >= 0),
    referral_code VARCHAR(20) UNIQUE NOT NULL,
    referrals_count INTEGER DEFAULT 0 CHECK (referrals_count >= 0),
    redeemed_points INTEGER DEFAULT 0 CHECK (redeemed_points >= 0),
    available_points INTEGER GENERATED ALWAYS AS (total_points - redeemed_points) STORED,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Referral rewards tracking table
CREATE TABLE IF NOT EXISTS referral_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code VARCHAR(20) NOT NULL,
    reward_points INTEGER NOT NULL CHECK (reward_points >= 0),
    reward_amount DECIMAL(10,2) NOT NULL CHECK (reward_amount >= 0),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(referred_user_id, referral_code)
);

-- 4. Reward transactions table
CREATE TABLE IF NOT EXISTS reward_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('earned', 'redeemed')),
    points INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    referral_id UUID REFERENCES referral_rewards(id) ON DELETE SET NULL,
    coupon_code VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Update orders table to include coupon and referral fields
ALTER TABLE orders ADD COLUMN IF NOT EXISTS original_amount DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS referrer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_id ON coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_code ON coupon_usage(coupon_code);
CREATE INDEX IF NOT EXISTS idx_user_rewards_referral_code ON user_rewards(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer_id ON referral_rewards(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referred_user_id ON referral_rewards(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_reward_transactions_user_id ON reward_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_coupon_code ON orders(coupon_code);
CREATE INDEX IF NOT EXISTS idx_orders_referrer_id ON orders(referrer_id);

-- 7. Row Level Security (RLS) policies
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coupon_usage
CREATE POLICY "Users can view their own coupon usage" ON coupon_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert coupon usage" ON coupon_usage
    FOR INSERT WITH CHECK (true);

-- RLS Policies for user_rewards
CREATE POLICY "Users can view their own rewards" ON user_rewards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own rewards" ON user_rewards
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert user rewards" ON user_rewards
    FOR INSERT WITH CHECK (true);

-- RLS Policies for referral_rewards
CREATE POLICY "Users can view referrals they made or received" ON referral_rewards
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "System can insert referral rewards" ON referral_rewards
    FOR INSERT WITH CHECK (true);

-- RLS Policies for reward_transactions
CREATE POLICY "Users can view their own transactions" ON reward_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert reward transactions" ON reward_transactions
    FOR INSERT WITH CHECK (true);

-- 8. Create functions for common operations
CREATE OR REPLACE FUNCTION get_user_rewards_summary(user_uuid UUID)
RETURNS TABLE (
    total_points INTEGER,
    available_points INTEGER,
    redeemed_points INTEGER,
    total_earned DECIMAL(10,2),
    referral_code VARCHAR(20),
    referrals_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ur.total_points,
        ur.available_points,
        ur.redeemed_points,
        ur.total_earned,
        ur.referral_code,
        ur.referrals_count
    FROM user_rewards ur
    WHERE ur.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create trigger to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_rewards_last_updated
    BEFORE UPDATE ON user_rewards
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_column();

-- 10. Sample data for testing (optional)
-- INSERT INTO user_rewards (user_id, referral_code) VALUES 
-- (gen_random_uuid(), 'ELX12AB34'),
-- (gen_random_uuid(), 'ELX56CD78');

COMMENT ON TABLE coupon_usage IS 'Tracks when and how coupons are used by users';
COMMENT ON TABLE user_rewards IS 'Stores user reward points, referral codes, and earnings';
COMMENT ON TABLE referral_rewards IS 'Tracks referral rewards given to users';
COMMENT ON TABLE reward_transactions IS 'Audit trail for all reward point transactions';
