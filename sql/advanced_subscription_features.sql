-- Advanced Subscription Features Database Schema
-- Features: Gift Subscriptions, Family Sharing, Corporate Wellness, Transfer Marketplace

-- 1. Gift Subscriptions System
CREATE TABLE IF NOT EXISTS gift_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gifter_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(20),
    subscription_plan_id VARCHAR(50) NOT NULL,
    subscription_duration INTEGER CHECK (subscription_duration IN (2, 3, 4, 6, 12)),
    custom_message TEXT,
    delivery_date DATE, -- When gift should be delivered/revealed
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'claimed', 'expired', 'cancelled')),
    gift_code VARCHAR(20) UNIQUE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Recipient subscription details
    recipient_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Set when claimed
    created_subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    
    -- Gift settings
    is_anonymous BOOLEAN DEFAULT FALSE,
    delivery_address JSONB, -- Where to deliver the gift
    notification_sent BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 year'),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Family Subscription Sharing System
CREATE TABLE IF NOT EXISTS family_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_name VARCHAR(100) NOT NULL,
    primary_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    invite_code VARCHAR(20) UNIQUE NOT NULL,
    max_members INTEGER DEFAULT 6 CHECK (max_members BETWEEN 2 AND 10),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Group settings
    shared_delivery_address JSONB,
    allow_individual_deliveries BOOLEAN DEFAULT TRUE,
    default_delivery_schedule JSONB, -- JSON with schedule preferences
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS family_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    permissions JSONB DEFAULT '{"can_pause": true, "can_modify_address": false, "can_view_billing": false}',
    
    -- Individual member preferences
    delivery_address JSONB, -- Individual delivery address if different
    notification_preferences JSONB DEFAULT '{"delivery_reminders": true, "group_updates": true}',
    
    UNIQUE(family_group_id, user_id)
);

CREATE TABLE IF NOT EXISTS family_shared_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE CASCADE,
    billing_member_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT, -- Who pays
    
    -- Sharing configuration
    delivery_distribution JSONB NOT NULL, -- How deliveries are split among members
    cost_sharing JSONB NOT NULL, -- How costs are split
    member_juice_selections JSONB, -- Individual juice preferences per member
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(family_group_id, subscription_id)
);

-- 3. Corporate Wellness Programs
CREATE TABLE IF NOT EXISTS corporate_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    company_email VARCHAR(255) NOT NULL UNIQUE,
    contact_person VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    
    -- Account details
    account_manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    billing_address JSONB NOT NULL,
    tax_id VARCHAR(50),
    
    -- Wellness program settings
    employee_limit INTEGER DEFAULT 50,
    monthly_budget DECIMAL(12,2),
    subsidy_percentage DECIMAL(5,2) DEFAULT 100 CHECK (subsidy_percentage BETWEEN 0 AND 100),
    allowed_plans JSONB, -- Which subscription plans are covered
    
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'cancelled')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS corporate_employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporate_account_id UUID REFERENCES corporate_accounts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id VARCHAR(100), -- Company's internal employee ID
    department VARCHAR(100),
    position VARCHAR(100),
    
    -- Wellness program participation
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    monthly_allowance DECIMAL(10,2),
    used_allowance DECIMAL(10,2) DEFAULT 0,
    
    UNIQUE(corporate_account_id, user_id),
    UNIQUE(corporate_account_id, employee_id)
);

CREATE TABLE IF NOT EXISTS corporate_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporate_account_id UUID REFERENCES corporate_accounts(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES corporate_employees(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE CASCADE,
    
    -- Corporate billing
    corporate_contribution DECIMAL(10,2) NOT NULL,
    employee_contribution DECIMAL(10,2) DEFAULT 0,
    approval_status VARCHAR(20) DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(subscription_id)
);

-- 4. Subscription Transfer Marketplace
CREATE TABLE IF NOT EXISTS subscription_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE CASCADE,
    seller_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Transfer details
    asking_price DECIMAL(10,2) NOT NULL,
    remaining_deliveries INTEGER NOT NULL,
    original_price DECIMAL(10,2) NOT NULL,
    transfer_reason VARCHAR(500),
    
    -- Listing details
    title VARCHAR(200) NOT NULL,
    description TEXT,
    is_negotiable BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'listed' CHECK (status IN ('listed', 'pending', 'completed', 'cancelled', 'expired')),
    
    -- Auto-expiry
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscription_transfer_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID REFERENCES subscription_transfers(id) ON DELETE CASCADE,
    buyer_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    offered_price DECIMAL(10,2) NOT NULL,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    
    -- Response details
    seller_response TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(transfer_id, buyer_user_id)
);

CREATE TABLE IF NOT EXISTS subscription_transfer_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID REFERENCES subscription_transfers(id) ON DELETE CASCADE,
    offer_id UUID REFERENCES subscription_transfer_offers(id) ON DELETE SET NULL,
    seller_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    buyer_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Transaction details
    final_price DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) DEFAULT 0,
    seller_amount DECIMAL(10,2) NOT NULL,
    
    -- Payment tracking
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_id VARCHAR(100),
    escrow_released BOOLEAN DEFAULT FALSE,
    
    -- Transfer completion
    subscription_transferred_at TIMESTAMP WITH TIME ZONE,
    transfer_completed BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Notifications and Communication
CREATE TABLE IF NOT EXISTS subscription_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'gift_received', 'family_invite', 'transfer_offer', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Related entities
    related_id UUID, -- Can reference gift_subscriptions, family_groups, etc.
    related_type VARCHAR(50), -- 'gift_subscription', 'family_group', 'transfer', etc.
    
    -- Notification status
    is_read BOOLEAN DEFAULT FALSE,
    is_action_required BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(500),
    
    -- Delivery tracking
    email_sent BOOLEAN DEFAULT FALSE,
    sms_sent BOOLEAN DEFAULT FALSE,
    push_sent BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gift_subscriptions_gifter ON gift_subscriptions(gifter_user_id);
CREATE INDEX IF NOT EXISTS idx_gift_subscriptions_recipient_email ON gift_subscriptions(recipient_email);
CREATE INDEX IF NOT EXISTS idx_gift_subscriptions_status ON gift_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_gift_subscriptions_gift_code ON gift_subscriptions(gift_code);

CREATE INDEX IF NOT EXISTS idx_family_groups_primary_user ON family_groups(primary_user_id);
CREATE INDEX IF NOT EXISTS idx_family_groups_invite_code ON family_groups(invite_code);
CREATE INDEX IF NOT EXISTS idx_family_group_members_user ON family_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_group_members_group ON family_group_members(family_group_id);

CREATE INDEX IF NOT EXISTS idx_corporate_employees_user ON corporate_employees(user_id);
CREATE INDEX IF NOT EXISTS idx_corporate_employees_account ON corporate_employees(corporate_account_id);
CREATE INDEX IF NOT EXISTS idx_corporate_subscriptions_subscription ON corporate_subscriptions(subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscription_transfers_seller ON subscription_transfers(seller_user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_transfers_status ON subscription_transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfer_offers_buyer ON subscription_transfer_offers(buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_transfer_offers_transfer ON subscription_transfer_offers(transfer_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON subscription_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON subscription_notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON subscription_notifications(user_id, is_read) WHERE is_read = FALSE;

-- Create triggers for updated_at columns
CREATE TRIGGER update_gift_subscriptions_updated_at 
    BEFORE UPDATE ON gift_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_groups_updated_at 
    BEFORE UPDATE ON family_groups 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_corporate_accounts_updated_at 
    BEFORE UPDATE ON corporate_accounts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_transfers_updated_at 
    BEFORE UPDATE ON subscription_transfers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transfer_transactions_updated_at 
    BEFORE UPDATE ON subscription_transfer_transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE gift_subscriptions IS 'Gift subscription system - allows users to gift subscriptions to others';
COMMENT ON TABLE family_groups IS 'Family sharing system - groups for sharing subscriptions among family members';
COMMENT ON TABLE family_group_members IS 'Members of family groups with roles and permissions';
COMMENT ON TABLE family_shared_subscriptions IS 'Subscriptions shared within family groups';
COMMENT ON TABLE corporate_accounts IS 'Corporate wellness program accounts';
COMMENT ON TABLE corporate_employees IS 'Employees enrolled in corporate wellness programs';
COMMENT ON TABLE corporate_subscriptions IS 'Subscriptions funded by corporate wellness programs';
COMMENT ON TABLE subscription_transfers IS 'Marketplace for transferring subscriptions between users';
COMMENT ON TABLE subscription_transfer_offers IS 'Offers made on subscription transfers';
COMMENT ON TABLE subscription_transfer_transactions IS 'Completed transfer transactions';
COMMENT ON TABLE subscription_notifications IS 'Notification system for all subscription-related events';
